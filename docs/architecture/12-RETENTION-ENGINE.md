# Dash24 V1 - Retention Engine

## Overview

Backend-ready trigger system for identifying retention opportunities and preparing actions. This document focuses on the **trigger detection** and **action preparation** layers—NOT marketing automation execution.

---

## Retention Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          RETENTION ENGINE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         TRIGGER SOURCES                                  │   │
│   │                                                                          │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌───────────┐   │   │
│   │   │   Events    │   │   Orders    │   │   Users     │   │ Scheduled │   │   │
│   │   │   Stream    │   │   Table     │   │   Table     │   │   Jobs    │   │   │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────┬─────┘   │   │
│   │          │                 │                 │                │         │   │
│   └──────────┼─────────────────┼─────────────────┼────────────────┼─────────┘   │
│              │                 │                 │                │             │
│              └─────────────────┼─────────────────┴────────────────┘             │
│                                │                                                 │
│                                ▼                                                 │
│              ┌─────────────────────────────────────────────────────┐            │
│              │              TRIGGER DETECTOR                        │            │
│              │                                                      │            │
│              │  • Event-driven triggers (real-time)                 │            │
│              │  • Scheduled triggers (batch processing)             │            │
│              │  • Rule evaluation engine                            │            │
│              │                                                      │            │
│              └───────────────────────┬─────────────────────────────┘            │
│                                      │                                           │
│                                      ▼                                           │
│              ┌─────────────────────────────────────────────────────┐            │
│              │            RETENTION TRIGGERS TABLE                  │            │
│              │                                                      │            │
│              │  user_id | trigger_type | context | eligible_actions│            │
│              │                                                      │            │
│              └───────────────────────┬─────────────────────────────┘            │
│                                      │                                           │
│                                      ▼                                           │
│              ┌─────────────────────────────────────────────────────┐            │
│              │            ACTION PREPARATION                        │            │
│              │                                                      │            │
│              │  • Wallet incentive calculation                      │            │
│              │  • Coupon generation                                 │            │
│              │  • Notification payload preparation                  │            │
│              │                                                      │            │
│              └───────────────────────┬─────────────────────────────┘            │
│                                      │                                           │
│                                      ▼                                           │
│              ┌─────────────────────────────────────────────────────┐            │
│              │          PREPARED ACTIONS TABLE                      │            │
│              │                                                      │            │
│              │  trigger_id | action_type | payload | status         │            │
│              │                                                      │            │
│              └───────────────────────┬─────────────────────────────┘            │
│                                      │                                           │
│                                      │ (Future: Marketing Automation)            │
│                                      ▼                                           │
│              ┌─────────────────────────────────────────────────────┐            │
│              │         EXTERNAL EXECUTION LAYER                     │            │
│              │         (Not in V1 scope)                            │            │
│              │                                                      │            │
│              │  • Push notification service                         │            │
│              │  • SMS gateway                                       │            │
│              │  • Email service                                     │            │
│              │                                                      │            │
│              └─────────────────────────────────────────────────────┘            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Retention Triggers

