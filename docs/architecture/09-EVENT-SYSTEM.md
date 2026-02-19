# Dash24 V1 - Event Tracking System

## Overview

Centralized event tracking system for capturing all user interactions across the Dash24 platform. Events are the foundation for analytics, retention triggers, and future ML/LLM capabilities.

---

## Event System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          EVENT TRACKING ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         EVENT SOURCES                                    │   │
│   │                                                                          │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌───────────┐   │   │
│   │   │  Customer   │   │   Brand     │   │   Admin     │   │  Backend  │   │   │
│   │   │  App (Web)  │   │   Portal    │   │   Portal    │   │  Services │   │   │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────┬─────┘   │   │
│   │          │                 │                 │                │         │   │
│   └──────────┼─────────────────┼─────────────────┼────────────────┼─────────┘   │
│              │                 │                 │                │             │
│              └─────────────────┼─────────────────┴────────────────┘             │
│                                │                                                 │
│                                ▼                                                 │
│              ┌─────────────────────────────────────────────┐                    │
│              │            EVENT INGESTION API               │                    │
│              │                                              │                    │
│              │  POST /api/events                            │                    │
│              │  POST /api/events/batch                      │                    │
│              │                                              │                    │
│              │  • Validate event schema                     │                    │
│              │  • Enrich with server context                │                    │
│              │  • Deduplicate (idempotency key)             │                    │
│              │  • Rate limiting                             │                    │
│              └──────────────────┬──────────────────────────┘                    │
│                                 │                                                │
│                                 │ Async                                          │
│                                 ▼                                                │
│              ┌─────────────────────────────────────────────┐                    │
│              │              REDIS QUEUE                     │                    │
│              │                                              │                    │
│              │  events:high    (orders, payments)           │                    │
│              │  events:normal  (interactions)               │                    │
│              │  events:low     (views, impressions)         │                    │
│              │                                              │                    │
│              └──────────────────┬──────────────────────────┘                    │
│                                 │                                                │
│                                 │ Workers                                        │
│                                 ▼                                                │
│              ┌─────────────────────────────────────────────┐                    │
│              │           EVENT PROCESSOR                    │                    │
│              │                                              │                    │
│              │  • Batch writes to PostgreSQL                │                    │
│              │  • Trigger retention rules                   │                    │
│              │  • Update real-time counters (Redis)         │                    │
│              │  • Fan-out to analytics pipeline             │                    │
│              │                                              │                    │
│              └──────────────────┬──────────────────────────┘                    │
│                                 │                                                │
│              ┌──────────────────┴──────────────────────────┐                    │
│              │                                              │                    │
│              ▼                                              ▼                    │
│   ┌─────────────────────────┐              ┌─────────────────────────────────┐  │
│   │      PostgreSQL         │              │           Redis                  │  │
│   │                         │              │                                  │  │
│   │  events (raw events)    │              │  Real-time counters              │  │
│   │  event_aggregates       │              │  Session tracking                │  │
│   │  retention_triggers     │              │  Rate limiting                   │  │
│   │                         │              │                                  │  │
│   └─────────────────────────┘              └─────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Event Types

### Core Events

| Event Type | Category | Priority | Description |
|------------|----------|----------|-------------|
| `product_view` | Engagement | Low | User viewed product detail |
| `product_impression` | Engagement | Low | Product shown in listing |
| `search_performed` | Engagement | Normal | User searched for products |
| `add_to_cart` | Commerce | Normal | Item added to cart |
| `remove_from_cart` | Commerce | Normal | Item removed from cart |
| `cart_updated` | Commerce | Normal | Cart quantity changed |
| `checkout_started` | Commerce | High | User initiated checkout |
| `checkout_completed` | Commerce | High | Checkout flow completed |
| `order_confirmed` | Transaction | High | Order confirmed (payment OK) |
| `order_cancelled` | Transaction | High | Order cancelled |
| `delivery_success` | Fulfillment | High | Order delivered |
| `delivery_failed` | Fulfillment | High | Delivery failed |
| `reorder_clicked` | Retention | Normal | User clicked reorder |
| `wallet_used` | Payment | Normal | Wallet credits applied |
| `coupon_applied` | Payment | Normal | Promo code used |
| `app_opened` | Session | Low | App/website opened |
| `session_started` | Session | Low | New session began |
| `session_ended` | Session | Low | Session ended |

---

