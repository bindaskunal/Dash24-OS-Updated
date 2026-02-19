# Dash24 V1 - Brand Analytics Data Model

## Overview

Analytics aggregation layer providing brand-level insights, SKU performance, cohort analysis, and operational metrics. Designed for efficient querying by the brand dashboard.

---

## Analytics Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS DATA ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         RAW DATA SOURCES                                 │   │
│   │                                                                          │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌───────────┐   │   │
│   │   │   events    │   │   orders    │   │  order_items│   │  users    │   │   │
│   │   │   (JSONB)   │   │             │   │             │   │           │   │   │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────┬─────┘   │   │
│   │          │                 │                 │                │         │   │
│   └──────────┼─────────────────┼─────────────────┼────────────────┼─────────┘   │
│              │                 │                 │                │             │
│              └─────────────────┴─────────────────┴────────────────┘             │
│                                        │                                         │
│                                        ▼                                         │
│              ┌─────────────────────────────────────────────────────┐            │
│              │              AGGREGATION JOBS                        │            │
│              │                                                      │            │
│              │  ┌────────────────┐  ┌────────────────┐             │            │
│              │  │  Hourly Jobs   │  │  Daily Jobs    │             │            │
│              │  │  (Real-time    │  │  (Full refresh │             │            │
│              │  │   counters)    │  │   aggregates)  │             │            │
│              │  └────────────────┘  └────────────────┘             │            │
│              │                                                      │            │
│              │  ┌────────────────┐  ┌────────────────┐             │            │
│              │  │  Weekly Jobs   │  │  Monthly Jobs  │             │            │
│              │  │  (Cohort       │  │  (Historical   │             │            │
│              │  │   analysis)    │  │   snapshots)   │             │            │
│              │  └────────────────┘  └────────────────┘             │            │
│              │                                                      │            │
│              └───────────────────────────┬─────────────────────────┘            │
│                                          │                                       │
│                                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      AGGREGATION TABLES                                  │   │
│   │                                                                          │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│   │  │ brand_daily_    │  │ brand_sku_      │  │ user_cohort_            │  │   │
│   │  │ metrics         │  │ metrics         │  │ retention               │  │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │   │
│   │                                                                          │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│   │  │ zone_daily_     │  │ payment_        │  │ delivery_               │  │   │
│   │  │ metrics         │  │ analytics       │  │ analytics               │  │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                       │
│                                          ▼                                       │
│                           ┌─────────────────────────────┐                       │
│                           │    BRAND DASHBOARD API      │                       │
│                           │    (Fast reads from         │                       │
│                           │     pre-computed data)      │                       │
│                           └─────────────────────────────┘                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Aggregation Tables Schema

### 1. Brand Daily Metrics

