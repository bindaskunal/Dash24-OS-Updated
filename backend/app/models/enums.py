"""
Dash24 V1 - Core Enums
"""
from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "customer"
    BRAND = "brand"
    ADMIN = "admin"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    PACKED = "packed"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    FAILED = "failed"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    COD = "cod"
    PREPAID = "prepaid"
    WALLET = "wallet"


class FulfillmentStatus(str, Enum):
    PENDING = "pending"
    PUSHED = "pushed"
    FAILED = "failed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"


class TriggerType(str, Enum):
    CART_ABANDONMENT = "cart_abandonment"
    LAPSED_CUSTOMER = "lapsed_customer"
    FIRST_ORDER_FOLLOWUP = "first_order_followup"


class TriggerStatus(str, Enum):
    PENDING = "pending"
    ELIGIBLE = "eligible"
    EXECUTED = "executed"
    CONVERTED = "converted"
    EXPIRED = "expired"
