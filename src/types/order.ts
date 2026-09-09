import { OrderStatus, PaymentStatus } from '@/config/constants';

export interface OrderSummary {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  itemCount: number;
  createdAt: Date | string;
}

export interface CheckoutCartItem {
  variantId: string;
  productId: string;
  quantity: number;
}

export interface CheckoutCart {
  items: CheckoutCartItem[];
  couponCode?: string;
}