```sql
-- Core brand-level daily aggregates
CREATE TABLE brand_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Revenue metrics
    gross_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,  -- After refunds
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Order metrics
    total_orders INT NOT NULL DEFAULT 0,
    confirmed_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    delivered_orders INT NOT NULL DEFAULT 0,
    failed_orders INT NOT NULL DEFAULT 0,
    
    -- Item metrics
    total_items_sold INT NOT NULL DEFAULT 0,
    unique_skus_sold INT NOT NULL DEFAULT 0,
    
    -- Customer metrics
    unique_customers INT NOT NULL DEFAULT 0,
    new_customers INT NOT NULL DEFAULT 0,
    repeat_customers INT NOT NULL DEFAULT 0,
    
    -- Average order value
    aov DECIMAL(10,2),
    
    -- Payment split
    cod_orders INT NOT NULL DEFAULT 0,
    cod_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    prepaid_orders INT NOT NULL DEFAULT 0,
    prepaid_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Wallet usage
    wallet_orders INT NOT NULL DEFAULT 0,  -- Orders using wallet
    wallet_amount_used DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Delivery metrics
    same_day_orders INT NOT NULL DEFAULT 0,
    next_day_orders INT NOT NULL DEFAULT 0,
    
    -- Engagement (from events)
    product_views INT NOT NULL DEFAULT 0,
    add_to_carts INT NOT NULL DEFAULT 0,
    checkout_starts INT NOT NULL DEFAULT 0,
    
    -- Conversion funnel
    view_to_cart_rate DECIMAL(5,4),  -- add_to_carts / product_views
    cart_to_checkout_rate DECIMAL(5,4),  -- checkout_starts / add_to_carts
    checkout_to_order_rate DECIMAL(5,4),  -- confirmed_orders / checkout_starts
    
    -- Timestamps
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, date)
);

-- Indexes for efficient querying
CREATE INDEX idx_brand_daily_brand_date ON brand_daily_metrics(brand_id, date DESC);
CREATE INDEX idx_brand_daily_date ON brand_daily_metrics(date DESC);

-- Aggregated weekly/monthly views
CREATE MATERIALIZED VIEW brand_weekly_metrics AS
SELECT 
    brand_id,
    DATE_TRUNC('week', date)::DATE as week_start,
    SUM(gross_revenue) as gross_revenue,
    SUM(net_revenue) as net_revenue,
    SUM(total_orders) as total_orders,
    SUM(delivered_orders) as delivered_orders,
    SUM(total_items_sold) as total_items_sold,
    SUM(unique_customers) as unique_customers,
    SUM(new_customers) as new_customers,
    CASE WHEN SUM(total_orders) > 0 
         THEN SUM(gross_revenue) / SUM(total_orders) 
         ELSE 0 END as aov,
    SUM(cod_orders) as cod_orders,
    SUM(prepaid_orders) as prepaid_orders,
    SUM(same_day_orders) as same_day_orders,
    MAX(computed_at) as computed_at
FROM brand_daily_metrics
GROUP BY brand_id, DATE_TRUNC('week', date);

CREATE UNIQUE INDEX idx_brand_weekly_pk ON brand_weekly_metrics(brand_id, week_start);

CREATE MATERIALIZED VIEW brand_monthly_metrics AS
SELECT 
    brand_id,
    DATE_TRUNC('month', date)::DATE as month_start,
    SUM(gross_revenue) as gross_revenue,
    SUM(net_revenue) as net_revenue,
    SUM(total_orders) as total_orders,
    SUM(delivered_orders) as delivered_orders,
    SUM(total_items_sold) as total_items_sold,
    SUM(unique_customers) as unique_customers,
    SUM(new_customers) as new_customers,
    CASE WHEN SUM(total_orders) > 0 
         THEN SUM(gross_revenue) / SUM(total_orders) 
         ELSE 0 END as aov,
    SUM(cod_orders) as cod_orders,
    SUM(prepaid_orders) as prepaid_orders,
    MAX(computed_at) as computed_at
FROM brand_daily_metrics
GROUP BY brand_id, DATE_TRUNC('month', date);

CREATE UNIQUE INDEX idx_brand_monthly_pk ON brand_monthly_metrics(brand_id, month_start);
```

### 2. SKU Velocity Metrics

```sql
-- SKU-level performance tracking
CREATE TABLE brand_sku_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    
    -- Sales metrics
    units_sold INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    orders_containing INT NOT NULL DEFAULT 0,  -- How many orders had this SKU
    
    -- Pricing
    avg_selling_price DECIMAL(10,2),
    min_selling_price DECIMAL(10,2),
    max_selling_price DECIMAL(10,2),
    
    -- Stock metrics
    start_of_day_stock INT,
    end_of_day_stock INT,
    out_of_stock_hours DECIMAL(4,2),  -- Hours OOS during the day
    
    -- Engagement (from events)
    views INT NOT NULL DEFAULT 0,
    add_to_carts INT NOT NULL DEFAULT 0,
    
    -- Conversion
    view_to_cart_rate DECIMAL(5,4),
    cart_to_purchase_rate DECIMAL(5,4),
    
    -- Returns
    units_returned INT NOT NULL DEFAULT 0,
    return_rate DECIMAL(5,4),
    
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, product_id, date)
);

CREATE INDEX idx_sku_metrics_brand_date ON brand_sku_metrics(brand_id, date DESC);
CREATE INDEX idx_sku_metrics_product ON brand_sku_metrics(product_id, date DESC);
CREATE INDEX idx_sku_metrics_velocity ON brand_sku_metrics(brand_id, date DESC, units_sold DESC);

-- SKU velocity view (rolling 7-day and 30-day)
CREATE MATERIALIZED VIEW sku_velocity AS
SELECT 
    bsm.brand_id,
    bsm.product_id,
    bsm.sku,
    p.name as product_name,
    
    -- Last 7 days
    SUM(CASE WHEN bsm.date >= CURRENT_DATE - 7 THEN bsm.units_sold ELSE 0 END) as units_7d,
    SUM(CASE WHEN bsm.date >= CURRENT_DATE - 7 THEN bsm.revenue ELSE 0 END) as revenue_7d,
    AVG(CASE WHEN bsm.date >= CURRENT_DATE - 7 THEN bsm.avg_selling_price END) as avg_price_7d,
    
    -- Last 30 days
    SUM(CASE WHEN bsm.date >= CURRENT_DATE - 30 THEN bsm.units_sold ELSE 0 END) as units_30d,
    SUM(CASE WHEN bsm.date >= CURRENT_DATE - 30 THEN bsm.revenue ELSE 0 END) as revenue_30d,
    
    -- Velocity score (units per day, 7-day average)
    ROUND(SUM(CASE WHEN bsm.date >= CURRENT_DATE - 7 THEN bsm.units_sold ELSE 0 END)::DECIMAL / 7, 2) as daily_velocity,
    
    -- Trend (compare last 7d to previous 7d)
    CASE 
        WHEN SUM(CASE WHEN bsm.date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8 
                      THEN bsm.units_sold ELSE 0 END) = 0 THEN NULL
        ELSE ROUND(
            (SUM(CASE WHEN bsm.date >= CURRENT_DATE - 7 THEN bsm.units_sold ELSE 0 END)::DECIMAL /
             SUM(CASE WHEN bsm.date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8 
                      THEN bsm.units_sold ELSE 0 END) - 1) * 100, 2
        )
    END as week_over_week_growth,
    
    -- Current stock
    (SELECT stock_quantity FROM products WHERE id = bsm.product_id) as current_stock,
    
    MAX(bsm.computed_at) as computed_at
    
FROM brand_sku_metrics bsm
JOIN products p ON p.id = bsm.product_id
WHERE bsm.date >= CURRENT_DATE - 30
GROUP BY bsm.brand_id, bsm.product_id, bsm.sku, p.name;

CREATE UNIQUE INDEX idx_sku_velocity_pk ON sku_velocity(brand_id, product_id);
```

