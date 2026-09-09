import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runConcurrencyVerification() {
  const { connectDB } = await import('../src/lib/db');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { inventoryService } = await import('../src/services/inventory.service');
  console.log('====================================================');
  console.log('  KASHMIRSTAG CONCURRENCY & OVERSELLING TEST');
  console.log('====================================================\n');

  await connectDB();
  console.log(' Connected to MongoDB Atlas');

  // 1. Setup isolated test product & variant with EXACTLY 1 unit of available stock
  const testSku = `CONCURRENCY-TEST-${Date.now()}`;
  const testProduct = await Product.create({
    title: 'Concurrency Stress Test Item',
    slug: `test-item-${Date.now()}`,
    description: 'Automated test item for inventory concurrency',
    basePrice: 10000,
    status: 'active',
    isVisible: true,
  });

  const testVariant = await ProductVariant.create({
    productId: testProduct._id,
    sku: testSku,
    size: 'M',
    color: 'Navy',
    price: 10000,
    availableQty: 1, // Exactly 1 unit available
    reservedQty: 0,
    lowStockThreshold: 1,
    isActive: true,
  });

  const variantId = testVariant._id.toString();
  console.log(` Created test variant ${testSku} with availableQty = 1, reservedQty = 0`);

  // 2. Launch 2 simultaneous checkout reservation requests competing for the single unit
  console.log('\n Launching 2 simultaneous reservation requests competing for 1 unit...');
  const orderA = `ORDER-CONCURRENT-A-${Date.now()}`;
  const orderB = `ORDER-CONCURRENT-B-${Date.now()}`;

  const results = await Promise.allSettled([
    inventoryService.reserveStock([{ variantId, quantity: 1 }], orderA),
    inventoryService.reserveStock([{ variantId, quantity: 1 }], orderB),
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  console.log(`\n Results:`);
  console.log(`  - Fulfilled (Successful reservations): ${fulfilled.length}`);
  console.log(`  - Rejected (Denied reservations): ${rejected.length}`);

  if (rejected.length > 0) {
    console.log(`  - Denied reason: ${(rejected[0] as PromiseRejectedResult).reason.message}`);
  }

  // 3. Inspect final state in MongoDB Atlas
  const finalVariant = await ProductVariant.findById(variantId).lean();
  console.log(`\n Database State after concurrent execution:`);
  console.log(`  - availableQty: ${finalVariant?.availableQty}`);
  console.log(`  - reservedQty:  ${finalVariant?.reservedQty}`);

  // 4. Assertions
  const assertion1 = fulfilled.length === 1;
  const assertion2 = rejected.length === 1;
  const assertion3 = finalVariant?.availableQty === 0;
  const assertion4 = finalVariant?.reservedQty === 1;
  const assertion5 = ((finalVariant?.availableQty || 0) >= 0); // Never negative

  console.log('\n Safety Verification Assertions:');
  console.log(`  [${assertion1 ? 'PASS' : 'FAIL'}] Exactly 1 customer won the reservation`);
  console.log(`  [${assertion2 ? 'PASS' : 'FAIL'}] Exactly 1 customer was safely denied`);
  console.log(`  [${assertion3 ? 'PASS' : 'FAIL'}] Available quantity decremented to exactly 0`);
  console.log(`  [${assertion4 ? 'PASS' : 'FAIL'}] Reserved quantity incremented to exactly 1`);
  console.log(`  [${assertion5 ? 'PASS' : 'FAIL'}] Zero overselling: available stock never negative`);

  // 5. Test Release / Rollback
  console.log('\n Testing Reservation Release (Rollback on timeout/cancellation)...');
  await inventoryService.releaseReservation([{ variantId, quantity: 1 }], orderA);
  const releasedVariant = await ProductVariant.findById(variantId).lean();
  console.log(`  - After release -> availableQty: ${releasedVariant?.availableQty}, reservedQty: ${releasedVariant?.reservedQty}`);

  const releaseAssertion = releasedVariant?.availableQty === 1 && releasedVariant?.reservedQty === 0;
  console.log(`  [${releaseAssertion ? 'PASS' : 'FAIL'}] Stock accurately restored after cancellation`);

  // Clean up
  await ProductVariant.findByIdAndDelete(variantId);
  await Product.findByIdAndDelete(testProduct._id);
  console.log('\n Test cleanup completed.');

  if (assertion1 && assertion2 && assertion3 && assertion4 && assertion5 && releaseAssertion) {
    console.log('\n OVERSELLING DEFENSE VERIFIED: 100% SUCCESS');
    process.exit(0);
  } else {
    console.error('\n CONCURRENCY TEST FAILED');
    process.exit(1);
  }
}

runConcurrencyVerification().catch((err) => {
  console.error('Fatal error running concurrency test:', err);
  process.exit(1);
});