```sql
-- Trigger types enum
CREATE TYPE retention_trigger_type AS ENUM (
    'cart_abandonment',       -- Cart not converted within window
    'lapsed_customer',        -- No order in X days
    'reorder_opportunity',    -- SKU reorder timing
    'delivery_recovery',      -- After delivery failure
    'browse_abandonment',     -- Viewed but didn't add to cart
    'winback',               -- Churned customer
    'loyalty_milestone',      -- Hit loyalty tier
    'first_order_followup'   -- After first successful order
);

-- Trigger status
CREATE TYPE trigger_status AS ENUM (
    'pending',     -- Newly detected, not processed
    'eligible',    -- Action prepared, ready for execution
    'executed',    -- Action sent/applied
    'converted',   -- User took desired action
    'expired',     -- Window passed without action
    'suppressed'   -- User opted out or rules suppressed
);

-- Main retention triggers table
CREATE TABLE retention_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trigger details
    trigger_type retention_trigger_type NOT NULL,
    trigger_source VARCHAR(50) NOT NULL,  -- 'event', 'scheduled', 'manual'
    
    -- Context (what triggered this)
    context JSONB NOT NULL DEFAULT '{}',
    /*
    Example contexts:
    - cart_abandonment: {cart_id, cart_value, items, last_activity}
    - lapsed_customer: {last_order_date, days_since, lifetime_value}
    - reorder_opportunity: {sku, last_ordered, avg_reorder_days}
    */
    
    -- Timing
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status tracking
    status trigger_status NOT NULL DEFAULT 'pending',
    
    -- Action eligibility
    eligible_actions JSONB DEFAULT '[]',
    /*
    Example: ['wallet_credit', 'coupon', 'push_notification']
    */
    
    -- Outcome tracking
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_order_id UUID REFERENCES orders(id),
    
    -- Processing metadata
    priority INT DEFAULT 5,  -- 1 highest
    suppress_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_triggers_user_status ON retention_triggers(user_id, status);
CREATE INDEX idx_triggers_type_status ON retention_triggers(trigger_type, status);
CREATE INDEX idx_triggers_pending ON retention_triggers(status, priority) 
    WHERE status = 'pending';
CREATE INDEX idx_triggers_expires ON retention_triggers(expires_at) 
    WHERE status IN ('pending', 'eligible');
CREATE INDEX idx_triggers_context ON retention_triggers USING gin(context jsonb_path_ops);
```

### Prepared Actions

```sql
-- Action types
CREATE TYPE retention_action_type AS ENUM (
    'wallet_credit',
    'coupon_generate',
    'push_notification',
    'sms',
    'email',
    'in_app_banner'
);

CREATE TYPE action_status AS ENUM (
    'prepared',    -- Ready for execution
    'queued',      -- In execution queue
    'sent',        -- Sent to user
    'delivered',   -- Confirmed delivered
    'clicked',     -- User interacted
    'redeemed',    -- Incentive used
    'expired',     -- Offer expired
    'failed'       -- Execution failed
);

-- Prepared retention actions
CREATE TABLE retention_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id UUID NOT NULL REFERENCES retention_triggers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Action details
    action_type retention_action_type NOT NULL,
    
    -- Action payload (ready for execution)
    payload JSONB NOT NULL,
    /*
    Examples:
    
    wallet_credit: {
        amount: 50,
        expires_in_days: 7,
        description: "We miss you! Here's ₹50 on us"
    }
    
    coupon_generate: {
        code: "WINBACK50",
        discount_type: "percentage",
        discount_value: 10,
        min_order: 200,
        max_discount: 100,
        valid_days: 5,
        single_use: true
    }
    
    push_notification: {
        title: "Your favorites are waiting!",
        body: "Complete your order and get 10% off",
        deep_link: "/cart",
        image_url: "..."
    }
    */
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status action_status NOT NULL DEFAULT 'prepared',
    
    -- Execution tracking
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_response JSONB,
    
    -- Redemption tracking (for incentives)
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_order_id UUID REFERENCES orders(id),
    
    -- Generated assets
    coupon_id UUID REFERENCES promo_codes(id),
    wallet_txn_id UUID REFERENCES wallet_transactions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actions_trigger ON retention_actions(trigger_id);
CREATE INDEX idx_actions_user_status ON retention_actions(user_id, status);
CREATE INDEX idx_actions_scheduled ON retention_actions(scheduled_for) 
    WHERE status = 'prepared';
CREATE INDEX idx_actions_type ON retention_actions(action_type, status);
```

### Retention Rules Configuration

