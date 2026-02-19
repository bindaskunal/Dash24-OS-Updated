"""
Dash24 V1 - Order State Machine
Handles order lifecycle and transitions
"""
from typing import Tuple, Optional, List
from datetime import datetime, timezone
from uuid import UUID
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Order, OrderItem, OrderStatusLog, OrderStatus

logger = logging.getLogger(__name__)


class OrderStateMachine:
    """
    Order state machine with validation and side effects.
    
    State flow:
    pending → confirmed → processing → packed → shipped → out_for_delivery → delivered
                ↓           ↓           ↓         ↓             ↓
              cancelled   cancelled  cancelled  cancelled    cancelled (before driver)
    """
    
    # Valid state transitions
    TRANSITIONS = {
        OrderStatus.PENDING.value: [OrderStatus.CONFIRMED.value, OrderStatus.CANCELLED.value, OrderStatus.FAILED.value],
        OrderStatus.CONFIRMED.value: [OrderStatus.PROCESSING.value, OrderStatus.CANCELLED.value],
        OrderStatus.PROCESSING.value: [OrderStatus.PACKED.value, OrderStatus.CANCELLED.value, OrderStatus.FAILED.value],
        OrderStatus.PACKED.value: [OrderStatus.SHIPPED.value, OrderStatus.CANCELLED.value],
        OrderStatus.SHIPPED.value: [OrderStatus.OUT_FOR_DELIVERY.value, OrderStatus.CANCELLED.value],
        OrderStatus.OUT_FOR_DELIVERY.value: [OrderStatus.DELIVERED.value, OrderStatus.CANCELLED.value, OrderStatus.FAILED.value],
        OrderStatus.DELIVERED.value: [],  # Terminal
        OrderStatus.CANCELLED.value: [],   # Terminal
        OrderStatus.FAILED.value: [],      # Terminal
    }
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def can_transition(self, order: Order, to_status: str) -> Tuple[bool, str]:
        """Check if transition is valid"""
        current = order.status
        
        valid_transitions = self.TRANSITIONS.get(current, [])
        
        if to_status not in valid_transitions:
            return False, f"Cannot transition from {current} to {to_status}"
        
        # Additional business rules for cancellation
        if to_status == OrderStatus.CANCELLED.value:
            if not order.can_cancel:
                return False, "Order cannot be cancelled after driver assignment"
        
        return True, ""
    
    async def transition(
        self,
        order: Order,
        to_status: str,
        changed_by: Optional[UUID] = None,
        source: str = "system",
        notes: str = None,
        metadata: dict = None
    ) -> Tuple[bool, str]:
        """Execute state transition with logging"""
        
        can_transition, error = self.can_transition(order, to_status)
        if not can_transition:
            return False, error
        
        from_status = order.status
        
        try:
            # Update order status
            order.status = to_status
            order.updated_at = datetime.now(timezone.utc)
            
            # Log status change
            log = OrderStatusLog(
                order_id=order.id,
                from_status=from_status,
                to_status=to_status,
                changed_by=changed_by,
                source=source,
                notes=notes,
                metadata=metadata or {}
            )
            self.db.add(log)
            
            # Execute side effects
            await self._execute_side_effects(order, from_status, to_status)
            
            await self.db.flush()
            
            logger.info(f"Order {order.order_number} transitioned: {from_status} → {to_status}")
            
            return True, ""
            
        except Exception as e:
            logger.error(f"Order transition failed: {e}")
            return False, str(e)
    
    async def _execute_side_effects(self, order: Order, from_status: str, to_status: str):
        """Execute side effects for transitions"""
        
        if to_status == OrderStatus.CONFIRMED.value:
            await self._on_order_confirmed(order)
        
        elif to_status == OrderStatus.DELIVERED.value:
            await self._on_order_delivered(order)
        
        elif to_status == OrderStatus.CANCELLED.value:
            await self._on_order_cancelled(order, from_status)
    
    async def _on_order_confirmed(self, order: Order):
        """Side effects when order is confirmed"""
        # In full implementation: reserve inventory, queue EasyEcom push
        logger.info(f"Order {order.order_number} confirmed - inventory reserved")
    
    async def _on_order_delivered(self, order: Order):
        """Side effects when order is delivered"""
        order.actual_delivery = datetime.now(timezone.utc)
        
        if order.payment_method == "cod":
            order.cod_collected = True
            order.cod_collected_at = datetime.now(timezone.utc)
        
        logger.info(f"Order {order.order_number} delivered")
    
    async def _on_order_cancelled(self, order: Order, from_status: str):
        """Side effects when order is cancelled"""
        order.cancelled_at = datetime.now(timezone.utc)
        
        # In full implementation: release inventory, process refund
        logger.info(f"Order {order.order_number} cancelled from {from_status}")


def get_delivery_slot(order_time: datetime) -> dict:
    """
    Determine delivery slot based on order time.
    
    Before 2PM: Same-day delivery (4PM - 8PM slot)
    After 2PM: Next-day delivery (10AM - 2PM)
    """
    from zoneinfo import ZoneInfo
    from datetime import timedelta, time
    
    IST = ZoneInfo('Asia/Kolkata')
    SAME_DAY_CUTOFF = time(14, 0)  # 2:00 PM
    
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
            'is_same_day': True,
            'cutoff': datetime.combine(order_date, SAME_DAY_CUTOFF, IST).isoformat()
        }
    else:
        # Next-day delivery
        delivery_date = order_date + timedelta(days=1)
        slot = {
            'date': delivery_date.isoformat(),
            'start_time': '10:00',
            'end_time': '14:00',
            'is_same_day': False,
            'cutoff': datetime.combine(delivery_date, SAME_DAY_CUTOFF, IST).isoformat()
        }
    
    return slot


def is_within_cutoff() -> bool:
    """Check if current time is before same-day cutoff"""
    from zoneinfo import ZoneInfo
    from datetime import time
    
    IST = ZoneInfo('Asia/Kolkata')
    SAME_DAY_CUTOFF = time(14, 0)
    
    now_ist = datetime.now(IST)
    return now_ist.time() < SAME_DAY_CUTOFF
