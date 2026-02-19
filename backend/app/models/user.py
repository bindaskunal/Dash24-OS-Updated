"""
Dash24 V1 - User Model
"""
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    name = Column(String(255))
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    wallet_balance = Column(Numeric(10, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # JSONB for preferences and AI profile (LLM-ready)
    preferences = Column(JSONB, default={})
    ai_profile = Column(JSONB, default={})
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "phone": self.phone,
            "name": self.name,
            "role": self.role.value,
            "wallet_balance": float(self.wallet_balance),
            "is_active": self.is_active,
            "is_verified": self.is_verified
        }


class OTPToken(Base):
    __tablename__ = "otp_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    email = Column(String(255))
    phone = Column(String(15))
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # 'login', 'verify_phone'
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    label = Column(String(50))  # 'home', 'work', 'other'
    flat_number = Column(String(50))
    tower_block = Column(String(100))
    full_address = Column(Text, nullable=False)
    landmark = Column(Text)
    pincode = Column(String(10), nullable=False)
    city = Column(String(100), default="Bangalore")
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_serviceable = Column(Boolean, default=True)
    zone = Column(String(50))  # Delivery zone
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="addresses")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "label": self.label,
            "flat_number": self.flat_number,
            "tower_block": self.tower_block,
            "full_address": self.full_address,
            "landmark": self.landmark,
            "pincode": self.pincode,
            "city": self.city,
            "is_default": self.is_default,
            "is_serviceable": self.is_serviceable,
            "zone": self.zone
        }


# Import needed for Address
from sqlalchemy import ForeignKey, Integer, Text
