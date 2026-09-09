import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  variantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId | null;
  sessionId: string;
  items: ICartItem[];
  couponCode?: string;
  updatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, required: true },
    items: [cartItemSchema],
    couponCode: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models.Cart as mongoose.Model<ICart>) || mongoose.model<ICart>('Cart', cartSchema);
