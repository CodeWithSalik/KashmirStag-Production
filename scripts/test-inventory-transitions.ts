import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runInventoryAudit() {
  const { connectDB } = await import('../src/lib/db');
  const { default: Order } = await import('../src/models/Order');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: InventoryTransaction } = await import('../src/models/InventoryTransaction');
  const { inventoryService } = await import('../src/services/inventory.service');
  const {
    cancelOrder,
    confirmPayment,
    updateOrderStatus,
    addTrackingInfo,
  } = await import('../src/services/order.service');

  console.log('================================================================');
  console.log('   KASHMIRSTAG — INVENTORY ATOMICITY & STATE MACHINE AUDIT');
  console.log('================================================================\n');

  await connectDB();

  // Create clean test product & variant
  const testProduct = await Product.create({
    title: 'Atomic Inventory Audit Item',
    slug: `inventory-audit-${Date.now()}`,
    description: 'Inventory audit item',
    basePrice: 15000,
    status: 'active',
  });

  const testVariant = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-INV-${Date.now()}`,
    price: 15000,
    availableQty: 100,
    reservedQty: 0,
    isActive: true,
  });

  const createdOrderIds: string[] = [];

  async function createTestOrder(status: any, qty: number, paymentStatus: 'unpaid' | 'paid' = 'unpaid') {
    const oId = `KS-INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    createdOrderIds.push(oId);
    const order = await Order.create({
      orderId: oId,
      email: 'audit-inv@kashmirstag.com',
      items: [{
        productId: testProduct._id,
        variantId: testVariant._id,
        title: testProduct.title,
        variant: 'Default',
        sku: testVariant.sku,
        image: '/test.jpg',
        unitPrice: 15000,
        quantity: qty,
        lineTotal: 15000 * qty,
      }],
      shippingAddress: {
        name: 'Inventory Auditor',
        phone: '9876543210',
        line1: 'Test Lab Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'IN',
      },
      billingAddress: {
        name: 'Inventory Auditor',
        phone: '9876543210',
        line1: 'Test Lab Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'IN',
      },
      pricing: {
        subtotal: 15000 * qty,
        shippingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 15000 * qty,
      },
      paymentStatus,
      paymentMethod: 'razorpay',
      status,
      timeline: [{ status, comment: 'Order initialized for inventory test' }],
    });
    return order;
  }

  async function getVariantState() {
    const v = await ProductVariant.findById(testVariant._id).lean();
    if (!v) throw new Error('Variant not found');
    return {
      availableQty: v.availableQty,
      reservedQty: v.reservedQty,
      onHand: v.availableQty + v.reservedQty,
    };
  }

  // ─── TEST 1: pending → cancelled ───────────────────────────────────────────
  console.log('─── TEST 1: pending → cancelled (Reservation Release) ──────────');
  // Initial reset: 100 available, 0 reserved
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 100, reservedQty: 0 });
  // Simulate checkout reservation: 5 items
  await inventoryService.reserveStock([{ variantId: testVariant._id.toString(), quantity: 5 }], 'ORDER-P-1');
  let state = await getVariantState();
  console.log(`After reservation: available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);
  if (state.availableQty !== 95 || state.reservedQty !== 5 || state.onHand !== 100) {
    throw new Error('Test 1 reservation setup failed!');
  }

  const pendingOrder = await createTestOrder('pending', 5, 'unpaid');
  const cancelResult1 = await cancelOrder(pendingOrder.orderId, 'Customer cancelled before payment');
  state = await getVariantState();
  console.log(`After cancel:      available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);

  if (state.availableQty !== 100 || state.reservedQty !== 0 || state.onHand !== 100) {
    throw new Error(`Test 1 Failed: Expected available=100, reserved=0. Got available=${state.availableQty}, reserved=${state.reservedQty}`);
  }

  const txs1 = await InventoryTransaction.find({ reference: pendingOrder.orderId });
  console.log(`Inventory Transactions logged for order: ${txs1.length}`);
  const releaseTx = txs1.find(t => t.type === 'RELEASE');
  if (!releaseTx || releaseTx.quantity !== 5) {
    throw new Error('Test 1 Failed: Missing or incorrect RELEASE transaction');
  }

  // Idempotency: Repeat cancel
  console.log('Testing Idempotency on pending cancellation...');
  await cancelOrder(pendingOrder.orderId, 'Repeated cancellation request');
  state = await getVariantState();
  if (state.availableQty !== 100 || state.reservedQty !== 0) {
    throw new Error(`Test 1 Idempotency Failed: Stock doubled on repeat cancel! available=${state.availableQty}`);
  }
  const txs1After = await InventoryTransaction.find({ reference: pendingOrder.orderId, type: 'RELEASE' });
  if (txs1After.length !== 1) {
    throw new Error(`Test 1 Idempotency Failed: Duplicate RELEASE transaction recorded! count=${txs1After.length}`);
  }
  console.log('[PASS] Test 1: pending → cancelled releases reservation atomically and idempotently.\n');

  // ─── TEST 2: confirmed → cancelled ─────────────────────────────────────────
  console.log('─── TEST 2: confirmed → cancelled (Committed Stock Restock) ────');
  // Reset: 100 available, 0 reserved
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 100, reservedQty: 0 });
  // Reserve 4 items
  await inventoryService.reserveStock([{ variantId: testVariant._id.toString(), quantity: 4 }], 'ORDER-C-1');
  // Commit reservation (Sale)
  await inventoryService.commitReservation([{ variantId: testVariant._id.toString(), quantity: 4 }], 'ORDER-C-1');
  state = await getVariantState();
  console.log(`After Sale commit: available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);
  if (state.availableQty !== 96 || state.reservedQty !== 0 || state.onHand !== 96) {
    throw new Error('Test 2 setup failed!');
  }

  const confirmedOrder = await createTestOrder('confirmed', 4, 'paid');
  await cancelOrder(confirmedOrder.orderId, 'Out of area order cancellation');
  state = await getVariantState();
  console.log(`After cancel:      available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);

  if (state.availableQty !== 100 || state.reservedQty !== 0 || state.onHand !== 100) {
    throw new Error(`Test 2 Failed: Expected available=100, onHand=100. Got available=${state.availableQty}, onHand=${state.onHand}`);
  }

  const restockTx2 = await InventoryTransaction.findOne({
    variantId: testVariant._id,
    type: 'RESTOCK',
    note: { $regex: confirmedOrder.orderId },
  });
  if (!restockTx2 || restockTx2.quantity !== 4) {
    throw new Error('Test 2 Failed: Missing or incorrect RESTOCK transaction');
  }

  // Idempotency: Repeat cancel
  console.log('Testing Idempotency on confirmed cancellation...');
  await cancelOrder(confirmedOrder.orderId, 'Repeated cancellation request');
  state = await getVariantState();
  if (state.availableQty !== 100 || state.onHand !== 100) {
    throw new Error(`Test 2 Idempotency Failed: Stock incremented twice! available=${state.availableQty}`);
  }
  const restockCount2 = await InventoryTransaction.countDocuments({
    variantId: testVariant._id,
    type: 'RESTOCK',
    note: { $regex: confirmedOrder.orderId },
  });
  if (restockCount2 !== 1) {
    throw new Error(`Test 2 Idempotency Failed: Duplicate RESTOCK transaction logged! count=${restockCount2}`);
  }
  console.log('[PASS] Test 2: confirmed → cancelled restocks committed inventory atomically and idempotently.\n');

  // ─── TEST 3: processing → cancelled ────────────────────────────────────────
  console.log('─── TEST 3: processing → cancelled (Committed Stock Restock) ───');
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 90, reservedQty: 0 });
  const processingOrder = await createTestOrder('processing', 6, 'paid');
  await cancelOrder(processingOrder.orderId, 'Item defect in workshop');
  state = await getVariantState();
  console.log(`After cancel:      available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);
  if (state.availableQty !== 96 || state.onHand !== 96) {
    throw new Error(`Test 3 Failed: Expected available=96. Got available=${state.availableQty}`);
  }
  console.log('[PASS] Test 3: processing → cancelled restocks inventory correctly.\n');

  // ─── TEST 4: packed → cancelled ────────────────────────────────────────────
  console.log('─── TEST 4: packed → cancelled (Committed Stock Restock) ───────');
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 90, reservedQty: 0 });
  const packedOrder = await createTestOrder('packed', 3, 'paid');
  await cancelOrder(packedOrder.orderId, 'Cancelled before dispatch');
  state = await getVariantState();
  console.log(`After cancel:      available=${state.availableQty}, reserved=${state.reservedQty}, onHand=${state.onHand}`);
  if (state.availableQty !== 93 || state.onHand !== 93) {
    throw new Error(`Test 4 Failed: Expected available=93. Got available=${state.availableQty}`);
  }
  console.log('[PASS] Test 4: packed → cancelled restocks inventory correctly.\n');

  // ─── TEST 5: packed → dispatched (shipped) ─────────────────────────────────
  console.log('─── TEST 5: packed → dispatched (Zero Inventory Delta) ─────────');
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 80, reservedQty: 0 });
  const stateBeforeDispatch = await getVariantState();
  const txCountBeforeDispatch = await InventoryTransaction.countDocuments({ variantId: testVariant._id });

  const shippedOrder = await createTestOrder('packed', 2, 'paid');
  await addTrackingInfo(shippedOrder.orderId, 'BlueDart', 'BD123456789IN', 'https://track.bluedart.com/123');

  const stateAfterDispatch = await getVariantState();
  const txCountAfterDispatch = await InventoryTransaction.countDocuments({ variantId: testVariant._id });

  console.log(`Before dispatch: available=${stateBeforeDispatch.availableQty}, reserved=${stateBeforeDispatch.reservedQty}`);
  console.log(`After dispatch:  available=${stateAfterDispatch.availableQty}, reserved=${stateAfterDispatch.reservedQty}`);

  if (
    stateBeforeDispatch.availableQty !== stateAfterDispatch.availableQty ||
    stateBeforeDispatch.reservedQty !== stateAfterDispatch.reservedQty ||
    stateBeforeDispatch.onHand !== stateAfterDispatch.onHand
  ) {
    throw new Error('Test 5 Failed: Inventory quantities mutated during dispatch!');
  }
  if (txCountBeforeDispatch !== txCountAfterDispatch) {
    throw new Error('Test 5 Failed: Inventory transaction created during dispatch!');
  }
  console.log('[PASS] Test 5: packed → dispatched has strictly 0 inventory mutation and 0 transaction logging.\n');

  // ─── TEST 6: dispatched → delivered ────────────────────────────────────────
  console.log('─── TEST 6: dispatched → delivered (Zero Inventory Delta) ──────');
  const stateBeforeDelivery = await getVariantState();
  const txCountBeforeDelivery = await InventoryTransaction.countDocuments({ variantId: testVariant._id });

  await updateOrderStatus(shippedOrder.orderId, 'delivered', undefined, 'Delivered to recipient');

  const stateAfterDelivery = await getVariantState();
  const txCountAfterDelivery = await InventoryTransaction.countDocuments({ variantId: testVariant._id });

  console.log(`Before delivery: available=${stateBeforeDelivery.availableQty}, reserved=${stateBeforeDelivery.reservedQty}`);
  console.log(`After delivery:  available=${stateAfterDelivery.availableQty}, reserved=${stateAfterDelivery.reservedQty}`);

  if (
    stateBeforeDelivery.availableQty !== stateAfterDelivery.availableQty ||
    stateBeforeDelivery.reservedQty !== stateAfterDelivery.reservedQty ||
    stateBeforeDelivery.onHand !== stateAfterDelivery.onHand
  ) {
    throw new Error('Test 6 Failed: Inventory quantities mutated during delivery!');
  }
  if (txCountBeforeDelivery !== txCountAfterDelivery) {
    throw new Error('Test 6 Failed: Inventory transaction created during delivery!');
  }
  console.log('[PASS] Test 6: dispatched → delivered has strictly 0 inventory mutation.\n');

  // ─── TEST 7: Concurrent Cancellation Requests ──────────────────────────────
  console.log('─── TEST 7: Race Condition Protection (Concurrent Cancellations) ');
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 50, reservedQty: 0 });
  const concurrentOrder = await createTestOrder('confirmed', 10, 'paid');

  console.log('Triggering 5 simultaneous cancellation requests on the same order...');
  const cancelPromises = [
    cancelOrder(concurrentOrder.orderId, 'Parallel request 1'),
    cancelOrder(concurrentOrder.orderId, 'Parallel request 2'),
    cancelOrder(concurrentOrder.orderId, 'Parallel request 3'),
    cancelOrder(concurrentOrder.orderId, 'Parallel request 4'),
    cancelOrder(concurrentOrder.orderId, 'Parallel request 5'),
  ];

  const results = await Promise.allSettled(cancelPromises);
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  console.log(`Fulfilled requests: ${fulfilled.length} / 5`);

  state = await getVariantState();
  console.log(`Stock after concurrent cancel: available=${state.availableQty}, reserved=${state.reservedQty}`);

  // Initial was 50. Exactly 10 units must be restocked -> 60.
  if (state.availableQty !== 60) {
    throw new Error(`Test 7 Race Condition Failed! Expected available=60. Got available=${state.availableQty} (Duplicate Restock Detected!)`);
  }

  const restockTxs = await InventoryTransaction.countDocuments({
    variantId: testVariant._id,
    type: 'RESTOCK',
    note: { $regex: concurrentOrder.orderId },
  });
  if (restockTxs !== 1) {
    throw new Error(`Test 7 Race Condition Failed! Expected exactly 1 RESTOCK transaction, found ${restockTxs}`);
  }
  console.log('[PASS] Test 7: Concurrent cancellations restocked inventory EXACTLY once without duplicate mutations.\n');

  // ─── TEST 8: Non-Negative Quantity Constraints ─────────────────────────────
  console.log('─── TEST 8: Non-Negative Quantity Enforcement ──────────────────');
  await ProductVariant.findByIdAndUpdate(testVariant._id, { availableQty: 5, reservedQty: 2 });

  // Test 8a: adjustStock below zero
  let threwUnderflow = false;
  try {
    await inventoryService.adjustStock(testVariant._id.toString(), -10, 'SALE');
  } catch (err: any) {
    threwUnderflow = true;
    console.log(`Underflow correctly rejected by adjustStock: "${err.message}"`);
  }
  if (!threwUnderflow) {
    throw new Error('Test 8a Failed: adjustStock allowed availableQty to drop below 0!');
  }

  // Test 8b: reserveStock exceeding availableQty
  let threwReservationOverflow = false;
  try {
    await inventoryService.reserveStock([{ variantId: testVariant._id.toString(), quantity: 20 }], 'ORDER-OVERFLOW');
  } catch (err: any) {
    threwReservationOverflow = true;
    console.log(`Reservation overflow correctly rejected: "${err.message}"`);
  }
  if (!threwReservationOverflow) {
    throw new Error('Test 8b Failed: reserveStock allowed reservation exceeding availableQty!');
  }

  // Test 8c: Mongoose schema validation prevents negative reservedQty
  let threwSchemaMin = false;
  try {
    const invalidVariant = new ProductVariant({
      productId: testProduct._id,
      sku: `SKU-INVALID-${Date.now()}`,
      availableQty: 10,
      reservedQty: -5,
    });
    await invalidVariant.validate();
  } catch (err: any) {
    threwSchemaMin = true;
    console.log(`Negative reservedQty rejected by Mongoose schema min: 0: "${err.message}"`);
  }
  if (!threwSchemaMin) {
    throw new Error('Test 8c Failed: Schema validation failed to reject negative reservedQty!');
  }
  console.log('[PASS] Test 8: Non-negative stock constraints enforced at both service and schema levels.\n');

  // ─── CLEANUP ───────────────────────────────────────────────────────────────
  console.log('Cleaning up test documents...');
  await Order.deleteMany({ orderId: { $in: createdOrderIds } });
  await InventoryTransaction.deleteMany({ variantId: testVariant._id });
  await ProductVariant.findByIdAndDelete(testVariant._id);
  await Product.findByIdAndDelete(testProduct._id);
  console.log('[PASS] Test data cleaned up successfully.\n');

  console.log('================================================================');
  console.log('  ALL INVENTORY ATOMICITY & STATE MACHINE AUDITS PASSED 100%');
  console.log('================================================================');
  process.exit(0);
}

runInventoryAudit().catch((err) => {
  console.error('INVENTORY AUDIT FAILURE:', err);
  process.exit(1);
});
