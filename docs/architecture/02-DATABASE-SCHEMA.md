# Dash24 V1 - Database Schema Design

## Overview

PostgreSQL schema designed for:
- Multi-brand marketplace operations
- Order lifecycle management with strong consistency
- Loyalty wallet with transactional integrity
- Apartment-based delivery grouping
- EasyEcom synchronization tracking

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DASH24 DATABASE SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐             │
│  │    users     │         │    brands    │         │  categories  │             │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤             │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │             │
│  │ email        │◄────┐   │ name         │         │ name         │             │
│  │ phone        │     │   │ slug         │         │ slug         │             │
│  │ role         │     │   │ logo_url     │         │ parent_id    │──┐          │
│  │ wallet_bal   │     │   │ is_active    │         └──────────────┘  │          │
│  └──────────────┘     │   └──────────────┘                │          │          │
│         │             │          │                        │          │          │
│         │             │          │                        ▼          ▼          │
│         ▼             │          ▼              ┌──────────────────────┐        │
│  ┌──────────────┐     │   ┌──────────────┐      │      products        │        │
│  │  addresses   │     │   │brand_users   │      ├──────────────────────┤        │
│  ├──────────────┤     │   ├──────────────┤      │ id (PK)              │        │
│  │ id (PK)      │     │   │ brand_id(FK) │      │ sku (unique)         │        │
│  │ user_id (FK) │     │   │ user_id (FK) │      │ easyecom_id          │        │
│  │ apartment_id │     │   └──────────────┘      │ brand_id (FK)        │        │
│  │ full_address │     │                         │ category_id (FK)     │        │
│  │ is_default   │     │                         │ name                 │        │
│  └──────────────┘     │                         │ price                │        │
│         │             │                         │ mrp                  │        │
│         │             │                         │ stock_quantity       │        │
│         ▼             │                         │ reserved_quantity    │        │
│  ┌──────────────┐     │                         │ is_active            │        │
│  │  apartments  │     │                         └──────────────────────┘        │
│  ├──────────────┤     │                                   │                     │
│  │ id (PK)      │     │                                   │                     │
│  │ name         │     │                                   ▼                     │
│  │ locality     │     │    ┌──────────────┐      ┌──────────────────┐           │
│  │ city         │     │    │    carts     │      │   cart_items     │           │
│  │ pincode      │     │    ├──────────────┤      ├──────────────────┤           │
│  │ is_serviceable│    │    │ id (PK)      │◄─────│ cart_id (FK)     │           │
│  │ delivery_zone│     │    │ user_id (FK) │      │ product_id (FK)  │           │
│  └──────────────┘     │    │ expires_at   │      │ quantity         │           │
│                       │    └──────────────┘      │ unit_price       │           │
│                       │                          └──────────────────┘           │
│                       │                                                         │
│                       │          ┌──────────────────────────────────┐           │
│                       │          │            orders                │           │
│                       │          ├──────────────────────────────────┤           │
│                       └──────────│ id (PK)                          │           │
│                                  │ order_number (unique)            │           │
│                                  │ user_id (FK)                     │           │
│                                  │ address_id (FK)                  │           │
│                                  │ status                           │           │
│                                  │ payment_method (COD/PREPAID)     │           │
│                                  │ payment_status                   │           │
│                                  │ subtotal                         │           │
│                                  │ delivery_fee                     │           │
│                                  │ wallet_applied                   │           │
│                                  │ total                            │           │
│                                  │ easyecom_order_id                │           │
│                                  │ delivery_slot                    │           │
│                                  │ cutoff_time                      │           │
│                                  └──────────────────────────────────┘           │
│                                               │                                 │
│                     ┌─────────────────────────┼─────────────────────────┐       │
│                     │                         │                         │       │
│                     ▼                         ▼                         ▼       │
│          ┌──────────────────┐      ┌──────────────────┐      ┌──────────────┐  │
│          │   order_items    │      │ order_status_log │      │   payments   │  │
│          ├──────────────────┤      ├──────────────────┤      ├──────────────┤  │
│          │ order_id (FK)    │      │ order_id (FK)    │      │ order_id(FK) │  │
│          │ product_id (FK)  │      │ from_status      │      │ razorpay_id  │  │
│          │ brand_id (FK)    │      │ to_status        │      │ amount       │  │
│          │ quantity         │      │ changed_by       │      │ status       │  │
│          │ unit_price       │      │ notes            │      │ method       │  │
│          │ subtotal         │      │ created_at       │      │ metadata     │  │
│          └──────────────────┘      └──────────────────┘      └──────────────┘  │
│                                                                                 │
│          ┌──────────────────┐      ┌──────────────────┐      ┌──────────────┐  │
│          │wallet_transactions│     │  inventory_sync  │      │webhook_logs  │  │
│          ├──────────────────┤      ├──────────────────┤      ├──────────────┤  │
│          │ user_id (FK)     │      │ product_id (FK)  │      │ id (PK)      │  │
│          │ order_id (FK)    │      │ easyecom_qty     │      │ source       │  │
│          │ type             │      │ local_qty        │      │ event_type   │  │
│          │ amount           │      │ discrepancy      │      │ payload      │  │
│          │ balance_after    │      │ synced_at        │      │ status       │  │
│          │ description      │      │ resolved         │      │ retries      │  │
│          └──────────────────┘      └──────────────────┘      └──────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### 1. Users & Authentication

