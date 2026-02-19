# Dash24 V1 - Inventory Sync Strategy

## Overview

Inventory synchronization between Dash24 and EasyEcom uses a **hybrid approach**:

1. **Event-Driven (Primary)**: Real-time webhook updates from EasyEcom
2. **Reconciliation (Secondary)**: Periodic full sync to catch missed events and fix drift

---

## Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INVENTORY SYNC ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         EASYECOM (Source of Truth)                       │   │
│   │                                                                          │   │
│   │   Warehouse Inventory ──────────────────────────────────────────────┐    │   │
│   │                                                                     │    │   │
│   └─────────────────────────────────────────────────────────────────────┼────┘   │
│                                                                         │        │
│           ┌──────────────────────────────────┐                          │        │
│           │     Webhook Push (Real-time)      │◄─────────────────────────        │
│           │  • inventory.updated              │                                  │
│           │  • stock.adjusted                 │                                  │
│           │  • order.fulfilled                │                                  │
│           └──────────────────┬───────────────┘                                  │
│                              │                                                   │
│                              ▼                                                   │
│           ┌──────────────────────────────────┐                                  │
│           │       Webhook Handler            │                                  │
│           │  • Verify signature              │                                  │
│           │  • Parse & validate              │                                  │
│           │  • Deduplicate events            │                                  │
│           └──────────────────┬───────────────┘                                  │
│                              │                                                   │
│                              ▼                                                   │
│     ┌────────────────────────────────────────────────────────────────────┐      │
│     │                    REDIS QUEUE                                      │      │
│     │  ┌────────────┐  ┌────────────┐  ┌────────────┐                    │      │
│     │  │ inventory  │  │   sync     │  │   recon    │                    │      │
│     │  │  updates   │  │   jobs     │  │   jobs     │                    │      │
│     │  └────────────┘  └────────────┘  └────────────┘                    │      │
│     └────────────────────────────┬───────────────────────────────────────┘      │
│                                  │                                               │
│                                  ▼                                               │
│     ┌────────────────────────────────────────────────────────────────────┐      │
│     │                  INVENTORY SERVICE                                  │      │
│     │                                                                     │      │
│     │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │      │
│     │  │ Process Event │  │ Update Stock  │  │ Handle Reservation    │   │      │
│     │  │ (webhook)     │  │ (PostgreSQL)  │  │ (cart/order locks)    │   │      │
│     │  └───────────────┘  └───────────────┘  └───────────────────────┘   │      │
│     │                                                                     │      │
│     │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │      │
│     │  │ Invalidate    │  │ Log Sync      │  │ Alert on Discrepancy  │   │      │
│     │  │ Cache (Redis) │  │ (audit trail) │  │ (if > threshold)      │   │      │
│     │  └───────────────┘  └───────────────┘  └───────────────────────┘   │      │
│     │                                                                     │      │
│     └────────────────────────────────────────────────────────────────────┘      │
│                                  │                                               │
│                                  ▼                                               │
│     ┌────────────────────────────────────────────────────────────────────┐      │
│     │                    POSTGRESQL                                       │      │
│     │                                                                     │      │
│     │  products.stock_quantity      ◄── Updated stock                    │      │
│     │  products.reserved_quantity   ◄── Active reservations              │      │
│     │  products.last_synced_at      ◄── Sync timestamp                   │      │
│     │  inventory_sync_log           ◄── Audit records                    │      │
│     │                                                                     │      │
│     └────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│                       RECONCILIATION PROCESS (Scheduled)                         │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │  │
│   │  │  CRON JOB   │────>│   Fetch All │────>│   Compare   │                │  │
│   │  │  (Hourly)   │     │   from OMS  │     │   & Update  │                │  │
│   │  └─────────────┘     └─────────────┘     └──────┬──────┘                │  │
│   │                                                 │                        │  │
│   │                                                 ▼                        │  │
│   │                                    ┌──────────────────────┐              │  │
│   │                                    │  Log Discrepancies   │              │  │
│   │                                    │  Alert if > 10%      │              │  │
│   │                                    │  Auto-correct        │              │  │
│   │                                    └──────────────────────┘              │  │
│   │                                                                          │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Inventory Data Model

