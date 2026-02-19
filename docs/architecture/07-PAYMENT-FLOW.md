# Dash24 V1 - Payment Flow & COD Logic

## Overview

Dash24 supports two payment methods:
1. **Prepaid** - Razorpay integration (UPI, cards, netbanking, wallets)
2. **COD** - Cash on Delivery with collection reconciliation

Additionally, customers can use **wallet credits** (loyalty balance) to offset order totals.

---

## Payment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         CHECKOUT FLOW                                    │   │
│   │                                                                          │   │
│   │   Customer Cart ─────> Apply Wallet ─────> Select Payment ─────> Pay    │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                       │
│                    ┌─────────────────────┼─────────────────────┐                │
│                    │                     │                     │                │
│                    ▼                     ▼                     ▼                │
│            ┌───────────────┐     ┌───────────────┐     ┌───────────────┐       │
│            │   PREPAID     │     │     COD       │     │    WALLET     │       │
│            │  (Razorpay)   │     │  (Deferred)   │     │   (Credits)   │       │
│            └───────┬───────┘     └───────┬───────┘     └───────┬───────┘       │
│                    │                     │                     │                │
│                    ▼                     ▼                     ▼                │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │                     PAYMENT SERVICE                                     │   │
│   │                                                                         │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │   │
│   │  │ PaymentGateway │  │ CODService     │  │ WalletService  │            │   │
│   │  │ (Abstract)     │  │                │  │                │            │   │
│   │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │   │
│   │          │                   │                   │                      │   │
│   │          ▼                   │                   │                      │   │
│   │  ┌────────────────┐          │                   │                      │   │
│   │  │ RazorpayAdapter│          │                   │                      │   │
│   │  │ (V1 Default)   │          │                   │                      │   │
│   │  └───────┬────────┘          │                   │                      │   │
│   │          │                   │                   │                      │   │
│   └──────────┼───────────────────┼───────────────────┼──────────────────────┘   │
│              │                   │                   │                          │
│              ▼                   ▼                   ▼                          │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐                 │
│   │   Razorpay     │   │   PostgreSQL   │   │   PostgreSQL   │                 │
│   │   API          │   │   (COD State)  │   │   (Wallet)     │                 │
│   └────────────────┘   └────────────────┘   └────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Gateway Abstraction

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from enum import Enum
from decimal import Decimal

class PaymentStatus(str, Enum):
    PENDING = 'pending'
    AUTHORIZED = 'authorized'
    CAPTURED = 'captured'
    FAILED = 'failed'
    REFUNDED = 'refunded'
    PARTIALLY_REFUNDED = 'partially_refunded'

@dataclass
class PaymentRequest:
    """Payment initiation request"""
    order_id: str
    order_number: str
    amount: Decimal  # In INR
    currency: str = 'INR'
    customer_email: str = None
    customer_phone: str = None
    customer_name: str = None
    description: str = None
    metadata: dict = None

@dataclass
class PaymentResponse:
    """Payment gateway response"""
    success: bool
    gateway_order_id: str = None  # e.g., razorpay_order_id
    gateway_payment_id: str = None  # e.g., razorpay_payment_id
    status: PaymentStatus = PaymentStatus.PENDING
    amount: Decimal = None
    error_code: str = None
    error_message: str = None
    redirect_url: str = None  # For web redirect flows
    checkout_options: dict = None  # Options for frontend SDK

@dataclass
class RefundRequest:
    """Refund initiation request"""
    payment_id: str
    gateway_payment_id: str
    amount: Decimal
    reason: str
    order_id: str = None

@dataclass
class RefundResponse:
    """Refund response"""
    success: bool
    refund_id: str = None
    gateway_refund_id: str = None
    amount: Decimal = None
    status: str = None
    error_message: str = None


