# Dash24 V1 - Webhook Handling Strategy

## Overview

Robust webhook handling is critical for real-time synchronization with EasyEcom and payment providers. This document outlines the architecture for reliable, idempotent webhook processing with retry logic.

---

## Webhook Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          WEBHOOK HANDLING ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   EXTERNAL SOURCES                                                               │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                         │
│   │  EasyEcom   │    │  Razorpay   │    │   Future    │                         │
│   │  Webhooks   │    │  Webhooks   │    │  Providers  │                         │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                         │
│          │                  │                  │                                 │
│          └──────────────────┼──────────────────┘                                 │
│                             │                                                    │
│                             ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                     WEBHOOK GATEWAY (FastAPI)                            │   │
│   │                                                                          │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│   │   │   Receive    │──│   Validate   │──│   Respond    │                  │   │
│   │   │   Request    │  │   Signature  │  │   200 OK     │                  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘                  │   │
│   │                                                │                         │   │
│   │                                                ▼                         │   │
│   │                                       ┌──────────────┐                   │   │
│   │                                       │   Log to DB  │                   │   │
│   │                                       │  (Webhook    │                   │   │
│   │                                       │   Log Table) │                   │   │
│   │                                       └──────────────┘                   │   │
│   │                                                │                         │   │
│   └────────────────────────────────────────────────┼─────────────────────────┘   │
│                                                    │                             │
│                                                    │ Async                       │
│                                                    ▼                             │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         REDIS QUEUE                                      │   │
│   │                                                                          │   │
│   │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│   │   │  webhook:high   │  │ webhook:normal  │  │  webhook:retry  │         │   │
│   │   │  (order status) │  │ (inventory)     │  │  (failed jobs)  │         │   │
│   │   └─────────────────┘  └─────────────────┘  └─────────────────┘         │   │
│   │                                                                          │   │
│   └───────────────────────────────────┬─────────────────────────────────────┘   │
│                                       │                                          │
│                                       │ Workers                                  │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      WEBHOOK PROCESSORS                                  │   │
│   │                                                                          │   │
│   │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │   │
│   │   │    EasyEcom      │  │    Razorpay      │  │    Generic       │      │   │
│   │   │    Processor     │  │    Processor     │  │    Processor     │      │   │
│   │   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │   │
│   │            │                     │                     │                 │   │
│   │            └─────────────────────┼─────────────────────┘                 │   │
│   │                                  │                                       │   │
│   │                                  ▼                                       │   │
│   │                    ┌─────────────────────────┐                           │   │
│   │                    │    Business Logic       │                           │   │
│   │                    │  • Update Order Status  │                           │   │
│   │                    │  • Sync Inventory       │                           │   │
│   │                    │  • Process Payment      │                           │   │
│   │                    │  • Send Notifications   │                           │   │
│   │                    └─────────────────────────┘                           │   │
│   │                                                                          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         MONITORING & RETRY                               │   │
│   │                                                                          │   │
│   │   • Dead Letter Queue for permanent failures                             │   │
│   │   • Exponential backoff for retries                                      │   │
│   │   • Alerting on high failure rates                                       │   │
│   │   • Dashboard for webhook health                                         │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Webhook Endpoint Implementation

