# Dash24 V1 - Order State Machine

## Order Lifecycle Overview

The order state machine governs all valid state transitions for an order from creation to completion or cancellation.

---

## State Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                  ORDER STATE MACHINE                         │
                                    └─────────────────────────────────────────────────────────────┘

    ┌──────────┐                                                                    
    │  START   │                                                                    
    └────┬─────┘                                                                    
         │                                                                          
         │ Customer places order                                                    
         ▼                                                                          
    ┌──────────┐                                                                    
    │ PENDING  │──────────────────────────────────────────────────────────────┐     
    └────┬─────┘                                                              │     
         │                                                                    │     
         │                                                                    │     
    ┌────┴──────────────────┐                                                 │     
    │                       │                                                 │     
    │ COD                   │ PREPAID                                        │     
    │                       │                                                 │     
    ▼                       ▼                                                 │     
┌─────────┐          ┌─────────────┐                                          │     
│CONFIRMED│◄─────────│PAYMENT_INIT │                                          │     
└────┬────┘          └──────┬──────┘                                          │     
     │                      │                                                 │     
     │                      │ Payment Success                                 │     
     │               ┌──────┴──────┐                                          │     
     │               │             │                                          │     
     │               │             │ Payment Failed                           │     
     │               ▼             ▼                                          │     
     │          ┌─────────┐   ┌────────┐                                      │     
     │          │CONFIRMED│   │ FAILED │                                      │     
     │          └────┬────┘   └────────┘                                      │     
     │               │                                                        │     
     └───────────────┼────────────────────────────────────────────────────────┤     
                     │                                                        │     
                     │ Push to EasyEcom                                       │     
                     ▼                                                        │     
              ┌────────────┐                                                  │     
              │ PROCESSING │◄─────────────────────────────────────────────────┤     
              └─────┬──────┘                                                  │     
                    │                                                         │     
                    │ EasyEcom confirms pack                                  │     
                    ▼                                                         │     
              ┌──────────┐                                                    │     
              │  PACKED  │────────────────────────────────────────────────────┤     
              └────┬─────┘                                                    │     
                   │                                                          │     
                   │ Handed to delivery partner                               │     
                   ▼                                                          │     
              ┌──────────┐                                                    │     
              │ SHIPPED  │────────────────────────────────────────────────────┤     
              └────┬─────┘                                                    │     
                   │                                                          │     
                   │ Out for delivery (same day)                              │     
                   ▼                                                          │     
         ┌─────────────────┐                                                  │     
         │OUT_FOR_DELIVERY │──────────────────────────────────────────────────┤     
         └────────┬────────┘                                                  │     
                  │                                                           │     
                  │                                                           │     
         ┌────────┴────────┐                                                  │     
         │                 │                                                  │     
         ▼                 ▼                                                  │     
    ┌───────────┐    ┌───────────┐                                            │     
    │ DELIVERED │    │ CANCELLED │◄───────────────────────────────────────────┘     
    └─────┬─────┘    └───────────┘                                                  
          │                                                                          
          │ Return requested                                                         
          ▼                                                                          
    ┌───────────┐                                                                    
    │ RETURNED  │                                                                    
    └─────┬─────┘                                                                    
          │                                                                          
          │ Refund processed                                                         
          ▼                                                                          
    ┌───────────┐                                                                    
    │ REFUNDED  │                                                                    
    └───────────┘                                                                    