```python
@dataclass
class InventoryState:
    """Inventory state for a product"""
    sku: str
    easyecom_quantity: int      # From OMS (source of truth)
    local_quantity: int         # Synced to PostgreSQL
    reserved_quantity: int      # In carts or pending orders
    available_quantity: int     # local - reserved
    last_synced_at: datetime
    sync_status: str            # 'synced', 'pending', 'error', 'stale'

# PostgreSQL products table columns
"""
stock_quantity INT       -- Total stock from EasyEcom
reserved_quantity INT    -- Currently reserved (carts + pending orders)
-- Available = stock_quantity - reserved_quantity
last_synced_at TIMESTAMP
sync_status VARCHAR
"""
```

---

## Event-Driven Sync (Webhooks)

### Webhook Events

| Event Type | Trigger | Action |
|------------|---------|--------|
| `inventory.updated` | Stock adjustment in EasyEcom | Update `stock_quantity` |
| `inventory.low_stock` | Stock below threshold | Send alert to admin |
| `order.fulfilled` | Order shipped from warehouse | Reduce `stock_quantity` |
| `order.returned` | Return received | Increase `stock_quantity` |
| `product.created` | New product in EasyEcom | Create product record |
| `product.updated` | Product details changed | Update product metadata |

### Webhook Handler

```python
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from datetime import datetime
import json

router = APIRouter()

class InventoryWebhookHandler:
    """Handle inventory webhook events from EasyEcom"""
    
    def __init__(self, oms_adapter, db_session, redis_client, queue):
        self.oms = oms_adapter
        self.db = db_session
        self.redis = redis_client
        self.queue = queue
    
    async def handle_webhook(
        self,
        request: Request,
        background_tasks: BackgroundTasks
    ):
        """Process incoming webhook"""
        
        # 1. Get raw payload and headers
        payload = await request.body()
        signature = request.headers.get('X-Easyecom-Signature', '')
        event_type = request.headers.get('X-Easyecom-Event', '')
        event_id = request.headers.get('X-Easyecom-Event-Id', '')
        
        # 2. Verify signature
        if not self.oms.verify_webhook_signature(payload, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # 3. Check for duplicate (idempotency)
        if await self._is_duplicate(event_id):
            return {"status": "already_processed"}
        
        # 4. Parse and log
        data = json.loads(payload)
        await self._log_webhook(event_id, event_type, data)
        
        # 5. Acknowledge immediately, process async
        background_tasks.add_task(
            self._process_event,
            event_id,
            event_type,
            data
        )
        
        return {"status": "accepted"}
    
    async def _is_duplicate(self, event_id: str) -> bool:
        """Check if event already processed (Redis-based idempotency)"""
        key = f"webhook:event:{event_id}"
        exists = await self.redis.exists(key)
        if not exists:
            # Mark as processing, expire after 24h
            await self.redis.setex(key, 86400, "processing")
        return exists
    
    async def _log_webhook(self, event_id: str, event_type: str, data: dict):
        """Log webhook for audit"""
        log = WebhookLog(
            event_id=event_id,
            source='easyecom',
            event_type=event_type,
            payload=data,
            status='pending',
            created_at=datetime.utcnow()
        )
        self.db.add(log)
        await self.db.commit()
    
    async def _process_event(self, event_id: str, event_type: str, data: dict):
        """Process webhook event"""
        try:
            event = self.oms.parse_webhook(data, event_type)
            
            if event.event_type == 'inventory_update':
                await self._handle_inventory_update(event)
            elif event.event_type == 'order_status':
                await self._handle_order_status(event)
            
            # Mark as processed
            await self._update_webhook_status(event_id, 'success')
            await self.redis.setex(f"webhook:event:{event_id}", 86400, "processed")
            
        except Exception as e:
            await self._update_webhook_status(event_id, 'failed', str(e))
            # Queue for retry
            await self._queue_retry(event_id, event_type, data)
    
    async def _handle_inventory_update(self, event: OMSWebhookEvent):
        """Process inventory update event"""
        sku = event.sku
        new_quantity = event.data.get('available_quantity', 0)
        
        # Get current local quantity
        product = await self.db.query(Product).filter(Product.sku == sku).first()
        if not product:
            # Unknown SKU - might be new product, queue sync
            await self.queue.enqueue('sync_new_product', sku=sku)
            return
        
        old_quantity = product.stock_quantity
        discrepancy = new_quantity - old_quantity
        
        # Update stock
        product.stock_quantity = new_quantity
        product.last_synced_at = datetime.utcnow()
        product.sync_status = 'synced'
        
        # Log sync
        sync_log = InventorySyncLog(
            product_id=product.id,
            easyecom_quantity=new_quantity,
            local_quantity=old_quantity,
            sync_type='webhook',
            synced_at=datetime.utcnow()
        )
        self.db.add(sync_log)
        
        # Invalidate cache
        await self._invalidate_product_cache(sku)
        
        await self.db.commit()
        
        # Alert if significant discrepancy
        if abs(discrepancy) > 10:
            await self._alert_discrepancy(sku, old_quantity, new_quantity)
    
    async def _invalidate_product_cache(self, sku: str):
        """Invalidate product cache in Redis"""
        keys = [
            f"product:{sku}",
            f"product:{sku}:stock",
            f"inventory:{sku}"
        ]
        await self.redis.delete(*keys)
    
    async def _alert_discrepancy(self, sku: str, old: int, new: int):
        """Alert admin about significant inventory discrepancy"""
        # TODO: Implement alerting (Slack, email, etc.)
        pass


# API endpoint
@router.post("/webhooks/easyecom")
async def easyecom_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    handler: InventoryWebhookHandler = Depends(get_inventory_handler)
):
    return await handler.handle_webhook(request, background_tasks)
```