```python
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Header
from typing import Optional
import json
import hashlib
import hmac
from datetime import datetime
import logging

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


class WebhookGateway:
    """
    Central gateway for all incoming webhooks.
    Handles validation, logging, and async dispatch.
    """
    
    def __init__(self, db_session, redis_client, queue):
        self.db = db_session
        self.redis = redis_client
        self.queue = queue
        
        # Signature validators for each source
        self.validators = {
            'easyecom': self._validate_easyecom,
            'razorpay': self._validate_razorpay,
        }
        
        # Queue priority by event type
        self.priority_map = {
            'order_status': 'high',
            'payment_success': 'high',
            'payment_failed': 'high',
            'inventory_update': 'normal',
            'shipment_update': 'normal',
        }
    
    async def handle_webhook(
        self,
        source: str,
        request: Request,
        background_tasks: BackgroundTasks
    ) -> dict:
        """
        Generic webhook handler.
        1. Validate signature
        2. Check idempotency
        3. Log to database
        4. Queue for async processing
        5. Return 200 immediately
        """
        
        # 1. Get payload and headers
        payload = await request.body()
        headers = dict(request.headers)
        
        # 2. Extract event metadata
        event_id = self._extract_event_id(source, headers, payload)
        event_type = self._extract_event_type(source, headers, payload)
        
        # 3. Validate signature
        signature = headers.get(self._get_signature_header(source), '')
        if not await self._validate_signature(source, payload, signature):
            logger.warning(f"Invalid webhook signature from {source}: {event_id}")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # 4. Check idempotency (already processed?)
        if await self._is_duplicate(source, event_id):
            logger.info(f"Duplicate webhook ignored: {source}:{event_id}")
            return {"status": "already_processed", "event_id": event_id}
        
        # 5. Log to database
        webhook_log_id = await self._log_webhook(
            source=source,
            event_id=event_id,
            event_type=event_type,
            payload=json.loads(payload) if payload else {},
            headers=headers
        )
        
        # 6. Acknowledge immediately
        # 7. Queue for async processing
        background_tasks.add_task(
            self._queue_for_processing,
            webhook_log_id,
            source,
            event_type,
            json.loads(payload)
        )
        
        return {
            "status": "accepted",
            "event_id": event_id,
            "log_id": str(webhook_log_id)
        }
    
    def _extract_event_id(self, source: str, headers: dict, payload: bytes) -> str:
        """Extract unique event ID from webhook"""
        if source == 'easyecom':
            return headers.get('x-easyecom-event-id', '')
        elif source == 'razorpay':
            data = json.loads(payload) if payload else {}
            return data.get('event_id', data.get('payload', {}).get('payment', {}).get('entity', {}).get('id', ''))
        return hashlib.sha256(payload).hexdigest()[:32]
    
    def _extract_event_type(self, source: str, headers: dict, payload: bytes) -> str:
        """Extract event type from webhook"""
        if source == 'easyecom':
            return headers.get('x-easyecom-event', 'unknown')
        elif source == 'razorpay':
            data = json.loads(payload) if payload else {}
            return data.get('event', 'unknown')
        return 'unknown'
    
    def _get_signature_header(self, source: str) -> str:
        """Get signature header name for source"""
        headers = {
            'easyecom': 'x-easyecom-signature',
            'razorpay': 'x-razorpay-signature',
        }
        return headers.get(source, 'x-signature')
    
    async def _validate_signature(
        self, 
        source: str, 
        payload: bytes, 
        signature: str
    ) -> bool:
        """Validate webhook signature"""
        validator = self.validators.get(source)
        if not validator:
            logger.warning(f"No validator for source: {source}")
            return False
        return validator(payload, signature)
    
    def _validate_easyecom(self, payload: bytes, signature: str) -> bool:
        """Validate EasyEcom webhook signature"""
        secret = os.environ.get('EASYECOM_WEBHOOK_SECRET', '')
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    
    def _validate_razorpay(self, payload: bytes, signature: str) -> bool:
        """Validate Razorpay webhook signature"""
        secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    
    async def _is_duplicate(self, source: str, event_id: str) -> bool:
        """Check if event already processed (idempotency)"""
        key = f"webhook:processed:{source}:{event_id}"
        exists = await self.redis.exists(key)
        if not exists:
            # Mark as processing, expire after 7 days
            await self.redis.setex(key, 604800, "processing")
            return False
        return True
    
    async def _log_webhook(
        self,
        source: str,
        event_id: str,
        event_type: str,
        payload: dict,
        headers: dict
    ) -> str:
        """Log webhook to database"""
        log = WebhookLog(
            source=source,
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            headers={k: v for k, v in headers.items() if k.lower() != 'authorization'},
            status='pending',
            created_at=datetime.utcnow()
        )
        self.db.add(log)
        await self.db.commit()
        return str(log.id)
    
    async def _queue_for_processing(
        self,
        webhook_log_id: str,
        source: str,
        event_type: str,
        payload: dict
    ):
        """Queue webhook for async processing"""
        priority = self.priority_map.get(event_type, 'normal')
        queue_name = f"webhook:{priority}"
        
        job_data = {
            'webhook_log_id': webhook_log_id,
            'source': source,
            'event_type': event_type,
            'payload': payload,
            'queued_at': datetime.utcnow().isoformat()
        }
        
        await self.queue.enqueue(
            queue_name,
            'process_webhook',
            job_data
        )


# API Endpoints

gateway = WebhookGateway(db_session, redis_client, queue)

@router.post("/easyecom")
async def easyecom_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """EasyEcom webhook endpoint"""
    return await gateway.handle_webhook('easyecom', request, background_tasks)

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Razorpay webhook endpoint"""
    return await gateway.handle_webhook('razorpay', request, background_tasks)
```

