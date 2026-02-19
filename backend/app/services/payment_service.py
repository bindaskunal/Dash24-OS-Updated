"""
Dash24 V1 - Payment Service
Handles Razorpay integration
"""
import os
import razorpay
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """Razorpay payment service"""
    
    def __init__(self):
        self.key_id = os.environ.get("RAZORPAY_KEY_ID")
        self.key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        
        if not self.key_id or not self.key_secret:
            logger.warning("Razorpay credentials not configured")
            self.client = None
        else:
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
        if not self.client:
            return False, None, "Razorpay not configured"
        
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
        if not self.client:
            logger.error("Razorpay not configured")
            return False
        
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