```sql
-- User roles enum
CREATE TYPE user_role AS ENUM ('customer', 'brand', 'admin');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'customer',
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP management
CREATE TABLE otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(15),
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'login', 'verify_phone', 'verify_email'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_lookup ON otp_tokens(email, otp_code, is_used);
CREATE INDEX idx_otp_phone_lookup ON otp_tokens(phone, otp_code, is_used);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id, is_revoked);
```

### 2. Location & Delivery

```sql
-- Apartments for grouping deliveries
CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_serviceable BOOLEAN NOT NULL DEFAULT true,
    delivery_zone VARCHAR(50), -- 'zone_a', 'zone_b' for routing
    avg_delivery_time_mins INT DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_apartment_pincode ON apartments(pincode);
CREATE INDEX idx_apartment_serviceable ON apartments(is_serviceable);

-- User addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    apartment_id UUID REFERENCES apartments(id),
    label VARCHAR(50), -- 'home', 'work', 'other'
    flat_number VARCHAR(50),
    tower_block VARCHAR(100),
    full_address TEXT NOT NULL,
    landmark TEXT,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_address_user ON addresses(user_id, is_active);
```

### 3. Catalog & Inventory

```sql
-- Brands
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    commission_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brand_slug ON brands(slug);
CREATE INDEX idx_brand_active ON brands(is_active);

-- Brand users (for brand portal access)
CREATE TABLE brand_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'manager', -- 'owner', 'manager', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(brand_id, user_id)
);

-- Categories (hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_category_parent ON categories(parent_id);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    easyecom_product_id VARCHAR(100), -- EasyEcom reference
    easyecom_variant_id VARCHAR(100), -- EasyEcom variant reference
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Pricing
    mrp DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2), -- for margin calculation
    
    -- Inventory (shadow copy from EasyEcom)
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0, -- items in active carts/pending orders
    low_stock_threshold INT DEFAULT 5,
    
    -- Product details
    weight_grams INT,
    dimensions JSONB, -- {length, width, height}
    images JSONB DEFAULT '[]', -- array of image URLs
    attributes JSONB DEFAULT '{}', -- size, color, etc.
    
    -- Flags
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    requires_refrigeration BOOLEAN DEFAULT false,
    
    -- Sync metadata
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'pending', 'error'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_price CHECK (selling_price <= mrp),
    CONSTRAINT chk_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_reserved CHECK (reserved_quantity >= 0)
);

CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_brand ON products(brand_id);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_product_easyecom ON products(easyecom_product_id);
CREATE INDEX idx_product_active ON products(is_active, stock_quantity);
CREATE INDEX idx_product_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Inventory sync log (for reconciliation)
CREATE TABLE inventory_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    easyecom_quantity INT NOT NULL,
    local_quantity INT NOT NULL,
    discrepancy INT GENERATED ALWAYS AS (easyecom_quantity - local_quantity) STORED,
    sync_type VARCHAR(50) NOT NULL, -- 'webhook', 'reconciliation', 'manual'
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_product ON inventory_sync_log(product_id);
CREATE INDEX idx_sync_unresolved ON inventory_sync_log(resolved) WHERE NOT resolved;
```

