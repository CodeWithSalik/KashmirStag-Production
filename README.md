# KashmirStag

> A production-ready B2C e-commerce platform built for Kashmiri products, local artisans, and modern commerce.

[![Live Demo](https://img.shields.io/badge/Demo-kashmir--stag.vercel.app-0284c7?style=for-the-badge&logo=vercel)](https://kashmir-stag.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-CodeWithSalik-181717?style=for-the-badge&logo=github)](https://github.com/CodeWithSalik)
[![Developer](https://img.shields.io/badge/Developer-Salik%20Pirzada-059669?style=for-the-badge&logo=linkedin)](https://www.instagram.com/codewithsalik/)

---

## Overview

**KashmirStag** is an end-to-end, production-grade e-commerce application architected to showcase authentic artisanal heritage products — such as hand-spun Pashmina shawls, traditional Tilla needlework, organic apparel, and local crafts — direct to global consumers.

Engineered with **Next.js 15 (App Router)**, **React 19**, **MongoDB Atlas**, **Tailwind CSS**, and **TypeScript**, the platform is built from the ground up to solve real-world commerce challenges: strict inventory concurrency, atomic stock reservations, payment idempotency, protected catalog archiving, and a fully connected, zero-cosmetic admin operations hub.

---

## ✨ Features

### Customer Experience
* **Artisanal Storefront**: Fast, accessible, and SEO-optimized storefront with dynamic OpenGraph previews, Schema.org JSON-LD microdata, and responsive mobile-first UI.
* **Catalog Exploration & Filtering**: Multi-faceted filtering by Category, Collection, Price range, In-Stock status, and Tag filters with instant URL search parameters.
* **Product Detail & Gallery**: Interactive multi-angle image gallery, color swatches with hex previews, size selectors, real-time stock indicators, and customer reviews.
* **Fast Debounced Search**: Live search bar with instant query suggestions and keyboard navigation.
* **Shopping Cart & Wishlist**: Resilient local storage and authenticated cart sync with real-time stock validation and dynamic shipping calculation.
* **Customer Account Portal**: Profile management, order history with live timeline updates, fulfillment tracking, and saved address management with single-default guarantees.

### Commerce & Payments
* **Razorpay Gateway Integration**: Secure checkout supporting UPI, Credit/Debit cards, and Net Banking.
* **Payment Idempotency & Webhook Resilience**: Double-capture prevention via atomic transaction checks and webhook deduplication.
* **Timing-Safe Verification**: Cryptographic payment signature verification using Node.js `crypto.timingSafeEqual` with buffer length normalization to defend against timing attacks.
* **Order State Machine**: Strict, deterministic order status transitions (`pending` → `confirmed` → `processing` → `packed` → `shipped` → `out_for_delivery` → `delivered`) with invalid transitions automatically rejected.
* **Historical Order Snapshots**: Orders preserve complete immutable line item data (title, variant, SKU, price, quantity) so catalog edits never distort financial history.

### Inventory Concurrency & Stock
* **Single Source of Truth**: All stock derives from `ProductVariant` using the formula:
  $$\text{Available} = \text{On-Hand} - \text{Reserved}$$
* **Atomic Two-Phase Reservations**:
  1. **Reservation Phase**: Atomically decrements `availableQty` and increments `reservedQty` during checkout. Concurrent shoppers competing for the last unit are safely rejected with zero overselling.
  2. **Commit / Release Phase**: Decrements `reservedQty` on successful payment or safely restores `availableQty` if checkout expires or is abandoned.
* **Chronological Transaction Ledger**: Every change (Restock, Sale, Reservation, Release, Correction, Damage) logs an immutable `InventoryTransaction` for end-to-end SKU traceability.

### Admin Dashboard (Operations Hub)
* **Live Operational Metrics**: Real-time revenue, order volume, pending fulfillment count, active customers, and low-stock alerts derived directly from MongoDB Atlas.
* **Product & Variant Management**: Full catalog CRUD with multi-variant management (size, color, price, SKU), instant variant restock logging, and protected archive/restore workflows.
* **Category & Collection Sync**: Dynamic live product count aggregation, duplicate slug conflict guards, and deep-link cross-filtering (`Category → View Products`, `Collection → View Products`).
* **Inventory Dashboard**: Live search across SKU and title, low-stock threshold triggers, and interactive adjustment modal with reason codes.
* **Customer Lifetime Value**: Customer accounts aggregate real-time completed order counts and total spent with one-click deep navigation to customer orders.
* **Promotions & Coupons**: Percentage or flat discounts, minimum order thresholds, max discount caps, per-user usage limits, and active status toggles.
* **Review Moderation**: Admin approval and rejection workflow that automatically recalculates product average rating and review count.
* **Store Settings**: Live MongoDB-backed configuration for store identity, contact info, shipping rates, free shipping threshold, and maintenance mode.
* **Audit Logging**: Comprehensive audit trail capturing actor, entity, action, timestamp, and metadata for administrative accountability.

### Security & Hardening
* **Authentication**: Stateless JWT issuance stored in secure `HttpOnly`, `SameSite=Lax` cookies.
* **Edge Runtime Middleware**: RBAC route protection for `/admin/:path*` and `/account/:path*` running on Vercel's edge network.
* **Magic-Byte File Upload Validation**: File uploads inspect binary magic bytes to verify genuine JPEG/PNG/WebP format, preventing disguised script or polyglot executable uploads.
* **Rate Limiting**: Sliding-window in-memory rate limiting applied to authentication and contact endpoints to mitigate brute-force and spam attempts.
* **Input Sanitization**: Strict request validation using **Zod** schemas across every API handler.

---

## 🏗️ Architecture

```
                         +-----------------------------------+
                         |          Vercel Platform          |
                         |   (Edge Middleware & CDN Cache)   |
                         +-----------------+-----------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
         +----------v----------+                       +----------v----------+
         |  Next.js 15 (RSC)   |                       | Next.js API Routes  |
         |  Storefront Pages   |                       |  (App Router REST)  |
         +----------+----------+                       +----------+----------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                 +---------v---------+
                                 |   Service Layer   |
                                 |  (Domain Logic)   |
                                 +---------+---------+
                                           |
                                 +---------v---------+
                                 |  Mongoose Models  |
                                 | (Validation/Hooks)|
                                 +---------+---------+
                                           |
                                 +---------v---------+
                                 |   MongoDB Atlas   |
                                 | (Replica Cluster) |
                                 +-------------------+
```

---

## 🔄 Core Commerce Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Storefront as Next.js Storefront
    participant API as /api/checkout
    participant Inv as Inventory Service
    participant Razorpay as Razorpay Gateway
    participant OrderDB as MongoDB Atlas

    Customer->>Storefront: Select Product & Variant
    Storefront->>API: Initiate Checkout
    API->>Inv: Atomic Stock Reservation ($inc availableQty -N, reservedQty +N)
    alt Insufficient Stock
        Inv-->>API: Reject: Out of Stock
        API-->>Storefront: Error: Item Unavailable
    else Stock Reserved
        Inv-->>API: Reservation Confirmed
        API->>Razorpay: Create Razorpay Order
        Razorpay-->>API: razorpay_order_id
        API-->>Storefront: Render Payment Modal
        Customer->>Razorpay: Authorize Payment
        Razorpay-->>Storefront: Signature & Payment ID
        Storefront->>API: POST /api/checkout/verify
        API->>API: timingSafeEqual(Signature, Expected)
        API->>Inv: Commit Stock Reservation ($inc reservedQty -N, log SALE)
        API->>OrderDB: Create Immutable Order Document
        API-->>Storefront: Order Confirmation (ID: KS-XXXXXX)
    end
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **UI Library** | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 8](https://mongoosejs.com/) |
| **Payments** | [Razorpay SDK](https://razorpay.com/) with cryptographic signature verification |
| **Authentication** | [Jose](https://github.com/panva/jose) (Edge JWT), [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) |
| **Validation** | [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/) |
| **Transactional Email** | [Next.js Mail / Nodemailer](https://nodemailer.com/) with direct TLS |
| **Analytics & Monitoring**| [Vercel Analytics](https://vercel.com/analytics) & [Speed Insights](https://vercel.com/speed-insights) |

---

## 📊 Performance & Quality

* **TypeScript Strictness**: 100% type-checked (`tsc --noEmit` exits with 0 errors).
* **Production Build Optimization**: All 67 static and dynamic App Router routes compile and trace cleanly with static optimization where appropriate.
* **Dynamic Image Optimization**: External images from verified merchant CDNs (e.g. `shahkaar.in`) and uploaded product assets served via Next.js `next/image` with automated WebP/AVIF compression.
* **Database Indexes**: Compound indexes on high-frequency query paths:
  * `Product`: `{ status: 1, isVisible: 1, createdAt: -1 }`, text index on `{ title: 'text', description: 'text', tags: 'text' }`
  * `ProductVariant`: `{ productId: 1, isActive: 1 }`, unique on `{ sku: 1 }`
  * `InventoryTransaction`: `{ variantId: 1, createdAt: -1 }`
  * `Order`: `{ userId: 1, createdAt: -1 }`, unique on `{ orderId: 1 }`

---

## 🧪 Testing

KashmirStag includes a rigorous suite of automated integration and regression tests covering all mission-critical subsystems:

| Test Suite | File | What It Validates |
|---|---|---|
| **28-Step Admin E2E** | `scripts/test-admin-e2e-workflow.ts` | Complete lifecycle: Category/Collection creation → Product assignment → Variant & SKU → Stock adjustment → Storefront sync → Archiving → Restoring → Order placement → Reservation → Commit → Audit trail |
| **Catalog & Inventory Bugfixes** | `scripts/test-admin-catalog-bugfixes.ts` | Category auto-slugging, 409 conflict guards, image uploads, opening stock RESTOCK transactions |
| **Product Image Management** | `scripts/test-product-images.ts` | Magic-byte MIME validation, multi-image ordering, persistence across reloads, primary thumbnail selection |
| **Catalog Deletion Safety** | `scripts/test-catalog-deletion.ts` | Protected soft-archiving when referenced in historical orders; hard-deletion when unreferenced |
| **Archive & Restore** | `scripts/test-product-archive-restore.ts` | Storefront exclusion on archive, restoration of variants without duplicate records, historical order integrity |
| **Customer Addresses** | `scripts/test-addresses.ts` | Address CRUD, default address auto-promotion, user ownership isolation, Indian PIN/phone validation |
| **Concurrency & Overselling** | `scripts/test-concurrency.ts` | Simultaneous reservation requests competing for single unit; zero overselling guarantee |
| **Order State Machine** | `scripts/test-order-transitions.ts` | Strict transition rules, payment idempotency, webhook deduplication |
| **Security Hardening** | `scripts/test-security.ts` | Sliding-window rate limiter, timing-safe payment signatures, path traversal defense |

Run any test suite using `tsx`:
```bash
npx tsx scripts/test-admin-e2e-workflow.ts
npx tsx scripts/test-concurrency.ts
npx tsx scripts/test-security.ts
```

---

## 📁 Project Structure

```text
d:/Production/KashmirStag-Production/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Login, Signup, Forgot/Reset Password
│   │   ├── (storefront)/             # Home, Shop, Category, Collection, Product, Cart, Checkout
│   │   ├── (account)/                # Customer Dashboard, Orders, Addresses, Profile, Reviews
│   │   ├── admin/                    # Admin Hub (Products, Inventory, Orders, Settings, etc.)
│   │   └── api/                      # REST Endpoints (Auth, Products, Checkout, Inventory, Admin)
│   ├── components/                   # Reusable React UI Components
│   │   ├── admin/                    # Admin StatsCard, DataTable, ImageManager
│   │   ├── layout/                   # Navbar, Footer, MobileNav, AdminSidebar
│   │   ├── product/                  # ProductCard, Gallery, VariantSelector, Reviews
│   │   └── ui/                       # Button, Input, Modal, Badge, Dropdown, Table
│   ├── config/                       # Application, SEO, and Navigation Constants
│   ├── hooks/                        # Custom React Hooks (useCart, useToast)
│   ├── lib/                          # Database connection, Auth JWT, Money helpers, Upload
│   ├── models/                       # Mongoose Models (Product, Order, Variant, User, etc.)
│   ├── providers/                    # React Context Providers (Auth, Cart, Toast)
│   ├── services/                     # Business Logic Layer (Order, Product, Inventory, Coupon)
│   └── types/                        # TypeScript Interfaces & Types
├── public/                           # Static assets, branding, and local uploads
├── scripts/                          # Automated QA & E2E workflow test scripts
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.18.0 or newer (v20+ recommended)
* **npm** or **pnpm**
* **MongoDB**: MongoDB Atlas cluster or local MongoDB instance (v6.0+)
* **Razorpay Account**: Test or live API credentials

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CodeWithSalik/KashmirStag.git
   cd KashmirStag
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values (see [Environment Variables](#-environment-variables) below).

4. **Seed sample catalog (optional)**:
   ```bash
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Verify build & types**:
   ```bash
   npm run type-check
   npm run build
   ```

---

## 🔐 Environment Variables

| Variable | Description | Required | Example |
|---|---|:---:|---|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/kashmirstag` |
| `JWT_SECRET` | Secret used for signing authentication JWTs | Yes | `your_super_secret_jwt_key_here` |
| `ADMIN_EMAILS` | Comma-separated admin emails (auto-promoted on login) | Yes | `admin@kashmirstag.com` |
| `NEXT_PUBLIC_APP_URL` | Canonical URL of the application | Yes | `https://kashmir-stag.vercel.app` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key ID for client-side modal | Yes | `rzp_test_XXXXXXXXXXXX` |
| `RAZORPAY_KEY_ID` | Server Razorpay key ID | Yes | `rzp_test_XXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Server Razorpay secret for signature verification | Yes | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret for asynchronous verification | Optional | `your_webhook_secret` |
| `MAIL_USER` | SMTP email address for transactional mail | Optional | `support@kashmirstag.com` |
| `MAIL_PASS` | SMTP app password | Optional | `app_specific_password` |
| `MAIL_FROM` | Sender display string for emails | Optional | `KashmirStag <support@kashmirstag.com>` |

---

## 🗺️ Roadmap

- [x] Next.js 15 App Router migration & Server Component optimization
- [x] Atomic two-phase inventory reservations & overselling defense
- [x] Razorpay payment verification & idempotent order state machine
- [x] Complete admin dashboard with live database truth & cross-navigation
- [x] Automated 28-step end-to-end admin workflow validation
- [ ] Shiprocket / Delhivery automated logistics API integration
- [ ] Multi-currency international checkout (USD, EUR, GBP via Razorpay International)
- [ ] Automated customer SMS / WhatsApp notifications for tracking updates
- [ ] Customer loyalty rewards & referral program

---

## 👨💻 Built By

**Salik Pirzada**  
*Full-Stack Engineer & Founder of CodeWithSalik*

* **GitHub**: [@CodeWithSalik](https://github.com/CodeWithSalik)
* **Instagram**: [@codewithsalik](https://www.instagram.com/codewithsalik/)
* **Platform**: [KashmirStag](https://kashmir-stag.vercel.app)

---

<p align="center">
  Crafted with pride in Srinagar, Kashmir 🏔️
</p>
