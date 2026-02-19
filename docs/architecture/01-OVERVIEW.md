# Dash24 V1 - Backend Architecture Overview

## Executive Summary

Dash24 is a Bangalore-based same-day multi-brand marketplace enabling customers to order from 25+ brands (~500 SKUs) with same-day delivery. This document outlines the backend architecture for the V1 pilot.

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DASH24 ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐        │
│   │   Customer   │     │   Brand Portal   │     │   Admin Portal   │        │
│   │   (PWA Web)  │     │   (Web App)      │     │   (Web App)      │        │
│   └──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘        │
│          │                      │                        │                   │
│          └──────────────────────┼────────────────────────┘                   │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │    API Gateway Layer   │                                │
│                    │    (FastAPI + JWT)     │                                │
│                    └───────────┬────────────┘                                │
│                                │                                             │
│          ┌─────────────────────┼─────────────────────┐                       │
│          │                     │                     │                       │
│          ▼                     ▼                     ▼                       │
│   ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐                │
│   │   Auth      │    │   Commerce      │    │   Inventory  │                │
│   │   Service   │    │   Service       │    │   Service    │                │
│   └─────────────┘    └─────────────────┘    └──────────────┘                │
│          │                     │                     │                       │
│          └─────────────────────┼─────────────────────┘                       │
│                                │                                             │
│                    ┌───────────┴───────────┐                                 │
│                    │                       │                                 │
│                    ▼                       ▼                                 │
│           ┌───────────────┐       ┌───────────────┐                         │
│           │  PostgreSQL   │       │     Redis     │                         │
│           │  (Primary DB) │       │ (Cache+Queue) │                         │
│           └───────────────┘       └───────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Webhooks + API
                                     ▼
                    ┌────────────────────────────┐
                    │         EasyEcom           │
                    │  (OMS - Source of Truth)   │
                    │  • Inventory Management    │
                    │  • Order Fulfillment       │
                    │  • 3PL Coordination        │
                    └────────────────────────────┘
```

---

## Core Design Principles

### 1. Modular Adapter Pattern
- EasyEcom integration via abstracted OMS adapter interface
- Payment gateway abstraction (Razorpay now, extensible later)
- Notification service abstraction (SMS/Email providers)

### 2. Event-Driven Architecture (Lightweight)
- Redis-based job queues for async operations
- Webhook processing with retry logic
- No complex Kafka/event bus for V1

### 3. Source of Truth Separation
- **EasyEcom**: Inventory levels, fulfillment status
- **Dash24 PostgreSQL**: Orders, customers, wallets, cart state
- Reconciliation jobs maintain consistency

### 4. Transactional Integrity
- PostgreSQL for ACID compliance on financial operations
- Optimistic locking for inventory reservation
- Saga pattern for distributed operations (order → payment → OMS push)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| API | FastAPI (Python 3.11+) | REST API, async support |
| Database | PostgreSQL 15 | Primary relational store |
| Cache | Redis 7 | Caching, job queues, rate limiting |
| Queue | Redis (RQ/Celery) | Background jobs |
| Auth | JWT + OTP | Stateless auth |
| Payments | Razorpay | Prepaid transactions |
| OMS | EasyEcom | Inventory + Fulfillment |
| SMS | Configurable (MSG91/Twilio) | OTP + Notifications |

---

## Service Boundaries

### Authentication Service
- Email + OTP login
- JWT token management
- Role-based access (Customer/Brand/Admin)
- Session management

### Commerce Service
- Cart management (multi-brand)
- Order creation and lifecycle
- Checkout flow orchestration
- COD/Prepaid handling

### Inventory Service
- Product catalog (synced from EasyEcom)
- Real-time stock levels
- Reservation management
- Sync reconciliation

### Payment Service
- Razorpay integration
- Wallet (loyalty credits) management
- Refund processing
- COD reconciliation

### Fulfillment Service
- Order push to EasyEcom
- Status tracking
- Delivery slot management
- Same-day cutoff logic (2PM)

### Notification Service
- OTP delivery
- Order updates
- Promotional (future)

---

## Scalability Assumptions (Bangalore Pilot)

| Metric | V1 Target | Peak Load |
|--------|-----------|-----------|
| Daily Orders | 100-500 | 50/hour |
| Concurrent Users | 100 | 200 |
| SKUs | 500 | 1000 |
| Brands | 25 | 50 |
| Response Time (P95) | < 200ms | < 500ms |

### Infrastructure Sizing (Initial)
- 2x API servers (2 vCPU, 4GB RAM each)
- 1x PostgreSQL (4 vCPU, 8GB RAM, 100GB SSD)
- 1x Redis (2 vCPU, 4GB RAM)
- Horizontal scaling via container orchestration

---

## Document Index

1. **01-OVERVIEW.md** - This document
2. **02-DATABASE-SCHEMA.md** - Complete PostgreSQL schema
3. **03-ORDER-STATE-MACHINE.md** - Order lifecycle and transitions
4. **04-EASYECOM-INTEGRATION.md** - OMS adapter design
5. **05-INVENTORY-SYNC.md** - Sync strategy and reconciliation
6. **06-WEBHOOK-HANDLING.md** - Webhook processing and retries
7. **07-PAYMENT-FLOW.md** - Payment abstraction and COD logic
8. **08-API-CONTRACTS.md** - Core API endpoints
