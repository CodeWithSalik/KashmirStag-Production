import mongoose, { Document, Schema } from 'mongoose';
import { PAYMENT_GATEWAYS, PaymentGateway } from '@/config/constants';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  refunds: {
    refundId: string;
    amount: number;
    reason?: string;
    createdAt: Date;
  }[];
  webhookEvents: {
    eventId: string;
    eventType: string;
    payload: any;
    processedAt: Date;
  }[];
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, required: true },
    gatewayOrderId: { type: String, required: true },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      required: true,
    },
    refunds: [
      {
        refundId: { type: String, required: true },
        amount: { type: Number, required: true },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    webhookEvents: [
      {
        eventId: { type: String, required: true },
        eventType: { type: String, required: true },
        payload: { type: Schema.Types.Mixed },
        processedAt: { type: Date, default: Date.now },
      },
    ],
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ gatewayOrderId: 1 }, { unique: true });
paymentSchema.index({ status: 1 });

export default (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>('Payment', paymentSchema);