```sql
-- Configurable retention rules
CREATE TABLE retention_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule identification
    name VARCHAR(255) NOT NULL,
    trigger_type retention_trigger_type NOT NULL,
    
    -- Rule conditions (JSONB for flexibility)
    conditions JSONB NOT NULL,
    /*
    Example conditions:
    {
        "min_lifetime_value": 500,
        "max_triggers_per_user": 1,
        "cooldown_days": 7,
        "exclude_segments": ["vip", "blacklist"],
        "time_window_days": 7
    }
    */
    
    -- Actions to prepare when triggered
    actions JSONB NOT NULL,
    /*
    Example:
    [
        {
            "type": "wallet_credit",
            "amount": 50,
            "expires_in_days": 7
        },
        {
            "type": "push_notification",
            "delay_hours": 2,
            "template": "cart_abandonment_reminder"
        }
    ]
    */
    
    -- Rule settings
    priority INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    
    -- Scheduling
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default rules
INSERT INTO retention_rules (name, trigger_type, conditions, actions) VALUES
(
    'Cart Abandonment - 2 hours',
    'cart_abandonment',
    '{
        "cart_age_hours": 2,
        "min_cart_value": 200,
        "max_triggers_per_user": 2,
        "cooldown_days": 3
    }',
    '[
        {
            "type": "push_notification",
            "template": "cart_reminder",
            "delay_hours": 0
        }
    ]'
),
(
    'Lapsed Customer - 7 days',
    'lapsed_customer',
    '{
        "days_since_order": 7,
        "min_lifetime_orders": 1,
        "max_triggers_per_user": 1,
        "cooldown_days": 14
    }',
    '[
        {
            "type": "wallet_credit",
            "amount": 50,
            "expires_in_days": 7
        },
        {
            "type": "push_notification",
            "template": "we_miss_you",
            "delay_hours": 0
        }
    ]'
),
(
    'Reorder Opportunity',
    'reorder_opportunity',
    '{
        "sku_categories": ["dairy", "bread", "eggs"],
        "avg_reorder_multiplier": 1.2,
        "min_orders_of_sku": 2
    }',
    '[
        {
            "type": "push_notification",
            "template": "reorder_reminder",
            "delay_hours": 0
        }
    ]'
);
```

---

## Trigger Detection Service

