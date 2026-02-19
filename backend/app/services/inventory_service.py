"""
Dash24 V1 - Inventory Service
Handles stock management, reservations, and sync
"""
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from uuid import UUID
from decimal import Decimal
import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models import Product

logger = logging.getLogger(__name__)

LOW_STOCK_THRESHOLD = int(os.environ.get("LOW_STOCK_THRESHOLD", 5))
CART_RESERVATION_MINUTES = int(os.environ.get("CART_RESERVATION_MINUTES", 30))


class InventoryService:
    """Inventory management service"""
    
    def __init__(self, db: AsyncSession, redis=None):
        self.db = db
        self.redis = redis
    
    async def check_availability(self, product_id: UUID, quantity: int) -> bool:
        """Check if requested quantity is available"""
        product = await self.db.get(Product, product_id)
        if not product:
            return False
        
        return product.available_quantity >= quantity
    
    async def reserve_stock(
        self,
        product_id: UUID,
        quantity: int,
        reference_id: str  # cart_id or order_id
    ) -> bool:
        """
        Reserve stock for cart/order.
        Uses optimistic locking to prevent overselling.
        """
        try:
            result = await self.db.execute(
                update(Product)
                .where(
                    Product.id == product_id,
                    Product.stock_quantity - Product.reserved_quantity >= quantity
                )
                .values(
                    reserved_quantity=Product.reserved_quantity + quantity,
                    updated_at=datetime.now(timezone.utc)
                )
                .returning(Product.id)
            )
            
            updated = result.scalar_one_or_none()
            
            if updated:
                # Track reservation in Redis for TTL management
                if self.redis:
                    key = f"reservation:{reference_id}:{product_id}"
                    await self.redis.setex(
                        key,
                        CART_RESERVATION_MINUTES * 60,
                        str(quantity)
                    )
                
                logger.info(f"Reserved {quantity} units of product {product_id} for {reference_id}")
                return True
            
            logger.warning(f"Failed to reserve stock for product {product_id} - insufficient")
            return False
            
        except Exception as e:
            logger.error(f"Error reserving stock: {e}")
            return False
    
    async def release_reservation(
        self,
        product_id: UUID,
        quantity: int,
        reference_id: str
    ) -> bool:
        """Release stock reservation"""
        try:
            result = await self.db.execute(
                update(Product)
                .where(Product.id == product_id)
                .values(
                    reserved_quantity=Product.reserved_quantity - quantity,
                    updated_at=datetime.now(timezone.utc)
                )
                .returning(Product.id)
            )
            
            updated = result.scalar_one_or_none()
            
            if updated:
                # Remove Redis key
                if self.redis:
                    key = f"reservation:{reference_id}:{product_id}"
                    await self.redis.delete(key)
                
                logger.info(f"Released {quantity} units of product {product_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error releasing reservation: {e}")
            return False
    
    async def confirm_sale(
        self,
        product_id: UUID,
        quantity: int
    ) -> bool:
        """
        Convert reservation to sale.
        Decrements both stock_quantity and reserved_quantity.
        """
        try:
            result = await self.db.execute(
                update(Product)
                .where(
                    Product.id == product_id,
                    Product.reserved_quantity >= quantity
                )
                .values(
                    stock_quantity=Product.stock_quantity - quantity,
                    reserved_quantity=Product.reserved_quantity - quantity,
                    updated_at=datetime.now(timezone.utc)
                )
                .returning(Product.id)
            )
            
            updated = result.scalar_one_or_none()
            return updated is not None
            
        except Exception as e:
            logger.error(f"Error confirming sale: {e}")
            return False
    
    async def update_stock_from_webhook(
        self,
        sku: str,
        new_quantity: int,
        source: str = "webhook"
    ) -> bool:
        """Update stock from EasyEcom webhook"""
        try:
            result = await self.db.execute(
                select(Product).where(Product.sku == sku)
            )
            product = result.scalar_one_or_none()
            
            if not product:
                logger.warning(f"Product not found for SKU: {sku}")
                return False
            
            old_quantity = product.stock_quantity
            discrepancy = new_quantity - old_quantity
            
            product.stock_quantity = new_quantity
            product.last_synced_at = datetime.now(timezone.utc)
            product.sync_status = "synced"
            
            # Invalidate cache
            if self.redis:
                await self.redis.delete(f"product:{sku}", f"inventory:{sku}")
            
            logger.info(f"Updated stock for {sku}: {old_quantity} → {new_quantity}")
            
            # Alert if significant discrepancy
            if abs(discrepancy) > 10:
                logger.warning(f"Large inventory discrepancy for {sku}: {discrepancy} units")
            
            # Check low stock alert
            if product.is_low_stock:
                await self._send_low_stock_alert(product)
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating stock from webhook: {e}")
            return False
    
    async def get_low_stock_products(self, brand_id: Optional[UUID] = None) -> List[Product]:
        """Get products below low stock threshold"""
        query = select(Product).where(
            Product.is_active == True,
            Product.stock_quantity - Product.reserved_quantity <= Product.low_stock_threshold
        )
        
        if brand_id:
            query = query.where(Product.brand_id == brand_id)
        
        result = await self.db.execute(query.order_by(Product.stock_quantity))
        return list(result.scalars().all())
    
    async def reconcile_with_easyecom(
        self,
        easyecom_inventory: Dict[str, int]
    ) -> Dict[str, any]:
        """
        Hourly reconciliation with EasyEcom inventory.
        
        Args:
            easyecom_inventory: Dict of {sku: quantity} from EasyEcom
        
        Returns:
            Dict with reconciliation results
        """
        stats = {
            "total_skus": len(easyecom_inventory),
            "synced": 0,
            "discrepancies": 0,
            "details": []
        }
        
        for sku, easyecom_qty in easyecom_inventory.items():
            result = await self.db.execute(
                select(Product).where(Product.sku == sku)
            )
            product = result.scalar_one_or_none()
            
            if not product:
                stats["details"].append({
                    "sku": sku,
                    "status": "not_found",
                    "easyecom_qty": easyecom_qty
                })
                continue
            
            local_qty = product.stock_quantity
            
            if local_qty != easyecom_qty:
                # Auto-correct
                product.stock_quantity = easyecom_qty
                product.last_synced_at = datetime.now(timezone.utc)
                product.sync_status = "synced"
                
                stats["discrepancies"] += 1
                stats["details"].append({
                    "sku": sku,
                    "status": "corrected",
                    "local_qty": local_qty,
                    "easyecom_qty": easyecom_qty,
                    "discrepancy": easyecom_qty - local_qty
                })
            else:
                stats["synced"] += 1
        
        await self.db.commit()
        
        logger.info(
            f"Reconciliation complete: {stats['synced']} synced, "
            f"{stats['discrepancies']} discrepancies corrected"
        )
        
        return stats
    
    async def _send_low_stock_alert(self, product: Product):
        """Send low stock alert (placeholder for notification)"""
        logger.warning(
            f"LOW STOCK ALERT: {product.name} ({product.sku}) - "
            f"Only {product.available_quantity} units available"
        )
        # TODO: Send to admin notification system