---

## Reconciliation Process

### Scheduled Reconciliation

```python
from datetime import datetime, timedelta
import asyncio

class InventoryReconciler:
    """
    Periodic inventory reconciliation between Dash24 and EasyEcom.
    
    Schedule:
    - Full sync: Every hour
    - Deep reconciliation: Daily at 2 AM
    - Quick check (high-velocity SKUs): Every 15 minutes
    """
    
    DISCREPANCY_THRESHOLD_PERCENT = 10  # Alert if > 10% discrepancy
    DISCREPANCY_THRESHOLD_ABSOLUTE = 5  # Alert if > 5 units difference
    
    def __init__(self, oms_adapter, db_session, redis_client):
        self.oms = oms_adapter
        self.db = db_session
        self.redis = redis_client
    
    async def full_reconciliation(self):
        """
        Full inventory reconciliation.
        Compares all SKUs between Dash24 and EasyEcom.
        """
        start_time = datetime.utcnow()
        stats = {
            'total_skus': 0,
            'synced': 0,
            'discrepancies': 0,
            'errors': 0,
            'details': []
        }
        
        try:
            # 1. Fetch all inventory from EasyEcom
            oms_inventory = await self.oms.sync_inventory()
            oms_stock_map = {p.sku: p.quantity for p in oms_inventory}
            stats['total_skus'] = len(oms_stock_map)
            
            # 2. Get local inventory
            local_products = await self.db.query(Product).all()
            local_stock_map = {p.sku: p.stock_quantity for p in local_products}
            
            # 3. Compare and reconcile
            all_skus = set(oms_stock_map.keys()) | set(local_stock_map.keys())
            
            for sku in all_skus:
                oms_qty = oms_stock_map.get(sku, 0)
                local_qty = local_stock_map.get(sku, 0)
                
                if oms_qty != local_qty:
                    discrepancy = oms_qty - local_qty
                    stats['discrepancies'] += 1
                    
                    # Log discrepancy
                    stats['details'].append({
                        'sku': sku,
                        'oms_quantity': oms_qty,
                        'local_quantity': local_qty,
                        'discrepancy': discrepancy
                    })
                    
                    # Auto-correct by syncing from EasyEcom
                    await self._sync_product_stock(sku, oms_qty)
                else:
                    stats['synced'] += 1
            
            # 4. Handle SKUs in EasyEcom but not locally (new products)
            missing_skus = set(oms_stock_map.keys()) - set(local_stock_map.keys())
            for sku in missing_skus:
                await self._create_missing_product(sku, oms_inventory)
            
            # 5. Mark stale products (in Dash24 but not in EasyEcom)
            stale_skus = set(local_stock_map.keys()) - set(oms_stock_map.keys())
            for sku in stale_skus:
                await self._mark_product_stale(sku)
            
            # 6. Log reconciliation results
            await self._log_reconciliation(stats, start_time)
            
            # 7. Alert if significant discrepancies
            if stats['discrepancies'] > 0:
                discrepancy_rate = (stats['discrepancies'] / stats['total_skus']) * 100
                if discrepancy_rate > self.DISCREPANCY_THRESHOLD_PERCENT:
                    await self._alert_high_discrepancy(stats)
            
            return stats
            
        except Exception as e:
            stats['errors'] += 1
            await self._log_reconciliation_error(str(e), start_time)
            raise
    
    async def quick_reconciliation(self, skus: List[str]):
        """
        Quick reconciliation for specific SKUs.
        Used for high-velocity products or after order events.
        """
        oms_stock = await self.oms.bulk_get_stock_levels(skus)
        
        for sku, oms_qty in oms_stock.items():
            product = await self.db.query(Product).filter(Product.sku == sku).first()
            if product and product.stock_quantity != oms_qty:
                await self._sync_product_stock(sku, oms_qty)
    
    async def reconcile_after_order(self, order_items: List[dict]):
        """
        Reconcile inventory after order is placed.
        Ensures stock levels are accurate post-order.
        """
        skus = [item['sku'] for item in order_items]
        
        # Small delay to allow EasyEcom to process
        await asyncio.sleep(2)
        
        await self.quick_reconciliation(skus)
    
    async def _sync_product_stock(self, sku: str, new_quantity: int):
        """Update product stock from OMS"""
        await self.db.execute(
            """
            UPDATE products 
            SET stock_quantity = :qty,
                last_synced_at = :now,
                sync_status = 'synced'
            WHERE sku = :sku
            """,
            {'qty': new_quantity, 'now': datetime.utcnow(), 'sku': sku}
        )
        
        # Log sync
        product = await self.db.query(Product).filter(Product.sku == sku).first()
        if product:
            sync_log = InventorySyncLog(
                product_id=product.id,
                easyecom_quantity=new_quantity,
                local_quantity=product.stock_quantity,
                sync_type='reconciliation',
                synced_at=datetime.utcnow()
            )
            self.db.add(sync_log)
        
        # Invalidate cache
        await self.redis.delete(f"product:{sku}", f"inventory:{sku}")
        
        await self.db.commit()
    
    async def _log_reconciliation(self, stats: dict, start_time: datetime):
        """Log reconciliation run"""
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Store in Redis for monitoring
        await self.redis.hset('reconciliation:last_run', mapping={
            'timestamp': datetime.utcnow().isoformat(),
            'duration_seconds': duration,
            'total_skus': stats['total_skus'],
            'discrepancies': stats['discrepancies'],
            'synced': stats['synced']
        })
        
        # Store detailed log in PostgreSQL
        # ... implementation


# Scheduler setup (using APScheduler or similar)
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

# Full reconciliation every hour
scheduler.add_job(
    reconciler.full_reconciliation,
    'interval',
    hours=1,
    id='inventory_full_reconciliation'
)

# Quick check for high-velocity SKUs every 15 minutes
scheduler.add_job(
    reconciler.quick_reconciliation,
    'interval',
    minutes=15,
    args=[HIGH_VELOCITY_SKUS],
    id='inventory_quick_reconciliation'
)

scheduler.start()
"""
```

