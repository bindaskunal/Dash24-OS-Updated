"""
Dash24 V1 - Fulfillment Router
Handles EasyEcom webhooks and fulfillment status
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from typing import Optional
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.order import Order
from app.models.enums import OrderStatus, FulfillmentStatus
from app.core.responses import success_response
from app.core.settings import settings

router = APIRouter(prefix="/api/fulfillment", tags=["fulfillment"])
logger = logging.getLogger(__name__)


class WebhookPayload(BaseModel):
    order_id: str
    easyecom_order_id: Optional[str] = None
    status: str
    awb: Optional[str] = None
    tracking_url: Optional[str] = None
    timestamp: Optional[str] = None


@router.post("/webhook")
async def easyecom_webhook(
    payload: WebhookPayload,
    x_easyecom_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Receive status updates from EasyEcom
    
    Security:
    - Validates signature header
    - Updates order status transactionally
    
    Status mapping:
    - shipped → SHIPPED
    - out_for_delivery → OUT_FOR_DELIVERY
    - delivered → DELIVERED
    """
    
    if x_easyecom_signature != settings.EASYECOM_WEBHOOK_SECRET:
        logger.warning(f"Invalid EasyEcom webhook signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    result = await db.execute(
        select(Order).where(Order.order_number == payload.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        logger.error(f"Order not found for webhook: {payload.order_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    status_mapping = {
        "shipped": (OrderStatus.SHIPPED, FulfillmentStatus.SHIPPED),
        "out_for_delivery": (OrderStatus.OUT_FOR_DELIVERY, FulfillmentStatus.SHIPPED),
        "delivered": (OrderStatus.DELIVERED, FulfillmentStatus.DELIVERED)
    }
    
    webhook_status = payload.status.lower()
    
    if webhook_status not in status_mapping:
        logger.warning(f"Unknown webhook status: {payload.status}")
        return success_response({"message": "Status not mapped"})
    
    order_status, fulfillment_status = status_mapping[webhook_status]
    
    async with db.begin():
        order.status = order_status
        order.fulfillment_status = fulfillment_status
        order.easyecom_status = payload.status
        
        if payload.awb:
            order.easyecom_awb = payload.awb
        
        if payload.easyecom_order_id and not order.easyecom_order_id:
            order.easyecom_order_id = payload.easyecom_order_id
        
        from datetime import datetime, timezone
        order.easyecom_last_sync = datetime.now(timezone.utc)
        
        if webhook_status == "delivered" and not order.actual_delivery:
            order.actual_delivery = datetime.now(timezone.utc)
        
        await db.flush()
    
    logger.info(f"Order {order.order_number} updated to {order_status.value} via webhook")
    
    return success_response({
        "order_id": str(order.id),
        "order_number": order.order_number,
        "status": order.status.value,
        "fulfillment_status": order.fulfillment_status.value,
        "message": "Webhook processed successfully"
    })
