"""
Dash24 V1 - Event & Analytics Models (Basic)
Phase 0: Fixed mutable defaults
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from datetime import datetime, timezone
import uuid

from app.database import Base


class Event(Base):
    """Core events table for tracking"""
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Event identification
    event_type = Column(String(100), nullable=False, index=True)
    event_id = Column(String(255), unique=True)  # Idempotency key
    
    # Actor
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    session_id = Column(String(255))
    device_id = Column(String(255))
    
    # Entity references
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="SET NULL"), index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"))
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"))
    cart_id = Column(UUID(as_uuid=True))
    
    # Event data - Phase 0: Fixed mutable default
    properties = Column(JSONB, nullable=False, default=dict)
    
    # Context
    source = Column(String(50), nullable=False)  # 'web', 'pwa', 'admin', 'system'
    page_url = Column(Text)
    referrer = Column(Text)
    user_agent = Column(Text)
    ip_address = Column(INET)
    
    # Geo context
    city = Column(String(100))
    pincode = Column(String(10))
    zone = Column(String(50))
    
    # Timestamps
    client_timestamp = Column(DateTime(timezone=True))
    server_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    # Processing
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime(timezone=True))


class BrandDailyMetrics(Base):
    """Pre-computed daily metrics per brand"""
    __tablename__ = "brand_daily_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Revenue
    gross_revenue = Column(Integer, nullable=False, default=0)  # Store as paise
    net_revenue = Column(Integer, nullable=False, default=0)
    
    # Orders
    total_orders = Column(Integer, nullable=False, default=0)
    confirmed_orders = Column(Integer, nullable=False, default=0)
    cancelled_orders = Column(Integer, nullable=False, default=0)
    delivered_orders = Column(Integer, nullable=False, default=0)
    
    # Items
    total_items_sold = Column(Integer, nullable=False, default=0)
    unique_skus_sold = Column(Integer, nullable=False, default=0)
    
    # Customers
    unique_customers = Column(Integer, nullable=False, default=0)
    new_customers = Column(Integer, nullable=False, default=0)
    repeat_customers = Column(Integer, nullable=False, default=0)
    
    # Payment split
    cod_orders = Column(Integer, nullable=False, default=0)
    cod_revenue = Column(Integer, nullable=False, default=0)
    prepaid_orders = Column(Integer, nullable=False, default=0)
    prepaid_revenue = Column(Integer, nullable=False, default=0)
    
    # Delivery
    same_day_orders = Column(Integer, nullable=False, default=0)
    next_day_orders = Column(Integer, nullable=False, default=0)
    
    computed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WebhookLog(Base):
    """Webhook processing log"""
    __tablename__ = "webhook_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(50), nullable=False)  # 'easyecom', 'razorpay'
    event_type = Column(String(100), nullable=False)
    event_id = Column(String(255))  # External event ID
    
    # Phase 0: Fixed mutable defaults
    payload = Column(JSONB, nullable=False, default=dict)
    headers = Column(JSONB, default=dict)
    
    status = Column(String(50), nullable=False, default="pending")  # pending, processing, success, failed, retrying
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime(timezone=True))
    
    response_code = Column(Integer)
    error_message = Column(Text)
    
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
