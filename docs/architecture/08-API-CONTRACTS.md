# Dash24 V1 - API Contracts

## Overview

Core API endpoints for Dash24 marketplace backend. All endpoints are prefixed with `/api`.

---

## Authentication

### Base URL
```
Production: https://api.dash24.in
Staging: https://staging-api.dash24.in
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access
| Role | Access |
|------|--------|
| customer | Customer app endpoints |
| brand | Brand portal endpoints |
| admin | Admin portal + all endpoints |

---

## Auth Endpoints

### Request OTP
```http
POST /api/auth/request-otp
```

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+919876543210"  // Optional, either email or phone required
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp_id": "uuid",
  "expires_in": 300
}
```

### Verify OTP & Login
```http
POST /api/auth/verify-otp
```

**Request:**
```json
{
  "otp_id": "uuid",
  "otp_code": "123456",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+919876543210",
    "name": "John Doe",
    "role": "customer",
    "wallet_balance": 150.00,
    "is_verified": true
  },
  "tokens": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 3600
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbG...",
  "expires_in": 3600
}
```

### Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true
}
```

---

## Catalog Endpoints

### List Categories
```http
GET /api/categories
```

**Query Params:**
- `parent_id` (optional): Filter by parent category

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Fresh Produce",
      "slug": "fresh-produce",
      "image_url": "https://...",
      "parent_id": null,
      "children": [
        {
          "id": "uuid",
          "name": "Fruits",
          "slug": "fruits"
        }
      ]
    }
  ]
}
```

### List Brands
```http
GET /api/brands
```

**Query Params:**
- `is_active` (optional): Filter active brands
- `limit` (optional): Default 25
- `offset` (optional): Default 0

**Response:**
```json
{
  "brands": [
    {
      "id": "uuid",
      "name": "Farm Fresh",
      "slug": "farm-fresh",
      "logo_url": "https://...",
      "banner_url": "https://...",
      "description": "Fresh from the farm"
    }
  ],
  "total": 25,
  "limit": 25,
  "offset": 0
}
```

### List Products
```http
GET /api/products
```

**Query Params:**
- `brand_id` (optional): Filter by brand
- `category_id` (optional): Filter by category
- `search` (optional): Text search
- `in_stock` (optional): Only in-stock items (default: true)
- `sort` (optional): `price_asc`, `price_desc`, `newest`, `popular`
- `limit` (optional): Default 20
- `offset` (optional): Default 0

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "FF-MANGO-500",
      "name": "Alphonso Mangoes 500g",
      "brand": {
        "id": "uuid",
        "name": "Farm Fresh",
        "slug": "farm-fresh"
      },
      "category": {
        "id": "uuid",
        "name": "Fruits",
        "slug": "fruits"
      },
      "mrp": 350.00,
      "selling_price": 299.00,
      "discount_percent": 15,
      "in_stock": true,
      "available_quantity": 45,
      "images": ["https://..."],
      "attributes": {
        "weight": "500g",
        "origin": "Ratnagiri"
      },
      "is_featured": true
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Get Product Detail
```http
GET /api/products/{product_id}
```

**Response:**
```json
{
  "id": "uuid",
  "sku": "FF-MANGO-500",
  "name": "Alphonso Mangoes 500g",
  "description": "Premium Alphonso mangoes from Ratnagiri...",
  "brand": {
    "id": "uuid",
    "name": "Farm Fresh",
    "slug": "farm-fresh",
    "logo_url": "https://..."
  },
  "category": {
    "id": "uuid",
    "name": "Fruits",
    "slug": "fruits",
    "parent": {
      "id": "uuid",
      "name": "Fresh Produce"
    }
  },
  "mrp": 350.00,
  "selling_price": 299.00,
  "in_stock": true,
  "available_quantity": 45,
  "images": ["https://..."],
  "attributes": {
    "weight": "500g",
    "origin": "Ratnagiri",
    "shelf_life": "5-7 days"
  }
}
```

---

## Cart Endpoints

### Get Cart
```http
GET /api/cart
```

