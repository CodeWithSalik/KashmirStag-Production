// ─── Application Constants ────────────────────────────────────────

export const APP_NAME = 'KashmirStag';
export const APP_DESCRIPTION = 'Premium fashion and lifestyle — authentic quality from Kashmir to your doorstep.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Currency ────────────────────────────────────────────────────
export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
/** All monetary values are stored and calculated in paise (1/100 of a rupee). */
export const CURRENCY_SUBUNIT = 100;

// ─── Pagination ──────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Inventory ───────────────────────────────────────────────────
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const RESERVATION_TIMEOUT_MINUTES = 10;

// ─── Auth ────────────────────────────────────────────────────────
export const JWT_EXPIRY = '7d';
export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MINUTES = 30;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

// ─── Order ───────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Valid transitions: { from: [allowed next statuses] } */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
  cancelled: ['refunded'],
  return_requested: ['returned', 'delivered'],
  returned: ['refunded'],
  refunded: [],
};

export const PAYMENT_STATUSES = [
  'unpaid',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ─── Product ─────────────────────────────────────────────────────
export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// ─── Inventory Transactions ──────────────────────────────────────
export const INVENTORY_TX_TYPES = [
  'PURCHASE',
  'RESTOCK',
  'SALE',
  'RESERVATION',
  'RELEASE',
  'RETURN',
  'DAMAGE',
  'MANUAL_ADJUSTMENT',
] as const;

export type InventoryTxType = (typeof INVENTORY_TX_TYPES)[number];

// ─── User Roles ──────────────────────────────────────────────────
export const USER_ROLES = ['customer', 'admin', 'manager'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// ─── Coupon ──────────────────────────────────────────────────────
export const COUPON_TYPES = ['percentage', 'fixed'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

// ─── Review ──────────────────────────────────────────────────────
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// ─── Notification Channels ───────────────────────────────────────
export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ─── Payment Gateways ───────────────────────────────────────────
export const PAYMENT_GATEWAYS = ['razorpay', 'cod'] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];