### 3. Cohort Retention Analysis

```sql
-- User cohort assignments
CREATE TABLE user_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Cohort definition
    cohort_date DATE NOT NULL,  -- First purchase date
    cohort_week DATE NOT NULL,  -- Week of first purchase
    cohort_month DATE NOT NULL,  -- Month of first purchase
    
    -- First order details
    first_order_id UUID REFERENCES orders(id),
    first_order_value DECIMAL(10,2),
    first_order_items INT,
    acquisition_channel VARCHAR(50),  -- 'organic', 'referral', 'marketing'
    
    -- Metrics
    total_orders INT NOT NULL DEFAULT 1,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_order_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, brand_id)
);

CREATE INDEX idx_cohorts_brand_date ON user_cohorts(brand_id, cohort_date);
CREATE INDEX idx_cohorts_brand_month ON user_cohorts(brand_id, cohort_month);

-- Cohort retention aggregates
CREATE TABLE cohort_retention (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Cohort definition
    cohort_month DATE NOT NULL,  -- Month of first purchase
    cohort_size INT NOT NULL,    -- Total users in cohort
    
    -- Retention by period (percentage of cohort that ordered)
    day_7_retention DECIMAL(5,4),   -- % ordered within 7 days
    day_14_retention DECIMAL(5,4),
    day_30_retention DECIMAL(5,4),
    day_60_retention DECIMAL(5,4),
    day_90_retention DECIMAL(5,4),
    
    -- Revenue by period (cumulative)
    day_7_revenue DECIMAL(12,2),
    day_30_revenue DECIMAL(12,2),
    day_60_revenue DECIMAL(12,2),
    day_90_revenue DECIMAL(12,2),
    
    -- LTV metrics
    avg_orders_per_user DECIMAL(5,2),
    avg_revenue_per_user DECIMAL(10,2),
    
    -- Repeat rate
    repeat_rate DECIMAL(5,4),  -- % with 2+ orders
    
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, cohort_month)
);

CREATE INDEX idx_cohort_retention_brand ON cohort_retention(brand_id, cohort_month DESC);

-- Weekly cohort view for granular analysis
CREATE MATERIALIZED VIEW cohort_retention_weekly AS
WITH cohort_orders AS (
    SELECT 
        uc.brand_id,
        uc.cohort_week,
        uc.user_id,
        o.created_at::DATE as order_date,
        o.total as order_value,
        ROW_NUMBER() OVER (
            PARTITION BY uc.brand_id, uc.user_id 
            ORDER BY o.created_at
        ) as order_number
    FROM user_cohorts uc
    JOIN orders o ON o.user_id = uc.user_id
    JOIN order_items oi ON oi.order_id = o.id AND oi.brand_id = uc.brand_id
    WHERE o.status = 'delivered'
)
SELECT 
    brand_id,
    cohort_week,
    COUNT(DISTINCT user_id) as cohort_size,
    
    -- Week 1 (days 1-7)
    COUNT(DISTINCT CASE 
        WHEN order_date <= cohort_week + 7 AND order_number > 1 
        THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT user_id), 0) as week_1_retention,
    
    -- Week 2 (days 8-14)
    COUNT(DISTINCT CASE 
        WHEN order_date > cohort_week + 7 AND order_date <= cohort_week + 14 
        THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT user_id), 0) as week_2_retention,
    
    -- Week 4 (days 22-30)
    COUNT(DISTINCT CASE 
        WHEN order_date > cohort_week + 21 AND order_date <= cohort_week + 30 
        THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT user_id), 0) as week_4_retention,
    
    -- Repeat rate (2+ orders)
    COUNT(DISTINCT CASE WHEN order_number >= 2 THEN user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT user_id), 0) as repeat_rate,
    
    NOW() as computed_at
    
FROM cohort_orders
GROUP BY brand_id, cohort_week;

CREATE UNIQUE INDEX idx_cohort_weekly_pk ON cohort_retention_weekly(brand_id, cohort_week);
```

