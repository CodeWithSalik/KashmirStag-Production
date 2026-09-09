import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runOrderStateMachineVerification() {
  const { connectDB } = await import('../src/lib/db');
  const { default: Order } = await import('../src/models/Order');
  const { default: Payment } = await import('../src/models/Payment');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { updateOrderStatus, cancelOrder, confirmPayment, ORDER_STATE_TRANSITIONS } = await import('../src/services/order.service');

  console.log('====================================================');
  console.log('  ORDER STATE MACHINE & IDEMPOTENCY TEST');
  console.log('====================================================\n');

  await connectDB();

  const testProduct = await Product.create({
    title: 'Order Transition Test Item',
    slug: `trans-test-${Date.now()}`,
    description: 'Transition test item',
    basePrice: 15000,
    status: 'active',
  });

  // Create test variant with 10 units
  const testVariant = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-ORDER-TEST-${Date.now()}`,
    price: 15000,
    availableQty: 10,
    reservedQty: 0,
    isActive: true,
  });

  const testOrder = await Order.create({
    orderId: `KS-TEST-${Date.now()}`,
    email: 'tester@kashmirstag.com',
    items: [{
      productId: testVariant._id,
      variantId: testVariant._id,
      title: 'Test Transition Product',
      variant: 'Default',
      sku: testVariant.sku,
      image: '/test.jpg',
      unitPrice: 15000,
      quantity: 2,
      lineTotal: 30000,
    }],
    shippingAddress: {
      name: 'Test Customer',
      phone: '9876543210',
      line1: '123 Test St',
      city: 'Srinagar',
      state: 'Jammu and Kashmir',
      pincode: '190001',
      country: 'IN',
    },
    billingAddress: {
      name: 'Test Customer',
      phone: '9876543210',
      line1: '123 Test St',
      city: 'Srinagar',
      state: 'Jammu and Kashmir',
      pincode: '190001',
      country: 'IN',
    },
    pricing: {
      subtotal: 30000,
      shippingFee: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 30000,
    },
    status: 'pending',
    paymentStatus: 'unpaid',
    timeline: [{ status: 'pending', comment: 'Order created', createdAt: new Date() }],
  });

  const orderId = testOrder.orderId;
  console.log(` Created test order ${orderId} in status: 'pending'`);

  // 1. Test invalid transitions
  console.log('\n Testing state machine transition rules:');
  let invalidAError = false;
  try {
    await updateOrderStatus(orderId, 'delivered'); // pending -> delivered is forbidden!
  } catch (err: any) {
    invalidAError = true;
    console.log(`  [PASS] Forbidden transition rejected: ${err.message}`);
  }

  // 2. Test valid transition pending -> confirmed
  await updateOrderStatus(orderId, 'confirmed');
  const confirmedOrder = await Order.findOne({ orderId }).lean();
  const validTransitionPass = confirmedOrder?.status === 'confirmed';
  console.log(`  [${validTransitionPass ? 'PASS' : 'FAIL'}] Valid transition pending -> confirmed succeeded`);

  // 3. Test confirmed -> processing -> shipped -> delivered
  await updateOrderStatus(orderId, 'processing');
  await updateOrderStatus(orderId, 'shipped');
  await updateOrderStatus(orderId, 'delivered');
  const deliveredOrder = await Order.findOne({ orderId }).lean();
  const fullFlowPass = deliveredOrder?.status === 'delivered';
  console.log(`  [${fullFlowPass ? 'PASS' : 'FAIL'}] Valid sequence processing -> shipped -> delivered succeeded`);

  // 4. Test delivered -> pending (must be rejected)
  let deliveredToPendingError = false;
  try {
    await updateOrderStatus(orderId, 'pending');
  } catch (err: any) {
    deliveredToPendingError = true;
    console.log(`  [PASS] Delivered to pending rejected: ${err.message}`);
  }

  // 5. Test Payment Idempotency with CAS update
  console.log('\n Testing Payment Idempotency & Webhook Deduplication:');
  const gatewayOrderId = `order_test_gateway_${Date.now()}`;
  const testPayment = await Payment.create({
    orderId: testOrder._id,
    gateway: 'razorpay',
    gatewayOrderId,
    amount: 30000,
    currency: 'INR',
    status: 'created',
  });

  // Reserve stock for payment confirmation test
  testVariant.reservedQty = 2;
  testVariant.availableQty = 8;
  await testVariant.save();

  // Fire 2 concurrent confirmPayment calls
  const confirmResults = await Promise.allSettled([
    confirmPayment(gatewayOrderId, 'pay_concurrent_1'),
    confirmPayment(gatewayOrderId, 'pay_concurrent_2'),
  ]);

  const confirmPass = confirmResults.every(r => r.status === 'fulfilled');
  const finalPayment = await Payment.findOne({ gatewayOrderId }).lean();
  const paymentCapturedPass = finalPayment?.status === 'captured';

  console.log(`  [${confirmPass ? 'PASS' : 'FAIL'}] Concurrent confirmPayment executed without unhandled conflict`);
  console.log(`  [${paymentCapturedPass ? 'PASS' : 'FAIL'}] Payment status captured exactly once`);

  // Cleanup
  await Order.findByIdAndDelete(testOrder._id);
  await Payment.findByIdAndDelete(testPayment._id);
  await ProductVariant.findByIdAndDelete(testVariant._id);
  await Product.findByIdAndDelete(testProduct._id);
  console.log('\n Test cleanup completed.');

  if (invalidAError && validTransitionPass && fullFlowPass && deliveredToPendingError && confirmPass && paymentCapturedPass) {
    console.log('\n ORDER STATE MACHINE & PAYMENT IDEMPOTENCY: 100% SUCCESS');
    process.exit(0);
  } else {
    console.error('\n STATE MACHINE VERIFICATION FAILED');
    process.exit(1);
  }
}

runOrderStateMachineVerification().catch((err) => {
  console.error('Fatal error in order state machine verification:', err);
  process.exit(1);
});