---

## Inventory Reservation System

```python
class InventoryReservationService:
    """
    Handle inventory reservations for carts and pending orders.
    
    Reservation flow:
    1. Customer adds item to cart → Soft reservation (expires in 30 mins)
    2. Customer proceeds to checkout → Hard reservation (extends to order completion)
    3. Order confirmed → Reservation converted to sale
    4. Order cancelled → Reservation released
    """
    
    SOFT_RESERVATION_TTL = timedelta(minutes=30)
    HARD_RESERVATION_TTL = timedelta(hours=2)
    
    def __init__(self, db_session, redis_client):
        self.db = db_session
        self.redis = redis_client
    
    async def reserve_for_cart(
        self,
        product_id: str,
        quantity: int,
        cart_id: str
    ) -> bool:
        """
        Create soft reservation for cart item.
        Returns True if reservation successful.
        """
        async with self.db.begin():
            # Check available stock
            product = await self.db.query(Product).filter(
                Product.id == product_id
            ).with_for_update().first()
            
            available = product.stock_quantity - product.reserved_quantity
            
            if quantity > available:
                return False
            
            # Create reservation
            product.reserved_quantity += quantity
            
            # Track reservation in Redis for TTL
            reservation_key = f"reservation:{cart_id}:{product_id}"
            await self.redis.setex(
                reservation_key,
                int(self.SOFT_RESERVATION_TTL.total_seconds()),
                str(quantity)
            )
            
            # Set up expiry callback
            await self._schedule_reservation_expiry(
                cart_id,
                product_id,
                quantity,
                self.SOFT_RESERVATION_TTL
            )
            
            await self.db.commit()
            return True
    
    async def extend_reservation(
        self,
        product_id: str,
        quantity: int,
        cart_id: str,
        order_id: str
    ):
        """
        Convert cart reservation to order reservation.
        Extends TTL for order processing.
        """
        reservation_key = f"reservation:{cart_id}:{product_id}"
        order_key = f"reservation:{order_id}:{product_id}"
        
        # Transfer reservation
        current_qty = await self.redis.get(reservation_key)
        if current_qty:
            await self.redis.delete(reservation_key)
            await self.redis.setex(
                order_key,
                int(self.HARD_RESERVATION_TTL.total_seconds()),
                str(quantity)
            )
    
    async def release_reservation(
        self,
        product_id: str,
        quantity: int,
        reference_id: str  # cart_id or order_id
    ):
        """Release inventory reservation"""
        async with self.db.begin():
            product = await self.db.query(Product).filter(
                Product.id == product_id
            ).with_for_update().first()
            
            product.reserved_quantity = max(0, product.reserved_quantity - quantity)
            
            # Remove Redis key
            await self.redis.delete(f"reservation:{reference_id}:{product_id}")
            
            await self.db.commit()
    
    async def confirm_sale(self, order_items: List[dict]):
        """
        Convert reservation to sale.
        Stock already reduced by EasyEcom via webhook.
        """
        for item in order_items:
            # Release the reservation (stock already deducted via webhook)
            async with self.db.begin():
                product = await self.db.query(Product).filter(
                    Product.id == item['product_id']
                ).with_for_update().first()
                
                product.reserved_quantity = max(
                    0, 
                    product.reserved_quantity - item['quantity']
                )
                
                await self.db.commit()
    
    async def cleanup_expired_reservations(self):
        """
        Periodic job to clean up expired reservations.
        Redis TTL handles automatic expiry, this syncs PostgreSQL.
        """
        # Find all active reservations in DB without Redis counterpart
        # This handles cases where Redis key expired but DB not updated
        pass
    
    async def _schedule_reservation_expiry(
        self,
        cart_id: str,
        product_id: str,
        quantity: int,
        ttl: timedelta
    ):
        """Schedule reservation release after TTL"""
        # Using Redis keyspace notifications or scheduled job
        # When key expires, release the reservation
        pass
```