## Database Schema

### Events Table

```sql
-- Core events table with JSONB for flexible metadata
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE,  -- Client-provided idempotency key
    
    -- Actor information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    device_id VARCHAR(255),
    
    -- Entity references (for efficient querying)
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
    
    -- Event data
    properties JSONB NOT NULL DEFAULT '{}',
    
    -- Context
    source VARCHAR(50) NOT NULL,  -- 'web', 'pwa', 'admin', 'system'
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Geo context (derived from IP or address)
    city VARCHAR(100),
    pincode VARCHAR(10),
    zone VARCHAR(50),
    
    -- Timestamps
    client_timestamp TIMESTAMP WITH TIME ZONE,  -- When event occurred on client
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- When received
    
    -- Processing metadata
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Partitioning by month for efficient data management
-- CREATE TABLE events_2024_01 PARTITION OF events 
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES FOR EVENT QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Primary query patterns

-- 1. Brand-level analytics (most common)
CREATE INDEX idx_events_brand_type_time 
    ON events(brand_id, event_type, server_timestamp DESC)
    WHERE brand_id IS NOT NULL;

-- 2. User journey tracking
CREATE INDEX idx_events_user_time 
    ON events(user_id, server_timestamp DESC)
    WHERE user_id IS NOT NULL;

-- 3. Product analytics
CREATE INDEX idx_events_product_type 
    ON events(product_id, event_type, server_timestamp DESC)
    WHERE product_id IS NOT NULL;

-- 4. Order-related events
CREATE INDEX idx_events_order 
    ON events(order_id, server_timestamp DESC)
    WHERE order_id IS NOT NULL;

-- 5. Event type aggregation
CREATE INDEX idx_events_type_time 
    ON events(event_type, server_timestamp DESC);

-- 6. Zone-based analytics
CREATE INDEX idx_events_zone_type 
    ON events(zone, event_type, server_timestamp DESC)
    WHERE zone IS NOT NULL;

-- 7. Session tracking
CREATE INDEX idx_events_session 
    ON events(session_id, server_timestamp)
    WHERE session_id IS NOT NULL;

-- 8. Unprocessed events (for workers)
CREATE INDEX idx_events_unprocessed 
    ON events(server_timestamp)
    WHERE NOT processed;

-- 9. JSONB property queries (GIN index)
CREATE INDEX idx_events_properties 
    ON events USING gin(properties jsonb_path_ops);

-- 10. Idempotency lookup
CREATE INDEX idx_events_event_id 
    ON events(event_id)
    WHERE event_id IS NOT NULL;

-- 11. Time-range queries (BRIN for sequential data)
CREATE INDEX idx_events_time_brin 
    ON events USING brin(server_timestamp);
```

### Event Properties Schema (JSONB)

```python
# Standard properties by event type

EVENT_PROPERTIES = {
    'product_view': {
        'sku': str,
        'product_name': str,
        'brand_name': str,
        'category': str,
        'price': float,
        'in_stock': bool,
        'view_duration_ms': int,
        'source_page': str,  # 'search', 'category', 'brand', 'home', 'recommendation'
    },
    
    'add_to_cart': {
        'sku': str,
        'product_name': str,
        'brand_name': str,
        'quantity': int,
        'unit_price': float,
        'cart_value_before': float,
        'cart_value_after': float,
        'cart_item_count': int,
    },
    
    'remove_from_cart': {
        'sku': str,
        'product_name': str,
        'quantity_removed': int,
        'quantity_remaining': int,
        'cart_value_after': float,
        'reason': str,  # 'user_action', 'out_of_stock', 'expired'
    },
    
    'checkout_started': {
        'cart_value': float,
        'item_count': int,
        'brand_count': int,
        'brands': list,  # [brand_ids]
        'has_wallet_balance': bool,
        'wallet_balance': float,
    },
    
    'checkout_completed': {
        'cart_value': float,
        'item_count': int,
        'payment_method': str,  # 'prepaid', 'cod', 'wallet'
        'wallet_applied': float,
        'delivery_slot': str,
        'is_same_day': bool,
        'checkout_duration_seconds': int,
    },
    
    'order_confirmed': {
        'order_number': str,
        'order_value': float,
        'payment_method': str,
        'wallet_used': float,
        'delivery_fee': float,
        'discount_applied': float,
        'item_count': int,
        'brand_count': int,
        'brands': list,
        'skus': list,
        'is_same_day': bool,
        'is_repeat_customer': bool,
        'days_since_last_order': int,
    },
    
    'order_cancelled': {
        'order_number': str,
        'order_value': float,
        'cancel_reason': str,
        'cancel_stage': str,  # 'pending', 'confirmed', 'processing'
        'refund_method': str,
        'refund_amount': float,
    },
    
    'delivery_success': {
        'order_number': str,
        'delivery_time_minutes': int,  # From order to delivery
        'slot_adherence': bool,  # Delivered within slot
        'delivery_zone': str,
    },
    
    'delivery_failed': {
        'order_number': str,
        'failure_reason': str,
        'attempt_count': int,
    },
    
    'reorder_clicked': {
        'original_order_number': str,
        'original_order_value': float,
        'days_since_order': int,
        'items_available': int,
        'items_unavailable': int,
    },
    
    'search_performed': {
        'query': str,
        'results_count': int,
        'filters_applied': dict,
        'clicked_result_position': int,
    },
}
```