```

---

## State Definitions

| State | Description | Triggers Entry | Duration |
|-------|-------------|----------------|----------|
| `pending` | Order created, awaiting action | Customer checkout | < 30 mins (prepaid) |
| `confirmed` | Order confirmed (payment OK or COD accepted) | Payment success / COD confirm | Immediate |
| `processing` | Pushed to EasyEcom, in fulfillment queue | EasyEcom API success | < 2 hours |
| `packed` | Items picked and packed | EasyEcom webhook | < 4 hours |
| `shipped` | Handed to delivery partner | EasyEcom webhook | < 1 hour |
| `out_for_delivery` | On delivery vehicle | EasyEcom webhook | < 4 hours |
| `delivered` | Successfully delivered | EasyEcom webhook / delivery confirmation | Terminal |
| `cancelled` | Order cancelled | Customer/admin/timeout | Terminal |
| `failed` | Order failed (payment/fulfillment) | System detection | Terminal |
| `returned` | Item returned after delivery | Return flow | < 7 days |
| `refunded` | Refund processed | Refund flow | Terminal |

---

## Valid State Transitions

```python
ORDER_TRANSITIONS = {
    'pending': ['confirmed', 'cancelled', 'failed'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['packed', 'cancelled', 'failed'],
    'packed': ['shipped', 'cancelled'],
    'shipped': ['out_for_delivery', 'cancelled'],
    'out_for_delivery': ['delivered', 'cancelled', 'failed'],
    'delivered': ['returned'],
    'returned': ['refunded'],
    'cancelled': [],  # Terminal
    'failed': [],     # Terminal
    'refunded': []    # Terminal
}
```

---

## Transition Business Rules

### pending → confirmed

**Prepaid Orders:**
```python
def can_confirm_prepaid(order, payment):
    return (
        payment.status == 'captured' and
        payment.amount >= order.total and
        inventory_available(order.items)
    )
```

**COD Orders:**
```python
def can_confirm_cod(order):
    return (
        order.total <= MAX_COD_AMOUNT and  # ₹5000 default
        customer.cod_eligible and
        delivery_address.is_serviceable and
        inventory_available(order.items)
    )
```

### confirmed → processing

```python
def push_to_easyecom(order):
    # 1. Lock inventory
    reserve_inventory(order.items)
    
    # 2. Create EasyEcom order
    easyecom_order = easyecom_client.create_order({
        'order_number': order.order_number,
        'items': order.items,
        'shipping_address': order.address,
        'payment_method': order.payment_method,
        'delivery_slot': order.delivery_slot
    })
    
    # 3. Update order with EasyEcom reference
    order.easyecom_order_id = easyecom_order.id
    order.status = 'processing'
    order.save()
```

### Cancellation Rules

| Current State | Can Cancel? | Refund Policy | Inventory Action |
|---------------|-------------|---------------|------------------|
| pending | Yes | Full refund | Release reservation |
| confirmed | Yes | Full refund | Release reservation |
| processing | Maybe* | Full refund | Cancel with EasyEcom |
| packed | No** | - | - |
| shipped | No | - | - |
| out_for_delivery | No | - | - |
| delivered | No (use return) | - | - |

*Processing cancellation requires EasyEcom confirmation
**Packed cancellation only via admin with EasyEcom coordination

---

## Timeout Handling

```python
ORDER_TIMEOUTS = {
    'pending': {
        'prepaid': timedelta(minutes=30),  # Payment timeout
        'cod': timedelta(hours=24),        # Order confirmation timeout
    },
    'confirmed': timedelta(hours=2),       # EasyEcom push timeout
}

async def handle_order_timeouts():
    """Run every 5 minutes via Redis scheduler"""
    
    # Pending prepaid orders - cancel after 30 mins
    stale_prepaid = Order.filter(
        status='pending',
        payment_method='prepaid',
        created_at__lt=now() - timedelta(minutes=30)
    )
    for order in stale_prepaid:
        await transition_order(order, 'failed', reason='payment_timeout')
    
    # Stuck in confirmed - alert and retry EasyEcom push
    stuck_confirmed = Order.filter(
        status='confirmed',
        updated_at__lt=now() - timedelta(hours=2)
    )
    for order in stuck_confirmed:
        await retry_easyecom_push(order)
```

---

## State Machine Implementation

```python
from enum import Enum
from typing import Optional, Callable
from datetime import datetime

class OrderStatus(str, Enum):
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    PROCESSING = 'processing'
    PACKED = 'packed'
    SHIPPED = 'shipped'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    FAILED = 'failed'
    RETURNED = 'returned'
    REFUNDED = 'refunded'

class OrderStateMachine:
    """
    Order state machine with validation and side effects
    """
    
    TRANSITIONS = {
        OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.FAILED],
        OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        OrderStatus.PROCESSING: [OrderStatus.PACKED, OrderStatus.CANCELLED, OrderStatus.FAILED],
        OrderStatus.PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        OrderStatus.SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
        OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED],
        OrderStatus.DELIVERED: [OrderStatus.RETURNED],
        OrderStatus.RETURNED: [OrderStatus.REFUNDED],
        OrderStatus.CANCELLED: [],
        OrderStatus.FAILED: [],
        OrderStatus.REFUNDED: [],
    }
    
    # Side effects for each transition
    TRANSITION_HANDLERS = {
        ('pending', 'confirmed'): 'on_order_confirmed',
        ('confirmed', 'processing'): 'on_order_processing',
        ('processing', 'packed'): 'on_order_packed',
        ('packed', 'shipped'): 'on_order_shipped',
        ('shipped', 'out_for_delivery'): 'on_out_for_delivery',
        ('out_for_delivery', 'delivered'): 'on_order_delivered',
        ('*', 'cancelled'): 'on_order_cancelled',
        ('*', 'failed'): 'on_order_failed',
        ('delivered', 'returned'): 'on_order_returned',
        ('returned', 'refunded'): 'on_order_refunded',
    }
    
    def __init__(self, order, db_session, services):
        self.order = order
        self.db = db_session
        self.services = services  # inventory, payment, notification, easyecom
    
    def can_transition(self, to_status: OrderStatus) -> tuple[bool, str]:
        """Check if transition is valid"""
        current = OrderStatus(self.order.status)
        
        if to_status not in self.TRANSITIONS.get(current, []):
            return False, f"Cannot transition from {current} to {to_status}"
        
        # Additional business rule validations
        if to_status == OrderStatus.CONFIRMED:
            if self.order.payment_method == 'prepaid':
                if self.order.payment_status != 'captured':
                    return False, "Payment not captured"
        
        return True, ""
    
    async def transition(
        self,
        to_status: OrderStatus,
        changed_by: Optional[str] = None,
        source: str = 'system',
        notes: str = None,
        metadata: dict = None
    ) -> tuple[bool, str]:
        """Execute state transition with side effects"""
        
        can_transition, error = self.can_transition(to_status)
        if not can_transition:
            return False, error
        
        from_status = self.order.status
        
        try:
            # Start transaction
            async with self.db.begin():
                # Update order status
                self.order.status = to_status.value
                self.order.updated_at = datetime.utcnow()
                
                # Log status change
                await self._log_transition(
                    from_status, to_status.value,
                    changed_by, source, notes, metadata
                )
                
                # Execute side effects
                handler_key = (from_status, to_status.value)
                wildcard_key = ('*', to_status.value)
                
                handler_name = (
                    self.TRANSITION_HANDLERS.get(handler_key) or
                    self.TRANSITION_HANDLERS.get(wildcard_key)
                )
                
                if handler_name:
                    handler = getattr(self, handler_name, None)
                    if handler:
                        await handler()
                
                await self.db.commit()
            
            return True, ""
            
        except Exception as e:
            await self.db.rollback()
            return False, str(e)
    
    async def _log_transition(self, from_status, to_status, changed_by, source, notes, metadata):
        """Record status change in audit log"""
        log_entry = OrderStatusLog(
            order_id=self.order.id,
            from_status=from_status,
            to_status=to_status,
            changed_by=changed_by,
            source=source,
            notes=notes,
            metadata=metadata or {},
            created_at=datetime.utcnow()
        )
        self.db.add(log_entry)
    
    # ─────────────────────────────────────────────────────────────────
    # Transition Handlers (Side Effects)
    # ─────────────────────────────────────────────────────────────────
    
    async def on_order_confirmed(self):
        """Order confirmed - reserve inventory, notify customer"""
        # Reserve inventory
        await self.services.inventory.reserve_items(self.order.items)
        
        # Send confirmation notification
        await self.services.notification.send_order_confirmed(self.order)
        
        # Queue EasyEcom push
        await self.services.queue.enqueue(
            'push_to_easyecom',
            order_id=str(self.order.id),
            priority='high'
        )
    
    async def on_order_processing(self):
        """Order pushed to EasyEcom"""
        await self.services.notification.send_order_processing(self.order)
    
    async def on_order_packed(self):
        """Order packed at warehouse"""
        await self.services.notification.send_order_packed(self.order)
    
    async def on_order_shipped(self):
        """Order handed to delivery partner"""
        await self.services.notification.send_order_shipped(
            self.order,
            tracking_number=self.order.easyecom_awb
        )
    
    async def on_out_for_delivery(self):
        """Order out for delivery"""
        await self.services.notification.send_out_for_delivery(self.order)
    
    async def on_order_delivered(self):
        """Order delivered successfully"""
        self.order.actual_delivery = datetime.utcnow()
        
        # Mark COD as collected if applicable
        if self.order.payment_method == 'cod':
            self.order.cod_collected = True
            self.order.cod_collected_at = datetime.utcnow()
        
        # Release reserved inventory (convert to sold)
        await self.services.inventory.confirm_sale(self.order.items)
        
        # Award loyalty points/cashback (future)
        # await self.services.loyalty.award_points(self.order)
        
        await self.services.notification.send_order_delivered(self.order)
    
    async def on_order_cancelled(self):
        """Order cancelled - release inventory, process refund"""
        # Release inventory reservation
        await self.services.inventory.release_reservation(self.order.items)
        
        # Process refund if prepaid
        if self.order.payment_method == 'prepaid' and self.order.payment_status == 'captured':
            await self.services.payment.initiate_refund(
                self.order,
                amount=self.order.total,
                reason='order_cancelled'
            )
        
        # Restore wallet credits if used
        if self.order.wallet_applied > 0:
            await self.services.wallet.credit(
                user_id=self.order.user_id,
                amount=self.order.wallet_applied,
                type='credit_refund',
                order_id=self.order.id,
                description=f'Refund for cancelled order {self.order.order_number}'
            )
        
        # Cancel on EasyEcom if pushed
        if self.order.easyecom_order_id:
            await self.services.easyecom.cancel_order(self.order.easyecom_order_id)
        
        await self.services.notification.send_order_cancelled(self.order)
    
    async def on_order_failed(self):
        """Order failed - cleanup and notify"""
        await self.services.inventory.release_reservation(self.order.items)
        await self.services.notification.send_order_failed(self.order)
    
    async def on_order_returned(self):
        """Order returned - update inventory, process refund"""
        # Increment inventory (returned items)
        await self.services.inventory.process_return(self.order.items)
        
        await self.services.notification.send_order_returned(self.order)
    
    async def on_order_refunded(self):
        """Refund processed"""
        self.order.payment_status = 'refunded'
        await self.services.notification.send_refund_processed(self.order)