---

## Webhook Processors

```python
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class WebhookProcessor(ABC):
    """Base class for webhook processors"""
    
    @abstractmethod
    async def process(self, event_type: str, payload: dict) -> bool:
        """Process webhook event. Returns True on success."""
        pass
    
    @abstractmethod
    def get_supported_events(self) -> list[str]:
        """List of event types this processor handles"""
        pass


class EasyEcomWebhookProcessor(WebhookProcessor):
    """Process EasyEcom webhook events"""
    
    SUPPORTED_EVENTS = [
        'inventory.updated',
        'inventory.low_stock',
        'order.status_changed',
        'order.cancelled',
        'shipment.created',
        'shipment.delivered',
        'shipment.failed',
        'return.initiated',
        'return.received',
    ]
    
    def __init__(self, order_service, inventory_service, notification_service):
        self.orders = order_service
        self.inventory = inventory_service
        self.notifications = notification_service
    
    def get_supported_events(self) -> list[str]:
        return self.SUPPORTED_EVENTS
    
    async def process(self, event_type: str, payload: dict) -> bool:
        """Route event to appropriate handler"""
        handlers = {
            'inventory.updated': self._handle_inventory_update,
            'inventory.low_stock': self._handle_low_stock,
            'order.status_changed': self._handle_order_status,
            'order.cancelled': self._handle_order_cancelled,
            'shipment.created': self._handle_shipment_created,
            'shipment.delivered': self._handle_shipment_delivered,
            'shipment.failed': self._handle_shipment_failed,
        }
        
        handler = handlers.get(event_type)
        if not handler:
            logger.warning(f"No handler for EasyEcom event: {event_type}")
            return False
        
        return await handler(payload)
    
    async def _handle_inventory_update(self, payload: dict) -> bool:
        """Handle inventory update event"""
        sku = payload.get('sku')
        new_quantity = payload.get('available_quantity')
        
        if not sku or new_quantity is None:
            logger.error(f"Invalid inventory update payload: {payload}")
            return False
        
        await self.inventory.update_stock_from_webhook(sku, new_quantity)
        return True
    
    async def _handle_low_stock(self, payload: dict) -> bool:
        """Handle low stock alert"""
        sku = payload.get('sku')
        quantity = payload.get('available_quantity')
        
        # Send alert to admin
        await self.notifications.send_low_stock_alert(sku, quantity)
        return True
    
    async def _handle_order_status(self, payload: dict) -> bool:
        """Handle order status change"""
        easyecom_order_id = payload.get('order_id')
        new_status = payload.get('status')
        
        # Map EasyEcom status to Dash24 status
        status_map = {
            'processing': 'processing',
            'packed': 'packed',
            'ready_to_ship': 'packed',
            'shipped': 'shipped',
            'in_transit': 'shipped',
            'out_for_delivery': 'out_for_delivery',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'failed': 'failed',
        }
        
        dash24_status = status_map.get(new_status.lower())
        if not dash24_status:
            logger.warning(f"Unknown EasyEcom status: {new_status}")
            return False
        
        # Update order
        order = await self.orders.get_by_easyecom_id(easyecom_order_id)
        if not order:
            logger.error(f"Order not found for EasyEcom ID: {easyecom_order_id}")
            return False
        
        # Extract tracking info if available
        tracking_info = {
            'awb': payload.get('awb'),
            'courier': payload.get('courier_name'),
            'tracking_url': payload.get('tracking_url'),
        }
        
        await self.orders.transition_status(
            order_id=order.id,
            new_status=dash24_status,
            source='webhook',
            metadata={
                'easyecom_status': new_status,
                'tracking': tracking_info
            }
        )
        
        return True
    
    async def _handle_shipment_created(self, payload: dict) -> bool:
        """Handle shipment creation (AWB assigned)"""
        easyecom_order_id = payload.get('order_id')
        awb = payload.get('awb')
        courier = payload.get('courier_name')
        
        order = await self.orders.get_by_easyecom_id(easyecom_order_id)
        if not order:
            return False
        
        # Update order with tracking info
        await self.orders.update_tracking(order.id, awb, courier)
        
        # Send notification to customer
        await self.notifications.send_shipment_created(order, awb)
        
        return True
    
    async def _handle_shipment_delivered(self, payload: dict) -> bool:
        """Handle delivery confirmation"""
        easyecom_order_id = payload.get('order_id')
        delivered_at = payload.get('delivered_at')
        pod = payload.get('proof_of_delivery')
        
        order = await self.orders.get_by_easyecom_id(easyecom_order_id)
        if not order:
            return False
        
        await self.orders.mark_delivered(
            order_id=order.id,
            delivered_at=delivered_at,
            proof_of_delivery=pod
        )
        
        return True
    
    async def _handle_shipment_failed(self, payload: dict) -> bool:
        """Handle delivery failure"""
        easyecom_order_id = payload.get('order_id')
        failure_reason = payload.get('reason')
        
        order = await self.orders.get_by_easyecom_id(easyecom_order_id)
        if not order:
            return False
        
        await self.orders.handle_delivery_failure(
            order_id=order.id,
            reason=failure_reason
        )
        
        return True


class RazorpayWebhookProcessor(WebhookProcessor):
    """Process Razorpay webhook events"""
    
    SUPPORTED_EVENTS = [
        'payment.authorized',
        'payment.captured',
        'payment.failed',
        'refund.created',
        'refund.processed',
        'refund.failed',
    ]
    
    def __init__(self, payment_service, order_service):
        self.payments = payment_service
        self.orders = order_service
    
    def get_supported_events(self) -> list[str]:
        return self.SUPPORTED_EVENTS
    
    async def process(self, event_type: str, payload: dict) -> bool:
        """Route event to appropriate handler"""
        handlers = {
            'payment.authorized': self._handle_payment_authorized,
            'payment.captured': self._handle_payment_captured,
            'payment.failed': self._handle_payment_failed,
            'refund.created': self._handle_refund_created,
            'refund.processed': self._handle_refund_processed,
        }
        
        handler = handlers.get(event_type)
        if not handler:
            logger.warning(f"No handler for Razorpay event: {event_type}")
            return False
        
        return await handler(payload)
    
    async def _handle_payment_captured(self, payload: dict) -> bool:
        """Handle successful payment capture"""
        payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
        
        razorpay_payment_id = payment_entity.get('id')
        razorpay_order_id = payment_entity.get('order_id')
        amount = payment_entity.get('amount', 0) / 100  # Convert from paise
        
        # Update payment record
        await self.payments.mark_captured(
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id,
            amount=amount
        )
        
        # Transition order to confirmed
        order = await self.orders.get_by_razorpay_order_id(razorpay_order_id)
        if order and order.status == 'pending':
            await self.orders.confirm_order(order.id)
        
        return True
    
    async def _handle_payment_failed(self, payload: dict) -> bool:
        """Handle payment failure"""
        payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
        
        razorpay_order_id = payment_entity.get('order_id')
        error_code = payment_entity.get('error_code')
        error_description = payment_entity.get('error_description')
        
        # Update payment record
        await self.payments.mark_failed(
            razorpay_order_id=razorpay_order_id,
            error_code=error_code,
            error_description=error_description
        )
        
        # Don't automatically fail the order - customer might retry
        
        return True
    
    async def _handle_refund_processed(self, payload: dict) -> bool:
        """Handle refund completion"""
        refund_entity = payload.get('payload', {}).get('refund', {}).get('entity', {})
        
        refund_id = refund_entity.get('id')
        payment_id = refund_entity.get('payment_id')
        amount = refund_entity.get('amount', 0) / 100
        
        await self.payments.mark_refunded(
            refund_id=refund_id,
            payment_id=payment_id,
            amount=amount
        )
        
        return True
```

