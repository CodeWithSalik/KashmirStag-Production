import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  seo?: {
    title?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    seo: {
      title: { type: String },
      description: { type: String },
    },
  },
  { timestamps: true }
);

export default (mongoose.models.Collection as mongoose.Model<ICollection>) || mongoose.model<ICollection>('Collection', collectionSchema);