```python
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class RetentionTriggerDetector:
    """
    Detects retention triggers from events and scheduled checks.
    """
    
    def __init__(self, db_session, redis_client, rules_engine):
        self.db = db_session
        self.redis = redis_client
        self.rules = rules_engine
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EVENT-DRIVEN TRIGGERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def evaluate_trigger(
        self,
        trigger_type: str,
        event: dict
    ):
        """
        Called from event processor when relevant events occur.
        """
        handlers = {
            'cart_abandonment': self._handle_cart_abandonment,
            'post_purchase': self._handle_post_purchase,
            'reorder_opportunity': self._handle_reorder_opportunity,
        }
        
        handler = handlers.get(trigger_type)
        if handler:
            await handler(event)
    
    async def _handle_cart_abandonment(self, event: dict):
        """
        Triggered when checkout_started event received.
        Schedule check for abandonment after configured time.
        """
        user_id = event.get('user_id')
        cart_id = event.get('cart_id')
        
        if not user_id:
            return
        
        # Get abandonment rules
        rule = await self.rules.get_active_rule('cart_abandonment')
        if not rule:
            return
        
        check_time = rule.conditions.get('cart_age_hours', 2)
        
        # Schedule abandonment check
        await self.redis.zadd(
            'retention:cart_abandonment_checks',
            {
                f"{user_id}:{cart_id}": (
                    datetime.utcnow() + timedelta(hours=check_time)
                ).timestamp()
            }
        )
    
    async def _handle_post_purchase(self, event: dict):
        """
        After order confirmed - set up first order followup for new customers.
        """
        user_id = event.get('user_id')
        order_id = event.get('order_id')
        properties = event.get('properties', {})
        
        is_first_order = properties.get('is_repeat_customer') == False
        
        if is_first_order:
            # Create first order followup trigger
            await self._create_trigger(
                user_id=user_id,
                trigger_type='first_order_followup',
                context={
                    'order_id': str(order_id),
                    'order_value': properties.get('order_value'),
                },
                expires_in_days=3,
                priority=2
            )
    
    async def _handle_reorder_opportunity(self, event: dict):
        """
        After delivery - check for reorder opportunities based on SKU patterns.
        """
        user_id = event.get('user_id')
        order_id = event.get('order_id')
        
        # Get user's repeat purchase patterns
        patterns = await self._get_user_reorder_patterns(user_id)
        
        for pattern in patterns:
            if pattern['eligible_for_reminder']:
                await self._create_trigger(
                    user_id=user_id,
                    trigger_type='reorder_opportunity',
                    context={
                        'sku': pattern['sku'],
                        'product_name': pattern['product_name'],
                        'avg_reorder_days': pattern['avg_days'],
                        'last_ordered': pattern['last_ordered'],
                    },
                    expires_in_days=pattern['avg_days'] + 2,
                    priority=4
                )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SCHEDULED TRIGGERS (Batch Processing)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def run_lapsed_customer_detection(self):
        """
        Run daily to find lapsed customers.
        """
        rule = await self.rules.get_active_rule('lapsed_customer')
        if not rule:
            return
        
        days_threshold = rule.conditions.get('days_since_order', 7)
        min_orders = rule.conditions.get('min_lifetime_orders', 1)
        cooldown = rule.conditions.get('cooldown_days', 14)
        
        lapsed_date = datetime.utcnow().date() - timedelta(days=days_threshold)
        cooldown_date = datetime.utcnow() - timedelta(days=cooldown)
        
        # Find lapsed customers
        lapsed_users = await self.db.execute("""
            SELECT 
                u.id as user_id,
                MAX(o.created_at) as last_order_date,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total) as lifetime_value
            FROM users u
            JOIN orders o ON o.user_id = u.id
            WHERE o.status = 'delivered'
            GROUP BY u.id
            HAVING 
                MAX(o.created_at)::DATE < :lapsed_date
                AND COUNT(DISTINCT o.id) >= :min_orders
                AND u.id NOT IN (
                    SELECT user_id FROM retention_triggers
                    WHERE trigger_type = 'lapsed_customer'
                    AND created_at > :cooldown_date
                )
        """, {
            'lapsed_date': lapsed_date,
            'min_orders': min_orders,
            'cooldown_date': cooldown_date
        })
        
        for user in lapsed_users.fetchall():
            await self._create_trigger(
                user_id=user.user_id,
                trigger_type='lapsed_customer',
                context={
                    'last_order_date': user.last_order_date.isoformat(),
                    'days_since': days_threshold,
                    'total_orders': user.total_orders,
                    'lifetime_value': float(user.lifetime_value)
                },
                expires_in_days=7,
                priority=3
            )
    
    async def run_cart_abandonment_check(self):
        """
        Check for carts that have been abandoned.
        Run every 15 minutes.
        """
        now = datetime.utcnow().timestamp()
        
        # Get due checks
        due_checks = await self.redis.zrangebyscore(
            'retention:cart_abandonment_checks',
            '-inf',
            now
        )
        
        for check in due_checks:
            user_id, cart_id = check.decode().split(':')
            
            # Verify cart is still abandoned (no order created)
            cart_status = await self._check_cart_status(user_id, cart_id)
            
            if cart_status['abandoned']:
                await self._create_trigger(
                    user_id=user_id,
                    trigger_type='cart_abandonment',
                    context={
                        'cart_id': cart_id,
                        'cart_value': cart_status['value'],
                        'items': cart_status['items'],
                        'checkout_started_at': cart_status['checkout_time']
                    },
                    expires_in_days=1,
                    priority=1
                )
            
            # Remove from check queue
            await self.redis.zrem(
                'retention:cart_abandonment_checks',
                check
            )
    
    async def run_winback_detection(self):
        """
        Find customers who haven't ordered in 30+ days.
        Run weekly.
        """
        winback_threshold = 30  # days
        cooldown = 30  # days
        
        churned_date = datetime.utcnow().date() - timedelta(days=winback_threshold)
        
        churned_users = await self.db.execute("""
            SELECT 
                u.id as user_id,
                MAX(o.created_at) as last_order_date,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total) as lifetime_value,
                u.email
            FROM users u
            JOIN orders o ON o.user_id = u.id
            WHERE o.status = 'delivered'
            GROUP BY u.id, u.email
            HAVING 
                MAX(o.created_at)::DATE < :churned_date
                AND COUNT(DISTINCT o.id) >= 2  -- At least 2 orders to be considered churned
                AND u.id NOT IN (
                    SELECT user_id FROM retention_triggers
                    WHERE trigger_type = 'winback'
                    AND created_at > NOW() - INTERVAL '%s days'
                )
        """ % cooldown, {'churned_date': churned_date})
        
        for user in churned_users.fetchall():
            days_since = (datetime.utcnow().date() - user.last_order_date.date()).days
            
            await self._create_trigger(
                user_id=user.user_id,
                trigger_type='winback',
                context={
                    'last_order_date': user.last_order_date.isoformat(),
                    'days_since': days_since,
                    'total_orders': user.total_orders,
                    'lifetime_value': float(user.lifetime_value)
                },
                expires_in_days=14,
                priority=5
            )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPER METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _create_trigger(
        self,
        user_id: str,
        trigger_type: str,
        context: dict,
        expires_in_days: int,
        priority: int = 5
    ):
        """Create a new retention trigger"""
        
        # Check suppression rules
        if await self._should_suppress(user_id, trigger_type):
            return
        
        # Get eligible actions from rule
        rule = await self.rules.get_active_rule(trigger_type)
        eligible_actions = [a['type'] for a in rule.actions] if rule else []
        
        trigger = RetentionTrigger(
            user_id=user_id,
            trigger_type=trigger_type,
            trigger_source='scheduled' if trigger_type in ['lapsed_customer', 'winback'] else 'event',
            context=context,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
            eligible_actions=eligible_actions,
            priority=priority,
            status='pending'
        )
        
        self.db.add(trigger)
        await self.db.commit()
        
        logger.info(f"Created {trigger_type} trigger for user {user_id}")
        
        # Queue for action preparation
        await self.redis.lpush(
            'retention:pending_triggers',
            str(trigger.id)
        )
    
    async def _should_suppress(
        self,
        user_id: str,
        trigger_type: str
    ) -> bool:
        """Check if trigger should be suppressed"""
        
        # Check if user opted out
        user = await self.db.query(User).filter(User.id == user_id).first()
        if user and user.metadata.get('retention_opt_out'):
            return True
        
        # Check cooldown (max triggers per user)
        rule = await self.rules.get_active_rule(trigger_type)
        if rule:
            max_triggers = rule.conditions.get('max_triggers_per_user', 3)
            cooldown_days = rule.conditions.get('cooldown_days', 7)
            
            recent_triggers = await self.db.execute("""
                SELECT COUNT(*) 
                FROM retention_triggers
                WHERE user_id = :user_id
                AND trigger_type = :type
                AND created_at > :since
            """, {
                'user_id': user_id,
                'type': trigger_type,
                'since': datetime.utcnow() - timedelta(days=cooldown_days)
            })
            
            if recent_triggers.scalar() >= max_triggers:
                return True
        
        return False
    
    async def _get_user_reorder_patterns(self, user_id: str) -> List[dict]:
        """Analyze user's purchase patterns for reorder opportunities"""
        
        patterns = await self.db.execute("""
            WITH user_purchases AS (
                SELECT 
                    oi.sku,
                    p.name as product_name,
                    o.created_at::DATE as order_date,
                    LAG(o.created_at::DATE) OVER (
                        PARTITION BY oi.sku ORDER BY o.created_at
                    ) as prev_order_date
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                JOIN products p ON p.id = oi.product_id
                WHERE o.user_id = :user_id
                AND o.status = 'delivered'
            ),
            sku_patterns AS (
                SELECT 
                    sku,
                    product_name,
                    AVG(order_date - prev_order_date) as avg_days,
                    COUNT(*) as purchase_count,
                    MAX(order_date) as last_ordered
                FROM user_purchases
                WHERE prev_order_date IS NOT NULL
                GROUP BY sku, product_name
                HAVING COUNT(*) >= 2
            )
            SELECT 
                sku,
                product_name,
                EXTRACT(EPOCH FROM avg_days) / 86400 as avg_days,
                purchase_count,
                last_ordered,
                CURRENT_DATE - last_ordered as days_since_last
            FROM sku_patterns
            WHERE CURRENT_DATE - last_ordered >= avg_days * 0.8
        """, {'user_id': user_id})
        
        return [
            {
                'sku': row.sku,
                'product_name': row.product_name,
                'avg_days': int(row.avg_days),
                'last_ordered': row.last_ordered.isoformat(),
                'eligible_for_reminder': row.days_since_last >= row.avg_days * 0.9
            }
            for row in patterns.fetchall()
        ]
```