---

## Event Ingestion Service

```python
from fastapi import APIRouter, Request, BackgroundTasks, Depends
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
import logging

router = APIRouter(prefix="/api/events", tags=["events"])
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# Event Models
# ═══════════════════════════════════════════════════════════════════════════

class EventBase(BaseModel):
    """Base event structure"""
    event_type: str = Field(..., regex=r'^[a-z_]+$')
    event_id: Optional[str] = None  # Client idempotency key
    
    # Entity references
    brand_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    order_id: Optional[UUID] = None
    
    # Event properties
    properties: Dict[str, Any] = Field(default_factory=dict)
    
    # Client context
    client_timestamp: Optional[datetime] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    
    @validator('event_type')
    def validate_event_type(cls, v):
        valid_types = [
            'product_view', 'product_impression', 'search_performed',
            'add_to_cart', 'remove_from_cart', 'cart_updated',
            'checkout_started', 'checkout_completed',
            'order_confirmed', 'order_cancelled',
            'delivery_success', 'delivery_failed',
            'reorder_clicked', 'wallet_used', 'coupon_applied',
            'app_opened', 'session_started', 'session_ended'
        ]
        if v not in valid_types:
            raise ValueError(f'Invalid event type: {v}')
        return v


class EventBatch(BaseModel):
    """Batch of events"""
    events: List[EventBase] = Field(..., max_items=100)


class EventResponse(BaseModel):
    """Event ingestion response"""
    success: bool
    event_id: str
    queued: bool = True


# ═══════════════════════════════════════════════════════════════════════════
# Event Ingestion Service
# ═══════════════════════════════════════════════════════════════════════════

class EventIngestionService:
    """
    Handles event ingestion, validation, and queuing.
    """
    
    # Priority mapping
    PRIORITY_MAP = {
        'order_confirmed': 'high',
        'order_cancelled': 'high',
        'checkout_completed': 'high',
        'delivery_success': 'high',
        'delivery_failed': 'high',
        'checkout_started': 'normal',
        'add_to_cart': 'normal',
        'remove_from_cart': 'normal',
        'reorder_clicked': 'normal',
        'product_view': 'low',
        'product_impression': 'low',
        'search_performed': 'low',
        'app_opened': 'low',
        'session_started': 'low',
        'session_ended': 'low',
    }
    
    def __init__(self, redis_client, db_session):
        self.redis = redis_client
        self.db = db_session
    
    async def ingest_event(
        self,
        event: EventBase,
        user_id: Optional[UUID],
        session_id: str,
        device_id: Optional[str],
        source: str,
        ip_address: str,
        user_agent: str
    ) -> EventResponse:
        """Ingest a single event"""
        
        # Generate event ID if not provided
        event_id = event.event_id or str(uuid4())
        
        # Check for duplicate (idempotency)
        if event.event_id:
            is_duplicate = await self._check_duplicate(event.event_id)
            if is_duplicate:
                return EventResponse(
                    success=True,
                    event_id=event_id,
                    queued=False
                )
        
        # Enrich event with server context
        enriched_event = {
            'id': str(uuid4()),
            'event_id': event_id,
            'event_type': event.event_type,
            'user_id': str(user_id) if user_id else None,
            'session_id': session_id,
            'device_id': device_id,
            'brand_id': str(event.brand_id) if event.brand_id else None,
            'product_id': str(event.product_id) if event.product_id else None,
            'order_id': str(event.order_id) if event.order_id else None,
            'properties': event.properties,
            'source': source,
            'page_url': event.page_url,
            'referrer': event.referrer,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'client_timestamp': event.client_timestamp.isoformat() if event.client_timestamp else None,
            'server_timestamp': datetime.utcnow().isoformat(),
        }
        
        # Derive geo context from IP (simplified)
        geo = await self._get_geo_context(ip_address, user_id)
        enriched_event.update(geo)
        
        # Queue for async processing
        priority = self.PRIORITY_MAP.get(event.event_type, 'normal')
        queue_name = f"events:{priority}"
        
        await self.redis.lpush(queue_name, json.dumps(enriched_event))
        
        # Mark event ID as seen (for idempotency)
        if event.event_id:
            await self.redis.setex(
                f"event:seen:{event.event_id}",
                86400,  # 24 hour TTL
                "1"
            )
        
        # Update real-time counters
        await self._update_realtime_counters(enriched_event)
        
        return EventResponse(
            success=True,
            event_id=event_id,
            queued=True
        )
    
    async def ingest_batch(
        self,
        events: List[EventBase],
        user_id: Optional[UUID],
        session_id: str,
        device_id: Optional[str],
        source: str,
        ip_address: str,
        user_agent: str
    ) -> dict:
        """Ingest batch of events"""
        results = []
        
        for event in events:
            result = await self.ingest_event(
                event, user_id, session_id, device_id,
                source, ip_address, user_agent
            )
            results.append(result)
        
        return {
            'success': True,
            'processed': len(results),
            'events': results
        }
    
    async def _check_duplicate(self, event_id: str) -> bool:
        """Check if event already processed"""
        return await self.redis.exists(f"event:seen:{event_id}")
    
    async def _get_geo_context(
        self,
        ip_address: str,
        user_id: Optional[UUID]
    ) -> dict:
        """Derive geo context from IP or user's default address"""
        # If user logged in, use their default address zone
        if user_id:
            # Simplified - in production, query user's default address
            cached = await self.redis.hgetall(f"user:geo:{user_id}")
            if cached:
                return {
                    'city': cached.get('city', 'Bangalore'),
                    'pincode': cached.get('pincode'),
                    'zone': cached.get('zone')
                }
        
        # Default to Bangalore (pilot city)
        return {
            'city': 'Bangalore',
            'pincode': None,
            'zone': None
        }
    
    async def _update_realtime_counters(self, event: dict):
        """Update real-time counters in Redis"""
        event_type = event['event_type']
        brand_id = event.get('brand_id')
        timestamp = datetime.utcnow()
        
        # Daily counter key
        date_key = timestamp.strftime('%Y-%m-%d')
        hour_key = timestamp.strftime('%Y-%m-%d-%H')
        
        # Global counters
        await self.redis.hincrby(f"events:daily:{date_key}", event_type, 1)
        await self.redis.hincrby(f"events:hourly:{hour_key}", event_type, 1)
        
        # Brand-specific counters
        if brand_id:
            await self.redis.hincrby(
                f"events:brand:{brand_id}:daily:{date_key}",
                event_type,
                1
            )
        
        # Set TTL for counter keys (7 days for daily, 48 hours for hourly)
        await self.redis.expire(f"events:daily:{date_key}", 604800)
        await self.redis.expire(f"events:hourly:{hour_key}", 172800)
        if brand_id:
            await self.redis.expire(
                f"events:brand:{brand_id}:daily:{date_key}",
                604800
            )


# ═══════════════════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════════════════

@router.post("", response_model=EventResponse)
async def track_event(
    event: EventBase,
    request: Request,
    background_tasks: BackgroundTasks,
    service: EventIngestionService = Depends(get_event_service),
    current_user = Depends(get_optional_current_user)
):
    """Track a single event"""
    
    # Extract context from request
    session_id = request.cookies.get('session_id', str(uuid4()))
    device_id = request.headers.get('X-Device-Id')
    source = request.headers.get('X-Source', 'web')
    ip_address = request.client.host
    user_agent = request.headers.get('User-Agent', '')
    
    return await service.ingest_event(
        event=event,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        device_id=device_id,
        source=source,
        ip_address=ip_address,
        user_agent=user_agent
    )


@router.post("/batch")
async def track_events_batch(
    batch: EventBatch,
    request: Request,
    service: EventIngestionService = Depends(get_event_service),
    current_user = Depends(get_optional_current_user)
):
    """Track multiple events in batch"""
    
    session_id = request.cookies.get('session_id', str(uuid4()))
    device_id = request.headers.get('X-Device-Id')
    source = request.headers.get('X-Source', 'web')
    ip_address = request.client.host
    user_agent = request.headers.get('User-Agent', '')
    
    return await service.ingest_batch(
        events=batch.events,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        device_id=device_id,
        source=source,
        ip_address=ip_address,
        user_agent=user_agent
    )
```

