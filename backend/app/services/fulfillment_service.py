"""
Dash24 V1 - Fulfillment Service
Handles EasyEcom integration for order fulfillment
"""
import httpx
import logging
from typing import Tuple, Optional
from app.models.order import Order
from app.core.settings import settings

logger = logging.getLogger(__name__)


class FulfillmentService:
    """EasyEcom fulfillment service"""
    
    def __init__(self):
        self.api_url = settings.EASYECOM_API_URL
        self.api_key = settings.EASYECOM_API_KEY
    
    async def push_order_to_easyecom(self, order: Order) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Push order to EasyEcom for fulfillment
        
        Args:
            order: Order instance with loaded relationships
        
        Returns:
            Tuple of (success, easyecom_order_id, error_message)
        """
        try:
            payload = self._build_easyecom_payload(order)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/orders",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200 or response.status_code == 201:
                    data = response.json()
                    easyecom_order_id = data.get("order_id") or data.get("id")
                    return True, easyecom_order_id, None
                else:
                    error_msg = f"EasyEcom API returned {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    return False, None, error_msg
                    
        except httpx.TimeoutException:
            error_msg = "EasyEcom API timeout"
            logger.error(error_msg)
            return False, None, error_msg
        except Exception as e:
            error_msg = f"EasyEcom push failed: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
    
    def _build_easyecom_payload(self, order: Order) -> dict:
        """Build EasyEcom API payload from order"""
        
        address = order.address
        user = order.user
        
        line_items = []
        for item in order.items:
            line_items.append({
                "sku": item.sku,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total": float(item.subtotal)
            })
        
        payload = {
            "order_id": str(order.id),
            "order_number": order.order_number,
            "order_date": order.created_at.isoformat() if order.created_at else None,
            "payment_mode": "prepaid" if order.payment_method.value == "prepaid" else "cod",
            "payment_status": "paid" if order.payment_status.value == "captured" else "pending",
            "customer": {
                "name": user.full_name if hasattr(user, 'full_name') else user.email,
                "email": user.email,
                "phone": user.phone
            },
            "shipping_address": {
                "address_line1": address.address_line1 if hasattr(address, 'address_line1') else address.full_address,
                "address_line2": getattr(address, 'address_line2', ''),
                "city": address.city,
                "state": address.state,
                "pincode": address.pincode,
                "country": "India"
            },
            "line_items": line_items,
            "subtotal": float(order.subtotal),
            "delivery_fee": float(order.delivery_fee),
            "total": float(order.total),
            "cod_amount": float(order.cod_amount) if order.cod_amount else 0,
            "delivery_instructions": order.delivery_instructions
        }
        
        return payload


fulfillment_service = FulfillmentService()
