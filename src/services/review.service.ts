import { connectDB } from "@/lib/db";
import Review from '@/models/Review';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export const ReviewService = {
  async moderateReview(reviewId: string, status: 'approved' | 'rejected') {
    await connectDB();
    const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
    if (review && status === 'approved') {
      await this.calculateProductRating(review.productId.toString());
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