---

## Event Processor (Worker)

```python
import asyncio
import json
import logging
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)


class EventProcessor:
    """
    Background worker for processing queued events.
    
    Responsibilities:
    - Batch writes to PostgreSQL
    - Trigger retention rules
    - Fan-out to analytics aggregation
    """
    
    BATCH_SIZE = 100
    FLUSH_INTERVAL_SECONDS = 5
    
    def __init__(self, redis_client, db_session, retention_engine):
        self.redis = redis_client
        self.db = db_session
        self.retention = retention_engine
        self.buffer = []
        self.last_flush = datetime.utcnow()
    
    async def run(self):
        """Main worker loop"""
        logger.info("Event processor started")
        
        while True:
            try:
                # Process high priority first
                await self._process_queue('events:high')
                await self._process_queue('events:normal')
                await self._process_queue('events:low')
                
                # Flush buffer if needed
                await self._maybe_flush()
                
                # Small delay to prevent busy loop
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Event processor error: {e}")
                await asyncio.sleep(1)
    
    async def _process_queue(self, queue_name: str):
        """Process events from a queue"""
        # Get up to BATCH_SIZE events
        events = []
        for _ in range(self.BATCH_SIZE):
            event_json = await self.redis.rpop(queue_name)
            if not event_json:
                break
            events.append(json.loads(event_json))
        
        if events:
            self.buffer.extend(events)
            
            # Trigger retention checks for relevant events
            for event in events:
                await self._check_retention_triggers(event)
    
    async def _maybe_flush(self):
        """Flush buffer to PostgreSQL if conditions met"""
        should_flush = (
            len(self.buffer) >= self.BATCH_SIZE or
            (datetime.utcnow() - self.last_flush).seconds >= self.FLUSH_INTERVAL_SECONDS
        )
        
        if should_flush and self.buffer:
            await self._flush_to_database()
    
    async def _flush_to_database(self):
        """Batch insert events to PostgreSQL"""
        if not self.buffer:
            return
        
        events_to_insert = self.buffer
        self.buffer = []
        self.last_flush = datetime.utcnow()
        
        try:
            # Prepare batch insert
            values = []
            for event in events_to_insert:
                values.append({
                    'id': event['id'],
                    'event_id': event.get('event_id'),
                    'event_type': event['event_type'],
                    'user_id': event.get('user_id'),
                    'session_id': event.get('session_id'),
                    'device_id': event.get('device_id'),
                    'brand_id': event.get('brand_id'),
                    'product_id': event.get('product_id'),
                    'order_id': event.get('order_id'),
                    'cart_id': event.get('cart_id'),
                    'properties': json.dumps(event.get('properties', {})),
                    'source': event.get('source', 'web'),
                    'page_url': event.get('page_url'),
                    'referrer': event.get('referrer'),
                    'user_agent': event.get('user_agent'),
                    'ip_address': event.get('ip_address'),
                    'city': event.get('city'),
                    'pincode': event.get('pincode'),
                    'zone': event.get('zone'),
                    'client_timestamp': event.get('client_timestamp'),
                    'server_timestamp': event.get('server_timestamp'),
                    'processed': True,
                    'processed_at': datetime.utcnow().isoformat()
                })
            
            # Batch insert with ON CONFLICT for idempotency
            await self.db.execute(
                """
                INSERT INTO events (
                    id, event_id, event_type, user_id, session_id, device_id,
                    brand_id, product_id, order_id, cart_id, properties,
                    source, page_url, referrer, user_agent, ip_address,
                    city, pincode, zone, client_timestamp, server_timestamp,
                    processed, processed_at
                )
                SELECT * FROM unnest($1::events[])
                ON CONFLICT (event_id) DO NOTHING
                """,
                values
            )
            
            logger.info(f"Flushed {len(events_to_insert)} events to database")
            
        except Exception as e:
            logger.error(f"Failed to flush events: {e}")
            # Put events back in queue for retry
            for event in events_to_insert:
                priority = 'normal'  # Use normal priority for retries
                await self.redis.lpush(f"events:{priority}", json.dumps(event))
    
    async def _check_retention_triggers(self, event: dict):
        """Check if event triggers retention rules"""
        event_type = event['event_type']
        
        # Events that trigger retention checks
        trigger_events = {
            'checkout_started': 'cart_abandonment',
            'order_confirmed': 'post_purchase',
            'delivery_success': 'reorder_opportunity',
        }
        
        if event_type in trigger_events:
            await self.retention.evaluate_trigger(
                trigger_type=trigger_events[event_type],
                event=event
            )
```