---

## Cache Strategy

```python
class InventoryCache:
    """
    Redis-based caching for inventory data.
    
    Cache hierarchy:
    1. product:{sku} - Full product data (5 min TTL)
    2. inventory:{sku} - Stock level only (1 min TTL)
    3. available:{sku} - Available quantity (30 sec TTL, computed)
    """
    
    PRODUCT_TTL = 300      # 5 minutes
    INVENTORY_TTL = 60     # 1 minute
    AVAILABLE_TTL = 30     # 30 seconds
    
    def __init__(self, redis_client, db_session):
        self.redis = redis_client
        self.db = db_session
    
    async def get_product(self, sku: str) -> Optional[dict]:
        """Get product with caching"""
        cache_key = f"product:{sku}"
        
        # Try cache
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Fetch from DB
        product = await self.db.query(Product).filter(Product.sku == sku).first()
        if not product:
            return None
        
        data = product.to_dict()
        
        # Cache
        await self.redis.setex(cache_key, self.PRODUCT_TTL, json.dumps(data))
        
        return data
    
    async def get_available_quantity(self, sku: str) -> int:
        """
        Get available quantity (stock - reserved).
        Short TTL for accuracy.
        """
        cache_key = f"available:{sku}"
        
        cached = await self.redis.get(cache_key)
        if cached:
            return int(cached)
        
        # Compute from DB
        product = await self.db.query(Product).filter(Product.sku == sku).first()
        if not product:
            return 0
        
        available = max(0, product.stock_quantity - product.reserved_quantity)
        
        await self.redis.setex(cache_key, self.AVAILABLE_TTL, str(available))
        
        return available
    
    async def bulk_get_available(self, skus: List[str]) -> dict[str, int]:
        """Get available quantities for multiple SKUs"""
        result = {}
        missing = []
        
        # Check cache
        for sku in skus:
            cached = await self.redis.get(f"available:{sku}")
            if cached:
                result[sku] = int(cached)
            else:
                missing.append(sku)
        
        # Fetch missing from DB
        if missing:
            products = await self.db.query(Product).filter(
                Product.sku.in_(missing)
            ).all()
            
            for p in products:
                available = max(0, p.stock_quantity - p.reserved_quantity)
                result[p.sku] = available
                await self.redis.setex(f"available:{p.sku}", self.AVAILABLE_TTL, str(available))
        
        return result
    
    async def invalidate(self, sku: str):
        """Invalidate all caches for a SKU"""
        keys = [
            f"product:{sku}",
            f"inventory:{sku}",
            f"available:{sku}"
        ]
        await self.redis.delete(*keys)
```

