"""
Dash24 V1 - Cart Model
"""
from sqlalchemy import Column, String, Boolean, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base


class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    session_id = Column(String(255), index=True)  # For guest carts
    
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items) if self.items else 0
    
    @property
    def subtotal(self):
        return sum(float(item.unit_price) * item.quantity for item in self.items) if self.items else 0
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "items": [item.to_dict() for item in self.items] if self.items else [],
            "summary": {
                "item_count": self.total_items,
                "subtotal": self.subtotal,
                "delivery_fee": 0,  # Free delivery for now
                "total": self.subtotal
            },
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }


class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)  # Locked at time of adding
    
    # Reservation tracking
    reserved_until = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "product": self.product.to_summary() if self.product else None,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "subtotal": float(self.unit_price) * self.quantity
        }
