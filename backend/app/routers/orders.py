"""
Dash24 V1 - Orders API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/api/orders", tags=["orders"])


# Request/Response Models

class CreateOrderRequest(BaseModel):
    address_id: UUID
    payment_method: str = Field(..., regex="^(cod|prepaid)$")
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


class OrderListResponse(BaseModel):
    orders: List[dict]
    total: int
    limit: int
    offset: int


class DeliverySlotResponse(BaseModel):
    is_before_cutoff: bool
    same_day_available: bool
    slot: dict
    cutoff_time: str


# API Endpoints

@router.get("/delivery-slot", response_model=DeliverySlotResponse)
async def get_delivery_slot_info():
    """Get current delivery slot information"""
    from datetime import timezone
    from zoneinfo import ZoneInfo
    
    IST = ZoneInfo('Asia/Kolkata')
    now = datetime.now(timezone.utc)
    slot = get_delivery_slot(now)
    
    return DeliverySlotResponse(
        is_before_cutoff=is_within_cutoff(),
        same_day_available=slot['is_same_day'],
        slot=slot,
        cutoff_time=datetime.now(IST).replace(hour=14, minute=0, second=0).isoformat()
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    request: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Create a new order from cart.
    
    - For COD: Returns confirmed order
    - For Prepaid: Returns Razorpay checkout options
    """
    # TODO: Get user_id from JWT auth
    # For now, use a placeholder
    user_id = UUID("00000000-0000-0000-0000-000000000001")
    
    service = OrderService(db, redis)
    
    try:
        order, payment_info = await service.create_order(
            user_id=user_id,
            address_id=request.address_id,
            payment_method=request.payment_method,
            wallet_amount=request.wallet_amount,
            delivery_instructions=request.delivery_instructions,
            notes=request.notes
        )
        
        return {
            "success": True,
            "order": order.to_dict(),
            "payment": payment_info
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{order_id}/verify-payment")
async def verify_payment(
    order_id: UUID,
    request: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """Verify Razorpay payment and confirm order"""
    service = OrderService(db, redis)
    
    success, error = await service.verify_payment(
        order_id=order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_order_id=request.razorpay_order_id,
        razorpay_signature=request.razorpay_signature
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error)
    
    order = await service.get_order(order_id)
    
    return {
        "success": True,
        "order": order.to_dict()
    }


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    request: CancelOrderRequest,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """Cancel an order"""
    service = OrderService(db, redis)
    
    success, error = await service.cancel_order(
        order_id=order_id,
        reason=request.reason,
        cancelled_by="customer"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error)
    
    order = await service.get_order(order_id)
    
    return {
        "success": True,
        "order": order.to_dict()
    }


@router.get("/{order_id}")
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """Get order details"""
    service = OrderService(db, redis)
    order = await service.get_order(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "success": True,
        "order": {
            **order.to_dict(),
            "items": [item.to_dict() for item in order.items]
        }
    }


@router.get("")
async def list_orders(
    status: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """List user's orders"""
    # TODO: Get user_id from JWT auth
    user_id = UUID("00000000-0000-0000-0000-000000000001")
    
    service = OrderService(db, redis)
    orders = await service.get_user_orders(
        user_id=user_id,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return {
        "orders": [order.to_summary() for order in orders],
        "total": len(orders),  # TODO: Get actual count
        "limit": limit,
        "offset": offset
    }