---

## Retry Logic

```python
import asyncio
from datetime import datetime, timedelta
from typing import Optional
import random

class WebhookRetryHandler:
    """
    Handle webhook processing retries with exponential backoff.
    
    Retry strategy:
    - Max retries: 5
    - Initial delay: 10 seconds
    - Max delay: 1 hour
    - Backoff multiplier: 2
    - Jitter: +/- 20%
    """
    
    MAX_RETRIES = 5
    INITIAL_DELAY = 10  # seconds
    MAX_DELAY = 3600    # 1 hour
    BACKOFF_MULTIPLIER = 2
    JITTER_FACTOR = 0.2
    
    def __init__(self, db_session, redis_client, queue):
        self.db = db_session
        self.redis = redis_client
        self.queue = queue
    
    def calculate_next_retry(self, retry_count: int) -> datetime:
        """Calculate next retry time with exponential backoff + jitter"""
        delay = min(
            self.INITIAL_DELAY * (self.BACKOFF_MULTIPLIER ** retry_count),
            self.MAX_DELAY
        )
        
        # Add jitter
        jitter = delay * self.JITTER_FACTOR * (random.random() * 2 - 1)
        delay = max(1, delay + jitter)
        
        return datetime.utcnow() + timedelta(seconds=delay)
    
    async def schedule_retry(
        self,
        webhook_log_id: str,
        retry_count: int,
        error_message: str
    ):
        """Schedule webhook for retry"""
        if retry_count >= self.MAX_RETRIES:
            await self._move_to_dead_letter(webhook_log_id, error_message)
            return
        
        next_retry = self.calculate_next_retry(retry_count)
        
        # Update webhook log
        await self.db.execute(
            """
            UPDATE webhook_logs 
            SET status = 'retrying',
                retry_count = :count,
                next_retry_at = :next_retry,
                error_message = :error
            WHERE id = :id
            """,
            {
                'count': retry_count + 1,
                'next_retry': next_retry,
                'error': error_message,
                'id': webhook_log_id
            }
        )
        await self.db.commit()
        
        # Schedule in Redis
        await self.redis.zadd(
            'webhook:retry_queue',
            {webhook_log_id: next_retry.timestamp()}
        )
    
    async def _move_to_dead_letter(self, webhook_log_id: str, error_message: str):
        """Move permanently failed webhook to dead letter queue"""
        await self.db.execute(
            """
            UPDATE webhook_logs 
            SET status = 'failed',
                error_message = :error
            WHERE id = :id
            """,
            {'error': f"Max retries exceeded: {error_message}", 'id': webhook_log_id}
        )
        await self.db.commit()
        
        # Alert admin
        await self._alert_dead_letter(webhook_log_id)
    
    async def _alert_dead_letter(self, webhook_log_id: str):
        """Alert admin about permanent webhook failure"""
        # TODO: Implement alerting (Slack, email, etc.)
        pass
    
    async def process_retry_queue(self):
        """
        Process webhooks due for retry.
        Run this as a scheduled job every minute.
        """
        now = datetime.utcnow().timestamp()
        
        # Get webhooks due for retry
        due_webhooks = await self.redis.zrangebyscore(
            'webhook:retry_queue',
            '-inf',
            now,
            start=0,
            num=100
        )
        
        for webhook_log_id in due_webhooks:
            webhook_log_id = webhook_log_id.decode() if isinstance(webhook_log_id, bytes) else webhook_log_id
            
            # Remove from retry queue
            await self.redis.zrem('webhook:retry_queue', webhook_log_id)
            
            # Fetch webhook and re-queue for processing
            log = await self.db.query(WebhookLog).filter(
                WebhookLog.id == webhook_log_id
            ).first()
            
            if log:
                await self.queue.enqueue(
                    'webhook:retry',
                    'process_webhook',
                    {
                        'webhook_log_id': str(log.id),
                        'source': log.source,
                        'event_type': log.event_type,
                        'payload': log.payload,
                        'is_retry': True,
                        'retry_count': log.retry_count
                    }
                )


# Retry scheduler job
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

scheduler.add_job(
    retry_handler.process_retry_queue,
    'interval',
    minutes=1,
    id='webhook_retry_processor'
)

scheduler.start()
"""
```

