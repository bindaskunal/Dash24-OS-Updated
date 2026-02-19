# Dash24 V1 - Founder Scope (Bangalore Pilot)

## Scope Lock Date: January 2026

---

## 🔒 FROZEN FEATURES (Do Not Implement in V1)

### Intelligence Layer - Deferred
| Feature | Status | Document Reference |
|---------|--------|-------------------|
| Cohort retention (D30/D60/D90) | ❄️ FROZEN | 10-BRAND-ANALYTICS.md |
| Weekly/monthly materialized views | ❄️ FROZEN | 10-BRAND-ANALYTICS.md |
| Zone heatmap ranking | ❄️ FROZEN | 11-BRAND-DASHBOARD-API.md |
| Payment health analytics | ❄️ FROZEN | 11-BRAND-DASHBOARD-API.md |
| Export engine | ❄️ FROZEN | 11-BRAND-DASHBOARD-API.md |
| Winback detection | ❄️ FROZEN | 12-RETENTION-ENGINE.md |
| Reorder pattern engine | ❄️ FROZEN | 12-RETENTION-ENGINE.md |
| LTV-based wallet scaling | ❄️ FROZEN | 12-RETENTION-ENGINE.md |
| Embedding pipeline | ❄️ FROZEN | 13-LLM-READINESS.md |
| Semantic search | ❄️ FROZEN | 13-LLM-READINESS.md |
| Conversation system | ❄️ FROZEN | 13-LLM-READINESS.md |

### Infrastructure - Deferred
| Feature | Status |
|---------|--------|
| Horizontal scaling triggers | ❄️ FROZEN |
| Read replicas | ❄️ FROZEN |
| Redis clustering | ❄️ FROZEN |
| Advanced monitoring (Datadog/NewRelic) | ❄️ FROZEN |
| Table partitioning | ❄️ FROZEN |

---

## ✅ V1 IMPLEMENTATION SCOPE

### Priority 1: Order Lifecycle
- [x] Order state machine (pending → confirmed → processing → delivered)
- [x] 2PM same-day cutoff logic
- [x] Cancellation rules (before driver assignment only)
- [x] COD + Razorpay prepaid support
- [x] Order → EasyEcom push
- [x] EasyEcom webhook status updates

### Priority 2: Inventory Sync
- [x] Webhook-based stock updates
- [x] Low-stock threshold alerts
- [x] Hourly reconciliation job
- [x] Redis cart reservation

### Priority 3: 3PL Integration
- [x] Dispatch-ready triggers
- [x] Waybill creation
- [x] Status webhook processing
- [x] Delivery confirmation
- [ ] ~~GPS tracking~~ NOT IN SCOPE
- [ ] ~~SLA analytics~~ NOT IN SCOPE

### Priority 4: Basic Brand Dashboard
**Included:**
- Overview (revenue, orders, AOV, same-day %, COD/Prepaid split)
- SKU Performance (top 10, units sold, stock, low stock flag)
- Realtime (orders today, revenue today, cutoff countdown)

**Excluded:**
- ~~Cohorts~~
- ~~Heatmaps~~
- ~~Export~~

### Priority 5: Minimal Retention
**Included:**
- Cart abandonment (2-hour rule)
- First order thank-you push
- 7-day lapsed reminder

**Excluded:**
- ~~Wallet incentives~~
- ~~Coupon generation~~
- ~~Winback~~
- ~~Complex suppression~~

---

## 🏗️ INFRASTRUCTURE (Bangalore Pilot)

```
┌─────────────────────────────────────────┐
│         BANGALORE PILOT INFRA           │
├─────────────────────────────────────────┤
│                                         │
│   1x API Service (FastAPI)              │
│   1x Background Worker                  │
│   1x PostgreSQL                         │
│   1x Redis                              │
│   Basic logging (stdout)                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1-2: Core Order Flow
- [ ] Database schema setup (Alembic migrations)
- [ ] Order model + state machine
- [ ] Order creation API
- [ ] Payment integration (Razorpay + COD)
- [ ] 2PM cutoff logic
- [ ] Cancellation logic

### Week 3: Inventory + EasyEcom
- [ ] EasyEcom adapter (sandbox)
- [ ] Order push to EasyEcom
- [ ] Webhook handlers
- [ ] Stock sync (webhook + reconciliation)
- [ ] Cart reservation system

### Week 4: 3PL + Fulfillment
- [ ] Dispatch triggers
- [ ] Waybill integration
- [ ] Status webhooks
- [ ] Delivery confirmation flow

### Week 5: Brand Dashboard
- [ ] Aggregation queries
- [ ] Overview API
- [ ] SKU performance API
- [ ] Realtime API
- [ ] Redis caching

### Week 6: Retention + Polish
- [ ] Event tracking (basic)
- [ ] Cart abandonment trigger
- [ ] First order followup
- [ ] 7-day lapsed trigger
- [ ] End-to-end testing

---

## ✓ MILESTONE CHECKPOINTS

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| W2 | Order Flow | Place order → payment → confirmed |
| W3 | EasyEcom Live | Order synced to EasyEcom sandbox |
| W4 | Fulfillment | End-to-end delivery status flow |
| W5 | Dashboard | Brand can see revenue/orders |
| W6 | Retention | Abandonment triggers firing |

---

## 🔑 REQUIRED CREDENTIALS

| Service | Status | Action Required |
|---------|--------|-----------------|
| EasyEcom Sandbox | ⏳ PENDING | Provide API key, secret, warehouse ID |
| Razorpay Test | ✅ AVAILABLE | Test keys in environment |
| 3PL API | ⏳ PENDING | Confirm provider + credentials |
| SMS Provider | ⏳ PENDING | MSG91 or Twilio credentials |

---

## 🎯 OPTIMIZATION PRIORITY

```
Operational Stability > Intelligence
Ship Fast > Feature Rich
Working > Perfect
```

---

*Scope locked by: Product Team*
*Implementation start: Week 1*
