import mongoose, { Document, Schema } from 'mongoose';
import { ORDER_STATUSES, PAYMENT_STATUSES, OrderStatus, PaymentStatus } from '@/config/constants';

export interface IOrder extends Document {
  orderId: string;
  userId?: mongoose.Types.ObjectId | null;
  email: string;
  items: {
    productId: mongoose.Types.ObjectId;
    variantId: mongoose.Types.ObjectId;
    title: string;
    variant: string;
    sku: string;
    image: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  billingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  pricing: {
    subtotal: number;
    shippingFee: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  };
  discount?: {
    couponCode: string;
    discountType: string;
    amount: number;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillment?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  };
  timeline: {
    status: OrderStatus;
    comment?: string;
    actorId?: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];
  cancellation?: {
    reason: string;
    requestedAt: Date;
    refundId?: string;
    refundAmount?: number;
  };
  notificationsSent?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}


const addressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        variantId: { type: Schema.Types.ObjectId, required: true },
        title: { type: String, required: true },
        variant: { type: String, required: true },
        sku: { type: String, required: true },
        image: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    pricing: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, required: true },
      taxAmount: { type: Number, required: true },
      discountAmount: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    discount: {
      couponCode: { type: String },
      discountType: { type: String },
      amount: { type: Number },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    fulfillment: {
      carrier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    timeline: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        comment: { type: String },
        actorId: { type: Schema.Types.ObjectId },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    cancellation: {
      reason: { type: String },
      requestedAt: { type: Date },
      refundId: { type: String },
      refundAmount: { type: Number },
    },
    notificationsSent: { type: [String], default: [] },
    notes: { type: String },
  },

  { timestamps: true }
);

orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export default (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>('Order', orderSchema);
