import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getPaymentProvider } from '@/services/payment.service';
import { confirmPayment, cancelOrder } from '@/services/order.service';
import Payment from '@/models/Payment';
import Order from '@/models/Order';

export async function POST(request: Request) {
  try {
    await connectDB();
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const provider = getPaymentProvider();
    const event = provider.verifyWebhook(bodyText, signature);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const eventId = event.id || 'unknown';
    const eventType = event.event;
    
    // Webhook event payload data based on razorpay structure
    const paymentData = event.payload.payment?.entity;
    const orderData = event.payload.order?.entity;

    const gatewayOrderId = orderData?.id || paymentData?.order_id;
    if (!gatewayOrderId) {
      return NextResponse.json({ success: true }); // Acknowledge to prevent retries
    }

    const payment = await Payment.findOne({ gatewayOrderId });
    if (!payment) {
      return NextResponse.json({ success: true }); // Payment record not found
    }

    // Idempotency check
    const alreadyProcessed = payment.webhookEvents.some(e => e.eventId === eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ success: true });
    }

    // Store the event
    payment.webhookEvents.push({
      eventId,
      eventType,
      payload: event.payload,
      processedAt: new Date()
    });
    await payment.save();

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      await confirmPayment(gatewayOrderId, paymentData.id);
    } else if (eventType === 'payment.failed') {
      payment.status = 'failed';
      await payment.save();
      const order = await Order.findById(payment.orderId);
      if (order && order.status === 'pending') {
         await cancelOrder(order.orderId, 'Payment failed via webhook', 'system');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    // Important: Always return 200 OK so Razorpay doesn't keep retrying the webhook endlessly
    return NextResponse.json({ success: true });
  }
}