**Response:**
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "sku": "FF-MANGO-500",
        "name": "Alphonso Mangoes 500g",
        "brand_name": "Farm Fresh",
        "image": "https://...",
        "mrp": 350.00,
        "selling_price": 299.00,
        "in_stock": true,
        "available_quantity": 45
      },
      "quantity": 2,
      "unit_price": 299.00,
      "subtotal": 598.00
    }
  ],
  "summary": {
    "item_count": 2,
    "subtotal": 598.00,
    "delivery_fee": 0.00,
    "total": 598.00,
    "savings": 102.00
  },
  "expires_at": "2024-01-15T15:30:00Z"
}
```

### Add to Cart
```http
POST /api/cart/items
```

**Request:**
```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "cart": { ... },  // Full cart object
  "message": "Added to cart"
}
```

### Update Cart Item
```http
PATCH /api/cart/items/{item_id}
```

**Request:**
```json
{
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /api/cart/items/{item_id}
```

### Clear Cart
```http
DELETE /api/cart
```

---

## Checkout & Orders

### Get Checkout Summary
```http
GET /api/checkout/summary
```

**Query Params:**
- `wallet_amount` (optional): Wallet credits to apply

**Response:**
```json
{
  "cart": { ... },
  "delivery": {
    "address": {
      "id": "uuid",
      "label": "Home",
      "full_address": "123 MG Road, Bangalore"
    },
    "slot": {
      "date": "2024-01-15",
      "start_time": "16:00",
      "end_time": "20:00",
      "is_same_day": true
    },
    "fee": 0.00,
    "cutoff_time": "2024-01-15T14:00:00+05:30"
  },
  "pricing": {
    "subtotal": 598.00,
    "delivery_fee": 0.00,
    "discount": 0.00,
    "wallet_applied": 100.00,
    "wallet_available": 150.00,
    "total": 498.00,
    "cod_available": true,
    "cod_max": 5000.00
  }
}
```

### Create Order
```http
POST /api/orders
```

**Request:**
```json
{
  "address_id": "uuid",
  "payment_method": "prepaid",  // "prepaid" or "cod"
  "wallet_amount": 100.00,
  "delivery_slot": {
    "date": "2024-01-15",
    "start_time": "16:00",
    "end_time": "20:00"
  },
  "notes": "Please call before delivery"
}
```

**Response (Prepaid):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "D24-20240115-00042",
    "status": "pending",
    "total": 498.00
  },
  "payment": {
    "type": "razorpay",
    "razorpay_order_id": "order_abc123",
    "amount": 398.00,
    "wallet_applied": 100.00,
    "checkout_options": {
      "key": "rzp_xxx",
      "order_id": "order_abc123",
      "amount": 39800,
      "currency": "INR",
      "name": "Dash24",
      "prefill": { ... }
    }
  }
}
```

**Response (COD):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "D24-20240115-00042",
    "status": "confirmed",
    "total": 498.00,
    "cod_amount": 398.00
  },
  "payment": {
    "type": "cod",
    "cod_amount": 398.00,
    "wallet_applied": 100.00
  }
}
```

### Verify Payment (Prepaid callback)
```http
POST /api/orders/{order_id}/verify-payment
```

**Request:**
```json
{
  "razorpay_payment_id": "pay_abc123",
  "razorpay_order_id": "order_abc123",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "D24-20240115-00042",
    "status": "confirmed",
    "payment_status": "captured"
  }
}
```

### List Orders
```http
GET /api/orders
```

**Query Params:**
- `status` (optional): Filter by status
- `limit` (optional): Default 10
- `offset` (optional): Default 0

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "D24-20240115-00042",
      "status": "out_for_delivery",
      "payment_method": "prepaid",
      "payment_status": "captured",
      "total": 498.00,
      "item_count": 2,
      "estimated_delivery": "2024-01-15T18:00:00+05:30",
      "tracking": {
        "awb": "AWB123456",
        "courier": "Dunzo"
      },
      "created_at": "2024-01-15T10:30:00+05:30"
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

### Get Order Detail
```http
GET /api/orders/{order_id}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "D24-20240115-00042",
  "status": "out_for_delivery",
  "payment_method": "prepaid",
  "payment_status": "captured",
  "items": [
    {
      "id": "uuid",
      "sku": "FF-MANGO-500",
      "product_name": "Alphonso Mangoes 500g",
      "brand_name": "Farm Fresh",
      "quantity": 2,
      "unit_price": 299.00,
      "subtotal": 598.00
    }
  ],
  "address": {
    "label": "Home",
    "full_address": "123 MG Road, Bangalore",
    "pincode": "560001"
  },
  "pricing": {
    "subtotal": 598.00,
    "delivery_fee": 0.00,
    "discount": 0.00,
    "wallet_applied": 100.00,
    "total": 498.00
  },
  "delivery": {
    "slot": {
      "date": "2024-01-15",
      "start_time": "16:00",
      "end_time": "20:00"
    },
    "estimated_delivery": "2024-01-15T18:00:00+05:30"
  },
  "tracking": {
    "awb": "AWB123456",
    "courier": "Dunzo",
    "tracking_url": "https://...",
    "events": [
      {
        "status": "out_for_delivery",
        "timestamp": "2024-01-15T16:30:00+05:30",
        "description": "Out for delivery"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-15T15:00:00+05:30",
        "description": "Shipped from warehouse"
      }
    ]
  },
  "created_at": "2024-01-15T10:30:00+05:30"
}
```

### Cancel Order
```http
POST /api/orders/{order_id}/cancel
```

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "status": "cancelled"
  },
  "refund": {
    "amount": 398.00,
    "wallet_credited": 100.00,
    "payment_refunded": 298.00,
    "status": "initiated"
  }
}
```

---

