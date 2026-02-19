# Dash24 V1 - EasyEcom Integration Design

## Overview

EasyEcom serves as the **source of truth** for inventory and fulfillment. This document outlines the modular adapter pattern for OMS integration, allowing future extensibility to other providers.

---

## Architecture: OMS Adapter Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OMS ADAPTER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │                    Dash24 Services                            │        │
│     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │        │
│     │  │ Inventory   │  │   Order     │  │    Fulfillment      │   │        │
│     │  │  Service    │  │  Service    │  │      Service        │   │        │
│     │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │        │
│     │         │                │                    │               │        │
│     └─────────┼────────────────┼────────────────────┼───────────────┘        │
│               │                │                    │                        │
│               └────────────────┼────────────────────┘                        │
│                                │                                             │
│                                ▼                                             │
│               ┌────────────────────────────────┐                             │
│               │      OMS Adapter Interface     │                             │
│               │  (Abstract Base Class)         │                             │
│               │                                │                             │
│               │  • sync_inventory()            │                             │
│               │  • create_order()              │                             │
│               │  • cancel_order()              │                             │
│               │  • get_order_status()          │                             │
│               │  • get_tracking_info()         │                             │
│               │  • process_webhook()           │                             │
│               └───────────────┬────────────────┘                             │
│                               │                                              │
│               ┌───────────────┼───────────────┐                              │
│               │               │               │                              │
│               ▼               ▼               ▼                              │
│     ┌─────────────────┐ ┌───────────┐ ┌───────────────┐                     │
│     │  EasyEcom       │ │  Future:  │ │  Future:      │                     │
│     │  Adapter        │ │  Unicom   │ │  Custom WMS   │                     │
│     │  (V1 Primary)   │ │  Adapter  │ │  Adapter      │                     │
│     └────────┬────────┘ └───────────┘ └───────────────┘                     │
│              │                                                               │
│              │ HTTPS/REST                                                    │
│              ▼                                                               │
│     ┌─────────────────────────────────────────┐                             │
│     │             EasyEcom API                │                             │
│     │  • Inventory Management                 │                             │
│     │  • Order Management                     │                             │
│     │  • Fulfillment & Shipping               │                             │
│     │  • Returns Processing                   │                             │
│     └─────────────────────────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## OMS Adapter Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ─────────────────────────────────────────────────────────────────
# Data Transfer Objects
# ─────────────────────────────────────────────────────────────────

@dataclass
class OMSProduct:
    """Product data from OMS"""
    oms_product_id: str
    oms_variant_id: Optional[str]
    sku: str
    name: str
    quantity: int
    price: float
    mrp: float
    weight_grams: Optional[int]
    images: List[str]
    attributes: dict
    last_updated: datetime

@dataclass
class OMSOrderItem:
    """Order item for OMS"""
    sku: str
    quantity: int
    unit_price: float
    product_name: str

@dataclass
class OMSAddress:
    """Shipping address for OMS"""
    name: str
    phone: str
    email: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    pincode: str
    country: str = "IN"

@dataclass
class OMSOrderRequest:
    """Order creation request"""
    order_number: str
    items: List[OMSOrderItem]
    shipping_address: OMSAddress
    billing_address: Optional[OMSAddress]
    payment_method: str  # 'cod' or 'prepaid'
    payment_status: str
    subtotal: float
    delivery_fee: float
    total: float
    notes: Optional[str]
    delivery_slot: Optional[dict]

@dataclass
class OMSOrderResponse:
    """Order response from OMS"""
    success: bool
    oms_order_id: Optional[str]
    error_message: Optional[str]
    error_code: Optional[str]

class OMSOrderStatus(str, Enum):
    """Standardized OMS statuses"""
    RECEIVED = 'received'
    CONFIRMED = 'confirmed'
    PROCESSING = 'processing'
    PACKED = 'packed'
    SHIPPED = 'shipped'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    RETURNED = 'returned'
    FAILED = 'failed'