---

## API Hooks for Backend Services

```python
# Event hooks for backend services to emit events

class EventEmitter:
    """
    Utility for backend services to emit events.
    Use this in service layer code.
    """
    
    def __init__(self, ingestion_service: EventIngestionService):
        self.ingestion = ingestion_service
    
    async def emit(
        self,
        event_type: str,
        user_id: UUID = None,
        brand_id: UUID = None,
        product_id: UUID = None,
        order_id: UUID = None,
        properties: dict = None,
        source: str = 'system'
    ):
        """Emit an event from backend service"""
        event = EventBase(
            event_type=event_type,
            brand_id=brand_id,
            product_id=product_id,
            order_id=order_id,
            properties=properties or {}
        )
        
        await self.ingestion.ingest_event(
            event=event,
            user_id=user_id,
            session_id=f"system-{uuid4()}",
            device_id=None,
            source=source,
            ip_address='127.0.0.1',
            user_agent='Dash24-Backend'
        )


# Example usage in Order Service
class OrderService:
    def __init__(self, ..., event_emitter: EventEmitter):
        self.events = event_emitter
    
    async def confirm_order(self, order: Order):
        # ... order confirmation logic ...
        
        # Emit order confirmed event
        await self.events.emit(
            event_type='order_confirmed',
            user_id=order.user_id,
            order_id=order.id,
            properties={
                'order_number': order.order_number,
                'order_value': float(order.total),
                'payment_method': order.payment_method,
                'item_count': len(order.items),
                'brand_count': len(set(i.brand_id for i in order.items)),
                'brands': [str(i.brand_id) for i in order.items],
                'is_same_day': order.is_same_day_delivery,
            }
        )
```

