"""
Dash24 V1 - Order Service
Handles order creation, management, and lifecycle
"""
from typing import List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from uuid import UUID
from decimal import Decimal
import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models import Order, OrderItem, OrderStatusLog, Payment, Product, Cart, CartItem, User, Address
from app.models.enums import OrderStatus, PaymentStatus, PaymentMethod
from app.services.order_state_machine import OrderStateMachine, get_delivery_slot
from app.services.inventory_service import InventoryService

logger = logging.getLogger(__name__)

# Config
COD_MAX_AMOUNT = int(os.environ.get("COD_MAX_AMOUNT", 5000))


class OrderService:
    """Order management service"""
    
    def __init__(self, db: AsyncSession, redis=None):
        self.db = db
        self.redis = redis
        self.state_machine = OrderStateMachine(db)
        self.inventory = InventoryService(db, redis)
    
    async def create_order(
        self,
        user_id: UUID,
        address_id: UUID,
        payment_method: str,
        wallet_amount: Decimal = Decimal("0"),
        delivery_instructions: str = None,
        notes: str = None,
        idempotency_key: Optional[str] = None
    ) -> Tuple[Order, dict]:
        """
        Create order from user's cart.
        
        Returns:
            Tuple[Order, dict]: Order and payment info (for prepaid) or confirmation (for COD)
        """
        
        # 1. Get user's cart
        cart = await self._get_user_cart(user_id)
        if not cart or not cart.items:
            raise ValueError("Cart is empty")
        
        # 2. Validate address
        address = await self.db.get(Address, address_id)
        if not address or not address.is_serviceable:
            raise ValueError("Invalid or non-serviceable address")
        
        # 3. Validate stock availability
        for item in cart.items:
            if not await self.inventory.check_availability(item.product_id, item.quantity):
                raise ValueError(f"Insufficient stock for {item.product.name}")
        
        # 4. Calculate totals
        subtotal = sum(Decimal(str(item.unit_price)) * item.quantity for item in cart.items)
        delivery_fee = Decimal("0")  # Free delivery for pilot
        total = subtotal + delivery_fee - wallet_amount
        
        # 5. Validate COD limits
        if payment_method == PaymentMethod.COD.value:
            if total > COD_MAX_AMOUNT:
                raise ValueError(f"COD not available for orders above ₹{COD_MAX_AMOUNT}")
        
        # 6. Generate order number
        order_number = await self._generate_order_number()
        
        # 7. Get delivery slot
        delivery_slot = get_delivery_slot(datetime.now(timezone.utc))
        
        # 8. Create order
        order = Order(
            order_number=order_number,
            user_id=user_id,
            address_id=address_id,
            status=OrderStatus.PENDING.value,
            payment_status=PaymentStatus.PENDING.value,
            payment_method=payment_method,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            wallet_applied=wallet_amount,
            total=total,
            delivery_slot=delivery_slot,
            delivery_instructions=delivery_instructions,
            notes=notes,
            cod_amount=total if payment_method == PaymentMethod.COD.value else None
        )
        
        self.db.add(order)
        await self.db.flush()
        
        # 9. Create order items
        for cart_item in cart.items:
            product = cart_item.product
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                brand_id=product.brand_id,
                sku=product.sku,
                product_name=product.name,
                brand_name=product.brand.name if product.brand else "Unknown",
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price,
                subtotal=Decimal(str(cart_item.unit_price)) * cart_item.quantity
            )
            self.db.add(order_item)
        
        # 10. Reserve inventory
        for cart_item in cart.items:
            await self.inventory.reserve_stock(
                cart_item.product_id,
                cart_item.quantity,
                str(order.id)
            )
        
        # 11. Handle payment based on method
        if payment_method == PaymentMethod.COD.value:
            # COD: Confirm immediately
            await self.state_machine.transition(
                order,
                OrderStatus.CONFIRMED.value,
                source="system",
                notes="COD order auto-confirmed"
            )
            
            # Clear cart
            await self._clear_cart(cart)
            
            await self.db.commit()
            
            return order, {
                "type": "cod",
                "order_id": str(order.id),
                "order_number": order.order_number,
                "cod_amount": float(total),
                "status": "confirmed"
            }
        
        else:
            # Prepaid: Create Razorpay order
            from app.services.payment_service import payment_service
            
            success, razorpay_data, error = payment_service.create_order(
                amount=float(total),
                order_id=str(order.id)
            )
            
            if not success:
                raise ValueError(f"Payment initialization failed: {error}")
            
            order.razorpay_order_id = razorpay_data.get("id")
            
            # Create payment record
            payment = Payment(
                order_id=order.id,
                razorpay_order_id=razorpay_data.get("id"),
                amount=total,
                status=PaymentStatus.PENDING
            )
            self.db.add(payment)
            
            await self.db.flush()
            
            return order, {
                "type": "prepaid",
                "razorpay_order_id": razorpay_data.get("id"),
                "razorpay_key_id": os.environ.get("RAZORPAY_KEY_ID"),
                "amount": razorpay_data.get("amount"),
                "currency": razorpay_data.get("currency"),
                "order_number": order.order_number
            }
    
    async def verify_payment(
        self,
        order_id: UUID,
        razorpay_payment_id: str,
        razorpay_order_id: str,
        razorpay_signature: str
    ) -> Tuple[bool, str]:
        """Verify Razorpay payment and confirm order"""
        
        order = await self.get_order(order_id)
        if not order:
            return False, "Order not found"
        
        if order.status != OrderStatus.PENDING.value:
            return False, "Order is not pending payment"
        
        # Verify signature (simplified - in production use Razorpay SDK)
        # TODO: Implement actual signature verification with Razorpay
        
        # Update payment
        payment = order.payment
        if payment:
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = PaymentStatus.CAPTURED.value
            payment.updated_at = datetime.now(timezone.utc)
        
        # Confirm order
        order.payment_status = PaymentStatus.CAPTURED.value
        success, error = await self.state_machine.transition(
            order,
            OrderStatus.CONFIRMED.value,
            source="payment_webhook",
            notes="Payment verified"
        )
        
        if success:
            # Clear cart
            cart = await self._get_user_cart(order.user_id)
            if cart:
                await self._clear_cart(cart)
            
            await self.db.commit()
        
        return success, error
    
    async def cancel_order(
        self,
        order_id: UUID,
        reason: str,
        cancelled_by: str = "customer"
    ) -> Tuple[bool, str]:
        """Cancel an order"""
        
        order = await self.get_order(order_id)
        if not order:
            return False, "Order not found"
        
        if not order.can_cancel:
            return False, "Order cannot be cancelled at this stage"
        
        # Transition to cancelled
        success, error = await self.state_machine.transition(
            order,
            OrderStatus.CANCELLED.value,
            source=cancelled_by,
            notes=reason
        )
        
        if success:
            order.cancellation_reason = reason
            order.cancelled_by = cancelled_by
            
            # Release inventory
            for item in order.items:
                await self.inventory.release_reservation(
                    item.product_id,
                    item.quantity,
                    str(order.id)
                )
            
            # TODO: Process refund if prepaid
            
            await self.db.commit()
        
        return success, error
    
    async def get_order(self, order_id: UUID) -> Optional[Order]:
        """Get order by ID with related data"""
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.status_logs),
                selectinload(Order.payment)
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_user_orders(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Tuple[List[Order], int]:
        """Get orders for a user with total count for pagination"""
        
        # Build base query
        base_query = select(Order).where(Order.user_id == user_id)
        count_query = select(func.count(Order.id)).where(Order.user_id == user_id)
        
        if status:
            base_query = base_query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)
        
        # Get total count
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0
        
        # Get paginated orders
        query = base_query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        orders = list(result.scalars().all())
        
        return orders, total
    
    async def update_from_webhook(
        self,
        easyecom_order_id: str,
        new_status: str,
        awb: str = None,
        metadata: dict = None
    ) -> bool:
        """Update order from EasyEcom webhook"""
        
        # Map EasyEcom status to Dash24 status
        status_map = {
            'processing': OrderStatus.PROCESSING.value,
            'packed': OrderStatus.PACKED.value,
            'shipped': OrderStatus.SHIPPED.value,
            'out_for_delivery': OrderStatus.OUT_FOR_DELIVERY.value,
            'delivered': OrderStatus.DELIVERED.value,
            'cancelled': OrderStatus.CANCELLED.value,
            'failed': OrderStatus.FAILED.value,
        }
        
        dash24_status = status_map.get(new_status.lower())
        if not dash24_status:
            logger.warning(f"Unknown EasyEcom status: {new_status}")
            return False
        
        # Find order
        result = await self.db.execute(
            select(Order).where(Order.easyecom_order_id == easyecom_order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            logger.error(f"Order not found for EasyEcom ID: {easyecom_order_id}")
            return False
        
        # Update tracking info
        if awb:
            order.easyecom_awb = awb
        
        order.easyecom_status = new_status
        order.easyecom_last_sync = datetime.now(timezone.utc)
        
        # Mark driver assigned for shipping states
        if dash24_status in [OrderStatus.SHIPPED.value, OrderStatus.OUT_FOR_DELIVERY.value]:
            order.driver_assigned = True
            order.driver_assigned_at = datetime.now(timezone.utc)
        
        # Transition status
        success, error = await self.state_machine.transition(
            order,
            dash24_status,
            source="webhook",
            notes=f"EasyEcom status: {new_status}",
            metadata=metadata
        )
        
        if success:
            await self.db.commit()
        
        return success
    
    async def _get_user_cart(self, user_id: UUID) -> Optional[Cart]:
        """Get user's cart with items"""
        result = await self.db.execute(
            select(Cart)
            .options(
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.brand)
            )
            .where(Cart.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def _clear_cart(self, cart: Cart):
        """Clear cart after order"""
        for item in cart.items:
            await self.db.delete(item)
    
    async def _generate_order_number(self) -> str:
        """Generate unique order number: D24-YYYYMMDD-XXXXX"""
        date_part = datetime.now(timezone.utc).strftime('%Y%m%d')
        
        # Get today's order count
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        result = await self.db.execute(
            select(func.count(Order.id))
            .where(Order.created_at >= today_start)
        )
        count = result.scalar() or 0
        
        sequence = str(count + 1).zfill(5)
        return f"D24-{date_part}-{sequence}"
    
    async def _create_razorpay_order(self, order: Order, amount: Decimal) -> dict:
        """Create Razorpay order for payment"""
        # TODO: Implement actual Razorpay integration
        # For now, return mock data
        
        razorpay_order_id = f"order_{order.id.hex[:16]}"
        
        return {
            "type": "razorpay",
            "order_id": str(order.id),
            "order_number": order.order_number,
            "razorpay_order_id": razorpay_order_id,
            "amount": float(amount),
            "currency": "INR",
            "checkout_options": {
                "key": os.environ.get("RAZORPAY_KEY_ID", ""),
                "order_id": razorpay_order_id,
                "amount": int(amount * 100),  # In paise
                "currency": "INR",
                "name": "Dash24",
                "description": f"Order {order.order_number}"
            }
        }
