import mongoose, { Document, Schema } from 'mongoose';

export interface IShipment extends Document {
  orderId: mongoose.Types.ObjectId;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  events: {
    status: string;
    location?: string;
    description?: string;
    timestamp: Date;
  }[];
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    carrier: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
      required: true,
    },
    events: [
      {
        status: { type: String, required: true },
        location: { type: String },
        description: { type: String },
        timestamp: { type: Date, required: true },
      },
    ],
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export default (mongoose.models.Shipment as mongoose.Model<IShipment>) || mongoose.model<IShipment>('Shipment', shipmentSchema);