---

## Performance Considerations

### 1. Write Optimization
- **Batch writes**: Buffer events and flush in batches of 100 or every 5 seconds
- **Async processing**: Events queued immediately, processed by workers
- **Partitioning**: Monthly partitions for efficient data lifecycle management

### 2. Query Optimization
- **Composite indexes**: Brand + event_type + time for analytics queries
- **BRIN index**: For time-range scans on large datasets
- **GIN index**: For JSONB property queries

### 3. Data Lifecycle
```sql
-- Partition management
-- Keep raw events for 90 days, then archive to cold storage

-- Create monthly partitions (automated via pg_partman or cron)
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Archive old partitions
-- 1. Export to S3/GCS in Parquet format
-- 2. Drop partition from hot storage
```

### 4. Rate Limiting
```python
# Per-user rate limiting
RATE_LIMITS = {
    'default': {'requests': 100, 'window': 60},  # 100 events/minute
    'batch': {'requests': 10, 'window': 60},     # 10 batch requests/minute
}
```

### 5. Monitoring
```python
# Key metrics to track
METRICS = [
    'events_ingested_total',       # Counter by event_type
    'events_processing_latency',   # Histogram
    'events_queue_depth',          # Gauge by priority
    'events_batch_size',           # Histogram
    'events_flush_duration',       # Histogram
    'events_errors_total',         # Counter by error_type
]
```

---

## Environment Variables

```bash
# Event System Configuration
EVENT_BATCH_SIZE=100
EVENT_FLUSH_INTERVAL_SECONDS=5
EVENT_RETENTION_DAYS=90
EVENT_RATE_LIMIT_PER_MINUTE=100

# Queue Configuration
EVENT_QUEUE_HIGH=events:high
EVENT_QUEUE_NORMAL=events:normal
EVENT_QUEUE_LOW=events:low

# Worker Configuration
EVENT_WORKERS=2
```
