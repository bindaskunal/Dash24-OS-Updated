"""
Dash24 V1 - Orders API Router
Hardened with transaction safety, status validation, and ownership checks
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.redis_client import get_redis
from app.models.order import Order
from app.models.enums import OrderStatus
from app.services.order_service import OrderService
from app.services.order_state_machine import is_within_cutoff, get_delivery_slot
from app.models.enums import PaymentMethod
from app.core.security import get_current_user, CurrentUser, require_role
from app.core.responses import success_response, error_response, paginated_response
from app.core.exceptions import NotFoundError, ValidationError as AppValidationError
from app.core.idempotency import get_idempotency_key, get_idempotency_service, IdempotencyService

router = APIRouter(prefix="/api/orders", tags=["orders"])


ALLOWED_TRANSITIONS = {
    OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    OrderStatus.PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
    OrderStatus.FAILED: []
}


def validate_status_transition(from_status: OrderStatus, to_status: OrderStatus) -> bool:
    """Validate if status transition is allowed"""
    allowed = ALLOWED_TRANSITIONS.get(from_status, [])
    return to_status in allowed


def check_order_ownership(order: Order, user: CurrentUser):
    """Check if user owns the order or is admin"""
    if user.role.value != "admin" and order.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this order"
        )


# Request/Response Models

class CreateOrderRequest(BaseModel):
    address_id: UUID
    payment_method: str = Field(..., pattern="^(cod|prepaid)$")
    wallet_amount: Decimal = Decimal("0")
    delivery_instructions: Optional[str] = None
    notes: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class CancelOrderRequest(BaseModel):
    reason: str


class UpdateOrderStatusRequest(BaseModel):
    status: str


class OrderItemResponse(BaseModel):
    id: str
    sku: str
    product_name: str
    brand_name: str
    quantity: int
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str
    payment_method: str
    subtotal: float
    delivery_fee: float
    wallet_applied: float
    total: float
    delivery_slot: Optional[dict] = None
    is_same_day: bool
    can_cancel: bool
    tracking: Optional[dict] = None
    items: List[OrderItemResponse] = []
    created_at: str


class DeliverySlotResponse(BaseModel):
    is_before_cutoff: bool
    same_day_available: bool
    slot: dict
    cutoff_time: str


# API Endpoints

@router.get("/delivery-slot")
async def get_delivery_slot_info():
    """Get current delivery slot information"""
    from datetime import timezone
    from zoneinfo import ZoneInfo
    
    IST = ZoneInfo('Asia/Kolkata')
    now = datetime.now(timezone.utc)
    slot = get_delivery_slot(now)
    
    return success_response({
        "is_before_cutoff": is_within_cutoff(),
        "same_day_available": slot['is_same_day'],
        "slot": slot,
        "cutoff_time": datetime.now(IST).replace(hour=14, minute=0, second=0).isoformat()
    })


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    request: CreateOrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    idempotency_key: Optional[str] = Depends(get_idempotency_key),
    idempotency_service: IdempotencyService = Depends(get_idempotency_service)
):
    """
    Create a new order from cart.
    
    - For COD: Returns confirmed order
    - For Prepaid: Returns Razorpay checkout options
    - Supports X-Idempotency-Key header to prevent duplicate orders
    - Runs in database transaction for atomicity
    """
    if idempotency_key:
        is_new, existing = await idempotency_service.check_and_set(idempotency_key, "order")
        if not is_new:
            if existing and existing.get("status") == "completed":
                result = await db.execute(
                    select(Order)
                    .options(selectinload(Order.items))
                    .where(Order.id == UUID(existing["resource_id"]))
                )
                existing_order = result.scalar_one_or_none()
                
                if existing_order:
                    check_order_ownership(existing_order, current_user)
                    return success_response({
                        "order": existing_order.to_dict(),
                        "payment": None,
                        "idempotent": True
                    })
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Duplicate request with idempotency key: {idempotency_key}"
            )
    
    async with db.begin():
        service = OrderService(db, redis)
        
        try:
            order, payment_info = await service.create_order(
                user_id=current_user.id,
                address_id=request.address_id,
                payment_method=request.payment_method,
                wallet_amount=request.wallet_amount,
                delivery_instructions=request.delivery_instructions,
                notes=request.notes,
                idempotency_key=idempotency_key
            )
            
            await db.flush()
            
            if idempotency_key:
                await idempotency_service.set_result(
                    idempotency_key,
                    str(order.id),
                    "order",
                    "completed"
                )
            
            return success_response({
                "order": order.to_dict(),
                "payment": payment_info
            })
            
        except ValueError as e:
            if idempotency_key:
                await idempotency_service.clear(idempotency_key)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            if idempotency_key:
                await idempotency_service.clear(idempotency_key)
            raise


@router.post("/{order_id}/verify-payment")
async def verify_payment(
    order_id: UUID,
    request: VerifyPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Verify Razorpay payment and confirm order"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    check_order_ownership(order, current_user)
    
    async with db.begin():
        service = OrderService(db, redis)
        
        success_verify, error = await service.verify_payment(
            order_id=order_id,
            razorpay_payment_id=request.razorpay_payment_id,
            razorpay_order_id=request.razorpay_order_id,
            razorpay_signature=request.razorpay_signature
        )
        
        if not success_verify:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        await db.flush()
        await db.refresh(order)
        
        return success_response({
            "order": order.to_dict()
        })


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    request: CancelOrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Cancel an order"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    check_order_ownership(order, current_user)
    
    if order.status == OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel delivered orders"
        )
    
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled"
        )
    
    if not validate_status_transition(order.status, OrderStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order in {order.status.value} status"
        )
    
    async with db.begin():
        service = OrderService(db, redis)
        
        success_cancel, error = await service.cancel_order(
            order_id=order_id,
            reason=request.reason,
            cancelled_by="customer"
        )
        
        if not success_cancel:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        await db.flush()
        await db.refresh(order)
        
        return success_response({
            "order": order.to_dict()
        })


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: UUID,
    request: UpdateOrderStatusRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Update order status (admin only)"""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        new_status = OrderStatus(request.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {request.status}"
        )
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if not validate_status_transition(order.status, new_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {order.status.value} to {new_status.value}"
        )
    
    async with db.begin():
        service = OrderService(db, redis)
        
        success_update, error = await service.update_order_status(
            order_id=order_id,
            new_status=new_status,
            changed_by=current_user.id
        )
        
        if not success_update:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        
        await db.flush()
        await db.refresh(order)
        
        return success_response({
            "order": order.to_dict()
        })


@router.get("/{order_id}")
async def get_order(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Get order details"""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    check_order_ownership(order, current_user)
    
    return success_response({
        "order": {
            **order.to_dict(),
            "items": [item.to_dict() for item in order.items]
        }
    })


@router.get("")
async def list_orders(
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """List user's orders"""
    if current_user.role.value == "admin":
        query = select(Order)
    else:
        query = select(Order).where(Order.user_id == current_user.id)
    
    if status:
        try:
            status_enum = OrderStatus(status)
            query = query.where(Order.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}"
            )
    
    query = query.order_by(Order.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    count_query = select(func.count()).select_from(Order)
    if current_user.role.value != "admin":
        count_query = count_query.where(Order.user_id == current_user.id)
    if status:
        count_query = count_query.where(Order.status == status_enum)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    return paginated_response(
        items=[order.to_summary() for order in orders],
        total=total,
        limit=limit,
        offset=offset
    )
