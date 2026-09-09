# KashmirStag API Reference

All API routes are implemented in Next.js 15 App Router format (`export async function GET/POST/PUT/DELETE(request: Request)`).
All request bodies and search parameters are validated with **Zod schemas**.
All responses follow a consistent envelope structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Human-readable error description"
}
```

---

## 1. Authentication APIs (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Register new customer. Sets HTTP-only `auth-token` cookie. |
| `POST` | `/api/auth/login` | No | Authenticate user with email + password. Returns user data & sets cookie. |
| `POST` | `/api/auth/logout` | Yes | Clears `auth-token` cookie. |
| `GET` | `/api/auth/me` | Yes | Retrieves current authenticated session user. |
| `POST` | `/api/auth/forgot-password` | No | Generates password reset token and sends email. |
| `POST` | `/api/auth/reset-password` | No | Validates token and updates password. |

---

## 2. Storefront APIs

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/products` | No | Paginated product list with search, category, sort filters. |
| `GET` | `/api/products/[id]` | No | Single product details with active variants. |
| `GET` | `/api/categories` | No | Active categories list. |
| `GET` | `/api/collections` | No | Active promotional collections list. |
| `GET` | `/api/search` | No | Full-text product search with auto-complete suggestions. |
| `GET` | `/api/products/[id]/reviews` | No | Approved customer reviews for a product. |
| `POST` | `/api/products/[id]/reviews` | Customer | Submit a review with verified purchase check. |

---

## 3. Cart & Checkout APIs

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Optional (Guest/User) | Get populated cart with server-recalculated prices. |
| `POST` | `/api/cart` | Optional | Add variant to cart. |
| `PUT` | `/api/cart` | Optional | Update quantity of cart item. |
| `DELETE` | `/api/cart` | Optional | Remove item or clear cart. |
| `POST` | `/api/cart/coupon` | Optional | Validate and apply promo code. |
| `DELETE` | `/api/cart/coupon` | Optional | Remove applied coupon. |
| `POST` | `/api/checkout` | Optional | Initiate checkout: reserves inventory, creates Order & Razorpay order. |
| `POST` | `/api/checkout/verify` | Yes | Verify Razorpay payment signature and capture order. |
| `POST` | `/api/webhooks/razorpay` | Signature | Idempotent gateway webhook handler for asynchronous payment events. |

---

## 4. Customer Account APIs

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/orders` | Customer | Paginated order history for current user. |
| `GET` | `/api/orders/[id]` | Customer | Single order details with tracking and timeline. |
| `GET` | `/api/addresses` | Customer | List saved customer addresses. |
| `POST` | `/api/addresses` | Customer | Add new saved shipping address. |
| `PUT` | `/api/addresses/[id]` | Customer | Update saved address. |
| `DELETE` | `/api/addresses/[id]` | Customer | Remove saved address. |
| `GET` | `/api/wishlist` | Customer | Get customer's saved wishlist products. |
| `POST` | `/api/wishlist` | Customer | Add product to wishlist. |
| `DELETE` | `/api/wishlist` | Customer | Remove product from wishlist. |

---

## 5. Admin Management APIs (`/api/admin`)
*All Admin endpoints require authenticated session with `role === 'admin'`.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/products` | Paginated product catalog with all statuses (active, draft, archived). |
| `POST` | `/api/admin/products` | Create new product. |
| `GET` | `/api/admin/products/[id]` | Full product details with all variants. |
| `PUT` | `/api/admin/products/[id]` | Update product details and SEO. |
| `DELETE` | `/api/admin/products/[id]` | Soft-delete / archive product. |
| `POST` | `/api/admin/products/[id]/variants` | Add new variant (size/color/price/stock). |
| `GET` | `/api/admin/inventory` | Inventory tracking across all variants with low-stock filters. |
| `POST` | `/api/admin/inventory/[id]/adjust`| Record manual stock adjustment with auditable reason. |
| `GET` | `/api/admin/orders` | Order management dashboard list with status filters. |
| `GET` | `/api/admin/orders/[id]` | Admin view of order detail and timeline. |
| `PUT` | `/api/admin/orders/[id]` | Update order status (with state machine validation). |
| `PATCH` | `/api/admin/orders/[id]` | Attach courier carrier and tracking number. |
| `GET` | `/api/admin/categories` | Manage catalog categories. |
| `POST` | `/api/admin/categories` | Create new category. |
| `GET` | `/api/admin/coupons` | Manage discount codes and usage limits. |
| `POST` | `/api/admin/coupons` | Create promotional coupon. |
| `GET` | `/api/admin/audit-log` | Audit log trail with actor, action, timestamp, and IP. |
| `POST` | `/api/upload` | Secure image uploader for products. |
