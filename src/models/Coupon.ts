import mongoose, { Document, Schema } from 'mongoose';
import { COUPON_TYPES, CouponType } from '@/config/constants';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  applicableTo?: {
    categoryIds: mongoose.Types.ObjectId[];
    productIds: mongoose.Types.ObjectId[];
  };
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    applicableTo: {
      categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1, expiresAt: 1 });

export default (mongoose.models.Coupon as mongoose.Model<ICoupon>) || mongoose.model<ICoupon>('Coupon', couponSchema);