### 4. Cart Management

```sql
-- Shopping carts
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- for guest carts
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX idx_cart_user ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_session ON carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_cart_expiry ON carts(expires_at);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL, -- locked at time of adding
    reserved_until TIMESTAMP WITH TIME ZONE, -- inventory reservation expiry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_reservation ON cart_items(reserved_until) WHERE reserved_until IS NOT NULL;
```

### 5. Orders & Payments

```sql
-- Order status enum
CREATE TYPE order_status AS ENUM (
    'pending',           -- Order created, awaiting payment/confirmation
    'confirmed',         -- Payment received or COD confirmed
    'processing',        -- Sent to EasyEcom
    'packed',            -- Packed by warehouse
    'shipped',           -- Handed to delivery partner
    'out_for_delivery',  -- On the way
    'delivered',         -- Successfully delivered
    'cancelled',         -- Cancelled by customer/admin
    'failed',            -- Order failed (payment/fulfillment)
    'returned',          -- Returned after delivery
    'refunded'           -- Refund processed
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
    'pending',
    'authorized',
    'captured',
    'failed',
    'refunded',
    'partially_refunded'
);

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('cod', 'prepaid', 'wallet');

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- human-readable: D24-YYYYMMDD-XXXXX
    user_id UUID REFERENCES users(id),
    address_id UUID REFERENCES addresses(id),
    
    -- Status
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    wallet_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    
    -- Delivery
    delivery_slot JSONB, -- {date, start_time, end_time}
    cutoff_time TIMESTAMP WITH TIME ZONE, -- 2PM cutoff
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    delivery_instructions TEXT,
    
    -- EasyEcom integration
    easyecom_order_id VARCHAR(100),
    easyecom_status VARCHAR(100),
    easyecom_awb VARCHAR(100), -- tracking number
    easyecom_sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'error'
    easyecom_last_sync TIMESTAMP WITH TIME ZONE,
    
    -- COD specific
    cod_amount DECIMAL(10,2), -- amount to collect
    cod_collected BOOLEAN DEFAULT false,
    cod_collected_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'web', -- 'web', 'app', 'admin'
    notes TEXT,
    admin_notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_total CHECK (total >= 0)
);

CREATE INDEX idx_order_number ON orders(order_number);
CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(created_at DESC);
CREATE INDEX idx_order_easyecom ON orders(easyecom_order_id);
CREATE INDEX idx_order_delivery ON orders(estimated_delivery) WHERE status NOT IN ('delivered', 'cancelled', 'failed');

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    brand_id UUID REFERENCES brands(id),
    
    -- Snapshot at order time
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Item status (for partial fulfillment)
    item_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'fulfilled', 'cancelled', 'returned'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_brand ON order_items(brand_id);

-- Order status history
CREATE TABLE order_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by UUID REFERENCES users(id), -- null for system changes
    source VARCHAR(50), -- 'system', 'admin', 'webhook', 'customer'
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_log_order ON order_status_log(order_id);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Razorpay references
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet', 'cod'
    status payment_status NOT NULL DEFAULT 'pending',
    
    -- Metadata
    failure_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_razorpay ON payments(razorpay_payment_id);
```