### 4. Zone-wise Demand Analytics

```sql
-- Zone/locality level metrics
CREATE TABLE zone_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,  -- NULL for all-brand
    zone VARCHAR(50) NOT NULL,
    pincode VARCHAR(10),
    locality VARCHAR(255),
    date DATE NOT NULL,
    
    -- Order metrics
    total_orders INT NOT NULL DEFAULT 0,
    delivered_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    
    -- Revenue
    gross_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Customer metrics
    unique_customers INT NOT NULL DEFAULT 0,
    new_customers INT NOT NULL DEFAULT 0,
    
    -- Delivery performance
    avg_delivery_time_minutes INT,
    on_time_deliveries INT NOT NULL DEFAULT 0,
    late_deliveries INT NOT NULL DEFAULT 0,
    failed_deliveries INT NOT NULL DEFAULT 0,
    
    -- Time slots
    same_day_orders INT NOT NULL DEFAULT 0,
    next_day_orders INT NOT NULL DEFAULT 0,
    
    -- Payment
    cod_orders INT NOT NULL DEFAULT 0,
    prepaid_orders INT NOT NULL DEFAULT 0,
    
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, zone, date) -- NULL brand_id handled separately
);

-- Handle NULL brand_id uniqueness
CREATE UNIQUE INDEX idx_zone_daily_all_brands 
    ON zone_daily_metrics(zone, date) 
    WHERE brand_id IS NULL;

CREATE INDEX idx_zone_metrics_brand_zone ON zone_daily_metrics(brand_id, zone, date DESC);
CREATE INDEX idx_zone_metrics_date ON zone_daily_metrics(date DESC, zone);

-- Zone demand heatmap view
CREATE MATERIALIZED VIEW zone_demand_heatmap AS
SELECT 
    brand_id,
    zone,
    
    -- Last 7 days
    SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN total_orders ELSE 0 END) as orders_7d,
    SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN gross_revenue ELSE 0 END) as revenue_7d,
    SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN unique_customers ELSE 0 END) as customers_7d,
    
    -- Last 30 days
    SUM(CASE WHEN date >= CURRENT_DATE - 30 THEN total_orders ELSE 0 END) as orders_30d,
    SUM(CASE WHEN date >= CURRENT_DATE - 30 THEN gross_revenue ELSE 0 END) as revenue_30d,
    
    -- Delivery performance
    AVG(avg_delivery_time_minutes) as avg_delivery_time,
    SUM(on_time_deliveries)::DECIMAL / NULLIF(SUM(delivered_orders), 0) as on_time_rate,
    SUM(failed_deliveries)::DECIMAL / NULLIF(SUM(total_orders), 0) as failure_rate,
    
    -- Demand score (normalized 0-100)
    PERCENT_RANK() OVER (
        PARTITION BY brand_id 
        ORDER BY SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN total_orders ELSE 0 END)
    ) * 100 as demand_score,
    
    NOW() as computed_at
    
FROM zone_daily_metrics
WHERE date >= CURRENT_DATE - 30
GROUP BY brand_id, zone;

CREATE UNIQUE INDEX idx_zone_heatmap_pk ON zone_demand_heatmap(brand_id, zone);
```

### 5. Payment Analytics

