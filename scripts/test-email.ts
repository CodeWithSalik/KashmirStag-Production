import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import mongoose from 'mongoose';

async function runEmailTests() {
  console.log('====================================================');
  console.log('  KASHMIRSTAG NEXT.JS MAIL & IDEMPOTENCY QA SUITE');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const {
    sendEmail,
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    sendShippingNotification,
    sendDeliveryNotification,
    sendCancellationNotification,
    sendContactInquiry,
  } = await import('../src/lib/email');

  const {
    confirmPayment,
    updateOrderStatus,
    addTrackingInfo,
    cancelOrder,
  } = await import('../src/services/order.service');

  const Order = (await import('../src/models/Order')).default;
  const Payment = (await import('../src/models/Payment')).default;
  const Notification = (await import('../src/models/Notification')).default;
  const ProductVariant = (await import('../src/models/ProductVariant')).default;
  const Product = (await import('../src/models/Product')).default;

  await connectDB();
  console.log(' [DB] Connected to MongoDB Atlas\n');

  const testRecipient = 'pirzadasalik116@gmail.com';

  // 1. Live Email Provider Dispatch Test
  console.log('1. Testing Direct Next.js Mail Provider Dispatch:');
  const liveResult = await sendEmail({
    to: testRecipient,
    subject: '[KashmirStag QA] Next.js Mail System Operational Test',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #b45309;">KashmirStag Mail Verification</h2>
        <p>This is an automated delivery verification test for the Next.js Mail transactional email architecture.</p>
        <p><strong>Provider:</strong> Next.js Mail Direct TLS (Port 465 SSL)</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      </div>
    `,
  });

  console.log('  - Dispatch result:', liveResult);
  if (!liveResult.success) {
    throw new Error(`Live email dispatch failed: ${liveResult.error}`);
  }
  console.log('  [PASS] Live transactional email dispatched successfully via Next.js Mail provider.\n');

  // 2. Setup Test Order for State Machine & Idempotency Testing
  console.log('2. Setting up Test Order for State Machine & Idempotency QA:');
  const testOrderId = `KS-EMAIL-${Date.now()}`;
  const gatewayOrderId = `order_mail_${Date.now()}`;

  const testProduct = await Product.create({
    title: 'Test Pashmina Silk Shawl',
    slug: `test-pashmina-email-${Date.now()}`,
    description: 'Authentic Kashmiri handmade embroidery.',
    basePrice: 450000,
    status: 'active',
  });

  const testVariant = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-MAIL-${Date.now()}`,
    size: 'Free Size',
    color: 'Natural Ivory',
    price: 450000,
    availableQty: 10,
    reservedQty: 1,
    isActive: true,
  });

  const testOrder = await Order.create({
    orderId: testOrderId,
    email: testRecipient,
    items: [
      {
        productId: testProduct._id,
        variantId: testVariant._id,
        title: testProduct.title,
        variant: 'Natural Ivory / Free Size',
        sku: testVariant.sku,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
        unitPrice: 450000,
        quantity: 1,
        lineTotal: 450000,
      },
    ],

    shippingAddress: {
      name: 'Salik Pirzada (QA)',
      phone: '9876543210',
      line1: 'KashmirStag Creative Studio, Boulevard Road',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001',
      country: 'India',
    },
    billingAddress: {
      name: 'Salik Pirzada (QA)',
      phone: '9876543210',
      line1: 'KashmirStag Creative Studio, Boulevard Road',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001',
      country: 'India',
    },
    pricing: {
      subtotal: 450000,
      shippingFee: 0,
      taxAmount: 0,
      discountAmount: 50000,
      total: 400000,
    },
    status: 'pending',
    paymentStatus: 'unpaid',
    notificationsSent: [],
  });

  const testPayment = await Payment.create({
    orderId: testOrder._id,
    gateway: 'razorpay',
    gatewayOrderId,
    gatewayPaymentId: 'pay_test_mail_1',
    amount: 400000,
    currency: 'INR',
    status: 'created',
  });


  console.log(`  - Test order created: #${testOrderId} (Payment ID: ${testPayment._id})\n`);

  // 3. Testing Payment Confirmation & Order Confirmation Email
  console.log('3. Testing Payment Confirmation & Order Confirmation Email Trigger:');
  await confirmPayment(gatewayOrderId, 'pay_mail_verified_123');

  const confirmedOrder = await Order.findOne({ orderId: testOrderId });
  if (confirmedOrder?.status !== 'confirmed' || confirmedOrder?.paymentStatus !== 'paid') {
    throw new Error('Order status failed to advance to confirmed');
  }

  if (!confirmedOrder.notificationsSent?.includes('confirmed')) {
    throw new Error("Order notificationsSent does not include 'confirmed'");
  }
  console.log("  [PASS] Order confirmation email recorded in notificationsSent: ['confirmed']");

  // Verify duplicate confirmPayment does NOT re-notify
  console.log('  - Firing duplicate confirmPayment to verify idempotency...');
  await confirmPayment(gatewayOrderId, 'pay_mail_verified_123');
  const doubleConfirmedOrder = await Order.findOne({ orderId: testOrderId });
  const confirmedCount = doubleConfirmedOrder?.notificationsSent?.filter((n) => n === 'confirmed').length;
  if (confirmedCount !== 1) {
    throw new Error('Duplicate notification was recorded!');
  }
  console.log('  [PASS] Duplicate payment confirmation bypassed cleanly with zero duplicate send.\n');

  // 4. Testing State Transition to Processing
  console.log('4. Testing State Transition: confirmed -> processing:');
  await updateOrderStatus(testOrderId, 'processing', 'admin_1', 'Item sent to artisan workshop');
  const processingOrder = await Order.findOne({ orderId: testOrderId });
  if (!processingOrder?.notificationsSent?.includes('processing')) {
    throw new Error("Order notificationsSent missing 'processing'");
  }
  console.log("  [PASS] Processing notification recorded in notificationsSent: ['confirmed', 'processing']");

  // Duplicate processing transition
  await updateOrderStatus(testOrderId, 'processing', 'admin_1');
  const procCount = (await Order.findOne({ orderId: testOrderId }))?.notificationsSent?.filter((n) => n === 'processing').length;
  if (procCount !== 1) throw new Error('Duplicate processing notification recorded!');
  console.log('  [PASS] Duplicate processing transition bypassed cleanly.\n');

  // 5. Testing State Transition: processing -> shipped with Tracking
  console.log('5. Testing Shipping Notification with Tracking Info:');
  await addTrackingInfo(
    testOrderId,
    'BlueDart Express',
    'BD987654321IN',
    'https://www.bluedart.com/tracking/BD987654321IN',
    'admin_1'
  );
  const shippedOrder = await Order.findOne({ orderId: testOrderId });
  if (!shippedOrder?.notificationsSent?.includes('shipped')) {
    throw new Error("Order notificationsSent missing 'shipped'");
  }
  if (shippedOrder?.fulfillment?.trackingNumber !== 'BD987654321IN') {
    throw new Error('Tracking number was not saved');
  }
  console.log("  [PASS] Shipped notification with tracking info recorded in notificationsSent: ['confirmed', 'processing', 'shipped']");

  // Duplicate tracking
  await addTrackingInfo(testOrderId, 'BlueDart Express', 'BD987654321IN');
  const shipCount = (await Order.findOne({ orderId: testOrderId }))?.notificationsSent?.filter((n) => n === 'shipped').length;
  if (shipCount !== 1) throw new Error('Duplicate shipped notification recorded!');
  console.log('  [PASS] Duplicate shipping update bypassed cleanly.\n');

  // 6. Testing State Transition: shipped -> delivered
  console.log('6. Testing Delivery Notification:');
  await updateOrderStatus(testOrderId, 'delivered', 'admin_1', 'Delivered to recipient');
  const deliveredOrder = await Order.findOne({ orderId: testOrderId });
  if (!deliveredOrder?.notificationsSent?.includes('delivered')) {
    throw new Error("Order notificationsSent missing 'delivered'");
  }
  console.log("  [PASS] Delivery notification recorded in notificationsSent: ['confirmed', 'processing', 'shipped', 'delivered']\n");

  // 7. Testing Contact Form Notification
  console.log('7. Testing Contact Form Support Notification:');
  const contactResult = await sendContactInquiry({
    name: 'Salik QA Tester',
    email: testRecipient,
    subject: 'Bespoke Pashmina Customization Inquiry',
    message: 'Hello, do you accept bespoke shawl embroidery requests for wedding gifts?',
  });
  console.log('  - Contact inquiry dispatch result:', contactResult.success);
  if (!contactResult.success) throw new Error(`Contact dispatch failed: ${contactResult.error}`);
  console.log('  [PASS] Contact form inquiry dispatched to store support with customer reply-to.\n');

  // 8. Testing Provider Failure Isolation (Commerce Must Never Break)
  console.log('8. Testing Provider Failure Isolation (Zero-Commerce-Interruption Guarantee):');
  // Temporarily corrupt mail password to simulate provider offline
  const originalPass = process.env.MAIL_PASS;
  process.env.MAIL_PASS = 'invalid_corrupted_pass';

  const corruptTestOrder = await Order.create({
    orderId: `KS-FAIL-SAFE-${Date.now()}`,
    email: testRecipient,
    items: testOrder.items,
    shippingAddress: testOrder.shippingAddress,
    billingAddress: testOrder.billingAddress,
    pricing: testOrder.pricing,
    status: 'confirmed',
    paymentStatus: 'paid',
    notificationsSent: [],
  });

  try {
    // Attempt state transition with offline mail provider
    const updated = await updateOrderStatus(corruptTestOrder.orderId, 'processing', 'admin_1', 'Offline mail test');
    if (updated.status !== 'processing') {
      throw new Error('Order transition failed during provider downtime!');
    }
    console.log('  [PASS] Order successfully transitioned to processing despite mail provider downtime.');
    console.log('  [PASS] Commerce operations remain 100% resilient and unblocked.');
  } finally {
    process.env.MAIL_PASS = originalPass;
    await Order.deleteOne({ orderId: corruptTestOrder.orderId });
  }

  // 9. Cleaning up test artifacts
  console.log('\n9. Cleaning up test artifacts...');
  await Promise.all([
    Order.deleteOne({ orderId: testOrderId }),
    Payment.deleteOne({ _id: testPayment._id }),
    Product.deleteOne({ _id: testProduct._id }),
    ProductVariant.deleteOne({ _id: testVariant._id }),
    Notification.deleteMany({ 'data.orderId': testOrderId }),
  ]);
  console.log(' [Cleanup] Test artifacts cleaned up.\n');

  console.log('====================================================');
  console.log('  ALL NEXT.JS MAIL & IDEMPOTENCY CHECKS: 100% PASS');
  console.log('====================================================\n');
  process.exit(0);
}

runEmailTests().catch((err) => {
  console.error('[FATAL] Email QA Suite failed:', err);
  process.exit(1);
});
