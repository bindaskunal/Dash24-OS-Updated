"""
Dash24 V1 - Product & Brand Models
Phase 0: Fixed mutable defaults, added composite indexes
"""
from sqlalchemy import Column, String, Boolean, Numeric, Integer, DateTime, ForeignKey, Text, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base


class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text)
    logo_url = Column(Text)
    banner_url = Column(Text)
    is_active = Column(Boolean, nullable=False, default=True)
    commission_rate = Column(Numeric(5, 2), default=0)
    
    # Extended metadata (LLM-ready) - Phase 0: Fixed mutable default
    metadata_extended = Column(JSONB, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products = relationship("Product", back_populates="brand")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "logo_url": self.logo_url,
            "is_active": self.is_active
        }


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(Text)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products = relationship("Product", back_populates="category")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "image_url": self.image_url,
            "is_active": self.is_active
        }


class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    
    # EasyEcom references
    easyecom_product_id = Column(String(100), index=True)
    easyecom_variant_id = Column(String(100))
    
    # Relationships
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"))
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    
    # Product details
    name = Column(String(500), nullable=False)
    description = Column(Text)
    short_description = Column(String(500))
    
    # Pricing
    mrp = Column(Numeric(10, 2), nullable=False)
    selling_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2))
    
    # Inventory
    stock_quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, default=5)
    
    # Product attributes - Phase 0: Fixed mutable defaults
    weight_grams = Column(Integer)
    images = Column(JSONB, default=list)
    attributes = Column(JSONB, default=dict)
    
    # Extended attributes (LLM-ready) - Phase 0: Fixed mutable defaults
    attributes_extended = Column(JSONB, default=dict)
    ai_metadata = Column(JSONB, default=dict)
    
    # Flags
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Sync metadata
    last_synced_at = Column(DateTime(timezone=True))
    sync_status = Column(String(50), default="synced")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    
    # Phase 0: Added composite indexes and inventory check constraint
    __table_args__ = (
        CheckConstraint("reserved_quantity >= 0", name="chk_reserved_non_negative"),
        CheckConstraint("stock_quantity >= 0", name="chk_stock_non_negative"),
        Index("ix_products_brand_active", "brand_id", "is_active"),
        Index("ix_products_category_active", "category_id", "is_active"),
    )
    
    @property
    def available_quantity(self):
        return max(0, self.stock_quantity - self.reserved_quantity)
    
    @property
    def is_in_stock(self):
        return self.available_quantity > 0
    
    @property
    def is_low_stock(self):
        return self.available_quantity <= self.low_stock_threshold
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "sku": self.sku,
            "name": self.name,
            "description": self.description,
            "short_description": self.short_description,
            "brand_id": str(self.brand_id) if self.brand_id else None,
            "brand_name": self.brand.name if self.brand else None,
            "category_id": str(self.category_id) if self.category_id else None,
            "category_name": self.category.name if self.category else None,
            "mrp": float(self.mrp),
            "selling_price": float(self.selling_price),
            "stock_quantity": self.stock_quantity,
            "available_quantity": self.available_quantity,
            "in_stock": self.is_in_stock,
            "is_low_stock": self.is_low_stock,
            "images": self.images,
            "attributes": self.attributes,
            "is_active": self.is_active,
            "is_featured": self.is_featured
        }
    
    def to_summary(self):
        """Minimal product info for lists"""
        return {
            "id": str(self.id),
            "sku": self.sku,
            "name": self.name,
            "brand_name": self.brand.name if self.brand else None,
            "mrp": float(self.mrp),
            "selling_price": float(self.selling_price),
            "in_stock": self.is_in_stock,
            "image": self.images[0] if self.images else None
        }
