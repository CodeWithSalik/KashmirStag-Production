import mongoose, { Document, Schema } from 'mongoose';
import { REVIEW_STATUSES, ReviewStatus } from '@/config/constants';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
  isVerified?: boolean;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    body: { type: String },
    images: { type: [String] },
    isVerified: { type: Boolean },
    status: { type: String, enum: REVIEW_STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export default (mongoose.models.Review as mongoose.Model<IReview>) || mongoose.model<IReview>('Review', reviewSchema);
