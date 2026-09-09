import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

couponUsageSchema.index({ couponId: 1, userId: 1 });

export default (mongoose.models.CouponUsage as mongoose.Model<ICouponUsage>) || mongoose.model<ICouponUsage>('CouponUsage', couponUsageSchema);
