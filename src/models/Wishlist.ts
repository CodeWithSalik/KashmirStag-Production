import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default (mongoose.models.Wishlist as mongoose.Model<IWishlist>) || mongoose.model<IWishlist>('Wishlist', wishlistSchema);
