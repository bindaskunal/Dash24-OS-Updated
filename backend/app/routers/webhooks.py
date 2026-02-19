"""
Dash24 V1 - Webhooks API Router
Handles EasyEcom and Razorpay webhooks
"""
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import json
import hmac
import hashlib
import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.redis_client import get_redis
from app.services.order_service import OrderService
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


# Webhook handlers

async def process_easyecom_event(event_type: str, payload: dict):
    """Process EasyEcom webhook event"""
    async with async_session_maker() as db:
        redis = await get_redis()
        
        if event_type in ["inventory.updated", "inventory.low_stock"]:
            service = InventoryService(db, redis)
            sku = payload.get("sku")
            quantity = payload.get("available_quantity", 0)
            
            if sku:
                await service.update_stock_from_webhook(sku, quantity)
        
        elif event_type in ["order.status_changed", "shipment.created", "shipment.delivered"]:
            service = OrderService(db, redis)
            easyecom_order_id = payload.get("order_id")
            new_status = payload.get("status", "")
            awb = payload.get("awb")
            
            if easyecom_order_id:
                await service.update_from_webhook(
                    easyecom_order_id=easyecom_order_id,
                    new_status=new_status,
                    awb=awb,
                    metadata=payload
                )


async def process_razorpay_event(event_type: str, payload: dict):
    """Process Razorpay webhook event"""
    async with async_session_maker() as db:
        redis = await get_redis()
        service = OrderService(db, redis)
        
        if event_type == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_payment_id = payment_entity.get("id")
            razorpay_order_id = payment_entity.get("order_id")
            
            # Find order and update
            # Note: Signature already verified at endpoint
            logger.info(f"Payment captured: {razorpay_payment_id} for order {razorpay_order_id}")
        
        elif event_type == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            logger.warning(f"Payment failed: {payment_entity.get('id')}")


# Webhook endpoints

@router.post("/easyecom")
async def easyecom_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """EasyEcom webhook endpoint"""
    try:
        payload = await request.body()
        signature = request.headers.get("X-Easyecom-Signature", "")
        event_type = request.headers.get("X-Easyecom-Event", "unknown")
        event_id = request.headers.get("X-Easyecom-Event-Id", "")
        
        # Verify signature
        secret = os.environ.get("EASYECOM_WEBHOOK_SECRET", "")
        if secret:
            expected = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(expected, signature):
                logger.warning(f"Invalid EasyEcom webhook signature: {event_id}")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse payload
        data = json.loads(payload)
        
        # Log webhook
        logger.info(f"EasyEcom webhook received: {event_type} ({event_id})")
        
        # Process async
        background_tasks.add_task(process_easyecom_event, event_type, data)
        
        return {"status": "accepted", "event_id": event_id}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"EasyEcom webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Razorpay webhook endpoint"""
    try:
        payload = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")
        
        # Verify signature
        secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
        if secret:
            expected = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(expected, signature):
                logger.warning("Invalid Razorpay webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse payload
        data = json.loads(payload)
        event_type = data.get("event", "unknown")
        
        logger.info(f"Razorpay webhook received: {event_type}")
        
        # Process async
        background_tasks.add_task(process_razorpay_event, event_type, data)
        
        return {"status": "accepted"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Razorpay webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