```sql
-- Payment method analytics
CREATE TABLE payment_daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- COD metrics
    cod_orders INT NOT NULL DEFAULT 0,
    cod_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    cod_collected INT NOT NULL DEFAULT 0,
    cod_pending INT NOT NULL DEFAULT 0,
    cod_collection_rate DECIMAL(5,4),
    
    -- Prepaid metrics
    prepaid_orders INT NOT NULL DEFAULT 0,
    prepaid_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- By prepaid method (from properties jsonb)
    upi_orders INT NOT NULL DEFAULT 0,
    upi_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    card_orders INT NOT NULL DEFAULT 0,
    card_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    netbanking_orders INT NOT NULL DEFAULT 0,
    netbanking_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Wallet metrics
    orders_with_wallet INT NOT NULL DEFAULT 0,
    wallet_amount_used DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_wallet_per_order DECIMAL(10,2),
    wallet_share_of_payments DECIMAL(5,4),  -- wallet_used / total_revenue
    
    -- Refunds
    refund_orders INT NOT NULL DEFAULT 0,
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Failed payments
    failed_payments INT NOT NULL DEFAULT 0,
    payment_success_rate DECIMAL(5,4),
    
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, date)
);

CREATE INDEX idx_payment_analytics_brand ON payment_daily_analytics(brand_id, date DESC);
```

### 6. Delivery Analytics

```sql
-- Delivery performance analytics
CREATE TABLE delivery_daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Slot distribution
    same_day_orders INT NOT NULL DEFAULT 0,
    same_day_delivered INT NOT NULL DEFAULT 0,
    same_day_on_time INT NOT NULL DEFAULT 0,
    
    next_day_orders INT NOT NULL DEFAULT 0,
    next_day_delivered INT NOT NULL DEFAULT 0,
    next_day_on_time INT NOT NULL DEFAULT 0,
    
    -- Timing metrics
    avg_order_to_dispatch_mins INT,
    avg_dispatch_to_delivery_mins INT,
    avg_total_delivery_time_mins INT,
    
    -- SLA compliance
    orders_within_sla INT NOT NULL DEFAULT 0,
    orders_outside_sla INT NOT NULL DEFAULT 0,
    sla_compliance_rate DECIMAL(5,4),
    
    -- Issues
    delivery_attempts_1 INT NOT NULL DEFAULT 0,  -- Delivered on 1st attempt
    delivery_attempts_2 INT NOT NULL DEFAULT 0,
    delivery_attempts_3_plus INT NOT NULL DEFAULT 0,
    
    failed_deliveries INT NOT NULL DEFAULT 0,
    rto_orders INT NOT NULL DEFAULT 0,  -- Return to origin
    
    -- By zone (top 5 zones as jsonb)
    zone_breakdown JSONB,
    
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(brand_id, date)
);

CREATE INDEX idx_delivery_analytics_brand ON delivery_daily_analytics(brand_id, date DESC);
```

---

## Aggregation Jobs

### Daily Aggregation Job

