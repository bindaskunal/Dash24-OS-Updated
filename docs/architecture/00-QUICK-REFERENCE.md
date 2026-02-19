# Dash24 V1 - Architecture Quick Reference

## Document Index

### Core Commerce Layer
| # | Document | Contents |
|---|----------|----------|
| 1 | [01-OVERVIEW.md](./01-OVERVIEW.md) | System context, tech stack, service boundaries |
| 2 | [02-DATABASE-SCHEMA.md](./02-DATABASE-SCHEMA.md) | Complete PostgreSQL schema with indexes |
| 3 | [03-ORDER-STATE-MACHINE.md](./03-ORDER-STATE-MACHINE.md) | Order lifecycle, transitions, timeouts |
| 4 | [04-EASYECOM-INTEGRATION.md](./04-EASYECOM-INTEGRATION.md) | OMS adapter pattern, EasyEcom implementation |
| 5 | [05-INVENTORY-SYNC.md](./05-INVENTORY-SYNC.md) | Event-driven sync + reconciliation |
| 6 | [06-WEBHOOK-HANDLING.md](./06-WEBHOOK-HANDLING.md) | Webhook processing, retry logic |
| 7 | [07-PAYMENT-FLOW.md](./07-PAYMENT-FLOW.md) | Razorpay, COD, wallet implementation |
| 8 | [08-API-CONTRACTS.md](./08-API-CONTRACTS.md) | REST API specifications |

### Intelligence Layer
| # | Document | Contents |
|---|----------|----------|
| 9 | [09-EVENT-SYSTEM.md](./09-EVENT-SYSTEM.md) | Centralized event tracking, async processing |
| 10 | [10-BRAND-ANALYTICS.md](./10-BRAND-ANALYTICS.md) | Aggregation tables, materialized views, cohorts |
| 11 | [11-BRAND-DASHBOARD-API.md](./11-BRAND-DASHBOARD-API.md) | Brand analytics API contracts |
| 12 | [12-RETENTION-ENGINE.md](./12-RETENTION-ENGINE.md) | Trigger detection, action preparation |
| 13 | [13-LLM-READINESS.md](./13-LLM-READINESS.md) | Semantic search, embeddings, AI readiness |

---

## Tech Stack Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      DASH24 V1 TECH STACK                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (Phase 2)      Backend                 Data Layer     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │ Next.js (PWA)   │    │ FastAPI         │    │ PostgreSQL  │ │
│  │ TypeScript      │    │ Python 3.11+    │    │ Redis       │ │
│  │ Tailwind CSS    │    │ Pydantic        │    │             │ │
│  │ React Query     │    │ SQLAlchemy      │    │             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
│  External Services                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │ EasyEcom (OMS)  │    │ Razorpay        │    │ SMS Provider│ │
│  │ Inventory       │    │ Payments        │    │ MSG91/Twilio│ │
│  │ Fulfillment     │    │ Refunds         │    │ OTP/Notif   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Database: PostgreSQL (not MongoDB)
- Strong transactional guarantees for orders and payments
- Relational integrity for multi-brand cart
- ACID compliance for inventory and wallet operations

### 2. OMS Integration: Modular Adapter Pattern
- Abstract `OMSAdapter` interface
- EasyEcom as V1 implementation
- Future-proof for additional OMS providers

### 3. Inventory Sync: Hybrid Approach
- **Primary**: Real-time webhooks from EasyEcom
- **Secondary**: Hourly reconciliation jobs
- Redis-based reservation system for carts

### 4. Payment: Abstracted Gateway
- `PaymentGateway` interface with Razorpay adapter
- COD with 3PL reconciliation tracking
- Wallet credits with expiry management

### 5. Auth: JWT + OTP
- Stateless JWT authentication
- Email/phone OTP for passwordless login
- Role-based access (Customer/Brand/Admin)

### 6. Queue: Redis-based
- Lightweight job queues (no Kafka)
- Exponential backoff for retries
- Dead letter queue for permanent failures

---

## Critical Flows

### Order Creation Flow
```
Customer Cart → Checkout → Payment Init → 
Payment Capture → Order Confirmed → 
Push to EasyEcom → Processing → Delivery
```

### Inventory Update Flow
```
EasyEcom Webhook → Verify Signature → 
Queue Event → Update PostgreSQL → 
Invalidate Redis Cache → Alert if discrepancy
```