class PaymentGateway(ABC):
    """
    Abstract payment gateway interface.
    Implement this to add new payment providers.
    """
    
    @abstractmethod
    async def initialize(self, config: dict) -> bool:
        """Initialize gateway with credentials"""
        pass
    
    @abstractmethod
    async def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Create payment/order on gateway"""
        pass
    
    @abstractmethod
    async def verify_payment(
        self,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str
    ) -> bool:
        """Verify payment signature"""
        pass
    
    @abstractmethod
    async def capture_payment(self, gateway_payment_id: str, amount: Decimal) -> PaymentResponse:
        """Capture authorized payment"""
        pass
    
    @abstractmethod
    async def get_payment_status(self, gateway_payment_id: str) -> PaymentStatus:
        """Get current payment status"""
        pass
    
    @abstractmethod
    async def initiate_refund(self, request: RefundRequest) -> RefundResponse:
        """Initiate refund"""
        pass
    
    @abstractmethod
    async def get_refund_status(self, gateway_refund_id: str) -> str:
        """Get refund status"""
        pass


class PaymentGatewayFactory:
    """Factory for payment gateways"""
    
    _gateways = {}
    
    @classmethod
    def register(cls, name: str, gateway_class: type):
        cls._gateways[name] = gateway_class
    
    @classmethod
    def create(cls, name: str, config: dict) -> PaymentGateway:
        if name not in cls._gateways:
            raise ValueError(f"Unknown payment gateway: {name}")
        return cls._gateways[name](config)
```

---

## Razorpay Adapter

```python
import razorpay
import hmac
import hashlib
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)


class RazorpayAdapter(PaymentGateway):
    """
    Razorpay payment gateway implementation.
    
    Documentation: https://razorpay.com/docs/api/
    """
    
    def __init__(self, config: dict):
        self.key_id = config.get('key_id')
        self.key_secret = config.get('key_secret')
        self.client = None
    
    async def initialize(self, config: dict = None) -> bool:
        """Initialize Razorpay client"""
        try:
            self.client = razorpay.Client(
                auth=(self.key_id, self.key_secret)
            )
            # Test connection
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': 'test',
                'razorpay_payment_id': 'test',
                'razorpay_signature': 'test'
            })
        except razorpay.errors.SignatureVerificationError:
            # Expected - just testing connection
            pass
        except Exception as e:
            logger.error(f"Razorpay initialization failed: {e}")
            return False
        return True
    
    async def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Create Razorpay order"""
        try:
            # Amount in paise
            amount_paise = int(request.amount * 100)
            
            order_data = {
                'amount': amount_paise,
                'currency': request.currency,
                'receipt': request.order_number,
                'notes': {
                    'dash24_order_id': request.order_id,
                    'order_number': request.order_number,
                    **(request.metadata or {})
                }
            }
            
            razorpay_order = self.client.order.create(data=order_data)
            
            return PaymentResponse(
                success=True,
                gateway_order_id=razorpay_order['id'],
                status=PaymentStatus.PENDING,
                amount=request.amount,
                checkout_options={
                    'key': self.key_id,
                    'order_id': razorpay_order['id'],
                    'amount': amount_paise,
                    'currency': request.currency,
                    'name': 'Dash24',
                    'description': request.description or f'Order {request.order_number}',
                    'prefill': {
                        'email': request.customer_email,
                        'contact': request.customer_phone,
                        'name': request.customer_name
                    },
                    'theme': {
                        'color': '#FF6B35'  # Dash24 brand color
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Razorpay create_payment failed: {e}")
            return PaymentResponse(
                success=False,
                error_code='CREATE_FAILED',
                error_message=str(e)
            )
    
    async def verify_payment(
        self,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str
    ) -> bool:
        """Verify Razorpay payment signature"""
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': gateway_order_id,
                'razorpay_payment_id': gateway_payment_id,
                'razorpay_signature': gateway_signature
            })
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
    
    async def capture_payment(self, gateway_payment_id: str, amount: Decimal) -> PaymentResponse:
        """Capture payment (for non-auto-capture scenarios)"""
        try:
            amount_paise = int(amount * 100)
            payment = self.client.payment.capture(
                gateway_payment_id,
                amount_paise
            )
            
            return PaymentResponse(
                success=True,
                gateway_payment_id=gateway_payment_id,
                status=PaymentStatus.CAPTURED,
                amount=Decimal(payment['amount']) / 100
            )
        except Exception as e:
            logger.error(f"Razorpay capture failed: {e}")
            return PaymentResponse(
                success=False,
                error_message=str(e)
            )
    
    async def get_payment_status(self, gateway_payment_id: str) -> PaymentStatus:
        """Get payment status from Razorpay"""
        try:
            payment = self.client.payment.fetch(gateway_payment_id)
            status_map = {
                'created': PaymentStatus.PENDING,
                'authorized': PaymentStatus.AUTHORIZED,
                'captured': PaymentStatus.CAPTURED,
                'refunded': PaymentStatus.REFUNDED,
                'failed': PaymentStatus.FAILED
            }
            return status_map.get(payment['status'], PaymentStatus.PENDING)
        except Exception as e:
            logger.error(f"Razorpay get_status failed: {e}")
            raise
    
    async def initiate_refund(self, request: RefundRequest) -> RefundResponse:
        """Initiate refund via Razorpay"""
        try:
            amount_paise = int(request.amount * 100)
            
            refund = self.client.payment.refund(
                request.gateway_payment_id,
                {
                    'amount': amount_paise,
                    'notes': {
                        'reason': request.reason,
                        'dash24_order_id': request.order_id
                    }
                }
            )
            
            return RefundResponse(
                success=True,
                refund_id=request.payment_id,
                gateway_refund_id=refund['id'],
                amount=Decimal(refund['amount']) / 100,
                status=refund['status']
            )
        except Exception as e:
            logger.error(f"Razorpay refund failed: {e}")
            return RefundResponse(
                success=False,
                error_message=str(e)
            )
    
    async def get_refund_status(self, gateway_refund_id: str) -> str:
        """Get refund status"""
        try:
            refund = self.client.refund.fetch(gateway_refund_id)
            return refund['status']
        except Exception as e:
            logger.error(f"Razorpay get_refund_status failed: {e}")
            raise


# Register adapter
PaymentGatewayFactory.register('razorpay', RazorpayAdapter)
```

---

## Payment Service

```python
from datetime import datetime
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Orchestrates payment operations.
    Handles prepaid, COD, and wallet payments.
    """
    
    def __init__(
        self,
        db_session,
        gateway: PaymentGateway,
        wallet_service: 'WalletService'
    ):
        self.db = db_session
        self.gateway = gateway
        self.wallet = wallet_service
    
    async def initiate_checkout(
        self,
        order: Order,
        payment_method: str,
        wallet_amount: Decimal = Decimal('0')
    ) -> dict:
        """
        Initiate checkout for an order.
        
        Returns checkout data for frontend.
        """
        # Calculate amounts
        wallet_to_apply = min(wallet_amount, order.total)
        remaining_amount = order.total - wallet_to_apply
        
        # If wallet covers full amount
        if remaining_amount <= 0:
            return await self._checkout_with_wallet_only(order, wallet_to_apply)
        
        if payment_method == 'cod':
            return await self._checkout_cod(order, wallet_to_apply, remaining_amount)
        else:
            return await self._checkout_prepaid(order, wallet_to_apply, remaining_amount)
    
    async def _checkout_prepaid(
        self,
        order: Order,
        wallet_amount: Decimal,
        remaining_amount: Decimal
    ) -> dict:
        """Handle prepaid checkout via Razorpay"""
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=remaining_amount,
            method='razorpay',
            status='pending',
            created_at=datetime.utcnow()
        )
        self.db.add(payment)
        
        # Create Razorpay order
        response = await self.gateway.create_payment(PaymentRequest(
            order_id=str(order.id),
            order_number=order.order_number,
            amount=remaining_amount,
            customer_email=order.user.email,
            customer_phone=order.user.phone,
            customer_name=order.user.name,
            metadata={'wallet_applied': str(wallet_amount)}
        ))
        
        if not response.success:
            raise PaymentError(response.error_message)
        
        # Update payment with Razorpay order ID
        payment.razorpay_order_id = response.gateway_order_id
        
        # Reserve wallet amount
        if wallet_amount > 0:
            await self.wallet.reserve(
                user_id=order.user_id,
                amount=wallet_amount,
                order_id=order.id
            )
        
        # Update order
        order.wallet_applied = wallet_amount
        order.payment_status = 'pending'
        
        await self.db.commit()
        
        return {
            'type': 'razorpay',
            'order_id': str(order.id),
            'razorpay_order_id': response.gateway_order_id,
            'amount': float(remaining_amount),
            'wallet_applied': float(wallet_amount),
            'checkout_options': response.checkout_options
        }
    
    async def _checkout_cod(
        self,
        order: Order,
        wallet_amount: Decimal,
        cod_amount: Decimal
    ) -> dict:
        """Handle COD checkout"""
        
        # Validate COD eligibility
        if cod_amount > Decimal('5000'):
            raise PaymentError("COD not available for orders above ₹5000")
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=cod_amount,
            method='cod',
            status='pending',
            created_at=datetime.utcnow()
        )
        self.db.add(payment)
        
        # Debit wallet if applicable
        if wallet_amount > 0:
            await self.wallet.debit(
                user_id=order.user_id,
                amount=wallet_amount,
                order_id=order.id,
                description=f'Applied to order {order.order_number}'
            )
        
        # Update order
        order.wallet_applied = wallet_amount
        order.cod_amount = cod_amount
        order.payment_method = 'cod'
        order.payment_status = 'pending'  # COD payment pending until delivery
        
        await self.db.commit()
        
        return {
            'type': 'cod',
            'order_id': str(order.id),
            'cod_amount': float(cod_amount),
            'wallet_applied': float(wallet_amount),
            'total': float(order.total)
        }
    
    async def _checkout_with_wallet_only(
        self,
        order: Order,
        wallet_amount: Decimal
    ) -> dict:
        """Handle checkout fully paid by wallet"""
        
        # Debit wallet
        await self.wallet.debit(
            user_id=order.user_id,
            amount=wallet_amount,
            order_id=order.id,
            description=f'Full payment for order {order.order_number}'
        )
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            amount=wallet_amount,
            method='wallet',
            status='captured',
            created_at=datetime.utcnow()
        )
        self.db.add(payment)
        
        # Update order
        order.wallet_applied = wallet_amount
        order.payment_method = 'wallet'
        order.payment_status = 'captured'
        order.status = 'confirmed'
        
        await self.db.commit()
        
        return {
            'type': 'wallet',
            'order_id': str(order.id),
            'wallet_applied': float(wallet_amount),
            'status': 'confirmed'
        }
    
    async def verify_and_capture_payment(
        self,
        order_id: str,
        razorpay_payment_id: str,
        razorpay_order_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Verify Razorpay payment callback and capture.
        Called after customer completes payment on frontend.
        """
        
        # Verify signature
        is_valid = await self.gateway.verify_payment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        
        if not is_valid:
            logger.warning(f"Invalid payment signature for order {order_id}")
            return False
        
        # Get order and payment
        order = await self.db.query(Order).filter(Order.id == order_id).first()
        payment = await self.db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.razorpay_order_id == razorpay_order_id
        ).first()
        
        if not order or not payment:
            logger.error(f"Order/Payment not found: {order_id}")
            return False
        
        # Update payment
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = 'captured'
        payment.updated_at = datetime.utcnow()
        
        # If wallet was reserved, confirm the debit
        if order.wallet_applied > 0:
            await self.wallet.confirm_reservation(
                user_id=order.user_id,
                order_id=order.id
            )
        
        # Update order
        order.payment_status = 'captured'
        order.status = 'confirmed'
        order.updated_at = datetime.utcnow()
        
        await self.db.commit()
        
        return True
    
    async def initiate_refund(
        self,
        order: Order,
        amount: Optional[Decimal] = None,
        reason: str = 'customer_request'
    ) -> RefundResponse:
        """Initiate refund for an order"""
        
        payment = await self.db.query(Payment).filter(
            Payment.order_id == order.id,
            Payment.status == 'captured'
        ).first()
        
        if not payment:
            raise PaymentError("No captured payment found")
        
        refund_amount = amount or payment.amount
        
        # For Razorpay payments
        if payment.method == 'razorpay':
            response = await self.gateway.initiate_refund(RefundRequest(
                payment_id=str(payment.id),
                gateway_payment_id=payment.razorpay_payment_id,
                amount=refund_amount,
                reason=reason,
                order_id=str(order.id)
            ))
            
            if response.success:
                payment.refund_amount = (payment.refund_amount or 0) + refund_amount
                payment.status = 'refunded' if payment.refund_amount >= payment.amount else 'partially_refunded'
                
        # For wallet payments, credit back
        elif payment.method == 'wallet':
            await self.wallet.credit(
                user_id=order.user_id,
                amount=refund_amount,
                type='credit_refund',
                order_id=order.id,
                description=f'Refund for order {order.order_number}'
            )
            payment.status = 'refunded'
            response = RefundResponse(success=True, amount=refund_amount)
        
        # Refund wallet amount if applicable
        if order.wallet_applied > 0:
            await self.wallet.credit(
                user_id=order.user_id,
                amount=order.wallet_applied,
                type='credit_refund',
                order_id=order.id,
                description=f'Wallet refund for order {order.order_number}'
            )
        
        await self.db.commit()
        return response
