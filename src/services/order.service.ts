import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { inventoryService } from './inventory.service';
import { sendOrderConfirmation } from '@/lib/email';
import { AppError, NotFoundError } from '@/lib/errors';

import mongoose from 'mongoose';

export async function getOrderById(orderId: string, userId?: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');
  if (userId && order.userId?.toString() !== userId) throw new AppError('Unauthorized access to order', 403);
  return order;
}

export async function getOrdersByUser(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Order.countDocuments({ userId });
  return { orders, total };
}

export async function getOrdersByEmail(email: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const orders = await Order.find({ email }).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Order.countDocuments({ email });
  return { orders, total };
}

export async function getAllOrders(params: { page: number, limit: number, status?: string, paymentStatus?: string }) {
  const { page, limit, status, paymentStatus } = params;
  const skip = (page - 1) * limit;
  const query: any = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Order.countDocuments(query);
  return { orders, total };
}

export const ORDER_STATE_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};

export async function updateOrderStatus(orderId: string, newStatus: any, actorId?: string, comment?: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  if (order.status === newStatus) return order;

  if (newStatus === 'cancelled') {
    return cancelOrder(order.orderId, comment || 'Cancelled by admin', actorId);
  }

  const allowedTransitions = ORDER_STATE_TRANSITIONS[order.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new AppError(`Cannot transition order status from '${order.status}' to '${newStatus}'`, 400);
  }

  order.status = newStatus;
  order.timeline.push({ status: newStatus, comment, actorId: actorId ? (actorId as any) : undefined, createdAt: new Date() });
  await order.save();
  return order;
}

export async function addTrackingInfo(orderId: string, carrier: string, trackingNumber: string, trackingUrl?: string, actorId?: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  order.fulfillment = { carrier, trackingNumber, trackingUrl, shippedAt: new Date() };
  order.timeline.push({ status: 'shipped', comment: 'Tracking info added', actorId: actorId as any, createdAt: new Date() });
  order.status = 'shipped';
  await order.save();
  return order;
}

export async function cancelOrder(orderId: string, reason: string, actorId?: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  if (order.status === 'cancelled') {
    return order; // Already cancelled
  }

  if (order.status !== 'pending' && order.status !== 'confirmed' && order.status !== 'processing') {
    throw new AppError(`Order cannot be cancelled in '${order.status}' status`, 400);
  }

  const items = order.items.map(item => ({ variantId: item.variantId.toString(), quantity: item.quantity }));
  
  if (order.paymentStatus === 'paid' || order.status === 'confirmed' || order.status === 'processing') {
    // Inventory was already committed (sale finalized). Restock available stock.
    for (const item of items) {
      await inventoryService.adjustStock(
        item.variantId,
        item.quantity,
        'RESTOCK',
        actorId,
        `Restocked from cancelled order ${order.orderId}`
      );
    }
  } else {
    // Inventory was only reserved. Release reservation back to available stock.
    await inventoryService.releaseReservation(items, order.orderId);
  }

  order.status = 'cancelled';
  order.cancellation = { reason, requestedAt: new Date() };
  order.timeline.push({ status: 'cancelled', comment: reason, actorId: actorId as any, createdAt: new Date() });
  await order.save();
  return order;
}

export async function confirmPayment(gatewayOrderId: string, paymentId: string) {
  // Atomic CAS update to eliminate race conditions between client verify and Razorpay webhooks
  const payment = await Payment.findOneAndUpdate(
    { gatewayOrderId, status: { $ne: 'captured' } },
    { $set: { status: 'captured', gatewayPaymentId: paymentId, paidAt: new Date() } },
    { new: true }
  );

  if (!payment) {
    const existing = await Payment.findOne({ gatewayOrderId });
    if (existing && existing.status === 'captured') {
      return; // Already processed idempotently
    }
    throw new NotFoundError('Payment');
  }

  const order = await Order.findById(payment.orderId);
  if (!order) throw new NotFoundError('Order');

  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.timeline.push({ status: 'confirmed', comment: 'Payment confirmed', createdAt: new Date() });
    await order.save();

    const itemsToCommit = order.items.map(item => ({ variantId: item.variantId.toString(), quantity: item.quantity }));
    await inventoryService.commitReservation(itemsToCommit, order.orderId);

    await sendOrderConfirmation(order.email, { orderId: order.orderId, items: order.items, total: order.pricing.total }).catch(console.error);
  }
}

export async function cleanupExpiredReservations(expiryMinutes = 30) {
  const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);
  const expiredOrders = await Order.find({
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: { $lt: cutoff }
  });

  const cancelled = [];
  for (const order of expiredOrders) {
    try {
      await cancelOrder(order.orderId, 'Order reservation expired after 30 minutes', 'system');
      cancelled.push(order.orderId);
    } catch (err) {
      console.error(`Failed to cancel expired order ${order.orderId}:`, err);
    }
  }
  return cancelled;
}
