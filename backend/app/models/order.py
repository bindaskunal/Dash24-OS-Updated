"""
Dash24 V1 - Order Model with State Machine
"""
from sqlalchemy import Column, String, Boolean, Numeric, Integer, DateTime, ForeignKey, Text, CheckConstraint, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base
from app.models.enums import OrderStatus, PaymentStatus, PaymentMethod, FulfillmentStatus


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # User & Address
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=False)
    
    # Status
    status = Column(
        SQLEnum(OrderStatus, name='order_status', create_constraint=True),
        nullable=False,
        default=OrderStatus.PENDING,
        index=True
    )
    payment_status = Column(
        SQLEnum(PaymentStatus, name='payment_status', create_constraint=True),
        nullable=False,
        default=PaymentStatus.PENDING
    )
    payment_method = Column(
        SQLEnum(PaymentMethod, name='payment_method', create_constraint=True),
        nullable=False
    )
    fulfillment_status = Column(
        SQLEnum(FulfillmentStatus, name='fulfillment_status', create_constraint=True),
        nullable=False,
        default=FulfillmentStatus.PENDING,
        index=True
    )
    
    # Pricing
    subtotal = Column(Numeric(10, 2), nullable=False)
    delivery_fee = Column(Numeric(10, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    wallet_applied = Column(Numeric(10, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False)
    
    # Razorpay integration
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    
    # EasyEcom integration
    easyecom_order_id = Column(String(100), nullable=True, index=True)
    easyecom_status = Column(String(100))
    easyecom_awb = Column(String(100))
    easyecom_sync_status = Column(String(50), default="pending")
    easyecom_last_sync = Column(DateTime(timezone=True))
    
    # Delivery
    delivery_slot = Column(JSONB)
    cutoff_time = Column(DateTime(timezone=True))
    estimated_delivery = Column(DateTime(timezone=True))
    actual_delivery = Column(DateTime(timezone=True))
    delivery_instructions = Column(Text)
    
    # COD specific
    cod_amount = Column(Numeric(10, 2))
    cod_collected = Column(Boolean, default=False)
    cod_collected_at = Column(DateTime(timezone=True))
    
    # Driver assignment
    driver_assigned = Column(Boolean, default=False)
    driver_assigned_at = Column(DateTime(timezone=True))
    
    # Metadata
    source = Column(String(50), default="web")
    notes = Column(Text)
    admin_notes = Column(Text)
    extra_metadata = Column("metadata", JSONB, default=dict)
    
    # Cancellation tracking
    cancelled_at = Column(DateTime(timezone=True))
    cancellation_reason = Column(Text)
    cancelled_by = Column(String(50))
    
    # Idempotency key for duplicate prevention
    idempotency_key = Column(String(255), unique=True, nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_logs = relationship("OrderStatusLog", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    address = relationship("Address")
    
    __table_args__ = (
        CheckConstraint("total >= 0", name="chk_total_positive"),
        Index("ix_orders_user_created", "user_id", "created_at"),
        Index("ix_orders_status_created", "status", "created_at"),
    )
    
    @property
    def can_cancel(self):
        non_cancellable_statuses = [
            OrderStatus.SHIPPED,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.FAILED
        ]
        
        if self.status in non_cancellable_statuses:
            return False
        
        if self.driver_assigned:
            return False
        
        return True
    
    @property
    def is_same_day(self):
        if self.delivery_slot:
            return self.delivery_slot.get("is_same_day", False)
        return False
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "order_number": self.order_number,
            "status": self.status.value if isinstance(self.status, OrderStatus) else self.status,
            "payment_status": self.payment_status.value if isinstance(self.payment_status, PaymentStatus) else self.payment_status,
            "payment_method": self.payment_method.value if isinstance(self.payment_method, PaymentMethod) else self.payment_method,
            "fulfillment_status": self.fulfillment_status.value if isinstance(self.fulfillment_status, FulfillmentStatus) else self.fulfillment_status,
            "subtotal": float(self.subtotal),
            "delivery_fee": float(self.delivery_fee),
            "discount_amount": float(self.discount_amount),
            "wallet_applied": float(self.wallet_applied),
            "total": float(self.total),
            "delivery_slot": self.delivery_slot,
            "estimated_delivery": self.estimated_delivery.isoformat() if self.estimated_delivery else None,
            "actual_delivery": self.actual_delivery.isoformat() if self.actual_delivery else None,
            "is_same_day": self.is_same_day,
            "can_cancel": self.can_cancel,
            "tracking": {
                "awb": self.easyecom_awb,
                "status": self.easyecom_status
            } if self.easyecom_awb else None,
            "razorpay_order_id": self.razorpay_order_id,
            "easyecom_order_id": self.easyecom_order_id,
            "item_count": len(self.items) if self.items else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def to_summary(self):
        return {
            "id": str(self.id),
            "order_number": self.order_number,
            "status": self.status.value if isinstance(self.status, OrderStatus) else self.status,
            "total": float(self.total),
            "item_count": len(self.items) if self.items else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False, index=True)
    
    sku = Column(String(100), nullable=False)
    product_name = Column(String(500), nullable=False)
    brand_name = Column(String(255), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    item_status = Column(String(50), default="pending")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="items")
    
    __table_args__ = (
        Index("ix_order_items_brand", "brand_id"),
        Index("ix_order_items_product", "product_id"),
    )
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "product_id": str(self.product_id) if self.product_id else None,
            "sku": self.sku,
            "product_name": self.product_name,
            "brand_name": self.brand_name,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "subtotal": float(self.subtotal)
        }


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    from_status = Column(String(50))
    to_status = Column(String(50), nullable=False)
    changed_by = Column(UUID(as_uuid=True))
    source = Column(String(50))
    notes = Column(Text)
    extra_metadata = Column("metadata", JSONB, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="status_logs")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    razorpay_order_id = Column(String(100), index=True)
    razorpay_payment_id = Column(String(100), index=True)
    razorpay_signature = Column(String(255))
    
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="INR")
    method = Column(String(50))
    status = Column(
        SQLEnum(PaymentStatus, name='payment_status_enum', create_constraint=True),
        nullable=False,
        default=PaymentStatus.PENDING
    )
    
    failure_reason = Column(Text)
    refund_amount = Column(Numeric(10, 2), default=0)
    extra_metadata = Column("metadata", JSONB, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="payment")
