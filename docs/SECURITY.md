# KashmirStag Security Architecture & Hardening Guide

## 1. Overview
Security is treated as a foundational requirement throughout the KashmirStag e-commerce platform. The application is built to defend against OWASP Top 10 vulnerabilities, unauthorized access, and financial manipulation.

---

## 2. Core Security Defenses

### 1. Authentication & Session Security
- **HTTP-Only, Secure Cookies**: The JWT session token (`auth-token`) is stored in an `HttpOnly`, `SameSite=Lax`, and `Secure` (production) cookie. It cannot be accessed by client-side JavaScript, neutralizing Cross-Site Scripting (XSS) token theft.
- **Edge Token Verification**: Incoming requests to protected areas (`/admin/*` and `/account/*`) are intercepted by Next.js edge middleware (`src/middleware.ts`) using the `jose` library before hitting any application render code.
- **Bcrypt Password Hashing**: Passwords are salted and hashed using `bcryptjs` with 12 computational rounds.
- **Brute-Force Lockout**: User models track `failedLoginAttempts`. After 5 consecutive failures, the account is temporarily locked for 15 minutes.

### 2. Authorization & Role-Based Access Control (RBAC)
- **Multi-Tier Roles**: Roles include `customer`, `manager`, and `admin`.
- **Server-Side Enforcement**: Role authorization is enforced at both the Edge middleware level and inside each API handler via `requireAdmin(request)`. Front-end UI gating is strictly cosmetic.

### 3. Financial & Business Logic Integrity
- **Paise Precision**: All price calculations and discounts occur on the server in integer paise. Client-provided prices are completely discarded during checkout.
- **Atomic Stock Reservation**: MongoDB transactions prevent race conditions and overselling during simultaneous checkout attempts.
- **Cryptographic Signature Verification**:
  - Razorpay checkout responses are verified using HMAC-SHA256 (`crypto.timingSafeEqual`) against `RAZORPAY_KEY_SECRET`.
  - Razorpay webhooks are validated using the `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET`.
- **Idempotent Webhooks**: All processed webhook event IDs are saved in `Payment.webhookEvents`. Duplicate deliveries from network retries are safely ignored.

### 4. Injection & Input Sanitization
- **NoSQL Injection Defense**: All user inputs are validated against strict Zod schemas before being passed into database queries. Unsanitized objects are rejected at the API boundary.
- **Parameter Validation**: MongoDB ObjectIds are checked with `mongoose.Types.ObjectId.isValid()`.

### 5. File Upload Safeguards (`src/lib/upload.ts`)
- Allowed MIME types are restricted to `image/jpeg`, `image/png`, and `image/webp`.
- Maximum file size is strictly capped at 4MB.
- Uploaded filenames are randomized using `nanoid()` to eliminate directory traversal attacks (`../../`).

### 6. Audit Logging (`src/services/audit.service.ts`)
- Administrative changes (catalog updates, manual stock adjustments, order cancellations, coupon creations) record the `actorId`, `action`, `entity`, `changes`, timestamp, and client IP.

---

## 3. Production Security Headers Checklist
In `next.config.ts`, the following HTTP security headers should be enforced:
- `X-Frame-Options: DENY` (Clickjacking defense)
- `X-Content-Type-Options: nosniff` (MIME-sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
