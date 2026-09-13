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
import { OrderStatus, isValidTransition, isCancellableStatus } from '@/config/constants';
import { startSession } from '@/lib/db';

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

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId?: string,
  comment?: string,
  expectedCurrentStatus?: OrderStatus
) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  // Idempotency: already at target status
  if (order.status === newStatus) return order;

  // Optimistic concurrency check if expectedCurrentStatus provided
  if (expectedCurrentStatus && order.status !== expectedCurrentStatus) {
    throw new AppError(
      `Order status conflict: expected '${expectedCurrentStatus}' but order is currently '${order.status}'. Please refresh.`,
      409
    );
  }

  // Routing cancellation through cancelOrder for proper inventory release/restock
  if (newStatus === 'cancelled') {
    return cancelOrder(order.orderId, comment || 'Cancelled by admin', actorId, expectedCurrentStatus);
  }

  // State machine transition validation
  if (!isValidTransition(order.status, newStatus, order.paymentStatus)) {
    throw new AppError(
      `Cannot transition order status from '${order.status}' to '${newStatus}'`,
      400
    );
  }

  // Specific prerequisite validations
  if (newStatus === 'refunded') {
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'partially_refunded') {
      throw new AppError(
        `Cannot mark order as refunded because payment status is '${order.paymentStatus}'`,
        400
      );
    }
  }

  const oldStatus = order.status;
  const updatePayload: any = {
    $set: {
      status: newStatus,
      ...(newStatus === 'refunded' ? { paymentStatus: 'refunded' } : {}),
      ...(newStatus === 'delivered' ? { 'fulfillment.deliveredAt': new Date() } : {}),
    },
    $push: {
      timeline: {
        status: newStatus,
        comment,
        actorId: toObjectId(actorId),
        createdAt: new Date(),
      },
    },
  };

  // Atomic conditional update to prevent concurrent race conditions
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: oldStatus },
    updatePayload,
    { new: true }
  );

  if (!updatedOrder) {
    const current = await Order.findById(order._id);
    if (current?.status === newStatus) return current; // Concurrent request already transitioned
    throw new AppError(
      `Concurrent status update detected. Order is no longer in '${oldStatus}' status.`,
      409
    );
  }

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'UPDATE_ORDER_STATUS', 'Order', updatedOrder._id?.toString() || updatedOrder.orderId, {
      from: oldStatus,
      to: newStatus,
      comment,
      orderId: updatedOrder.orderId,
    });
  }

  // Transactional Notifications
  if (newStatus === 'processing') {
    await recordAndSendOrderNotification(updatedOrder, 'processing', () =>
      sendOrderStatusUpdate(updatedOrder.email, updatedOrder, 'processing', comment)
    );
  } else if (newStatus === 'shipped') {
    await recordAndSendOrderNotification(updatedOrder, 'shipped', () =>
      sendShippingNotification(updatedOrder.email, updatedOrder, {
        carrier: updatedOrder.fulfillment?.carrier,
        trackingNumber: updatedOrder.fulfillment?.trackingNumber,
        trackingUrl: updatedOrder.fulfillment?.trackingUrl,
      })
    );
  } else if (newStatus === 'delivered') {
    await recordAndSendOrderNotification(updatedOrder, 'delivered', () =>
      sendDeliveryNotification(updatedOrder.email, updatedOrder)
    );
  } else if (newStatus === 'returned') {
    await recordAndSendOrderNotification(updatedOrder, 'returned', () =>
      sendOrderStatusUpdate(updatedOrder.email, updatedOrder, 'returned', comment || 'Order return completed')
    );
  } else if (newStatus === 'refunded') {
    await recordAndSendOrderNotification(updatedOrder, 'refunded', () =>
      sendOrderStatusUpdate(updatedOrder.email, updatedOrder, 'refunded', comment || 'Refund processed')
    );
  }

  return updatedOrder;
}

