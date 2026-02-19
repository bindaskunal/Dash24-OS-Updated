"""
Dash24 V1 - Payments Router
Handles payment verification and status
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.order import Order
from app.models.enums import OrderStatus, PaymentStatus
from app.core.security import get_current_user, CurrentUser
from app.core.responses import success_response
from app.services.payment_service import payment_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify Razorpay payment and confirm order
    
    Security:
    - Fetches order from DB to validate amount
    - Verifies signature using Razorpay secret
    - Ensures ownership
    - Prevents double confirmation
    """
    
    result = await db.execute(
        select(Order).where(Order.razorpay_order_id == request.razorpay_order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user.role.value != "admin" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this order"
        )
    
    if order.payment_status == PaymentStatus.CAPTURED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already confirmed"
        )
    
    is_valid = payment_service.verify_payment_signature(
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_signature=request.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )
    
    async with db.begin():
        order.razorpay_payment_id = request.razorpay_payment_id
        order.payment_status = PaymentStatus.CAPTURED
        
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.CONFIRMED
        
        await db.flush()
        await db.refresh(order)
    
    return success_response({
        "order_id": str(order.id),
        "status": order.status.value,
        "payment_status": order.payment_status.value,
        "message": "Payment verified successfully"
    })