```

---

## COD Reconciliation

```python
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class CODStatus(str, Enum):
    PENDING_DELIVERY = 'pending_delivery'
    DELIVERED_PENDING_COLLECTION = 'delivered_pending_collection'
    COLLECTED = 'collected'
    REMITTED = 'remitted'
    DISPUTED = 'disputed'
    FAILED = 'failed'


class CODReconciliationService:
    """
    Handle COD payment reconciliation.
    
    Flow:
    1. Order delivered → COD amount to be collected
    2. Delivery partner collects cash
    3. 3PL remits to Dash24 (via EasyEcom settlement)
    4. Reconcile against orders
    """
    
    def __init__(self, db_session, notification_service):
        self.db = db_session
        self.notifications = notification_service
    
    async def mark_delivered(self, order_id: str):
        """Mark order as delivered, update COD status"""
        order = await self.db.query(Order).filter(Order.id == order_id).first()
        
        if order.payment_method != 'cod':
            return
        
        order.cod_status = CODStatus.DELIVERED_PENDING_COLLECTION
        order.actual_delivery = datetime.utcnow()
        
        await self.db.commit()
    
    async def mark_collected(
        self,
        order_id: str,
        collected_amount: Decimal,
        collected_at: datetime = None
    ):
        """Mark COD as collected by delivery partner"""
        order = await self.db.query(Order).filter(Order.id == order_id).first()
        
        if collected_amount != order.cod_amount:
            # Amount mismatch - flag for investigation
            logger.warning(
                f"COD amount mismatch for order {order.order_number}: "
                f"expected {order.cod_amount}, collected {collected_amount}"
            )
            order.cod_status = CODStatus.DISPUTED
            order.admin_notes = f"Amount mismatch: expected {order.cod_amount}, collected {collected_amount}"
        else:
            order.cod_status = CODStatus.COLLECTED
            order.cod_collected = True
            order.cod_collected_at = collected_at or datetime.utcnow()
            
            # Mark payment as captured
            payment = await self.db.query(Payment).filter(
                Payment.order_id == order_id,
                Payment.method == 'cod'
            ).first()
            if payment:
                payment.status = 'captured'
        
        await self.db.commit()
    
    async def process_remittance(
        self,
        remittance_data: dict
    ):
        """
        Process COD remittance from 3PL/EasyEcom.
        
        Called when settlement is received.
        """
        orders_in_remittance = remittance_data.get('orders', [])
        total_remitted = Decimal(str(remittance_data.get('total_amount', 0)))
        remittance_id = remittance_data.get('remittance_id')
        
        calculated_total = Decimal('0')
        
        for order_data in orders_in_remittance:
            order_number = order_data.get('order_number')
            remitted_amount = Decimal(str(order_data.get('amount', 0)))
            
            order = await self.db.query(Order).filter(
                Order.order_number == order_number
            ).first()
            
            if not order:
                logger.warning(f"Order not found in remittance: {order_number}")
                continue
            
            if order.cod_status != CODStatus.COLLECTED:
                logger.warning(
                    f"Order {order_number} not in collected status, "
                    f"current: {order.cod_status}"
                )
            
            order.cod_status = CODStatus.REMITTED
            order.metadata = {
                **(order.metadata or {}),
                'remittance_id': remittance_id,
                'remitted_amount': float(remitted_amount),
                'remitted_at': datetime.utcnow().isoformat()
            }
            
            calculated_total += remitted_amount
        
        # Verify total matches
        if abs(calculated_total - total_remitted) > Decimal('0.01'):
            logger.error(
                f"Remittance total mismatch: "
                f"calculated {calculated_total}, reported {total_remitted}"
            )
            # Alert finance team
            await self._alert_remittance_mismatch(
                remittance_id,
                calculated_total,
                total_remitted
            )
        
        await self.db.commit()
        
        return {
            'remittance_id': remittance_id,
            'orders_processed': len(orders_in_remittance),
            'total_remitted': float(total_remitted)
        }
    
    async def get_pending_cod_summary(self) -> dict:
        """Get summary of pending COD reconciliation"""
        summary = await self.db.execute(
            """
            SELECT 
                cod_status,
                COUNT(*) as count,
                SUM(cod_amount) as total_amount
            FROM orders
            WHERE payment_method = 'cod'
            AND cod_status NOT IN ('remitted', 'failed')
            GROUP BY cod_status
            """
        )
        
        results = summary.fetchall()
        
        return {
            'by_status': {
                row.cod_status: {
                    'count': row.count,
                    'amount': float(row.total_amount)
                }
                for row in results
            },
            'total_pending': sum(row.total_amount for row in results)
        }
    
    async def flag_stale_cod(self):
        """
        Flag COD orders that haven't been collected/remitted in expected time.
        
        Run daily.
        """
        # Orders delivered > 3 days ago but not collected
        stale_threshold = datetime.utcnow() - timedelta(days=3)
        
        stale_orders = await self.db.query(Order).filter(
            Order.payment_method == 'cod',
            Order.cod_status == CODStatus.DELIVERED_PENDING_COLLECTION,
            Order.actual_delivery < stale_threshold
        ).all()
        
        for order in stale_orders:
            order.cod_status = CODStatus.DISPUTED
            order.admin_notes = (
                f"{order.admin_notes or ''}\n"
                f"[AUTO] Stale COD - delivered {order.actual_delivery}, not collected"
            )
            
            await self._alert_stale_cod(order)
        
        await self.db.commit()
        
        return len(stale_orders)
    
    async def _alert_remittance_mismatch(
        self,
        remittance_id: str,
        calculated: Decimal,
        reported: Decimal
    ):
        """Alert finance team about remittance mismatch"""
        # TODO: Implement alerting
        pass
    
    async def _alert_stale_cod(self, order: Order):
        """Alert about stale COD order"""
        # TODO: Implement alerting
        pass