```

---

## Payment Status Flow

```
                    ┌─────────────────────────────────────┐
                    │       PAYMENT STATUS FLOW           │
                    └─────────────────────────────────────┘

    ┌──────────┐    Create Razorpay Order    ┌────────────┐
    │ PENDING  │─────────────────────────────│ AUTHORIZED │
    └──────────┘                             └─────┬──────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                        ┌──────────┐        ┌──────────┐         ┌──────────┐
                        │ CAPTURED │        │  FAILED  │         │ TIMEOUT  │
                        └────┬─────┘        └──────────┘         └──────────┘
                             │
                             │ Refund Request
                             ▼
                    ┌─────────────────┐
                    │    REFUNDED     │
                    │ (full/partial)  │
                    └─────────────────┘
```

---

## COD Reconciliation State

```python
COD_STATES = {
    'pending_delivery': 'Awaiting delivery',
    'delivered_pending_collection': 'Delivered, COD amount to be collected',
    'collected': 'COD amount collected by delivery partner',
    'remitted': 'Amount remitted to Dash24',
    'disputed': 'Delivery/collection dispute'
}
```

---

## Cutoff Time Logic

```python
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

IST = ZoneInfo('Asia/Kolkata')
SAME_DAY_CUTOFF = time(14, 0)  # 2:00 PM

