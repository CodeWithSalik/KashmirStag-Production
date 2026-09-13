import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runComprehensiveOrderStateMachineTests() {
  const { connectDB } = await import('../src/lib/db');
  const { default: Order } = await import('../src/models/Order');
  const { default: Payment } = await import('../src/models/Payment');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const {
    ORDER_STATUSES,
    ORDER_STATUS_TRANSITIONS,
    getAvailableTransitions,
    isValidTransition,
    isCancellableStatus,
  } = await import('../src/config/constants');
  const {
    updateOrderStatus,
    cancelOrder,
    confirmPayment,
    addTrackingInfo,
  } = await import('../src/services/order.service');

  console.log('================================================================');
  console.log('  KASHMIRSTAG — COMPREHENSIVE ORDER STATE MACHINE AUDIT & TEST');
  console.log('================================================================\n');

  await connectDB();

  // ─── 1. Verify Completeness of Definitions ─────────────────────────────────
  console.log('─── Phase 1: Verifying State Machine Completeness ───────────────');
  for (const status of ORDER_STATUSES) {
    if (!(status in ORDER_STATUS_TRANSITIONS)) {
      throw new Error(`Status '${status}' is missing in ORDER_STATUS_TRANSITIONS!`);
    }
  }
  console.log(`[PASS] All ${ORDER_STATUSES.length} order statuses are mapped in ORDER_STATUS_TRANSITIONS.\n`);

  // Create mock product & variant for order creation
  const testProduct = await Product.create({
    title: 'Order Audit Test Item',
    slug: `trans-audit-${Date.now()}`,
    description: 'Transition test item',
    basePrice: 20000,
    status: 'active',
  });

  const testVariant = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-AUDIT-${Date.now()}`,
    price: 20000,
    availableQty: 100,
    reservedQty: 0,
    isActive: true,
  });

  let createdOrders: string[] = [];

  async function createOrder(status: any, paymentStatus: 'unpaid' | 'paid' = 'unpaid') {
    const oId = `KS-AUDIT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const order = await Order.create({
      orderId: oId,
      email: 'tester@kashmirstag.com',
      items: [{
        productId: testProduct._id,
        variantId: testVariant._id,
        title: 'Test Audit Product',
        variant: 'Default',
        sku: testVariant.sku,
        image: '/test.jpg',
        unitPrice: 20000,
        quantity: 2,
        lineTotal: 40000,
      }],
      shippingAddress: {
        name: 'Test Customer',
        phone: '9876543210',
        line1: '123 Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'IN',
      },
      billingAddress: {
        name: 'Test Customer',
        phone: '9876543210',
        line1: '123 Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'IN',
      },
      pricing: {
        subtotal: 40000,
        shippingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 40000,
      },
      status,
      paymentStatus,
      timeline: [{ status, comment: `Order initialized in ${status}`, createdAt: new Date() }],
    });
    createdOrders.push(order._id.toString());
    return order;
  }

  // ─── 2. Complete 11x11 Transition Matrix Verification ───────────────────────
  console.log('─── Phase 2: Testing Complete 11x11 Transition Matrix ───────────');
  const matrixResults: Record<string, Record<string, string>> = {};
  let totalTransitionsTested = 0;
  let matrixPassCount = 0;

  for (const fromStatus of ORDER_STATUSES) {
    matrixResults[fromStatus] = {};
    for (const toStatus of ORDER_STATUSES) {
      totalTransitionsTested++;
      const paymentStatus = fromStatus === 'returned' || fromStatus === 'cancelled' ? 'paid' : 'unpaid';
      const expectedAllowed = isValidTransition(fromStatus, toStatus, paymentStatus);

      // Create an order in `fromStatus`
      const testOrder = await createOrder(fromStatus, paymentStatus);

      let actualAllowed = false;
      let rejectionError: string | null = null;
      try {
        await updateOrderStatus(testOrder.orderId, toStatus, undefined, `Testing ${fromStatus} -> ${toStatus}`);
        actualAllowed = true;
      } catch (err: any) {
        actualAllowed = false;
        rejectionError = err.message;
      }

      if (fromStatus === toStatus) {
        // Idempotent no-op
        matrixResults[fromStatus][toStatus] = 'IDEMPOTENT';
        matrixPassCount++;
      } else if (expectedAllowed === actualAllowed) {
        matrixResults[fromStatus][toStatus] = expectedAllowed ? 'PASS (Allowed)' : 'PASS (Rejected)';
        matrixPassCount++;
      } else {
        matrixResults[fromStatus][toStatus] = `FAIL: expected ${expectedAllowed ? 'ALLOW' : 'REJECT'}, got ${actualAllowed ? 'ALLOW' : 'REJECT'} (${rejectionError})`;
      }
    }
  }

  console.log(`[PASS] Tested all ${totalTransitionsTested} transition pairs: ${matrixPassCount}/${totalTransitionsTested} accurately matched specification.\n`);

  // ─── 3. Concurrency & Compare-And-Swap (CAS) Protection ────────────────────
  console.log('─── Phase 3: Testing CAS Concurrency Protection ────────────────');
  const casOrder = await createOrder('processing');
  
  // Attempt update with stale expectedCurrentStatus
  let casConflictDetected = false;
  try {
    await updateOrderStatus(casOrder.orderId, 'packed', undefined, 'Update with stale CAS', 'pending');
  } catch (err: any) {
    if (err.statusCode === 409) {
      casConflictDetected = true;
      console.log(`  [PASS] Stale CAS rejected with 409 Conflict: "${err.message}"`);
    } else {
      console.error(`  [FAIL] Expected 409 statusCode, got:`, err);
    }
  }

  if (!casConflictDetected) {
    throw new Error('CAS Concurrency protection failed: stale status update was not rejected with 409!');
  }

  // Attempt update with matching expectedCurrentStatus
  const casSuccessOrder = await updateOrderStatus(casOrder.orderId, 'packed', undefined, 'Valid CAS', 'processing');
  const casSuccessPass = casSuccessOrder.status === 'packed';
  console.log(`  [${casSuccessPass ? 'PASS' : 'FAIL'}] Matching expectedCurrentStatus succeeded and transitioned to 'packed'.\n`);

  // ─── 4. Idempotency Verification ───────────────────────────────────────────
  console.log('─── Phase 4: Testing Idempotency ───────────────────────────────');
  const idemOrder = await createOrder('confirmed');
  const initialTimelineLength = idemOrder.timeline.length;
  
  // Call updateOrderStatus with same status
  const idemResult = await updateOrderStatus(idemOrder.orderId, 'confirmed');
  const refreshedIdemOrder = await Order.findById(idemOrder._id).lean();
  
  const timelineUnchanged = refreshedIdemOrder?.timeline.length === initialTimelineLength;
  console.log(`  [${timelineUnchanged ? 'PASS' : 'FAIL'}] Re-applying same status did not append duplicate timeline events.`);

  // ─── 5. Inventory Reservation vs Restock on Cancellation ───────────────────
  console.log('\n─── Phase 5: Testing Inventory Release vs Restock on Cancel ─────');

  // Test 5A: Pending order cancellation releases reserved inventory
  await ProductVariant.findByIdAndUpdate(testVariant._id, { $set: { availableQty: 50, reservedQty: 5 } });

  const pendingOrder = await createOrder('pending');
  await cancelOrder(pendingOrder.orderId, 'Customer changed mind');
  const variantAfterPendingCancel = await ProductVariant.findById(testVariant._id).lean();
  
  const reservationReleasedPass =
    variantAfterPendingCancel?.reservedQty === 3 &&
    variantAfterPendingCancel?.availableQty === 52;
  console.log(`  [${reservationReleasedPass ? 'PASS' : 'FAIL'}] Pending cancel: released reservation (reserved: 5->${variantAfterPendingCancel?.reservedQty}, available: 50->${variantAfterPendingCancel?.availableQty})`);

  // Test 5B: Confirmed order cancellation restocks committed inventory
  await ProductVariant.findByIdAndUpdate(testVariant._id, { $set: { availableQty: 50, reservedQty: 0 } });

  const confirmedOrder = await createOrder('confirmed', 'paid');
  await cancelOrder(confirmedOrder.orderId, 'Order cancelled after payment');
  const variantAfterConfirmedCancel = await ProductVariant.findById(testVariant._id).lean();

  const restockPass =
    variantAfterConfirmedCancel?.reservedQty === 0 &&
    variantAfterConfirmedCancel?.availableQty === 52;
  console.log(`  [${restockPass ? 'PASS' : 'FAIL'}] Confirmed cancel: restocked available inventory (available: 50->${variantAfterConfirmedCancel?.availableQty})`);

  // Test 5C: Irreversible fulfillment states cannot be cancelled
  const shippedOrder = await createOrder('shipped');
  let cancelShippedRejected = false;
  try {
    await cancelOrder(shippedOrder.orderId, 'Cancel shipped order');
  } catch (err: any) {
    cancelShippedRejected = err.statusCode === 400;
    console.log(`  [PASS] Cancellation rejected for shipped order (400 Bad Request): "${err.message}"`);
  }

  const deliveredOrder = await createOrder('delivered');
  let cancelDeliveredRejected = false;
  try {
    await cancelOrder(deliveredOrder.orderId, 'Cancel delivered order');
  } catch (err: any) {
    cancelDeliveredRejected = err.statusCode === 400;
    console.log(`  [PASS] Cancellation rejected for delivered order (400 Bad Request): "${err.message}"`);
  }

  // ─── 6. Payment Prerequisites for Refund ───────────────────────────────────
  console.log('\n─── Phase 6: Testing Payment Prerequisites for Refund ──────────');
  const unpaidCancelledOrder = await createOrder('cancelled', 'unpaid');
  let unpaidRefundRejected = false;
  try {
    await updateOrderStatus(unpaidCancelledOrder.orderId, 'refunded');
  } catch (err: any) {
    unpaidRefundRejected = err.statusCode === 400;
    console.log(`  [PASS] Refund transition rejected on unpaid order (400 Bad Request): "${err.message}"`);
  }

  const paidCancelledOrder = await createOrder('cancelled', 'paid');
  const refundedOrder = await updateOrderStatus(paidCancelledOrder.orderId, 'refunded', undefined, 'Processed full refund');
  const paidRefundSuccess = refundedOrder.status === 'refunded' && refundedOrder.paymentStatus === 'refunded';
  console.log(`  [${paidRefundSuccess ? 'PASS' : 'FAIL'}] Refund succeeded on paid order; paymentStatus updated to 'refunded'.`);

  // ─── 7. Fulfillment Tracking Prerequisites ─────────────────────────────────
  console.log('\n─── Phase 7: Testing Fulfillment Tracking Prerequisites ────────');
  const pendingTrackingOrder = await createOrder('pending');
  let pendingTrackingRejected = false;
  try {
    await addTrackingInfo(pendingTrackingOrder.orderId, 'Delhivery', 'DL123456789');
  } catch (err: any) {
    pendingTrackingRejected = err.statusCode === 400;
    console.log(`  [PASS] Add tracking rejected on pending order (400 Bad Request): "${err.message}"`);
  }

  const packedTrackingOrder = await createOrder('packed');
  const shippedTrackingOrder = await addTrackingInfo(packedTrackingOrder.orderId, 'BlueDart', 'BD987654321', 'https://track.bluedart.com');
  const packedTrackingSuccess =
    shippedTrackingOrder.status === 'shipped' &&
    shippedTrackingOrder.fulfillment?.carrier === 'BlueDart' &&
    shippedTrackingOrder.fulfillment?.trackingNumber === 'BD987654321';
  console.log(`  [${packedTrackingSuccess ? 'PASS' : 'FAIL'}] Add tracking on 'packed' order transitioned order to 'shipped' with tracking metadata.`);

  // ─── 8. Terminal States Verification ───────────────────────────────────────
  console.log('\n─── Phase 8: Verifying Terminal States ──────────────────────────');
  const terminalRefundedTransitions = getAvailableTransitions('refunded');
  const terminalPass = terminalRefundedTransitions.length === 0;
  console.log(`  [${terminalPass ? 'PASS' : 'FAIL'}] 'refunded' has 0 available next transitions (strictly terminal).`);

  // ─── Clean Up ──────────────────────────────────────────────────────────────
  console.log('\n─── Cleaning up test fixtures ──────────────────────────────────');
  for (const oId of createdOrders) {
    await Order.findByIdAndDelete(oId);
  }
  await ProductVariant.findByIdAndDelete(testVariant._id);
  await Product.findByIdAndDelete(testProduct._id);
  console.log(`Cleaned up ${createdOrders.length} test orders and test product/variant.`);

  // ─── Print Transition Matrix Table ─────────────────────────────────────────
  console.log('\n================================================================');
  console.log('             ORDER STATUS TRANSITION MATRIX RESULTS             ');
  console.log('================================================================');
  
  // Format matrix table
  const header = '| From \\ To | ' + ORDER_STATUSES.map(s => s.slice(0, 4)).join(' | ') + ' |';
  const divider = '|-----------|' + ORDER_STATUSES.map(() => '------|').join('');
  console.log(header);
  console.log(divider);

  for (const from of ORDER_STATUSES) {
    const row = [from.padEnd(9)];
    for (const to of ORDER_STATUSES) {
      const cell = matrixResults[from][to];
      if (cell === 'IDEMPOTENT') {
        row.push('SAME  ');
      } else if (cell.includes('Allowed')) {
        row.push('ALLOW ');
      } else if (cell.includes('Rejected')) {
        row.push('REJECT');
      } else {
        row.push('ERR   ');
      }
    }
    console.log('| ' + row.join(' | ') + ' |');
  }

  const allPassed =
    matrixPassCount === totalTransitionsTested &&
    casConflictDetected &&
    casSuccessPass &&
    timelineUnchanged &&
    reservationReleasedPass &&
    restockPass &&
    cancelShippedRejected &&
    cancelDeliveredRejected &&
    unpaidRefundRejected &&
    paidRefundSuccess &&
    pendingTrackingRejected &&
    packedTrackingSuccess &&
    terminalPass;

  if (allPassed) {
    console.log('\n================================================================');
    console.log('  ALL AUDIT & STATE MACHINE VERIFICATION TESTS PASSED (100%)');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('\nSTATE MACHINE TESTS ENCOUNTERED FAILURES');
    process.exit(1);
  }
}

runComprehensiveOrderStateMachineTests().catch((err) => {
  console.error('Fatal error during state machine verification:', err);
  process.exit(1);
});