@dataclass
class OMSTrackingInfo:
    """Tracking information"""
    awb_number: str
    courier_name: str
    current_status: OMSOrderStatus
    estimated_delivery: Optional[datetime]
    tracking_url: Optional[str]
    events: List[dict]

@dataclass
class OMSWebhookEvent:
    """Standardized webhook event"""
    event_type: str  # 'inventory_update', 'order_status', 'shipment_update'
    oms_order_id: Optional[str]
    sku: Optional[str]
    data: dict
    timestamp: datetime


# ─────────────────────────────────────────────────────────────────
# Abstract OMS Adapter
# ─────────────────────────────────────────────────────────────────

class OMSAdapter(ABC):
    """
    Abstract base class for OMS integrations.
    Implement this interface to add new OMS providers.
    """
    
    @abstractmethod
    async def initialize(self, config: dict) -> bool:
        """Initialize connection with credentials"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if OMS connection is healthy"""
        pass
    
    # ─────────────────────────────────────────────────────────────
    # Inventory Operations
    # ─────────────────────────────────────────────────────────────
    
    @abstractmethod
    async def sync_inventory(self, sku: Optional[str] = None) -> List[OMSProduct]:
        """
        Fetch inventory from OMS.
        If SKU provided, fetch single product. Otherwise fetch all.
        """
        pass
    
    @abstractmethod
    async def get_stock_level(self, sku: str) -> int:
        """Get current stock level for a SKU"""
        pass
    
    @abstractmethod
    async def bulk_get_stock_levels(self, skus: List[str]) -> dict[str, int]:
        """Get stock levels for multiple SKUs"""
        pass
    
    # ─────────────────────────────────────────────────────────────
    # Order Operations
    # ─────────────────────────────────────────────────────────────
    
    @abstractmethod
    async def create_order(self, order: OMSOrderRequest) -> OMSOrderResponse:
        """Push order to OMS for fulfillment"""
        pass
    
    @abstractmethod
    async def cancel_order(self, oms_order_id: str, reason: str) -> bool:
        """Cancel order in OMS"""
        pass
    
    @abstractmethod
    async def get_order_status(self, oms_order_id: str) -> OMSOrderStatus:
        """Get current order status"""
        pass
    
    @abstractmethod
    async def get_tracking_info(self, oms_order_id: str) -> Optional[OMSTrackingInfo]:
        """Get shipment tracking information"""
        pass
    
    # ─────────────────────────────────────────────────────────────
    # Webhook Processing
    # ─────────────────────────────────────────────────────────────
    
    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook authenticity"""
        pass
    
    @abstractmethod
    def parse_webhook(self, payload: dict, event_type: str) -> OMSWebhookEvent:
        """Parse webhook payload into standardized event"""
        pass
    
    # ─────────────────────────────────────────────────────────────
    # Returns
    # ─────────────────────────────────────────────────────────────
    
    @abstractmethod
    async def initiate_return(
        self, 
        oms_order_id: str, 
        items: List[dict],
        reason: str
    ) -> dict:
        """Initiate return request"""
        pass


# ─────────────────────────────────────────────────────────────────
# OMS Factory
# ─────────────────────────────────────────────────────────────────

class OMSFactory:
    """Factory for creating OMS adapters"""
    
    _adapters = {}
    
    @classmethod
    def register(cls, name: str, adapter_class: type):
        """Register an OMS adapter"""
        cls._adapters[name] = adapter_class
    
    @classmethod
    def create(cls, name: str, config: dict) -> OMSAdapter:
        """Create an OMS adapter instance"""
        if name not in cls._adapters:
            raise ValueError(f"Unknown OMS adapter: {name}")
        return cls._adapters[name](config)
    
    @classmethod
    def get_available_adapters(cls) -> List[str]:
        """List available OMS adapters"""
        return list(cls._adapters.keys())
```

---

## EasyEcom Adapter Implementation

```python
import httpx
import hashlib
import hmac
import logging
from typing import Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class EasyEcomAdapter(OMSAdapter):
    """
    EasyEcom OMS integration adapter.
    
    API Documentation: https://api.easyecom.io/docs (assumed)
    """
    
    BASE_URL = "https://api.easyecom.io/v1"  # Production
    SANDBOX_URL = "https://sandbox-api.easyecom.io/v1"  # Sandbox
    
    # Status mapping: EasyEcom status -> Dash24 OMSOrderStatus
    STATUS_MAP = {
        'order_received': OMSOrderStatus.RECEIVED,
        'order_confirmed': OMSOrderStatus.CONFIRMED,
        'processing': OMSOrderStatus.PROCESSING,
        'packed': OMSOrderStatus.PACKED,
        'ready_to_ship': OMSOrderStatus.PACKED,
        'shipped': OMSOrderStatus.SHIPPED,
        'in_transit': OMSOrderStatus.SHIPPED,
        'out_for_delivery': OMSOrderStatus.OUT_FOR_DELIVERY,
        'delivered': OMSOrderStatus.DELIVERED,
        'cancelled': OMSOrderStatus.CANCELLED,
        'returned': OMSOrderStatus.RETURNED,
        'rto_initiated': OMSOrderStatus.RETURNED,
        'failed': OMSOrderStatus.FAILED,
    }
    
    def __init__(self, config: dict):
        self.api_key = config.get('api_key')
        self.api_secret = config.get('api_secret')
        self.warehouse_id = config.get('warehouse_id')
        self.use_sandbox = config.get('sandbox', True)
        self.base_url = self.SANDBOX_URL if self.use_sandbox else self.BASE_URL
        self.client = None
        self.timeout = config.get('timeout', 30)
    
    async def initialize(self, config: dict = None) -> bool:
        """Initialize HTTP client and verify connection"""
        try:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Api-Key': self.api_key,
                    'Content-Type': 'application/json',
                },
                timeout=self.timeout
            )
            return await self.health_check()
        except Exception as e:
            logger.error(f"EasyEcom initialization failed: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Verify API connection"""
        try:
            response = await self.client.get('/health')
            return response.status_code == 200
        except Exception as e:
            logger.error(f"EasyEcom health check failed: {e}")
            return False
    
    # ─────────────────────────────────────────────────────────────
    # Inventory Operations
    # ─────────────────────────────────────────────────────────────
    
    async def sync_inventory(self, sku: Optional[str] = None) -> List[OMSProduct]:
        """Fetch inventory from EasyEcom"""
        try:
            params = {'warehouse_id': self.warehouse_id}
            if sku:
                params['sku'] = sku
            
            products = []
            page = 1
            
            while True:
                params['page'] = page
                params['limit'] = 100
                
                response = await self.client.get('/inventory', params=params)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get('items', []):
                    products.append(self._map_to_oms_product(item))
                
                if not data.get('has_more', False):
                    break
                page += 1
            
            return products
            
        except Exception as e:
            logger.error(f"EasyEcom sync_inventory failed: {e}")
            raise
    
    async def get_stock_level(self, sku: str) -> int:
        """Get current stock for a single SKU"""
        try:
            response = await self.client.get(
                f'/inventory/{sku}',
                params={'warehouse_id': self.warehouse_id}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('available_quantity', 0)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return 0
            raise
    
    async def bulk_get_stock_levels(self, skus: List[str]) -> dict[str, int]:
        """Get stock levels for multiple SKUs"""
        try:
            response = await self.client.post(
                '/inventory/bulk',
                json={
                    'skus': skus,
                    'warehouse_id': self.warehouse_id
                }
            )
            response.raise_for_status()
            data = response.json()
            return {
                item['sku']: item.get('available_quantity', 0)
                for item in data.get('items', [])
            }
        except Exception as e:
            logger.error(f"EasyEcom bulk_get_stock_levels failed: {e}")
            raise
    
    def _map_to_oms_product(self, item: dict) -> OMSProduct:
        """Map EasyEcom product to standard OMSProduct"""
        return OMSProduct(
            oms_product_id=str(item.get('product_id')),
            oms_variant_id=str(item.get('variant_id')) if item.get('variant_id') else None,
            sku=item.get('sku'),
            name=item.get('name'),
            quantity=item.get('available_quantity', 0),
            price=float(item.get('selling_price', 0)),
            mrp=float(item.get('mrp', 0)),
            weight_grams=item.get('weight'),
            images=item.get('images', []),
            attributes=item.get('attributes', {}),
            last_updated=datetime.fromisoformat(item.get('updated_at', datetime.utcnow().isoformat()))
        )
    
    # ─────────────────────────────────────────────────────────────
    # Order Operations
    # ─────────────────────────────────────────────────────────────
    
    async def create_order(self, order: OMSOrderRequest) -> OMSOrderResponse:
        """Push order to EasyEcom"""
        try:
            payload = {
                'order_number': order.order_number,
                'warehouse_id': self.warehouse_id,
                'channel': 'dash24',
                'order_items': [
                    {
                        'sku': item.sku,
                        'quantity': item.quantity,
                        'selling_price': item.unit_price,
                        'item_name': item.product_name
                    }
                    for item in order.items
                ],
                'shipping_address': {
                    'name': order.shipping_address.name,
                    'phone': order.shipping_address.phone,
                    'email': order.shipping_address.email,
                    'address1': order.shipping_address.address_line1,
                    'address2': order.shipping_address.address_line2,
                    'city': order.shipping_address.city,
                    'state': order.shipping_address.state,
                    'pincode': order.shipping_address.pincode,
                    'country': order.shipping_address.country
                },
                'payment': {
                    'method': 'cod' if order.payment_method == 'cod' else 'prepaid',
                    'status': order.payment_status,
                    'amount': order.total
                },
                'amounts': {
                    'subtotal': order.subtotal,
                    'shipping': order.delivery_fee,
                    'total': order.total
                },
                'notes': order.notes,
                'delivery_slot': order.delivery_slot
            }
            
            response = await self.client.post('/orders', json=payload)
            response.raise_for_status()
            data = response.json()
            
            return OMSOrderResponse(
                success=True,
                oms_order_id=str(data.get('order_id')),
                error_message=None,
                error_code=None
            )
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response.content else {}
            logger.error(f"EasyEcom create_order failed: {error_data}")
            return OMSOrderResponse(
                success=False,
                oms_order_id=None,
                error_message=error_data.get('message', str(e)),
                error_code=error_data.get('code', 'UNKNOWN')
            )
        except Exception as e:
            logger.error(f"EasyEcom create_order exception: {e}")
            return OMSOrderResponse(
                success=False,
                oms_order_id=None,
                error_message=str(e),
                error_code='EXCEPTION'
            )
    
    async def cancel_order(self, oms_order_id: str, reason: str) -> bool:
        """Cancel order in EasyEcom"""
        try:
            response = await self.client.post(
                f'/orders/{oms_order_id}/cancel',
                json={'reason': reason}
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"EasyEcom cancel_order failed: {e}")
            return False
    
    async def get_order_status(self, oms_order_id: str) -> OMSOrderStatus:
        """Get order status from EasyEcom"""
        try:
            response = await self.client.get(f'/orders/{oms_order_id}')
            response.raise_for_status()
            data = response.json()
            
            easyecom_status = data.get('status', '').lower()
            return self.STATUS_MAP.get(easyecom_status, OMSOrderStatus.PROCESSING)
        except Exception as e:
            logger.error(f"EasyEcom get_order_status failed: {e}")
            raise
    
    async def get_tracking_info(self, oms_order_id: str) -> Optional[OMSTrackingInfo]:
        """Get tracking information"""
        try:
            response = await self.client.get(f'/orders/{oms_order_id}/tracking')
            response.raise_for_status()
            data = response.json()
            
            if not data.get('awb'):
                return None
            
            return OMSTrackingInfo(
                awb_number=data.get('awb'),
                courier_name=data.get('courier_name'),
                current_status=self.STATUS_MAP.get(
                    data.get('status', '').lower(),
                    OMSOrderStatus.PROCESSING
                ),
                estimated_delivery=datetime.fromisoformat(data['edd']) if data.get('edd') else None,
                tracking_url=data.get('tracking_url'),
                events=data.get('events', [])
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    # ─────────────────────────────────────────────────────────────
    # Webhook Processing
    # ─────────────────────────────────────────────────────────────
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify EasyEcom webhook signature"""
        expected = hmac.new(
            self.api_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    
    def parse_webhook(self, payload: dict, event_type: str) -> OMSWebhookEvent:
        """Parse EasyEcom webhook into standard format"""
        
        # Map EasyEcom event types
        event_mapping = {
            'inventory.updated': 'inventory_update',
            'order.status_changed': 'order_status',
            'shipment.created': 'shipment_update',
            'shipment.delivered': 'shipment_update',
            'order.cancelled': 'order_status',
        }
        
        return OMSWebhookEvent(
            event_type=event_mapping.get(event_type, event_type),
            oms_order_id=payload.get('order_id'),
            sku=payload.get('sku'),
            data=payload,
            timestamp=datetime.fromisoformat(
                payload.get('timestamp', datetime.utcnow().isoformat())
            )
        )
    
    # ─────────────────────────────────────────────────────────────
    # Returns
    # ─────────────────────────────────────────────────────────────
    
    async def initiate_return(
        self,
        oms_order_id: str,
        items: List[dict],
        reason: str
    ) -> dict:
        """Initiate return request in EasyEcom"""
        try:
            response = await self.client.post(
                f'/orders/{oms_order_id}/return',
                json={
                    'items': items,
                    'reason': reason,
                    'return_type': 'customer_initiated'
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"EasyEcom initiate_return failed: {e}")
            raise


# Register adapter
OMSFactory.register('easyecom', EasyEcomAdapter)
```

---

## Configuration

```python
# config/oms.py

import os

OMS_CONFIG = {
    'provider': os.getenv('OMS_PROVIDER', 'easyecom'),
    
    'easyecom': {
        'api_key': os.getenv('EASYECOM_API_KEY'),
        'api_secret': os.getenv('EASYECOM_API_SECRET'),
        'warehouse_id': os.getenv('EASYECOM_WAREHOUSE_ID'),
        'sandbox': os.getenv('EASYECOM_SANDBOX', 'true').lower() == 'true',
        'timeout': int(os.getenv('EASYECOM_TIMEOUT', '30')),
        'webhook_secret': os.getenv('EASYECOM_WEBHOOK_SECRET'),
    }
}

def get_oms_adapter() -> OMSAdapter:
    """Get configured OMS adapter instance"""
    provider = OMS_CONFIG['provider']
    config = OMS_CONFIG.get(provider, {})
    return OMSFactory.create(provider, config)
```

---

## Integration Flow Diagrams

### Order Push Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ORDER PUSH TO EASYECOM                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────┐    ┌────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│   │  Order   │    │   Order    │    │   EasyEcom  │    │    EasyEcom     │   │
│   │ Service  │    │   Queue    │    │   Adapter   │    │      API        │   │
│   └────┬─────┘    └─────┬──────┘    └──────┬──────┘    └────────┬────────┘   │
│        │                │                  │                    │            │
│        │ 1. Queue push  │                  │                    │            │
│        │───────────────>│                  │                    │            │
│        │                │                  │                    │            │
│        │                │ 2. Dequeue       │                    │            │
│        │                │──────────────────>                    │            │
│        │                │                  │                    │            │
│        │                │                  │ 3. Create Order    │            │
│        │                │                  │───────────────────>│            │
│        │                │                  │                    │            │
│        │                │                  │ 4. Order ID        │            │
│        │                │                  │<───────────────────│            │
│        │                │                  │                    │            │
│        │                │ 5. Success/Fail  │                    │            │
│        │                │<──────────────────                    │            │
│        │                │                  │                    │            │
│        │ 6. Update      │                  │                    │            │
│        │<───────────────│                  │                    │            │
│        │                │                  │                    │            │
│                                                                               │
│   [On Failure]                                                                │
│        │                │                  │                    │            │
│        │                │ Retry (exp backoff)                   │            │
│        │                │──────────────────>                    │            │
│        │                │                  │                    │            │
│   [After max retries]                                                         │
│        │                │                  │                    │            │
│        │ Mark failed    │                  │                    │            │
│        │<───────────────│                  │                    │            │
│        │                │                  │                    │            │
│        │ Alert admin    │                  │                    │            │
│        │ ──────────────────────────────────────────────────────>│            │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Webhook Processing Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        WEBHOOK PROCESSING FLOW                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────┐    ┌────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│   │ EasyEcom │    │  Webhook   │    │   Webhook   │    │    Order        │   │
│   │   API    │    │  Endpoint  │    │   Handler   │    │    Service      │   │
│   └────┬─────┘    └─────┬──────┘    └──────┬──────┘    └────────┬────────┘   │
│        │                │                  │                    │            │
│        │ 1. POST webhook│                  │                    │            │
│        │───────────────>│                  │                    │            │
│        │                │                  │                    │            │
│        │                │ 2. Verify sig    │                    │            │
│        │                │──────────────────>                    │            │
│        │                │                  │                    │            │
│        │                │ 3. Valid ✓       │                    │            │
│        │                │<──────────────────                    │            │
│        │                │                  │                    │            │
│        │ 4. 200 OK      │                  │                    │            │
│        │<───────────────│                  │                    │            │
│        │                │                  │                    │            │
│        │                │ 5. Queue event   │                    │            │
│        │                │────────────────────────────────────── >            │
│        │                │                  │                    │            │
│        │                │                  │ 6. Process event   │            │
│        │                │                  │───────────────────>│            │
│        │                │                  │                    │            │
│        │                │                  │    Update order    │            │
│        │                │                  │    Notify customer │            │
│        │                │                  │                    │            │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

```python
class EasyEcomError(Exception):
    """Base exception for EasyEcom errors"""
    pass

class EasyEcomAuthError(EasyEcomError):
    """Authentication failed"""
    pass

class EasyEcomRateLimitError(EasyEcomError):
    """Rate limit exceeded"""
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limited. Retry after {retry_after}s")

class EasyEcomValidationError(EasyEcomError):
    """Request validation failed"""
    pass

# Retry configuration
RETRY_CONFIG = {
    'max_retries': 3,
    'initial_delay': 1,  # seconds
    'max_delay': 60,     # seconds
    'exponential_base': 2,
    'retryable_errors': [
        EasyEcomRateLimitError,
        httpx.TimeoutException,
        httpx.NetworkError,
    ],
    'non_retryable_status': [400, 401, 403, 404, 422]
}
```

---

## Environment Variables

```bash
# EasyEcom Configuration
EASYECOM_API_KEY=your_api_key
EASYECOM_API_SECRET=your_api_secret
EASYECOM_WAREHOUSE_ID=warehouse_id
EASYECOM_SANDBOX=true
EASYECOM_TIMEOUT=30
EASYECOM_WEBHOOK_SECRET=webhook_signing_secret

# OMS Provider (for adapter selection)
OMS_PROVIDER=easyecom
```
