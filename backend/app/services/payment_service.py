"""
Dash24 V1 - Payment Service
Handles Razorpay integration
"""
import razorpay
from typing import Tuple, Optional
import logging

from app.core.settings import settings

logger = logging.getLogger(__name__)


class PaymentService:
    """Razorpay payment service"""
    
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
    
    def create_order(self, amount: float, order_id: str, currency: str = "INR") -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Create Razorpay order
        
        Args:
            amount: Amount in rupees
            order_id: Dash24 order ID (used as receipt)
            currency: Currency code (default INR)
        
        Returns:
            Tuple of (success, razorpay_order_data, error_message)
        """
        try:
            amount_paise = int(amount * 100)
            
            razorpay_order = self.client.order.create({
                "amount": amount_paise,
                "currency": currency,
                "receipt": str(order_id),
                "payment_capture": 1
            })
            
            return True, razorpay_order, None
            
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            return False, None, str(e)
    
    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Verify Razorpay payment signature
        
        Args:
            razorpay_order_id: Razorpay order ID
            razorpay_payment_id: Razorpay payment ID
            razorpay_signature: Signature from frontend
        
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
            
        except razorpay.errors.SignatureVerificationError:
            logger.warning(f"Invalid signature for payment {razorpay_payment_id}")
            return False
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return False


payment_service = PaymentService()