### Same-Day Delivery Logic
```
Order Time < 2PM (IST) → Same-day slot (4PM-8PM)
Order Time >= 2PM (IST) → Next-day slot
```

---

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dash24
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# EasyEcom
EASYECOM_API_KEY=xxx
EASYECOM_API_SECRET=xxx
EASYECOM_WAREHOUSE_ID=xxx
EASYECOM_WEBHOOK_SECRET=xxx
EASYECOM_SANDBOX=true

# Razorpay
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# SMS (for OTP)
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=xxx
MSG91_SENDER_ID=DASH24

# Feature Flags
ENABLE_COD=true
ENABLE_WALLET=true
COD_MAX_AMOUNT=5000
```

---

## Scalability Assumptions (Bangalore Pilot)

| Metric | V1 Target | Infrastructure |
|--------|-----------|----------------|
| Daily Orders | 100-500 | 2x API servers |
| Concurrent Users | 100-200 | Load balanced |
| SKUs | 500 | PostgreSQL handles |
| Brands | 25 | No sharding needed |
| Response Time (P95) | <200ms | Redis caching |

### Scaling Triggers
- **Horizontal API scaling**: CPU > 70% or response time > 300ms
- **Database read replicas**: When read queries > 500/sec
- **Redis cluster**: When cache size > 2GB

---

## Deployment Architecture (Recommended)

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (AWS ALB/GCP)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ API Pod  │  │ API Pod  │  │ Worker   │
        │ (FastAPI)│  │ (FastAPI)│  │ (Jobs)   │
        └──────────┘  └──────────┘  └──────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │PostgreSQL│  │  Redis   │  │  Redis   │
        │ (Primary)│  │ (Cache)  │  │ (Queue)  │
        └──────────┘  └──────────┘  └──────────┘
```

---

## Security Checklist

- [ ] JWT secret rotation mechanism
- [ ] Webhook signature verification for all external services
- [ ] Rate limiting on auth and write endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configuration for frontend domains
- [ ] Sensitive data encryption at rest
- [ ] PCI compliance for payment handling (Razorpay handles most)
- [ ] API key rotation for EasyEcom/Razorpay

---

## Next Steps (Implementation Order)

### Phase 1: Core Backend
1. Set up PostgreSQL with schema migrations (Alembic)
2. Implement auth service (JWT + OTP)
3. Implement catalog service (products, brands, categories)
4. Implement cart service with Redis reservation

### Phase 2: Commerce Flow
5. Implement order service with state machine
6. Implement Razorpay payment integration
7. Implement COD flow
8. Implement wallet service

### Phase 3: Integrations
9. Implement EasyEcom adapter
10. Set up webhook handlers
11. Implement inventory sync + reconciliation
12. Set up background job workers

### Phase 4: Intelligence Layer
13. Event tracking system + async processing
14. Brand analytics aggregation jobs
15. Brand dashboard APIs
16. Retention trigger detection
17. LLM-ready schema extensions

### Phase 5: Frontend (Post-Architecture Approval)
18. Next.js PWA setup
19. Customer app UI
20. Brand portal with analytics
21. Admin dashboard

---

## Questions for Review

1. **EasyEcom API Access**: Do we have sandbox credentials ready?
2. **SMS Provider**: MSG91 or Twilio for OTP?
3. **Deployment Environment**: AWS, GCP, or self-hosted?
4. **Monitoring**: Preferred observability stack (Datadog, New Relic, Prometheus)?
5. **Error Tracking**: Sentry or alternative?

---

---

## Intelligence Layer Summary

### Event System
- Centralized tracking for all user interactions
- Async processing via Redis queues (high/normal/low priority)
- JSONB properties for flexible event data
- Optimized indexes for brand-level queries

### Analytics Aggregation
- Daily/weekly/monthly brand metrics
- SKU velocity tracking with trend analysis
- Cohort retention (D7, D30, D60, D90)
- Zone-wise demand heatmaps
- Payment split analysis (COD/Prepaid/Wallet)

### Retention Engine
- Trigger types: cart_abandonment, lapsed_customer, reorder_opportunity, winback
- Action types: wallet_credit, coupon_generate, push_notification
- Rule-based configuration with cooldown periods
- Prepared actions ready for external execution

### LLM Readiness
- Rich JSONB attributes on products/brands/users
- Embeddings placeholder for pgvector migration
- Search synonyms and query expansion
- Conversation history structure for future chatbot

---

*Document Version: 1.1*  
*Last Updated: January 2026*  
*Author: Dash24 Engineering*