```python
from datetime import datetime, date, timedelta
import logging

logger = logging.getLogger(__name__)


class DailyAggregationJob:
    """
    Runs daily at 2 AM IST.
    Computes yesterday's metrics and refreshes materialized views.
    """
    
    def __init__(self, db_session):
        self.db = db_session
    
    async def run(self, target_date: date = None):
        """Run daily aggregation for a specific date"""
        target_date = target_date or (datetime.utcnow().date() - timedelta(days=1))
        logger.info(f"Running daily aggregation for {target_date}")
        
        try:
            # 1. Compute brand daily metrics
            await self._compute_brand_daily_metrics(target_date)
            
            # 2. Compute SKU metrics
            await self._compute_sku_metrics(target_date)
            
            # 3. Compute zone metrics
            await self._compute_zone_metrics(target_date)
            
            # 4. Compute payment analytics
            await self._compute_payment_analytics(target_date)
            
            # 5. Compute delivery analytics
            await self._compute_delivery_analytics(target_date)
            
            # 6. Update cohorts for new customers
            await self._update_cohorts(target_date)
            
            # 7. Refresh materialized views
            await self._refresh_materialized_views()
            
            logger.info(f"Daily aggregation completed for {target_date}")
            
        except Exception as e:
            logger.error(f"Daily aggregation failed: {e}")
            raise
    
    async def _compute_brand_daily_metrics(self, target_date: date):
        """Compute brand_daily_metrics for each brand"""
        await self.db.execute("""
            INSERT INTO brand_daily_metrics (
                brand_id, date,
                gross_revenue, net_revenue, refund_amount,
                total_orders, confirmed_orders, cancelled_orders, delivered_orders, failed_orders,
                total_items_sold, unique_skus_sold,
                unique_customers, new_customers, repeat_customers,
                aov,
                cod_orders, cod_revenue, prepaid_orders, prepaid_revenue,
                wallet_orders, wallet_amount_used,
                same_day_orders, next_day_orders,
                product_views, add_to_carts, checkout_starts,
                view_to_cart_rate, cart_to_checkout_rate, checkout_to_order_rate,
                computed_at
            )
            SELECT 
                oi.brand_id,
                :target_date as date,
                
                -- Revenue
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.subtotal ELSE 0 END), 0) as gross_revenue,
                COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.subtotal ELSE 0 END), 0) as net_revenue,
                COALESCE(SUM(CASE WHEN o.status = 'refunded' THEN oi.subtotal ELSE 0 END), 0) as refund_amount,
                
                -- Order counts
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'confirmed' THEN o.id END) as confirmed_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as delivered_orders,
                COUNT(DISTINCT CASE WHEN o.status = 'failed' THEN o.id END) as failed_orders,
                
                -- Items
                COALESCE(SUM(oi.quantity), 0) as total_items_sold,
                COUNT(DISTINCT oi.product_id) as unique_skus_sold,
                
                -- Customers
                COUNT(DISTINCT o.user_id) as unique_customers,
                COUNT(DISTINCT CASE WHEN uc.cohort_date = :target_date THEN o.user_id END) as new_customers,
                COUNT(DISTINCT CASE WHEN uc.cohort_date < :target_date THEN o.user_id END) as repeat_customers,
                
                -- AOV
                CASE WHEN COUNT(DISTINCT o.id) > 0 
                     THEN SUM(CASE WHEN o.status != 'cancelled' THEN oi.subtotal ELSE 0 END) / COUNT(DISTINCT o.id)
                     ELSE 0 END as aov,
                
                -- Payment split
                COUNT(DISTINCT CASE WHEN o.payment_method = 'cod' THEN o.id END) as cod_orders,
                COALESCE(SUM(CASE WHEN o.payment_method = 'cod' THEN oi.subtotal ELSE 0 END), 0) as cod_revenue,
                COUNT(DISTINCT CASE WHEN o.payment_method = 'prepaid' THEN o.id END) as prepaid_orders,
                COALESCE(SUM(CASE WHEN o.payment_method = 'prepaid' THEN oi.subtotal ELSE 0 END), 0) as prepaid_revenue,
                
                -- Wallet
                COUNT(DISTINCT CASE WHEN o.wallet_applied > 0 THEN o.id END) as wallet_orders,
                COALESCE(SUM(o.wallet_applied), 0) as wallet_amount_used,
                
                -- Delivery type
                COUNT(DISTINCT CASE WHEN o.delivery_slot->>'is_same_day' = 'true' THEN o.id END) as same_day_orders,
                COUNT(DISTINCT CASE WHEN o.delivery_slot->>'is_same_day' = 'false' THEN o.id END) as next_day_orders,
                
                -- Engagement (from events)
                (SELECT COUNT(*) FROM events e 
                 WHERE e.brand_id = oi.brand_id 
                 AND e.event_type = 'product_view' 
                 AND e.server_timestamp::DATE = :target_date) as product_views,
                (SELECT COUNT(*) FROM events e 
                 WHERE e.brand_id = oi.brand_id 
                 AND e.event_type = 'add_to_cart' 
                 AND e.server_timestamp::DATE = :target_date) as add_to_carts,
                (SELECT COUNT(*) FROM events e 
                 WHERE e.brand_id = oi.brand_id 
                 AND e.event_type = 'checkout_started' 
                 AND e.server_timestamp::DATE = :target_date) as checkout_starts,
                
                -- Conversion rates (computed after)
                NULL as view_to_cart_rate,
                NULL as cart_to_checkout_rate,
                NULL as checkout_to_order_rate,
                
                NOW() as computed_at
                
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN user_cohorts uc ON uc.user_id = o.user_id AND uc.brand_id = oi.brand_id
            WHERE o.created_at::DATE = :target_date
            GROUP BY oi.brand_id
            
            ON CONFLICT (brand_id, date) 
            DO UPDATE SET
                gross_revenue = EXCLUDED.gross_revenue,
                net_revenue = EXCLUDED.net_revenue,
                refund_amount = EXCLUDED.refund_amount,
                total_orders = EXCLUDED.total_orders,
                confirmed_orders = EXCLUDED.confirmed_orders,
                cancelled_orders = EXCLUDED.cancelled_orders,
                delivered_orders = EXCLUDED.delivered_orders,
                failed_orders = EXCLUDED.failed_orders,
                total_items_sold = EXCLUDED.total_items_sold,
                unique_skus_sold = EXCLUDED.unique_skus_sold,
                unique_customers = EXCLUDED.unique_customers,
                new_customers = EXCLUDED.new_customers,
                repeat_customers = EXCLUDED.repeat_customers,
                aov = EXCLUDED.aov,
                cod_orders = EXCLUDED.cod_orders,
                cod_revenue = EXCLUDED.cod_revenue,
                prepaid_orders = EXCLUDED.prepaid_orders,
                prepaid_revenue = EXCLUDED.prepaid_revenue,
                wallet_orders = EXCLUDED.wallet_orders,
                wallet_amount_used = EXCLUDED.wallet_amount_used,
                same_day_orders = EXCLUDED.same_day_orders,
                next_day_orders = EXCLUDED.next_day_orders,
                product_views = EXCLUDED.product_views,
                add_to_carts = EXCLUDED.add_to_carts,
                checkout_starts = EXCLUDED.checkout_starts,
                computed_at = NOW()
        """, {'target_date': target_date})
        
        # Update conversion rates
        await self.db.execute("""
            UPDATE brand_daily_metrics
            SET 
                view_to_cart_rate = CASE WHEN product_views > 0 
                    THEN add_to_carts::DECIMAL / product_views ELSE 0 END,
                cart_to_checkout_rate = CASE WHEN add_to_carts > 0 
                    THEN checkout_starts::DECIMAL / add_to_carts ELSE 0 END,
                checkout_to_order_rate = CASE WHEN checkout_starts > 0 
                    THEN confirmed_orders::DECIMAL / checkout_starts ELSE 0 END
            WHERE date = :target_date
        """, {'target_date': target_date})
    
    async def _refresh_materialized_views(self):
        """Refresh all materialized views"""
        views = [
            'brand_weekly_metrics',
            'brand_monthly_metrics',
            'sku_velocity',
            'cohort_retention_weekly',
            'zone_demand_heatmap'
        ]
        
        for view in views:
            await self.db.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}")
            logger.info(f"Refreshed materialized view: {view}")


# Weekly cohort aggregation job
class WeeklyCohortJob:
    """
    Runs weekly on Sundays.
    Computes cohort retention metrics.
    """
    
    async def run(self):
        # Compute retention for all cohorts
        await self.db.execute("""
            INSERT INTO cohort_retention (
                brand_id, cohort_month, cohort_size,
                day_7_retention, day_14_retention, day_30_retention, 
                day_60_retention, day_90_retention,
                day_7_revenue, day_30_revenue, day_60_revenue, day_90_revenue,
                avg_orders_per_user, avg_revenue_per_user, repeat_rate,
                computed_at
            )
            SELECT 
                uc.brand_id,
                uc.cohort_month,
                COUNT(DISTINCT uc.user_id) as cohort_size,
                
                -- Retention rates
                COUNT(DISTINCT CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM orders o 
                        JOIN order_items oi ON oi.order_id = o.id
                        WHERE o.user_id = uc.user_id 
                        AND oi.brand_id = uc.brand_id
                        AND o.created_at::DATE <= uc.cohort_date + 7
                        AND o.id != uc.first_order_id
                        AND o.status = 'delivered'
                    ) THEN uc.user_id END
                )::DECIMAL / COUNT(DISTINCT uc.user_id) as day_7_retention,
                
                -- Similar for other retention periods...
                -- (abbreviated for clarity)
                
                0 as day_14_retention,
                0 as day_30_retention,
                0 as day_60_retention,
                0 as day_90_retention,
                0 as day_7_revenue,
                0 as day_30_revenue,
                0 as day_60_revenue,
                0 as day_90_revenue,
                
                AVG(uc.total_orders) as avg_orders_per_user,
                AVG(uc.total_revenue) as avg_revenue_per_user,
                COUNT(DISTINCT CASE WHEN uc.total_orders >= 2 THEN uc.user_id END)::DECIMAL / 
                    COUNT(DISTINCT uc.user_id) as repeat_rate,
                    
                NOW() as computed_at
                
            FROM user_cohorts uc
            GROUP BY uc.brand_id, uc.cohort_month
            
            ON CONFLICT (brand_id, cohort_month)
            DO UPDATE SET
                cohort_size = EXCLUDED.cohort_size,
                day_7_retention = EXCLUDED.day_7_retention,
                repeat_rate = EXCLUDED.repeat_rate,
                avg_orders_per_user = EXCLUDED.avg_orders_per_user,
                avg_revenue_per_user = EXCLUDED.avg_revenue_per_user,
                computed_at = NOW()
        """)
```

