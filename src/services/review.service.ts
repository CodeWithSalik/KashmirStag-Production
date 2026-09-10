import { connectDB } from "@/lib/db";
import Review from '@/models/Review';
import Product from '@/models/Product';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

export const ReviewService = {
  async moderateReview(reviewId: string, status: 'approved' | 'rejected', actorId?: string) {
    await connectDB();
    const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
    if (review) {
      await this.calculateProductRating(review.productId.toString());
      if (actorId) {
        await AuditLog.create({
          actorId,
          action: 'MODERATE_REVIEW',
          entity: 'review',
          entityId: reviewId,
          changes: { status, productId: review.productId },
        }).catch(() => {});
      }
    }
    return review;
  },

  async calculateProductRating(productId: string) {
    const objId = new mongoose.Types.ObjectId(productId);
    const stats = await Review.aggregate([
      { $match: { productId: objId, status: 'approved' } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        avgRating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount
      });
    } else {
      await Product.findByIdAndUpdate(productId, { avgRating: 0, reviewCount: 0 });
    }
  }
};
