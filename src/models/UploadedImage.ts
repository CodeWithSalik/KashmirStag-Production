import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadedImage extends Document {
  pathname: string;
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const uploadedImageSchema = new Schema<IUploadedImage>(
  {
    pathname: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.UploadedImage as mongoose.Model<IUploadedImage>) ||
  mongoose.model<IUploadedImage>('UploadedImage', uploadedImageSchema);