---

## Monitoring & Alerting

```python
class WebhookMonitor:
    """Monitor webhook health and performance"""
    
    # Alert thresholds
    FAILURE_RATE_THRESHOLD = 0.1  # 10%
    PROCESSING_TIME_THRESHOLD = 30  # seconds
    PENDING_QUEUE_THRESHOLD = 100
    
    def __init__(self, db_session, redis_client, alerting_service):
        self.db = db_session
        self.redis = redis_client
        self.alerts = alerting_service
    
    async def get_health_status(self) -> dict:
        """Get overall webhook health"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        # Count by status in last hour
        stats = await self.db.execute(
            """
            SELECT status, COUNT(*) as count
            FROM webhook_logs
            WHERE created_at > :since
            GROUP BY status
            """,
            {'since': hour_ago}
        )
        
        status_counts = dict(stats.fetchall())
        total = sum(status_counts.values())
        
        # Calculate metrics
        success_rate = status_counts.get('success', 0) / total if total > 0 else 1.0
        failure_rate = status_counts.get('failed', 0) / total if total > 0 else 0.0
        pending = status_counts.get('pending', 0) + status_counts.get('retrying', 0)
        
        # Average processing time
        avg_time = await self._get_avg_processing_time(hour_ago)
        
        # Determine health
        health = 'healthy'
        issues = []
        
        if failure_rate > self.FAILURE_RATE_THRESHOLD:
            health = 'degraded'
            issues.append(f"High failure rate: {failure_rate:.1%}")
        
        if avg_time > self.PROCESSING_TIME_THRESHOLD:
            health = 'degraded'
            issues.append(f"Slow processing: {avg_time:.1f}s avg")
        
        if pending > self.PENDING_QUEUE_THRESHOLD:
            health = 'degraded'
            issues.append(f"Large backlog: {pending} pending")
        
        return {
            'health': health,
            'issues': issues,
            'metrics': {
                'total_last_hour': total,
                'success_rate': success_rate,
                'failure_rate': failure_rate,
                'pending': pending,
                'avg_processing_time': avg_time
            },
            'by_status': status_counts,
            'timestamp': now.isoformat()
        }
    
    async def _get_avg_processing_time(self, since: datetime) -> float:
        """Calculate average webhook processing time"""
        result = await self.db.execute(
            """
            SELECT AVG(EXTRACT(EPOCH FROM (processed_at - created_at)))
            FROM webhook_logs
            WHERE status = 'success'
            AND created_at > :since
            AND processed_at IS NOT NULL
            """,
            {'since': since}
        )
        return result.scalar() or 0.0
    
    async def check_and_alert(self):
        """
        Periodic health check with alerting.
        Run every 5 minutes.
        """
        health = await self.get_health_status()
        
        if health['health'] != 'healthy':
            await self.alerts.send_webhook_health_alert(health)
        
        # Store metrics in Redis for dashboard
        await self.redis.hset('webhook:health', mapping={
            'status': health['health'],
            'success_rate': health['metrics']['success_rate'],
            'pending': health['metrics']['pending'],
            'checked_at': health['timestamp']
        })


# Admin API endpoint
@router.get("/admin/webhooks/health")
async def webhook_health(monitor: WebhookMonitor = Depends(get_monitor)):
    """Get webhook health status"""
    return await monitor.get_health_status()

@router.get("/admin/webhooks/failed")
async def failed_webhooks(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent failed webhooks for investigation"""
    logs = await db.query(WebhookLog).filter(
        WebhookLog.status == 'failed'
    ).order_by(
        WebhookLog.created_at.desc()
    ).limit(limit).all()
    
    return [log.to_dict() for log in logs]

@router.post("/admin/webhooks/{webhook_log_id}/retry")
async def manual_retry(
    webhook_log_id: str,
    retry_handler: WebhookRetryHandler = Depends(get_retry_handler)
):
    """Manually retry a failed webhook"""
    await retry_handler.schedule_retry(webhook_log_id, 0, "Manual retry")
    return {"status": "scheduled"}
```

---

## Environment Variables

```bash
# Webhook Secrets
EASYECOM_WEBHOOK_SECRET=your_easyecom_webhook_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Retry Configuration
WEBHOOK_MAX_RETRIES=5
WEBHOOK_INITIAL_DELAY=10
WEBHOOK_MAX_DELAY=3600

# Alerting
WEBHOOK_ALERT_EMAIL=ops@dash24.in
WEBHOOK_SLACK_CHANNEL=#alerts-webhooks
```