---

## Example SQL Queries

### Brand Revenue Trend
```sql
-- Daily revenue for last 30 days
SELECT 
    date,
    gross_revenue,
    net_revenue,
    total_orders,
    aov,
    LAG(gross_revenue, 7) OVER (ORDER BY date) as revenue_7d_ago,
    ROUND((gross_revenue - LAG(gross_revenue, 7) OVER (ORDER BY date)) / 
        NULLIF(LAG(gross_revenue, 7) OVER (ORDER BY date), 0) * 100, 2) as wow_growth
FROM brand_daily_metrics
WHERE brand_id = :brand_id
AND date >= CURRENT_DATE - 30
ORDER BY date DESC;
```

### Top SKUs by Velocity
```sql
-- Top 10 SKUs by velocity for a brand
SELECT 
    sku,
    product_name,
    units_7d,
    revenue_7d,
    daily_velocity,
    week_over_week_growth,
    current_stock,
    CASE 
        WHEN current_stock = 0 THEN 'Out of Stock'
        WHEN daily_velocity > 0 AND current_stock / daily_velocity < 7 THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM sku_velocity
WHERE brand_id = :brand_id
ORDER BY daily_velocity DESC
LIMIT 10;
```

### Cohort Retention Table
```sql
-- Monthly cohort retention grid
SELECT 
    TO_CHAR(cohort_month, 'Mon YYYY') as cohort,
    cohort_size,
    ROUND(day_7_retention * 100, 1) || '%' as d7,
    ROUND(day_30_retention * 100, 1) || '%' as d30,
    ROUND(day_60_retention * 100, 1) || '%' as d60,
    ROUND(day_90_retention * 100, 1) || '%' as d90,
    ROUND(repeat_rate * 100, 1) || '%' as repeat_rate,
    ROUND(avg_revenue_per_user, 2) as ltv
FROM cohort_retention
WHERE brand_id = :brand_id
ORDER BY cohort_month DESC
LIMIT 12;
```