```

---

## Wallet Service

```python
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class WalletService:
    """
    Manage customer wallet/loyalty credits.
    
    Credit types:
    - Promotional credits (with expiry)
    - Refund credits (no expiry)
    - Cashback (with expiry)
    - Purchase credits (no expiry)
    """
    
    DEFAULT_PROMO_VALIDITY_DAYS = 90
    
    def __init__(self, db_session):
        self.db = db_session
    
    async def get_balance(self, user_id: str) -> Decimal:
        """Get user's wallet balance"""
        user = await self.db.query(User).filter(User.id == user_id).first()
        return user.wallet_balance if user else Decimal('0')
    
    async def credit(
        self,
        user_id: str,
        amount: Decimal,
        type: str,  # 'credit_purchase', 'credit_promo', 'credit_refund', 'credit_cashback'
        order_id: str = None,
        description: str = None,
        expires_in_days: int = None
    ) -> dict:
        """Add credits to wallet"""
        
        user = await self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        balance_before = user.wallet_balance
        balance_after = balance_before + amount
        
        # Calculate expiry for promotional credits
        expires_at = None
        if type in ('credit_promo', 'credit_cashback'):
            days = expires_in_days or self.DEFAULT_PROMO_VALIDITY_DAYS
            expires_at = datetime.utcnow() + timedelta(days=days)
        
        # Create transaction
        txn = WalletTransaction(
            user_id=user_id,
            order_id=order_id,
            type=type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description,
            expires_at=expires_at,
            created_at=datetime.utcnow()
        )
        self.db.add(txn)
        
        # Update user balance (trigger handles this, but explicit is clearer)
        user.wallet_balance = balance_after
        
        await self.db.commit()
        
        return {
            'transaction_id': str(txn.id),
            'balance': float(balance_after),
            'credited': float(amount)
        }
    
    async def debit(
        self,
        user_id: str,
        amount: Decimal,
        order_id: str = None,
        description: str = None
    ) -> dict:
        """Debit from wallet"""
        
        user = await self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if user.wallet_balance < amount:
            raise ValueError("Insufficient wallet balance")
        
        balance_before = user.wallet_balance
        balance_after = balance_before - amount
        
        txn = WalletTransaction(
            user_id=user_id,
            order_id=order_id,
            type='debit_order',
            amount=-amount,  # Negative for debit
            balance_before=balance_before,
            balance_after=balance_after,
            description=description,
            created_at=datetime.utcnow()
        )
        self.db.add(txn)
        
        user.wallet_balance = balance_after
        
        await self.db.commit()
        
        return {
            'transaction_id': str(txn.id),
            'balance': float(balance_after),
            'debited': float(amount)
        }
    
    async def reserve(
        self,
        user_id: str,
        amount: Decimal,
        order_id: str
    ):
        """
        Reserve wallet amount for checkout.
        Actual debit happens on payment confirmation.
        """
        # Store reservation in Redis
        key = f"wallet:reservation:{order_id}"
        await self.redis.setex(
            key,
            3600,  # 1 hour expiry
            str(amount)
        )
    
    async def confirm_reservation(
        self,
        user_id: str,
        order_id: str
    ):
        """Confirm wallet reservation and debit"""
        key = f"wallet:reservation:{order_id}"
        amount = await self.redis.get(key)
        
        if amount:
            await self.debit(
                user_id=user_id,
                amount=Decimal(amount.decode()),
                order_id=order_id,
                description=f'Payment for order'
            )
            await self.redis.delete(key)
    
    async def release_reservation(self, order_id: str):
        """Release wallet reservation (order cancelled before payment)"""
        key = f"wallet:reservation:{order_id}"
        await self.redis.delete(key)
    
    async def expire_credits(self):
        """
        Expire promotional credits past their expiry date.
        
        Run daily at midnight.
        """
        # Find credits to expire
        expired_credits = await self.db.execute(
            """
            SELECT user_id, SUM(amount) as total
            FROM wallet_transactions
            WHERE type IN ('credit_promo', 'credit_cashback')
            AND expires_at < NOW()
            AND NOT EXISTS (
                SELECT 1 FROM wallet_transactions t2
                WHERE t2.id > wallet_transactions.id
                AND t2.user_id = wallet_transactions.user_id
                AND t2.type = 'debit_expired'
                AND t2.metadata->>'original_txn_id' = wallet_transactions.id::text
            )
            GROUP BY user_id
            """
        )
        
        for row in expired_credits.fetchall():
            user_id = row.user_id
            amount = Decimal(str(row.total))
            
            # Create expiry debit
            await self.debit(
                user_id=user_id,
                amount=amount,
                description='Promotional credits expired'
            )
        
        return expired_credits.rowcount
    
    async def get_transactions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> list[dict]:
        """Get wallet transaction history"""
        txns = await self.db.query(WalletTransaction).filter(
            WalletTransaction.user_id == user_id
        ).order_by(
            WalletTransaction.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return [txn.to_dict() for txn in txns]
```

---

## Environment Variables

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret

# Payment Configuration
PAYMENT_GATEWAY=razorpay
COD_MAX_AMOUNT=5000
WALLET_PROMO_VALIDITY_DAYS=90

# Feature Flags
ENABLE_COD=true
ENABLE_WALLET=true
```
