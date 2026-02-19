"""
Dash24 V1 - Orders API Router
Phase 0: Proper auth, standardized responses, idempotency support
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis_client import get_redis
from app.services.order_service import OrderService
from app.services.order_state_machine import is_within_cutoff, get_delivery_slot
from app.models.enums import PaymentMethod
from app.core.security import get_current_user, CurrentUser, require_role
from app.core.responses import success_response, error_response, paginated_response
from app.core.exceptions import NotFoundError, ValidationError as AppValidationError
from app.core.idempotency import get_idempotency_key, get_idempotency_service, IdempotencyService

router = APIRouter(prefix="/api/orders", tags=["orders"])


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
    """
    # Check idempotency if key provided
    if idempotency_key:
        is_new, existing = await idempotency_service.check_and_set(idempotency_key, "order")
        if not is_new:
            if existing and existing.get("status") == "completed":
                # Return existing order
                service = OrderService(db, redis)
                existing_order = await service.get_order(UUID(existing["resource_id"]))
                if existing_order:
                    return success_response({
                        "order": existing_order.to_dict(),
                        "payment": None,
                        "idempotent": True
                    })
            return error_response(
                f"Duplicate request with idempotency key: {idempotency_key}"
            )
    
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
        
        # Store idempotency result
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
        # Clear idempotency key on failure
        if idempotency_key:
            await idempotency_service.clear(idempotency_key)
        return error_response(str(e))
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
    service = OrderService(db, redis)
    
    # Verify ownership
    order = await service.get_order(order_id)
    if not order:
        return error_response("Order not found")
    
    if order.user_id != current_user.id:
        return error_response("Access denied")
    
    success, error = await service.verify_payment(
        order_id=order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_order_id=request.razorpay_order_id,
        razorpay_signature=request.razorpay_signature
    )
    
    if not success:
        return error_response(error)
    
    order = await service.get_order(order_id)
    
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
    service = OrderService(db, redis)
    
    # Verify ownership
    order = await service.get_order(order_id)
    if not order:
        return error_response("Order not found")
    
    if order.user_id != current_user.id:
        return error_response("Access denied")
    
    success, error = await service.cancel_order(
        order_id=order_id,
        reason=request.reason,
        cancelled_by="customer"
    )
    
    if not success:
        return error_response(error)
    
    order = await service.get_order(order_id)
    
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
    service = OrderService(db, redis)
    order = await service.get_order(order_id)
    
    if not order:
        return error_response("Order not found")
    
    # Verify ownership (or admin access)
    if order.user_id != current_user.id and current_user.role.value != "admin":
        return error_response("Access denied")
    
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
    service = OrderService(db, redis)
    orders, total = await service.get_user_orders(
        user_id=current_user.id,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return paginated_response(
        items=[order.to_summary() for order in orders],
        total=total,
        limit=limit,
        offset=offset
    )
