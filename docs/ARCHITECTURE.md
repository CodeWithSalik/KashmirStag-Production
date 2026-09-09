# KashmirStag Architecture Overview

## 1. System Vision & Core Principles
KashmirStag is a production-ready B2C e-commerce platform built on Next.js 15 (App Router), React 19, TypeScript, and MongoDB. The architecture is modular, type-safe, domain-driven, and designed for high performance, security, and conversion.

### Core Tenets:
1. **Server-Authoritative**: Prices, discounts, stock reservations, order calculation, and permissions are strictly computed and verified on the server. The client is never trusted for financial or stock state.
2. **Money Precision**: All monetary values are handled as integer paise (1 INR = 100 paise) throughout database, business logic, and payments. Floating-point arithmetic is strictly forbidden.
3. **Atomic Stock Management**: Dual-inventory model (`availableQty` and `reservedQty`) with atomic MongoDB transaction operations to guarantee zero overselling.
4. **Resilient Payments**: Decoupled payment gateway abstraction (`PaymentProvider`) with HMAC-SHA256 signature verification and idempotent webhook processing.
5. **Edge-Compatible Security**: Authentication using HTTP-only secure JWT cookies verified at the network edge (`jose` middleware) before requests hit server components.

---

## 2. High-Level System Architecture

```
[ Customer Browser / Mobile ] <---> [ Cloudflare / CDN ]
                                          |
                                          v
                                 [ Next.js Edge Middleware ]
                                   - JWT Auth Guard (/admin, /account)
                                   - Security Headers
                                          |
                                          v
                            [ Next.js 15 App Router Core ]
                    +---------------------+---------------------+
                    |                     |                     |
             (Storefront)             (Account)              Admin
             - Server Components      - Orders              - Dashboard
             - Client Interactivity   - Profile             - Catalog/Stock
             - SEO & Schema.org       - Addresses           - Orders/Coupons
                    |                     |                     |
                    +---------------------+---------------------+
                                          |
                               [ Domain Services Layer ]
              (Auth, Product, Inventory, Cart, Checkout, Order, Payment)
                                          |
                                 [ Data Access Layer ]
                              Mongoose 8 ODM (18 Models)
                                          |
                                          v
                          [ MongoDB Atlas Cluster ]
                               (WiredTiger Engine)
```

---

## 3. Domain Modules Breakdown

The backend and business logic is structured into distinct, self-contained domains in `src/services/`:

| Domain | Service | Responsibilities |
|---|---|---|
| **Auth** | `auth.service.ts` | Registration, login, password hashing, JWT signing, password resets, legacy migration |
| **Catalog** | `product.service.ts` | Product CRUD, pagination, filtering, search, related products, variant aggregation |
| **Categories** | `category.service.ts` | Category tree, product recount, hierarchy management |
| **Inventory** | `inventory.service.ts` | Dual-pool reservation, atomic commit on payment, atomic release on timeout, audit trail |
| **Cart** | `cart.service.ts` | Server-side price recalculation, guest session tracking, merge on login, coupon application |
| **Checkout** | `checkout.service.ts` | Multi-step validation, order generation, tax/shipping computation, Razorpay order creation |
| **Payments** | `payment.service.ts` | Gateway abstraction, Razorpay SDK, signature verification, webhook processing, refunds |
| **Orders** | `order.service.ts` | State machine transitions, fulfillment tracking, customer order history, admin management |
| **Coupons** | `coupon.service.ts` | Coupon validation (caps, expiry, per-user limits, category limits), discount deduction |
| **Reviews** | `review.service.ts` | Verified buyer checks, star rating recalculations, admin moderation |
| **Audit** | `audit.service.ts` | IP & user-agent tracking for administrative events |

---

## 4. State Machines & Critical Workflows

### Order Lifecycle State Machine:
```
[PENDING] ---------> [CANCELLED]
   |
   v (Payment Captured)
[CONFIRMED]
   |
   v (Fulfillment Start)
[PROCESSING]
   |
   v
[PACKED]
   |
   v
[SHIPPED] (with tracking number & carrier)
   |
   v
[OUT_FOR_DELIVERY]
   |
   v
[DELIVERED]
   |
   +---> [RETURN_REQUESTED] ---> [RETURNED] ---> [REFUNDED]
```

### Dual-Pool Inventory Reservation Flow:
1. **Checkout Initiation**: System atomically decrements `availableQty` and increments `reservedQty` within a MongoDB transaction. An `InventoryTransaction` record of type `RESERVATION` is generated.
2. **Payment Success**: Webhook or verify route captures payment, decrements `reservedQty`, and creates an `InventoryTransaction` of type `SALE`.
3. **Payment Failure / Timeout**: `reservedQty` is decremented and returned to `availableQty` with a `RELEASE` transaction.