def get_delivery_slot(order_time: datetime) -> dict:
    """
    Determine delivery slot based on order time
    
    Before 2PM: Same-day delivery (4PM - 8PM slot)
    After 2PM: Next-day delivery (10AM - 2PM or 4PM - 8PM)
    """
    order_ist = order_time.astimezone(IST)
    order_date = order_ist.date()
    order_time_only = order_ist.time()
    
    if order_time_only < SAME_DAY_CUTOFF:
        # Same-day delivery
        delivery_date = order_date
        slot = {
            'date': delivery_date.isoformat(),
            'start_time': '16:00',
            'end_time': '20:00',
            'cutoff': datetime.combine(order_date, SAME_DAY_CUTOFF, IST).isoformat()
        }
    else:
        # Next-day delivery
        delivery_date = order_date + timedelta(days=1)
        slot = {
            'date': delivery_date.isoformat(),
            'start_time': '10:00',
            'end_time': '14:00',
            'cutoff': datetime.combine(order_date + timedelta(days=1), SAME_DAY_CUTOFF, IST).isoformat()
        }
    
    return slot

def is_within_cutoff() -> bool:
    """Check if current time is before same-day cutoff"""
    now_ist = datetime.now(IST)
    return now_ist.time() < SAME_DAY_CUTOFF
```