export async function addTrackingInfo(
  orderId: string,
  carrier: string,
  trackingNumber: string,
  trackingUrl?: string,
  actorId?: string
) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  // Can only add tracking info if order is packed, processing, or already shipped
  if (!['packed', 'processing', 'shipped'].includes(order.status)) {
    throw new AppError(
      `Cannot add tracking info or mark shipped when order is in '${order.status}' status`,
      400
    );
  }

  const oldStatus = order.status;
  const isAlreadyShipped = oldStatus === 'shipped';

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: oldStatus },
    {
      $set: {
        status: 'shipped',
        fulfillment: {
          carrier,
          trackingNumber,
          trackingUrl,
          shippedAt: order.fulfillment?.shippedAt || new Date(),
        },
      },
      $push: {
        timeline: {
          status: 'shipped',
          comment: isAlreadyShipped
            ? `Tracking updated: ${carrier} (${trackingNumber})`
            : `Fulfillment dispatched via ${carrier} (${trackingNumber})`,
          actorId: toObjectId(actorId),
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    throw new AppError(
      `Concurrent update detected. Order is no longer in '${oldStatus}' status.`,
      409
    );
  }

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'ADD_TRACKING', 'Order', updatedOrder._id?.toString() || updatedOrder.orderId, {
      carrier,
      trackingNumber,
      orderId: updatedOrder.orderId,
    });
  }

  await recordAndSendOrderNotification(updatedOrder, 'shipped', () =>
    sendShippingNotification(updatedOrder.email, updatedOrder, { carrier, trackingNumber, trackingUrl })
  );

  return updatedOrder;
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  actorId?: string,
  expectedCurrentStatus?: OrderStatus
) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
  const order = await Order.findOne({
    $or: [{ orderId }, ...(isObjectId ? [{ _id: orderId }] : [])],
  });
  if (!order) throw new NotFoundError('Order');

  if (order.status === 'cancelled') {
    return order; // Already cancelled idempotently
  }

  if (expectedCurrentStatus && order.status !== expectedCurrentStatus) {
    throw new AppError(
      `Order status conflict: expected '${expectedCurrentStatus}' but order is currently '${order.status}'. Please refresh.`,
      409
    );
  }

  if (!isCancellableStatus(order.status)) {
    throw new AppError(`Order cannot be cancelled in '${order.status}' status`, 400);
  }

  const oldStatus = order.status;
  const updatePayload: any = {
    $set: {
      status: 'cancelled',
      cancellation: { reason, requestedAt: new Date() },
    },
    $push: {
      timeline: {
        status: 'cancelled',
        comment: reason,
        actorId: toObjectId(actorId),
        createdAt: new Date(),
      },
    },
  };

  let updatedOrder: any = null;
  const session = await startSession();
  let usedSession = false;

  try {
    await session.withTransaction(async () => {
      usedSession = true;
      updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: oldStatus },
        updatePayload,
        { new: true, session }
      );

      if (!updatedOrder) {
        const current = await Order.findById(order._id).session(session);
        if (current?.status === 'cancelled') {
          updatedOrder = current;
          return;
        }
        throw new AppError(
          `Concurrent status update detected. Order is no longer in '${oldStatus}' status.`,
          409
        );
      }

      const items = updatedOrder.items.map((item: any) => ({
        variantId: item.variantId.toString(),
        quantity: item.quantity,
      }));

      if (oldStatus === 'pending') {
        try {
          await inventoryService.releaseReservation(items, updatedOrder.orderId, session);
        } catch (err: any) {
          console.warn(`[Order:Cancel] Reservation release for ${updatedOrder.orderId}:`, err?.message || err);
        }
      } else {
        for (const item of items) {
          await inventoryService.adjustStock(
            item.variantId,
            item.quantity,
            'RESTOCK',
            actorId,
            `Restocked from cancelled order ${updatedOrder.orderId}`,
            session
          );
        }
      }
    });
  } catch (err: any) {
    if (!usedSession && (err?.message?.includes('Transaction numbers are only allowed') || err?.message?.includes('replica set'))) {
      updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: oldStatus },
        updatePayload,
        { new: true }
      );

      if (!updatedOrder) {
        const current = await Order.findById(order._id);
        if (current?.status === 'cancelled') return current;
        throw new AppError(
          `Concurrent status update detected. Order is no longer in '${oldStatus}' status.`,
          409
        );
      }

      const items = updatedOrder.items.map((item: any) => ({
        variantId: item.variantId.toString(),
        quantity: item.quantity,
      }));

      if (oldStatus === 'pending') {
        try {
          await inventoryService.releaseReservation(items, updatedOrder.orderId);
        } catch (err: any) {
          console.warn(`[Order:Cancel] Reservation release for ${updatedOrder.orderId}:`, err?.message || err);
        }
      } else {
        for (const item of items) {
          await inventoryService.adjustStock(
            item.variantId,
            item.quantity,
            'RESTOCK',
            actorId,
            `Restocked from cancelled order ${updatedOrder.orderId}`
          );
        }
      }
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }

  if (actorId) {
    const { auditService } = await import('./audit.service');
    await auditService.log(actorId, 'CANCEL_ORDER', 'Order', updatedOrder._id?.toString() || updatedOrder.orderId, {
      reason,
      orderId: updatedOrder.orderId,
    });
  }

  await recordAndSendOrderNotification(updatedOrder, 'cancelled', () =>
    sendCancellationNotification(updatedOrder.email, updatedOrder, reason, updatedOrder.cancellation?.refundAmount)
  );

  return updatedOrder;
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
    let updatedOrder: any = null;
    const session = await startSession();
    let usedSession = false;

    try {
      await session.withTransaction(async () => {
        usedSession = true;
        updatedOrder = await Order.findOneAndUpdate(
          { _id: order._id, paymentStatus: { $ne: 'paid' } },
          {
            $set: { paymentStatus: 'paid', status: 'confirmed' },
            $push: {
              timeline: { status: 'confirmed', comment: 'Payment confirmed', createdAt: new Date() },
            },
          },
          { new: true, session }
        );

        if (!updatedOrder) {
          return; // Handled concurrently
        }

        const itemsToCommit = updatedOrder.items.map((item: any) => ({
          variantId: item.variantId.toString(),
          quantity: item.quantity,
        }));
        await inventoryService.commitReservation(itemsToCommit, updatedOrder.orderId, session);
      });
    } catch (err: any) {
      if (!usedSession && (err?.message?.includes('Transaction numbers are only allowed') || err?.message?.includes('replica set'))) {
        updatedOrder = await Order.findOneAndUpdate(
          { _id: order._id, paymentStatus: { $ne: 'paid' } },
          {
            $set: { paymentStatus: 'paid', status: 'confirmed' },
            $push: {
              timeline: { status: 'confirmed', comment: 'Payment confirmed', createdAt: new Date() },
            },
          },
          { new: true }
        );

        if (updatedOrder) {
          const itemsToCommit = updatedOrder.items.map((item: any) => ({
            variantId: item.variantId.toString(),
            quantity: item.quantity,
          }));
          await inventoryService.commitReservation(itemsToCommit, updatedOrder.orderId);
        }
      } else {
        throw err;
      }
    } finally {
      await session.endSession();
    }

    if (updatedOrder) {
      // Atomically dispatch order confirmation email
      await recordAndSendOrderNotification(updatedOrder, 'confirmed', () =>
        sendOrderConfirmation(updatedOrder.email, {
          orderId: updatedOrder.orderId,
          items: updatedOrder.items,
          pricing: updatedOrder.pricing,
          total: updatedOrder.pricing?.total,
          shippingAddress: updatedOrder.shippingAddress,
          createdAt: updatedOrder.createdAt,
        })
      );
    }
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