### Zone Demand Analysis
```sql
-- Zone-wise demand with ranking
SELECT 
    zone,
    orders_7d,
    revenue_7d,
    customers_7d,
    ROUND(avg_delivery_time) as avg_delivery_mins,
    ROUND(on_time_rate * 100, 1) || '%' as on_time_rate,
    ROUND(demand_score, 0) as demand_percentile
FROM zone_demand_heatmap
WHERE brand_id = :brand_id
ORDER BY demand_score DESC;
```

### Payment Split Analysis
```sql
-- COD vs Prepaid trend
SELECT 
    date,
    cod_orders,
    prepaid_orders,
    ROUND(prepaid_orders::DECIMAL / NULLIF(cod_orders + prepaid_orders, 0) * 100, 1) as prepaid_percentage,
    wallet_orders,
    ROUND(wallet_amount_used / NULLIF(cod_revenue + prepaid_revenue, 0) * 100, 1) as wallet_share
FROM payment_daily_analytics
WHERE brand_id = :brand_id
AND date >= CURRENT_DATE - 30
ORDER BY date DESC;
```

---

## Scheduler Configuration

```python
# APScheduler job configuration

AGGREGATION_JOBS = [
    {
        'id': 'daily_aggregation',
        'func': 'jobs.aggregation:run_daily_aggregation',
        'trigger': 'cron',
        'hour': 2,
        'minute': 0,
        'timezone': 'Asia/Kolkata'
    },
    {
        'id': 'weekly_cohort_analysis',
        'func': 'jobs.aggregation:run_weekly_cohort',
        'trigger': 'cron',
        'day_of_week': 'sun',
        'hour': 3,
        'minute': 0,
        'timezone': 'Asia/Kolkata'
    },
    {
        'id': 'refresh_materialized_views',
        'func': 'jobs.aggregation:refresh_views',
        'trigger': 'cron',
        'hour': '*/4',  # Every 4 hours
        'minute': 30,
        'timezone': 'Asia/Kolkata'
    }
]
```
