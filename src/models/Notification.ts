import mongoose, { Document, Schema } from 'mongoose';
import { NOTIFICATION_CHANNELS, NotificationChannel } from '@/config/constants';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  recipientEmail?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  channel: NotificationChannel;
  idempotencyKey?: string;
  isRead: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    recipientEmail: { type: String },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    idempotencyKey: { type: String },
    isRead: { type: Boolean, default: false },


    sentAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });


export default (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>('Notification', notificationSchema);
