import mongoose from 'mongoose';
import ProductVariant from '@/models/ProductVariant';
import InventoryTransaction from '@/models/InventoryTransaction';

export const inventoryService = {
  getVariantStock: async (variantId: string) => {
    const variant = await ProductVariant.findById(variantId).lean();
    if (!variant) return null;
    return {
      available: variant.availableQty,
      reserved: variant.reservedQty,
      total: variant.availableQty + variant.reservedQty,
      isLowStock: variant.availableQty <= variant.lowStockThreshold,
      isOutOfStock: variant.availableQty === 0
    };
  },
  adjustStock: async (variantId: string, quantity: number, type: string, actorId?: any, note?: string) => {
    const query: any = { _id: variantId };
    if (type !== 'DAMAGE' && quantity < 0) {
      query.availableQty = { $gte: Math.abs(quantity) };
    }
    const updated = await ProductVariant.findOneAndUpdate(
      query,
      { $inc: { availableQty: quantity } },
      { new: true }
    );
    if (!updated) {
      const exists = await ProductVariant.findById(variantId);
      if (!exists) throw new Error('Variant not found');
      throw new Error('Insufficient stock for reduction');
    }
    await InventoryTransaction.create({
      variantId,
      productId: updated.productId,
      type,
      quantity,
      actorId,
      note
    });

    if (actorId) {
      const { auditService } = await import('./audit.service');
      await auditService.log(actorId, 'ADJUST_INVENTORY', 'ProductVariant', variantId, {
        quantity,
        type,
        note,
        availableQty: updated.availableQty,
        reservedQty: updated.reservedQty,
        sku: updated.sku,
      });
    }

    return updated;
  },
  reserveStock: async (items: { variantId: string, quantity: number }[], orderId: string, session?: mongoose.ClientSession) => {
    for (const item of items) {
      const variant = await ProductVariant.findOneAndUpdate(
        { _id: item.variantId, availableQty: { $gte: item.quantity } },
        { $inc: { availableQty: -item.quantity, reservedQty: item.quantity } },
        { new: true, session }
      );
      if (!variant) throw new Error(`Insufficient stock for variant ${item.variantId}`);
      await InventoryTransaction.create([{
        variantId: item.variantId,
        productId: variant.productId,
        type: 'RESERVATION',
        quantity: item.quantity,
        reference: orderId,
        note: `Reserved for order ${orderId}`
      }], { session });
    }
    return true;
  },
  commitReservation: async (items: { variantId: string, quantity: number }[], orderId: string, session?: mongoose.ClientSession) => {
    for (const item of items) {
      const variant = await ProductVariant.findOneAndUpdate(
        { _id: item.variantId, reservedQty: { $gte: item.quantity } },
        { $inc: { reservedQty: -item.quantity } },
        { new: true, session }
      );
      if (!variant) throw new Error(`Invalid reservation for variant ${item.variantId}`);
      await InventoryTransaction.create([{
        variantId: item.variantId,
        productId: variant.productId,
        type: 'SALE',
        quantity: -item.quantity,
        reference: orderId,
        note: `Sale completed for order ${orderId}`
      }], { session });
    }
    return true;
  },
  releaseReservation: async (items: { variantId: string, quantity: number }[], orderId: string, session?: mongoose.ClientSession) => {
    for (const item of items) {
      const variant = await ProductVariant.findOneAndUpdate(
        { _id: item.variantId, reservedQty: { $gte: item.quantity } },
        { $inc: { availableQty: item.quantity, reservedQty: -item.quantity } },
        { new: true, session }
      );
      if (!variant) throw new Error(`Invalid reservation for variant ${item.variantId}`);
      await InventoryTransaction.create([{
        variantId: item.variantId,
        productId: variant.productId,
        type: 'RELEASE',
        quantity: item.quantity,
        reference: orderId,
        note: `Released reservation for order ${orderId}`
      }], { session });
    }
    return true;
  },
  getLowStockVariants: async (threshold?: number) => {
    const query = threshold !== undefined 
      ? { $expr: { $lte: ['$availableQty', threshold] } }
      : { $expr: { $lte: ['$availableQty', '$lowStockThreshold'] } };
    return await ProductVariant.find(query).populate('productId', 'title').lean();
  },
  getInventoryHistory: async (variantId: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const history = await InventoryTransaction.find({ variantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email')
      .lean();
    const total = await InventoryTransaction.countDocuments({ variantId });
    return { history, total, page, totalPages: Math.ceil(total / limit) };
  },
  getInventorySummary: async () => {
    const totalProducts = await mongoose.model('Product').countDocuments();
    const variants = await ProductVariant.find().lean();
    const totalVariants = variants.length;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const v of variants) {
      if (v.costPrice) totalStockValue += v.costPrice * v.availableQty;
      if (v.availableQty === 0) outOfStockCount++;
      else if (v.availableQty <= v.lowStockThreshold) lowStockCount++;
    }
    return { totalProducts, totalVariants, totalStockValue, lowStockCount, outOfStockCount };
  }
};