---

## Action Preparation Service

```python
class RetentionActionPreparer:
    """
    Prepares actions for detected triggers.
    Does NOT execute - only prepares payloads.
    """
    
    def __init__(self, db_session, redis_client, rules_engine):
        self.db = db_session
        self.redis = redis_client
        self.rules = rules_engine
    
    async def process_pending_triggers(self):
        """
        Process triggers from queue and prepare actions.
        Run as worker process.
        """
        while True:
            trigger_id = await self.redis.brpop('retention:pending_triggers', timeout=5)
            if trigger_id:
                await self._prepare_actions(trigger_id[1].decode())
    
    async def _prepare_actions(self, trigger_id: str):
        """Prepare all actions for a trigger"""
        
        trigger = await self.db.query(RetentionTrigger).filter(
            RetentionTrigger.id == trigger_id
        ).first()
        
        if not trigger or trigger.status != 'pending':
            return
        
        # Get rule for this trigger type
        rule = await self.rules.get_active_rule(trigger.trigger_type)
        if not rule:
            return
        
        # Prepare each action
        for action_config in rule.actions:
            action = await self._prepare_single_action(
                trigger,
                action_config
            )
            if action:
                self.db.add(action)
        
        # Update trigger status
        trigger.status = 'eligible'
        trigger.updated_at = datetime.utcnow()
        
        await self.db.commit()
    
    async def _prepare_single_action(
        self,
        trigger: RetentionTrigger,
        config: dict
    ) -> Optional[RetentionAction]:
        """Prepare a single action based on config"""
        
        action_type = config['type']
        
        preparers = {
            'wallet_credit': self._prepare_wallet_credit,
            'coupon_generate': self._prepare_coupon,
            'push_notification': self._prepare_push_notification,
            'sms': self._prepare_sms,
            'email': self._prepare_email,
        }
        
        preparer = preparers.get(action_type)
        if not preparer:
            return None
        
        payload = await preparer(trigger, config)
        
        # Calculate schedule time
        delay_hours = config.get('delay_hours', 0)
        scheduled_for = datetime.utcnow() + timedelta(hours=delay_hours)
        
        return RetentionAction(
            trigger_id=trigger.id,
            user_id=trigger.user_id,
            action_type=action_type,
            payload=payload,
            scheduled_for=scheduled_for,
            status='prepared'
        )
    
    async def _prepare_wallet_credit(
        self,
        trigger: RetentionTrigger,
        config: dict
    ) -> dict:
        """Prepare wallet credit action"""
        
        # Calculate amount based on trigger context
        base_amount = config.get('amount', 50)
        
        # Adjust based on LTV for lapsed/winback
        if trigger.trigger_type in ['lapsed_customer', 'winback']:
            ltv = trigger.context.get('lifetime_value', 0)
            if ltv > 2000:
                base_amount = min(base_amount * 1.5, 100)
        
        return {
            'amount': base_amount,
            'expires_in_days': config.get('expires_in_days', 7),
            'type': 'credit_promo',
            'description': self._get_credit_description(trigger.trigger_type),
            'min_order_value': config.get('min_order_value', 0)
        }
    
    async def _prepare_coupon(
        self,
        trigger: RetentionTrigger,
        config: dict
    ) -> dict:
        """Prepare coupon generation"""
        
        # Generate unique code
        code_prefix = {
            'cart_abandonment': 'CART',
            'lapsed_customer': 'MISS',
            'winback': 'BACK',
        }.get(trigger.trigger_type, 'SAVE')
        
        unique_code = f"{code_prefix}{random.randint(1000, 9999)}"
        
        return {
            'code': unique_code,
            'discount_type': config.get('discount_type', 'percentage'),
            'discount_value': config.get('discount_value', 10),
            'min_order_value': config.get('min_order', 200),
            'max_discount': config.get('max_discount', 100),
            'valid_days': config.get('valid_days', 5),
            'single_use': True,
            'user_restricted': True  # Only for this user
        }
    
    async def _prepare_push_notification(
        self,
        trigger: RetentionTrigger,
        config: dict
    ) -> dict:
        """Prepare push notification payload"""
        
        template = config.get('template', 'generic')
        
        templates = {
            'cart_reminder': {
                'title': "Your cart is waiting! 🛒",
                'body': "Complete your order before items sell out",
                'deep_link': '/cart'
            },
            'we_miss_you': {
                'title': "We miss you! 💚",
                'body': "It's been a while. Here's ₹50 to welcome you back",
                'deep_link': '/home'
            },
            'reorder_reminder': {
                'title': "Time to reorder? 📦",
                'body': f"Your {trigger.context.get('product_name', 'favorite item')} might be running low",
                'deep_link': f"/product/{trigger.context.get('sku', '')}"
            }
        }
        
        base_payload = templates.get(template, templates['we_miss_you'])
        
        # Add personalization
        base_payload['user_id'] = str(trigger.user_id)
        base_payload['trigger_id'] = str(trigger.id)
        base_payload['tracking'] = {
            'campaign': trigger.trigger_type,
            'trigger_id': str(trigger.id)
        }
        
        return base_payload
    
    async def _prepare_sms(
        self,
        trigger: RetentionTrigger,
        config: dict
    ) -> dict:
        """Prepare SMS payload"""
        
        templates = {
            'cart_abandonment': "Your Dash24 cart is waiting! Complete your order now: {link}",
            'lapsed_customer': "We miss you at Dash24! Use code MISS50 for ₹50 off: {link}",
        }
        
        template = templates.get(
            trigger.trigger_type,
            "Shop now at Dash24: {link}"
        )
        
        return {
            'template': template,
            'variables': {
                'link': f"https://dash24.in/r/{trigger.id}"
            },
            'user_id': str(trigger.user_id)
        }
    
    def _get_credit_description(self, trigger_type: str) -> str:
        """Get wallet credit description based on trigger"""
        descriptions = {
            'cart_abandonment': "Complete your order bonus",
            'lapsed_customer': "We miss you! Welcome back credit",
            'winback': "Special comeback offer",
            'first_order_followup': "Thank you for your first order!",
        }
        return descriptions.get(trigger_type, "Special offer for you")
```

