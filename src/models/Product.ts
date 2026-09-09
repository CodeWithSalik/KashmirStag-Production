import mongoose, { Document, Schema } from 'mongoose';
import { PRODUCT_STATUSES, ProductStatus } from '@/config/constants';
import './Category';
import './Collection';

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  categoryId?: mongoose.Types.ObjectId;
  collectionIds: mongoose.Types.ObjectId[];
  tags: string[];
  basePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  status: ProductStatus;
  isVisible: boolean;
  weight?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  avgRating: number;
  reviewCount: number;
  totalSold: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    images: { type: [String], default: [] },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    tags: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    costPrice: { type: Number },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'draft' },
    isVisible: { type: Boolean, default: true },
    weight: { type: Number },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: { type: [String], default: [] },
    },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1, isVisible: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>('Product', productSchema);
