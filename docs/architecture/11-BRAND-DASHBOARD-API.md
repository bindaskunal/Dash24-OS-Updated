# Dash24 V1 - Brand Dashboard API Contracts

## Overview

REST APIs for brand dashboard providing analytics, SKU performance, cohort analysis, and operational insights. All endpoints require brand role authentication and are scoped to the authenticated brand.

---

## Authentication & Authorization

### Headers
```
Authorization: Bearer <jwt_token>
X-Brand-Id: <brand_uuid>  // Optional, admin can query any brand
```

### Role-Based Access

| Role | Access |
|------|--------|
| `brand` | Own brand data only (brand_id from JWT) |
| `admin` | Any brand data (via X-Brand-Id header) |

---

## API Endpoints

### 1. Analytics Overview

```http
GET /api/brand/analytics/overview
```

**Description**: High-level dashboard metrics with period comparison.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `today` | `today`, `7d`, `30d`, `mtd`, `custom` |
| `start_date` | date | - | Required if period=custom (YYYY-MM-DD) |
| `end_date` | date | - | Required if period=custom |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-08",
      "end": "2024-01-14",
      "label": "Last 7 Days"
    },
    "metrics": {
      "revenue": {
        "current": 125000.00,
        "previous": 110000.00,
        "change_percent": 13.64,
        "trend": "up"
      },
      "orders": {
        "current": 450,
        "previous": 420,
        "change_percent": 7.14,
        "trend": "up"
      },
      "aov": {
        "current": 277.78,
        "previous": 261.90,
        "change_percent": 6.06,
        "trend": "up"
      },
      "customers": {
        "unique": 380,
        "new": 120,
        "repeat": 260,
        "new_percent": 31.58
      },
      "items_sold": {
        "current": 890,
        "unique_skus": 45
      }
    },
    "funnel": {
      "product_views": 12500,
      "add_to_carts": 1800,
      "checkout_starts": 620,
      "orders_confirmed": 450,
      "conversion_rates": {
        "view_to_cart": 14.40,
        "cart_to_checkout": 34.44,
        "checkout_to_order": 72.58,
        "overall": 3.60
      }
    },
    "delivery": {
      "same_day_percent": 65.0,
      "on_time_rate": 94.2,
      "avg_delivery_hours": 4.5
    },
    "top_zone": {
      "name": "Whitefield",
      "orders": 85,
      "revenue": 28000.00
    }
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 2. Revenue Analytics

```http
GET /api/brand/analytics/revenue
```

**Description**: Detailed revenue metrics with time-series data.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `30d` | `7d`, `30d`, `90d`, `mtd`, `ytd`, `custom` |
| `start_date` | date | - | Required if period=custom |
| `end_date` | date | - | Required if period=custom |
| `granularity` | string | `daily` | `hourly`, `daily`, `weekly`, `monthly` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2023-12-15",
      "end": "2024-01-14",
      "label": "Last 30 Days"
    },
    "summary": {
      "gross_revenue": 450000.00,
      "net_revenue": 435000.00,
      "refunds": 15000.00,
      "total_orders": 1650,
      "delivered_orders": 1580,
      "cancelled_orders": 70,
      "cancel_rate": 4.24,
      "aov": 272.73
    },
    "comparison": {
      "previous_period": {
        "gross_revenue": 420000.00,
        "orders": 1550
      },
      "change": {
        "revenue_percent": 7.14,
        "orders_percent": 6.45
      }
    },
    "timeseries": [
      {
        "date": "2024-01-14",
        "gross_revenue": 18500.00,
        "net_revenue": 18000.00,
        "orders": 68,
        "aov": 272.06
      },
      {
        "date": "2024-01-13",
        "gross_revenue": 16200.00,
        "net_revenue": 15800.00,
        "orders": 58,
        "aov": 279.31
      }
      // ... more days
    ],
    "by_payment_method": {
      "prepaid": {
        "orders": 1100,
        "revenue": 320000.00,
        "percent": 71.11
      },
      "cod": {
        "orders": 550,
        "revenue": 130000.00,
        "percent": 28.89
      }
    },
    "by_delivery_type": {
      "same_day": {
        "orders": 1050,
        "revenue": 290000.00,
        "percent": 64.44
      },
      "next_day": {
        "orders": 600,
        "revenue": 160000.00,
        "percent": 35.56
      }
    }
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. SKU Performance

```http
GET /api/brand/analytics/skus
```