---

## Scheduler Configuration

```python
RETENTION_JOBS = [
    {
        'id': 'cart_abandonment_check',
        'func': 'retention.detector:run_cart_abandonment_check',
        'trigger': 'interval',
        'minutes': 15
    },
    {
        'id': 'lapsed_customer_detection',
        'func': 'retention.detector:run_lapsed_customer_detection',
        'trigger': 'cron',
        'hour': 6,
        'minute': 0,
        'timezone': 'Asia/Kolkata'
    },
    {
        'id': 'winback_detection',
        'func': 'retention.detector:run_winback_detection',
        'trigger': 'cron',
        'day_of_week': 'mon',
        'hour': 7,
        'minute': 0,
        'timezone': 'Asia/Kolkata'
    },
    {
        'id': 'expire_old_triggers',
        'func': 'retention.cleanup:expire_triggers',
        'trigger': 'cron',
        'hour': 3,
        'minute': 0
    }
]
```

---

## API Endpoints (Admin)

```http
GET /api/admin/retention/triggers
GET /api/admin/retention/triggers/{trigger_id}
GET /api/admin/retention/rules
POST /api/admin/retention/rules
PUT /api/admin/retention/rules/{rule_id}
GET /api/admin/retention/stats
```

---

## Conversion Tracking

```python
async def track_conversion(
    trigger_id: UUID,
    order_id: UUID
):
    """
    Called when a user with active trigger places an order.
    """
    trigger = await db.query(RetentionTrigger).filter(
        RetentionTrigger.id == trigger_id
    ).first()
    
    if trigger and trigger.status == 'eligible':
        trigger.status = 'converted'
        trigger.converted_at = datetime.utcnow()
        trigger.conversion_order_id = order_id
        
        # Mark associated actions as redeemed
        await db.execute("""
            UPDATE retention_actions
            SET status = 'redeemed',
                redeemed_at = NOW(),
                redeemed_order_id = :order_id
            WHERE trigger_id = :trigger_id
            AND status IN ('prepared', 'sent', 'delivered')
        """, {'trigger_id': trigger_id, 'order_id': order_id})
        
        await db.commit()
```
