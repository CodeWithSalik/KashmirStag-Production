import Order from '@/models/Order';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import { inventoryService } from './inventory.service';
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendShippingNotification,
  sendDeliveryNotification,
  sendCancellationNotification,
} from '@/lib/email';
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

export async function getAllOrders(params: {
  page: number;
  limit: number;
  status?: string;
  paymentStatus?: string;
  customer?: string;
  search?: string;
}) {
  const { page, limit, status, paymentStatus, customer, search } = params;
  const skip = (page - 1) * limit;
  const query: any = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (customer) {
    if (mongoose.Types.ObjectId.isValid(customer)) {
      query.$or = [{ userId: new mongoose.Types.ObjectId(customer) }, { email: customer }];
    } else {
      query.email = { $regex: customer, $options: 'i' };
    }
  }

  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'shippingAddress.name': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
    ];
  }

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

/**
 * Atomically marks an event as notified on the Order and dispatches the email.
 * Prevents race conditions and duplicate emails between webhooks and client redirects.
 */
async function recordAndSendOrderNotification(order: any, eventType: string, sendFn: () => Promise<any>) {
  try {
    const updated = await Order.findOneAndUpdate(
      { orderId: order.orderId, notificationsSent: { $ne: eventType } },
      { $addToSet: { notificationsSent: eventType } },
      { new: true }
    );

    if (!updated) {
      console.log(`[Order:Notification] Bypassing duplicate email for ${order.orderId}:${eventType}`);
      return;
    }

    // Trigger email non-blocking / isolated
    sendFn().catch((err) => {
      console.error(`[Order:Notification] Failed to send email for ${order.orderId}:${eventType}:`, err?.message || err);
    });

    // Record in Notification audit collection
    try {
      await Notification.create({
        userId: updated.userId || undefined,
        recipientEmail: updated.email,
        type: `ORDER_${eventType.toUpperCase()}`,
        title: `Order #${order.orderId} ${eventType}`,
        message: `Transactional email for ${eventType} dispatched to ${updated.email}`,
        data: { orderId: order.orderId, eventType, total: updated.pricing?.total },
        channel: 'email',
        idempotencyKey: `${order.orderId}:${eventType}`,
        sentAt: new Date(),
      });
    } catch {
      // ignore duplicate log error
    }
  } catch (err: any) {
    console.error(`[Order:Notification] Error recording notification for ${order.orderId}:${eventType}:`, err?.message || err);
  }
}

function toObjectId(id?: string): mongoose.Types.ObjectId | undefined {
  if (id && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return undefined;
}

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

  const oldStatus = order.status;
  order.status = newStatus;
  order.timeline.push({ status: newStatus, comment, actorId: toObjectId(actorId), createdAt: new Date() });
  await order.save();

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'UPDATE_ORDER_STATUS', 'Order', order._id || order.orderId, {
      from: oldStatus,
      to: newStatus,
      comment,
      orderId: order.orderId,
    });
  }

  // Transactional Email Triggers
  if (newStatus === 'processing') {
    await recordAndSendOrderNotification(order, 'processing', () =>
      sendOrderStatusUpdate(order.email, order, 'processing', comment)
    );
  } else if (newStatus === 'shipped') {
    await recordAndSendOrderNotification(order, 'shipped', () =>
      sendShippingNotification(order.email, order, {
        carrier: order.fulfillment?.carrier,
        trackingNumber: order.fulfillment?.trackingNumber,
        trackingUrl: order.fulfillment?.trackingUrl,
      })
    );
  } else if (newStatus === 'delivered') {
    await recordAndSendOrderNotification(order, 'delivered', () =>
      sendDeliveryNotification(order.email, order)
    );
  }

  return order;
}

export async function addTrackingInfo(orderId: string, carrier: string, trackingNumber: string, trackingUrl?: string, actorId?: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  order.fulfillment = { carrier, trackingNumber, trackingUrl, shippedAt: new Date() };
  order.timeline.push({ status: 'shipped', comment: 'Tracking info added', actorId: toObjectId(actorId), createdAt: new Date() });
  order.status = 'shipped';

  await order.save();

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'ADD_TRACKING', 'Order', order._id || order.orderId, {
      carrier,
      trackingNumber,
      orderId: order.orderId,
    });
  }

  await recordAndSendOrderNotification(order, 'shipped', () =>
    sendShippingNotification(order.email, order, { carrier, trackingNumber, trackingUrl })
  );

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
  order.timeline.push({ status: 'cancelled', comment: reason, actorId: toObjectId(actorId), createdAt: new Date() });
  await order.save();

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'CANCEL_ORDER', 'Order', order._id || order.orderId, {
      reason,
      orderId: order.orderId,
    });
  }


  await recordAndSendOrderNotification(order, 'cancelled', () =>
    sendCancellationNotification(order.email, order, reason, order.cancellation?.refundAmount)
  );

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

    // Atomically dispatch order confirmation email
    await recordAndSendOrderNotification(order, 'confirmed', () =>
      sendOrderConfirmation(order.email, {
        orderId: order.orderId,
        items: order.items,
        pricing: order.pricing,
        total: order.pricing?.total,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      })
    );
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