**Description**: SKU-level performance metrics with velocity and stock analysis.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | `7d`, `30d`, `90d` |
| `sort_by` | string | `revenue` | `revenue`, `units`, `velocity`, `growth` |
| `sort_order` | string | `desc` | `asc`, `desc` |
| `category_id` | uuid | - | Filter by category |
| `stock_status` | string | - | `in_stock`, `low_stock`, `out_of_stock` |
| `limit` | int | 20 | Max 100 |
| `offset` | int | 0 | |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-08",
      "end": "2024-01-14",
      "label": "Last 7 Days"
    },
    "summary": {
      "total_skus": 85,
      "active_skus": 72,
      "out_of_stock_skus": 5,
      "low_stock_skus": 12
    },
    "skus": [
      {
        "product_id": "uuid",
        "sku": "FF-MANGO-500",
        "name": "Alphonso Mangoes 500g",
        "category": "Fruits",
        "image_url": "https://...",
        "metrics": {
          "units_sold": 245,
          "revenue": 73255.00,
          "orders_containing": 198,
          "avg_price": 299.00,
          "daily_velocity": 35.0
        },
        "comparison": {
          "units_previous": 210,
          "units_change_percent": 16.67,
          "revenue_previous": 62790.00,
          "revenue_change_percent": 16.67
        },
        "stock": {
          "current": 156,
          "status": "in_stock",
          "days_of_stock": 4.5,
          "reorder_recommended": true
        },
        "engagement": {
          "views": 850,
          "add_to_carts": 312,
          "view_to_cart_rate": 36.71,
          "cart_to_purchase_rate": 78.53
        }
      },
      // ... more SKUs
    ],
    "pagination": {
      "total": 85,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Cohort Analysis

```http
GET /api/brand/analytics/cohorts
```

**Description**: Customer cohort retention and LTV analysis.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `granularity` | string | `monthly` | `weekly`, `monthly` |
| `cohorts` | int | 6 | Number of cohorts to show (max 12) |
| `retention_days` | string | `7,30,60,90` | Comma-separated retention periods |

**Response:**
```json
{
  "success": true,
  "data": {
    "granularity": "monthly",
    "retention_periods": [7, 30, 60, 90],
    "summary": {
      "total_customers": 2450,
      "avg_repeat_rate": 32.5,
      "avg_ltv": 850.00,
      "avg_orders_per_customer": 2.3
    },
    "cohorts": [
      {
        "cohort_id": "2024-01",
        "cohort_label": "Jan 2024",
        "cohort_start": "2024-01-01",
        "cohort_size": 320,
        "metrics": {
          "first_order_aov": 285.00,
          "total_revenue": 125000.00,
          "avg_revenue_per_customer": 390.63,
          "avg_orders": 1.8
        },
        "retention": {
          "day_7": {
            "customers": 85,
            "rate": 26.56,
            "revenue": 28500.00
          },
          "day_30": {
            "customers": 98,
            "rate": 30.63,
            "revenue": 45000.00
          },
          "day_60": {
            "customers": 110,
            "rate": 34.38,
            "revenue": 62000.00
          },
          "day_90": {
            "customers": 118,
            "rate": 36.88,
            "revenue": 75000.00
          }
        },
        "repeat_rate": 36.88
      },
      {
        "cohort_id": "2023-12",
        "cohort_label": "Dec 2023",
        "cohort_start": "2023-12-01",
        "cohort_size": 280,
        "metrics": {
          "first_order_aov": 275.00,
          "total_revenue": 145000.00,
          "avg_revenue_per_customer": 517.86,
          "avg_orders": 2.1
        },
        "retention": {
          "day_7": {
            "customers": 72,
            "rate": 25.71,
            "revenue": 22000.00
          },
          "day_30": {
            "customers": 88,
            "rate": 31.43,
            "revenue": 48000.00
          },
          "day_60": {
            "customers": 95,
            "rate": 33.93,
            "revenue": 68000.00
          },
          "day_90": {
            "customers": 102,
            "rate": 36.43,
            "revenue": 85000.00
          }
        },
        "repeat_rate": 36.43
      }
      // ... more cohorts
    ],
    "retention_trend": {
      "day_7_avg": 26.0,
      "day_30_avg": 31.0,
      "day_60_avg": 34.0,
      "day_90_avg": 36.5,
      "trend": "stable"
    }
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 5. Zone Analytics

```http
GET /api/brand/analytics/zones
```

**Description**: Geographic demand analysis by delivery zones.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | `7d`, `30d`, `mtd` |
| `sort_by` | string | `orders` | `orders`, `revenue`, `customers`, `growth` |
| `sort_order` | string | `desc` | `asc`, `desc` |
| `limit` | int | 20 | Max 50 |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-08",
      "end": "2024-01-14",
      "label": "Last 7 Days"
    },
    "summary": {
      "total_zones_active": 18,
      "total_pincodes_served": 45,
      "most_growth_zone": "HSR Layout",
      "growth_percent": 25.5
    },
    "zones": [
      {
        "zone": "Whitefield",
        "pincodes": ["560066", "560067"],
        "metrics": {
          "orders": 125,
          "revenue": 38500.00,
          "customers": 95,
          "new_customers": 28,
          "items_sold": 245
        },
        "comparison": {
          "orders_previous": 110,
          "orders_change_percent": 13.64,
          "revenue_previous": 34000.00,
          "revenue_change_percent": 13.24
        },
        "delivery_performance": {
          "avg_delivery_minutes": 185,
          "on_time_rate": 92.5,
          "same_day_percent": 68.0
        },
        "demand_score": 95,
        "demand_rank": 1
      },
      {
        "zone": "Koramangala",
        "pincodes": ["560034", "560095"],
        "metrics": {
          "orders": 112,
          "revenue": 35800.00,
          "customers": 88,
          "new_customers": 22,
          "items_sold": 210
        },
        "comparison": {
          "orders_previous": 105,
          "orders_change_percent": 6.67,
          "revenue_previous": 33500.00,
          "revenue_change_percent": 6.87
        },
        "delivery_performance": {
          "avg_delivery_minutes": 165,
          "on_time_rate": 95.2,
          "same_day_percent": 72.0
        },
        "demand_score": 88,
        "demand_rank": 2
      }
      // ... more zones
    ],
    "heatmap_data": [
      {
        "zone": "Whitefield",
        "lat": 12.9698,
        "lng": 77.7500,
        "intensity": 0.95
      }
      // ... coordinates for map visualization
    ]
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 6. Payment Analytics

```http
GET /api/brand/analytics/payments
```

**Description**: Payment method breakdown and wallet usage analysis.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `30d` | `7d`, `30d`, `90d`, `mtd` |
| `granularity` | string | `daily` | `daily`, `weekly` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2023-12-15",
      "end": "2024-01-14",
      "label": "Last 30 Days"
    },
    "summary": {
      "total_revenue": 450000.00,
      "prepaid_revenue": 320000.00,
      "cod_revenue": 130000.00,
      "prepaid_percent": 71.11,
      "cod_percent": 28.89
    },
    "prepaid_breakdown": {
      "upi": {
        "orders": 650,
        "revenue": 185000.00,
        "percent": 57.81
      },
      "card": {
        "orders": 280,
        "revenue": 85000.00,
        "percent": 26.56
      },
      "netbanking": {
        "orders": 120,
        "revenue": 38000.00,
        "percent": 11.88
      },
      "other_wallets": {
        "orders": 50,
        "revenue": 12000.00,
        "percent": 3.75
      }
    },
    "cod_metrics": {
      "total_orders": 550,
      "collected": 520,
      "pending_collection": 30,
      "collection_rate": 94.55,
      "avg_cod_order_value": 236.36
    },
    "wallet_usage": {
      "orders_with_wallet": 380,
      "wallet_orders_percent": 23.03,
      "total_wallet_used": 45000.00,
      "avg_wallet_per_order": 118.42,
      "wallet_share_of_total": 10.00
    },
    "refunds": {
      "total_refunds": 42,
      "refund_amount": 15000.00,
      "refund_rate": 2.55
    },
    "payment_health": {
      "success_rate": 96.5,
      "failed_attempts": 58,
      "retry_success_rate": 45.0
    },
    "timeseries": [
      {
        "date": "2024-01-14",
        "prepaid_orders": 42,
        "cod_orders": 18,
        "prepaid_percent": 70.00,
        "wallet_used": 1850.00
      }
      // ... more days
    ],
    "comparison": {
      "previous_prepaid_percent": 68.5,
      "prepaid_change": 2.61,
      "trend": "prepaid_increasing"
    }
  },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### 7. Real-time Dashboard

```http
GET /api/brand/analytics/realtime
```

**Description**: Live metrics for today (updates every minute).

**Response:**
```json
{
  "success": true,
  "data": {
    "as_of": "2024-01-15T10:30:00Z",
    "today": {
      "orders": 28,
      "revenue": 8500.00,
      "items_sold": 52,
      "avg_order_value": 303.57
    },
    "hourly_trend": [
      {"hour": "09:00", "orders": 3, "revenue": 850.00},
      {"hour": "10:00", "orders": 8, "revenue": 2400.00},
      {"hour": "11:00", "orders": 12, "revenue": 3650.00}
      // ... current hour data
    ],
    "active_carts": {
      "count": 15,
      "total_value": 4500.00,
      "at_checkout": 4
    },
    "order_status": {
      "pending": 5,
      "confirmed": 8,
      "processing": 10,
      "out_for_delivery": 12,
      "delivered_today": 45
    },
    "same_day_cutoff": {
      "time": "14:00",
      "orders_before_cutoff": 22,
      "time_remaining_minutes": 210
    },
    "alerts": [
      {
        "type": "low_stock",
        "sku": "FF-MANGO-500",
        "message": "Only 5 units left",
        "severity": "warning"
      }
    ]
  }
}
```

---

### 8. Export Analytics

```http
POST /api/brand/analytics/export
```

**Description**: Generate downloadable report.

**Request:**
```json
{
  "report_type": "revenue",
  "period": "30d",
  "format": "csv",
  "include_skus": true,
  "include_zones": true,
  "email_to": "brand@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "export-uuid",
    "status": "processing",
    "estimated_seconds": 30,
    "download_url": null
  }
}
```

```http
GET /api/brand/analytics/export/{job_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "export-uuid",
    "status": "completed",
    "download_url": "https://storage.dash24.in/exports/report-xxx.csv",
    "expires_at": "2024-01-16T10:30:00Z",
    "file_size_bytes": 125000
  }
}
```

---

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "End date must be after start date",
    "details": {
      "start_date": "2024-01-15",
      "end_date": "2024-01-01"
    }
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | No access to this brand |
| `BRAND_NOT_FOUND` | 404 | Brand doesn't exist |
| `INVALID_DATE_RANGE` | 400 | Invalid date parameters |
| `INVALID_PERIOD` | 400 | Unknown period value |
| `EXPORT_FAILED` | 500 | Report generation failed |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Overview/Revenue/SKUs | 60 req/min |
| Cohorts/Zones | 30 req/min |
| Realtime | 120 req/min |
| Export | 5 req/hour |

---

## Caching Strategy

| Endpoint | Cache TTL | Invalidation |
|----------|-----------|--------------|
| Overview | 5 min | On new order |
| Revenue | 15 min | Hourly refresh |
| SKUs | 15 min | On stock change |
| Cohorts | 1 hour | Daily refresh |
| Zones | 15 min | Hourly refresh |
| Payments | 15 min | Hourly refresh |
| Realtime | 1 min | Auto |

---

## Implementation Notes

### Service Layer Structure

```python
class BrandAnalyticsService:
    """
    Service layer for brand analytics APIs.
    Handles permission checks, caching, and data aggregation.
    """
    
    def __init__(self, db_session, redis_client, cache_service):
        self.db = db_session
        self.redis = redis_client
        self.cache = cache_service
    
    async def get_overview(
        self,
        brand_id: UUID,
        period: str,
        start_date: date = None,
        end_date: date = None
    ) -> dict:
        """Get analytics overview with caching"""
        
        # Calculate date range
        start, end = self._resolve_date_range(period, start_date, end_date)
        
        # Check cache
        cache_key = f"analytics:overview:{brand_id}:{start}:{end}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached
        
        # Fetch from aggregation tables
        current_metrics = await self._fetch_metrics(brand_id, start, end)
        
        # Previous period for comparison
        prev_start, prev_end = self._get_previous_period(start, end)
        previous_metrics = await self._fetch_metrics(brand_id, prev_start, prev_end)
        
        # Build response
        result = self._build_overview_response(
            current_metrics,
            previous_metrics,
            start, end
        )
        
        # Cache for 5 minutes
        await self.cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def _fetch_metrics(
        self,
        brand_id: UUID,
        start: date,
        end: date
    ) -> dict:
        """Fetch metrics from brand_daily_metrics"""
        result = await self.db.execute("""
            SELECT 
                SUM(gross_revenue) as revenue,
                SUM(total_orders) as orders,
                AVG(aov) as aov,
                SUM(unique_customers) as customers,
                SUM(new_customers) as new_customers,
                SUM(product_views) as views,
                SUM(add_to_carts) as carts,
                SUM(checkout_starts) as checkouts
            FROM brand_daily_metrics
            WHERE brand_id = :brand_id
            AND date BETWEEN :start AND :end
        """, {'brand_id': brand_id, 'start': start, 'end': end})
        
        return dict(result.fetchone())
```

### Permission Middleware

```python
from fastapi import Depends, HTTPException

async def verify_brand_access(
    brand_id: UUID = None,
    current_user = Depends(get_current_user)
) -> UUID:
    """
    Verify user has access to the requested brand.
    - brand role: can only access their own brand
    - admin role: can access any brand via X-Brand-Id header
    """
    
    if current_user.role == 'admin':
        # Admin can access any brand
        if brand_id:
            return brand_id
        raise HTTPException(400, "X-Brand-Id header required for admin")
    
    if current_user.role == 'brand':
        # Brand users can only access their own brand
        user_brand = await get_user_brand(current_user.id)
        if brand_id and brand_id != user_brand.id:
            raise HTTPException(403, "Access denied to this brand")
        return user_brand.id
    
    raise HTTPException(403, "Insufficient permissions")
```