### 6. Wallet & Loyalty

```sql
-- Wallet transaction types
CREATE TYPE wallet_txn_type AS ENUM (
    'credit_purchase',    -- Purchased wallet credits
    'credit_promo',       -- Promotional credits
    'credit_refund',      -- Refund to wallet
    'credit_cashback',    -- Cashback from order
    'debit_order',        -- Used for order
    'debit_expired',      -- Credits expired
    'debit_adjustment'    -- Admin adjustment
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    type wallet_txn_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, -- for promotional credits
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_order ON wallet_transactions(order_id);
CREATE INDEX idx_wallet_expiry ON wallet_transactions(expires_at) WHERE expires_at IS NOT NULL;

-- Promo codes (future)
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0.00,
    max_discount DECIMAL(10,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promo_code ON promo_codes(code, is_active);
```

### 7. Webhook & Integration Logs

```sql
-- Webhook status
CREATE TYPE webhook_status AS ENUM ('pending', 'processing', 'success', 'failed', 'retrying');

-- Webhook logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL, -- 'easyecom', 'razorpay', etc.
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255), -- external event ID for idempotency
    
    payload JSONB NOT NULL,
    headers JSONB,
    
    status webhook_status NOT NULL DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    response_code INT,
    response_body TEXT,
    error_message TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_source ON webhook_logs(source, event_type);
CREATE INDEX idx_webhook_event ON webhook_logs(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_webhook_retry ON webhook_logs(next_retry_at) WHERE status = 'retrying';
CREATE INDEX idx_webhook_pending ON webhook_logs(status) WHERE status IN ('pending', 'retrying');

-- EasyEcom sync queue
CREATE TABLE easyecom_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'order', 'inventory', 'product'
    entity_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL, -- 'create', 'update', 'sync'
    payload JSONB,
    priority INT DEFAULT 5, -- 1 highest, 10 lowest
    status webhook_status NOT NULL DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_status ON easyecom_sync_queue(status, priority, scheduled_at);
CREATE INDEX idx_sync_queue_entity ON easyecom_sync_queue(entity_type, entity_id);
```

### 8. Delivery Slots & Cutoffs

```sql
-- Delivery slots configuration
CREATE TABLE delivery_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    max_orders INT NOT NULL DEFAULT 50,
    current_orders INT DEFAULT 0,
    cutoff_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 2PM default
    is_available BOOLEAN DEFAULT true,
    zone VARCHAR(50), -- for zone-specific slots
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, slot_start, slot_end, zone)
);

CREATE INDEX idx_slot_availability ON delivery_slots(date, is_available);
CREATE INDEX idx_slot_cutoff ON delivery_slots(cutoff_time);
```

---

## Database Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    date_part VARCHAR(8);
    sequence_num INT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 14) AS INT)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'D24-' || date_part || '-%';
    
    NEW.order_number := 'D24-' || date_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET wallet_balance = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_wallet_balance AFTER INSERT ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();
```

---

## Indexes for Common Queries

```sql
-- Product search and filtering
CREATE INDEX idx_product_brand_active ON products(brand_id, is_active) WHERE is_active = true;
CREATE INDEX idx_product_category_active ON products(category_id, is_active) WHERE is_active = true;
CREATE INDEX idx_product_featured ON products(is_featured, is_active) WHERE is_featured = true AND is_active = true;
CREATE INDEX idx_product_stock ON products(stock_quantity) WHERE stock_quantity > 0 AND is_active = true;

-- Order analytics
CREATE INDEX idx_order_date_status ON orders(DATE(created_at), status);
CREATE INDEX idx_order_brand_date ON order_items(brand_id, created_at);

-- Apartment-based delivery grouping
CREATE INDEX idx_address_apartment ON addresses(apartment_id) WHERE apartment_id IS NOT NULL;
```