---

## Sync Status Monitoring

```python
# Redis keys for monitoring
MONITORING_KEYS = {
    'sync:last_webhook': 'Timestamp of last webhook received',
    'sync:last_reconciliation': 'Timestamp of last full reconciliation',
    'sync:discrepancy_count': 'Current number of unresolved discrepancies',
    'sync:health': 'Overall sync health status'
}

async def get_sync_health() -> dict:
    """Get inventory sync health status"""
    last_webhook = await redis.get('sync:last_webhook')
    last_recon = await redis.get('sync:last_reconciliation')
    discrepancies = await redis.get('sync:discrepancy_count')
    
    # Check if sync is healthy
    now = datetime.utcnow()
    webhook_age = (now - datetime.fromisoformat(last_webhook)).seconds if last_webhook else float('inf')
    recon_age = (now - datetime.fromisoformat(last_recon)).seconds if last_recon else float('inf')
    
    health = 'healthy'
    if webhook_age > 300:  # No webhook in 5 min
        health = 'degraded'
    if recon_age > 7200:  # No reconciliation in 2 hours
        health = 'unhealthy'
    
    return {
        'health': health,
        'last_webhook': last_webhook,
        'last_reconciliation': last_recon,
        'unresolved_discrepancies': int(discrepancies or 0),
        'webhook_age_seconds': webhook_age,
        'reconciliation_age_seconds': recon_age
    }
```