## Address Endpoints

### List Addresses
```http
GET /api/addresses
```

**Response:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "label": "Home",
      "flat_number": "A-123",
      "tower_block": "Tower A",
      "apartment": {
        "id": "uuid",
        "name": "Prestige Lakeside",
        "locality": "Whitefield"
      },
      "full_address": "A-123, Tower A, Prestige Lakeside, Whitefield",
      "pincode": "560066",
      "is_serviceable": true,
      "is_default": true
    }
  ]
}
```

### Add Address
```http
POST /api/addresses
```

**Request:**
```json
{
  "label": "Work",
  "apartment_id": "uuid",  // Optional, for known apartments
  "flat_number": "B-456",
  "tower_block": "Tower B",
  "full_address": "B-456, Tower B, Embassy Tech Village",
  "pincode": "560103",
  "landmark": "Near main gate",
  "is_default": false
}
```

### Check Serviceability
```http
GET /api/addresses/check-serviceability
```

**Query Params:**
- `pincode`: Pincode to check
- `apartment_id` (optional): Specific apartment

**Response:**
```json
{
  "serviceable": true,
  "delivery_zone": "zone_a",
  "estimated_delivery_time": "Same day (before 8 PM)",
  "delivery_fee": 0.00
}
```

---

## Wallet Endpoints

### Get Wallet Balance
```http
GET /api/wallet
```

**Response:**
```json
{
  "balance": 150.00,
  "expiring_soon": {
    "amount": 50.00,
    "expires_at": "2024-02-15"
  }
}
```

### Get Wallet Transactions
```http
GET /api/wallet/transactions
```

**Query Params:**
- `limit` (optional): Default 20
- `offset` (optional): Default 0

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "credit_refund",
      "amount": 100.00,
      "balance_after": 150.00,
      "description": "Refund for order D24-20240110-00038",
      "order_number": "D24-20240110-00038",
      "created_at": "2024-01-10T14:30:00+05:30"
    },
    {
      "id": "uuid",
      "type": "debit_order",
      "amount": -50.00,
      "balance_after": 50.00,
      "description": "Applied to order D24-20240108-00025",
      "order_number": "D24-20240108-00025",
      "created_at": "2024-01-08T11:00:00+05:30"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

## Delivery Slots

### Get Available Slots
```http
GET /api/delivery-slots
```

**Query Params:**
- `address_id`: Delivery address
- `date` (optional): Specific date (YYYY-MM-DD)

**Response:**
```json
{
  "slots": [
    {
      "date": "2024-01-15",
      "is_today": true,
      "slots": [
        {
          "start_time": "16:00",
          "end_time": "20:00",
          "label": "4 PM - 8 PM",
          "available": true,
          "cutoff": "2024-01-15T14:00:00+05:30"
        }
      ]
    },
    {
      "date": "2024-01-16",
      "is_today": false,
      "slots": [
        {
          "start_time": "10:00",
          "end_time": "14:00",
          "label": "10 AM - 2 PM",
          "available": true
        },
        {
          "start_time": "16:00",
          "end_time": "20:00",
          "label": "4 PM - 8 PM",
          "available": true
        }
      ]
    }
  ],
  "same_day_cutoff": "2024-01-15T14:00:00+05:30",
  "is_before_cutoff": true
}
```

---

## Webhooks (Internal)

### EasyEcom Webhook
```http
POST /api/webhooks/easyecom
```

**Headers:**
```
X-Easyecom-Signature: sha256_signature
X-Easyecom-Event: inventory.updated
X-Easyecom-Event-Id: evt_abc123
```

### Razorpay Webhook
```http
POST /api/webhooks/razorpay
```

**Headers:**
```
X-Razorpay-Signature: sha256_signature
```

---

## Admin Endpoints

### Dashboard Stats
```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "today": {
    "orders": 45,
    "revenue": 28500.00,
    "avg_order_value": 633.33
  },
  "orders_by_status": {
    "pending": 5,
    "confirmed": 8,
    "processing": 12,
    "out_for_delivery": 15,
    "delivered": 5
  },
  "low_stock_items": 8,
  "pending_cod": {
    "count": 12,
    "amount": 15000.00
  }
}
```

### Inventory Sync Status
```http
GET /api/admin/inventory/sync-status
```

**Response:**
```json
{
  "health": "healthy",
  "last_webhook": "2024-01-15T14:30:00Z",
  "last_reconciliation": "2024-01-15T14:00:00Z",
  "discrepancies": 2,
  "pending_syncs": 0
}
```

### Trigger Reconciliation
```http
POST /api/admin/inventory/reconcile
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "queued"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing/invalid auth token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| OUT_OF_STOCK | 422 | Product out of stock |
| PAYMENT_FAILED | 422 | Payment processing failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 10 req/min |
| Read endpoints | 100 req/min |
| Write endpoints | 30 req/min |
| Webhooks | 1000 req/min |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```
