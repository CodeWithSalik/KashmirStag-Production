import mongoose, { Document, Schema } from 'mongoose';
import { INVENTORY_TX_TYPES, InventoryTxType } from '@/config/constants';

export interface IInventoryTransaction extends Document {
  variantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: InventoryTxType;
  quantity: number;
  reference?: string;
  actorId?: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: INVENTORY_TX_TYPES, required: true },
    quantity: { type: Number, required: true },
    reference: { type: String },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ variantId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1 });

export default (mongoose.models.InventoryTransaction as mongoose.Model<IInventoryTransaction>) || mongoose.model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema);
