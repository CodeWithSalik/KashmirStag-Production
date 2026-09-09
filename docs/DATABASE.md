# KashmirStag Database Architecture & Schema Reference

## 1. Overview
The KashmirStag database layer uses **MongoDB with Mongoose 8**. The schema is designed for relational consistency within document boundaries, complete audit trails, and strict money precision.

### Key Database Rules:
1. **Money in Paise**: All currency values (`basePrice`, `price`, `subtotal`, `total`, `discountAmount`, `shippingFee`) are stored as integers representing paise (₹499.00 = 49900).
2. **Immutable Orders**: Orders take complete frozen snapshots of product titles, variant options, prices, and shipping addresses at the moment of checkout. Changes to catalog data never alter past orders.
3. **Compound Indexes**: Optimized compound indexes for storefront search, category browsing, admin order filtering, and inventory lookups.

---

## 2. Entity Relationship Overview

```
User (1) <---> (N) Address
User (1) <---> (N) Order
User (1) <---> (1) Cart
User (1) <---> (1) Wishlist
User (1) <---> (N) Review

Category (1) <---> (N) Product
Product (1) <---> (N) ProductVariant
ProductVariant (1) <---> (N) InventoryTransaction

Order (1) <---> (1) Payment
Order (1) <---> (1) Shipment
Coupon (1) <---> (N) CouponUsage
```

---

## 3. Core Models & Schemas

### 1. `User` (`src/models/User.ts`)
- `name`: String
- `email`: String (Unique, Indexed)
- `passwordHash`: String (bcrypt, 12 rounds)
- `role`: Enum (`'customer' | 'admin' | 'manager'`)
- `status`: Enum (`'active' | 'inactive' | 'locked'`)
- `failedLoginAttempts`: Number (lockout after 5 failed attempts)
- `lockoutUntil`: Date

### 2. `Product` (`src/models/Product.ts`)
- `title`: String
- `slug`: String (Unique, Indexed)
- `description`: String
- `categoryId`: ObjectId -> `Category` (Indexed)
- `collectionIds`: [ObjectId -> `Collection`]
- `tags`: [String]
- `basePrice`: Number (paise, Indexed)
- `compareAtPrice`: Number (paise)
- `status`: Enum (`'active' | 'draft' | 'archived'`)
- `isVisible`: Boolean
- `avgRating`: Number (Default: 0)
- `reviewCount`: Number (Default: 0)
- `totalSold`: Number (Default: 0)
- **Indexes**: Text index on `{ title: 'text', description: 'text', tags: 'text' }`

### 3. `ProductVariant` (`src/models/ProductVariant.ts`)
- `productId`: ObjectId -> `Product` (Indexed)
- `sku`: String (Unique, Indexed)
- `size`: String
- `color`: String
- `colorHex`: String
- `price`: Number (paise, optional override of basePrice)
- `availableQty`: Number (Stock ready for sale)
- `reservedQty`: Number (Stock held during active checkouts)
- `lowStockThreshold`: Number (Default: 5)
- `isActive`: Boolean

### 4. `InventoryTransaction` (`src/models/InventoryTransaction.ts`)
- `variantId`: ObjectId -> `ProductVariant`
- `type`: Enum (`'PURCHASE' | 'RESTOCK' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'DAMAGE' | 'MANUAL_ADJUSTMENT'`)
- `quantity`: Number
- `previousAvailable`: Number
- `newAvailable`: Number
- `orderId`: ObjectId -> `Order` (Optional)
- `actorId`: ObjectId -> `User` (Optional)
- `note`: String

### 5. `Order` (`src/models/Order.ts`)
- `orderId`: String (Unique, Indexed, e.g. `KS-A7X9F2`)
- `userId`: ObjectId -> `User` (Optional for guest checkouts)
- `guestEmail`: String (Optional)
- `items`: Array of snapshot objects:
  - `productId`, `variantId`, `title`, `variant` (e.g. "Black / XL"), `sku`, `image`, `unitPrice` (paise), `quantity`, `lineTotal` (paise)
- `pricing`: `{ subtotal, discountAmount, shippingFee, taxAmount, total }` (all in paise)
- `shippingAddress`: `{ fullName, line1, line2, city, state, pincode, phone }`
- `status`: Enum (`ORDER_STATUSES`)
- `paymentStatus`: Enum (`'pending' | 'paid' | 'failed' | 'refunded'`)
- `fulfillment`: `{ carrier, trackingNumber, trackingUrl, shippedAt, deliveredAt }`
- `timeline`: `[{ status, comment, createdAt, actorId }]`

### 6. `Payment` (`src/models/Payment.ts`)
- `orderId`: ObjectId -> `Order` (Indexed)
- `gateway`: Enum (`'razorpay' | 'cash_on_delivery'`)
- `gatewayOrderId`: String (e.g. Razorpay Order ID)
- `gatewayPaymentId`: String (e.g. Razorpay Payment ID)
- `amount`: Number (paise)
- `currency`: String (`'INR'`)
- `status`: Enum (`'created' | 'authorized' | 'captured' | 'failed' | 'refunded'`)
- `signature`: String
- `webhookEvents`: [Object] (idempotency log)

### 7. `Coupon` & `CouponUsage` (`src/models/Coupon.ts`, `CouponUsage.ts`)
- `code`: String (Unique, Uppercase, Indexed)
- `discountType`: Enum (`'percentage' | 'fixed'`)
- `discountValue`: Number (percentage or paise)
- `minOrderAmount`: Number (paise)
- `maxDiscount`: Number (paise)
- `usageLimit`: Number
- `usedCount`: Number
- `perUserLimit`: Number
- `expiresAt`: Date
- `isActive`: Boolean

---

## 4. Database Migrations & Seeds
- Seeding: `scripts/seed.ts` loads demo categories, products, and variants.
- Legacy password migration: `scripts/migrate-legacy-passwords.ts` converts legacy AES passwords into bcrypt.
