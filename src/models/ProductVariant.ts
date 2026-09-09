import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant extends Document {
  productId: mongoose.Types.ObjectId;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  material?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  availableQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true },
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    material: { type: String },
    price: { type: Number },
    compareAtPrice: { type: Number },
    costPrice: { type: Number },
    availableQty: { type: Number, min: 0, default: 0 },
    reservedQty: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ productId: 1, size: 1, color: 1 }, { unique: true });

export default (mongoose.models.ProductVariant as mongoose.Model<IProductVariant>) || mongoose.model<IProductVariant>('ProductVariant', productVariantSchema);
