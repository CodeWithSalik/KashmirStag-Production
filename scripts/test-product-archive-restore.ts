import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runArchiveRestoreRegressionTest() {
  console.log('====================================================');
  console.log('  KASHMIRSTAG PRODUCT ARCHIVE → RESTORE REGRESSION TEST');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const { signJwt } = await import('../src/lib/auth');
  const { productService } = await import('../src/services/product.service');
  const { PATCH } = await import('../src/app/api/admin/products/[id]/route');

  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: Order } = await import('../src/models/Order');
  const { default: AuditLog } = await import('../src/models/AuditLog');
  const { default: mongoose } = await import('mongoose');
  const { NextRequest } = await import('next/server');

  await connectDB();
  console.log(' [DB] Connected to MongoDB Atlas\n');

  const adminId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  const adminToken = signJwt({ sub: adminId.toString(), email: 'admin@kashmirstag.com', role: 'admin' });
  const customerToken = signJwt({ sub: customerId.toString(), email: 'customer@kashmirstag.com', role: 'customer' });

  function makeNextRequest(url: string, method: string, body?: any, token?: string): any {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (token) {
      req.cookies.set('auth-token', token);
    }
    return req;
  }

  // ----------------------------------------------------------------
  // 1. Setup Test Product, Active Variants, and Historical Order
  // ----------------------------------------------------------------
  console.log('1. Setting up Test Product with Active Variants & Historical Order:');

  await Product.deleteMany({ title: /Regression Test/ });
  await ProductVariant.deleteMany({ sku: /^SKU-REG-/ });

  const originalImages = [
    '/uploads/products/shawl-ivory-front.jpg',
    '/uploads/products/shawl-ivory-detail.jpg',
  ];

  const testProduct = await Product.create({
    title: 'Kashmir Pashmina Handwoven Shawl - Regression Test',
    slug: `test-pashmina-regression-${Date.now()}`,
    description: 'Ultra-soft pure Pashmina handwoven in Srinagar valley.',
    basePrice: 1800000, // ₹18,000 in paise
    compareAtPrice: 2200000,
    images: originalImages,
    status: 'active',
    isVisible: true,
  });

  const variant1 = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-REG-IVORY-${Date.now()}`,
    title: 'Ivory / Standard',
    color: 'Ivory',
    size: 'Standard',
    price: 1800000,
    availableQty: 12,
    reservedQty: 3,
    isActive: true,
  });

  const variant2 = await ProductVariant.create({
    productId: testProduct._id,
    sku: `SKU-REG-BLACK-${Date.now()}`,
    title: 'Black / Standard',
    color: 'Black',
    size: 'Standard',
    price: 1900000,
    availableQty: 8,
    reservedQty: 1,
    isActive: true,
  });

  const historicalOrder = await Order.create({
    orderId: `KS-HIST-REG-${Date.now()}`,
    userId: customerId,
    email: 'customer@kashmirstag.com',
    items: [
      {
        productId: testProduct._id,
        variantId: variant1._id,
        title: testProduct.title,
        variant: 'Ivory / Standard',
        sku: variant1.sku,
        image: originalImages[0],
        unitPrice: 1800000,
        quantity: 1,
        lineTotal: 1800000,
      },
    ],
    shippingAddress: {
      name: 'Salik',
      phone: '9876543210',
      line1: 'Residency Road',
      city: 'Srinagar',
      state: 'Jammu and Kashmir',
      pincode: '190001',
      country: 'India',
    },
    billingAddress: {
      name: 'Salik',
      phone: '9876543210',
      line1: 'Residency Road',
      city: 'Srinagar',
      state: 'Jammu and Kashmir',
      pincode: '190001',
      country: 'India',
    },
    pricing: {
      subtotal: 1800000,
      shippingFee: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 1800000,
    },
    status: 'delivered',
    paymentStatus: 'paid',
  });

  // Verify initial active state
  const initialVariants = await ProductVariant.find({ productId: testProduct._id }).lean();
  const initialStorefront = await Product.find({ status: 'active', isVisible: true }).lean();
  const initialFoundInStore = initialStorefront.some((p) => p._id.toString() === testProduct._id.toString());

  console.log(`  - Test Product ID: ${testProduct._id.toString()}`);
  console.log(`  - Initial status: '${testProduct.status}', isVisible: ${testProduct.isVisible}`);
  console.log(`  - Variants count: ${initialVariants.length}, all active: ${initialVariants.every((v) => v.isActive)}`);
  console.log(`  - Present on storefront: ${initialFoundInStore}`);
  console.log(`  [${initialFoundInStore && initialVariants.length === 2 ? 'PASS' : 'FAIL'}] Baseline product setup verified\n`);

  // ----------------------------------------------------------------
  // 2. Archive Product & Verify Disappearance
  // ----------------------------------------------------------------
  console.log('2. Archiving Product & Verifying Storefront Disappearance:');

  const archiveReq = makeNextRequest(
    `/api/admin/products/${testProduct._id}`,
    'PATCH',
    { action: 'archive' },
    adminToken
  );
  const archiveRes = await PATCH(archiveReq, { params: Promise.resolve({ id: testProduct._id.toString() }) });
  const archiveJson = await archiveRes.json();

  console.log(`  - Archive API response status: ${archiveRes.status}`);
  console.log(`  - Archive response action: ${archiveJson?.data?.action}`);

  const reloadedAfterArchive = await Product.findById(testProduct._id).lean();
  const variantsAfterArchive = await ProductVariant.find({ productId: testProduct._id }).lean();

  const statusArchived = reloadedAfterArchive?.status === 'archived';
  const isVisibleFalse = reloadedAfterArchive?.isVisible === false;
  const allVariantsInactive = variantsAfterArchive.every((v) => v.isActive === false);

  console.log(`  [${statusArchived ? 'PASS' : 'FAIL'}] Product status = 'archived' in DB`);
  console.log(`  [${isVisibleFalse ? 'PASS' : 'FAIL'}] Product isVisible = false in DB`);
  console.log(`  [${allVariantsInactive ? 'PASS' : 'FAIL'}] All variants inactive (isActive: false)`);

  // Storefront check
  const storefrontAfterArchive = await Product.find({ status: 'active', isVisible: true }).lean();
  const disappearedFromStore = !storefrontAfterArchive.some((p) => p._id.toString() === testProduct._id.toString());

  const getProductsCheck = await productService.getProducts({ status: 'active' });
  const disappearedFromService = !getProductsCheck.products.some((p) => p.id.toString() === testProduct._id.toString());

  console.log(`  [${disappearedFromStore && disappearedFromService ? 'PASS' : 'FAIL'}] Product strictly excluded from active storefront browsing & search`);

  // Images and Historical order check after archive
  const imagesIntactAfterArchive =
    reloadedAfterArchive?.images?.length === 2 &&
    reloadedAfterArchive?.images?.[0] === originalImages[0] &&
    reloadedAfterArchive?.images?.[1] === originalImages[1];
  console.log(`  [${imagesIntactAfterArchive ? 'PASS' : 'FAIL'}] Images remain intact in archived product`);

  const orderIntactAfterArchive = await Order.findById(historicalOrder._id).lean();
  const orderSnapshotPreserved =
    orderIntactAfterArchive?.items?.[0]?.title === testProduct.title &&
    orderIntactAfterArchive?.items?.[0]?.unitPrice === 1800000 &&
    orderIntactAfterArchive?.status === 'delivered';
  console.log(`  [${orderSnapshotPreserved ? 'PASS' : 'FAIL'}] Historical order remains intact and unmodified\n`);

  // ----------------------------------------------------------------
  // 3. Security, Authorization & Validation Checks on Restore
  // ----------------------------------------------------------------
  console.log('3. Testing Authorization & Error Guards on Restore:');

  // A. Unauthenticated restore -> 401
  const unauthReq = makeNextRequest(
    `/api/admin/products/${testProduct._id}`,
    'PATCH',
    { action: 'restore' }
  );
  const unauthRes = await PATCH(unauthReq, { params: Promise.resolve({ id: testProduct._id.toString() }) });
  console.log(`  [${unauthRes.status === 401 ? 'PASS' : 'FAIL'}] Unauthenticated restore rejected (HTTP ${unauthRes.status})`);

  // B. Customer restore -> 403
  const custReq = makeNextRequest(
    `/api/admin/products/${testProduct._id}`,
    'PATCH',
    { action: 'restore' },
    customerToken
  );
  const custRes = await PATCH(custReq, { params: Promise.resolve({ id: testProduct._id.toString() }) });
  console.log(`  [${custRes.status === 403 ? 'PASS' : 'FAIL'}] Customer restore rejected (HTTP ${custRes.status} Forbidden)`);

  // C. Malformed ObjectId -> 400
  const malformedReq = makeNextRequest(
    `/api/admin/products/invalid-hex-id-999`,
    'PATCH',
    { action: 'restore' },
    adminToken
  );
  const malformedRes = await PATCH(malformedReq, { params: Promise.resolve({ id: 'invalid-hex-id-999' }) });
  console.log(`  [${malformedRes.status === 400 ? 'PASS' : 'FAIL'}] Malformed ID rejected (HTTP ${malformedRes.status} Bad Request)`);

  // D. Non-existent product -> 404
  const nonExistentId = new mongoose.Types.ObjectId().toString();
  const nonExistentReq = makeNextRequest(
    `/api/admin/products/${nonExistentId}`,
    'PATCH',
    { action: 'restore' },
    adminToken
  );
  const nonExistentRes = await PATCH(nonExistentReq, { params: Promise.resolve({ id: nonExistentId }) });
  console.log(`  [${nonExistentRes.status === 404 ? 'PASS' : 'FAIL'}] Nonexistent product rejected (HTTP ${nonExistentRes.status} Not Found)\n`);

  // ----------------------------------------------------------------
  // 4. Restore Product & Verify Full Reappearance
  // ----------------------------------------------------------------
  console.log('4. Restoring Product & Verifying Reappearance:');

  const restoreReq = makeNextRequest(
    `/api/admin/products/${testProduct._id}`,
    'PATCH',
    { action: 'restore' },
    adminToken
  );
  const restoreRes = await PATCH(restoreReq, { params: Promise.resolve({ id: testProduct._id.toString() }) });
  const restoreJson = await restoreRes.json();

  console.log(`  - Restore API response status: ${restoreRes.status}`);
  console.log(`  - Restore response action: ${restoreJson?.data?.action}`);

  const reloadedAfterRestore = await Product.findById(testProduct._id).lean();
  const variantsAfterRestore = await ProductVariant.find({ productId: testProduct._id }).lean();

  const statusActive = reloadedAfterRestore?.status === 'active';
  const isVisibleTrue = reloadedAfterRestore?.isVisible === true;

  console.log(`  [${statusActive ? 'PASS' : 'FAIL'}] Product status = 'active' in DB`);
  console.log(`  [${isVisibleTrue ? 'PASS' : 'FAIL'}] Product isVisible = true in DB`);

  // Variant active state
  const allVariantsActive = variantsAfterRestore.every((v) => v.isActive === true);
  console.log(`  [${allVariantsActive ? 'PASS' : 'FAIL'}] All variants restored to active (isActive: true)`);

  // Variant count & non-duplication
  const variantsNotDuplicated = variantsAfterRestore.length === 2;
  const variantIdsMatch =
    variantsAfterRestore.some((v) => v._id.toString() === variant1._id.toString()) &&
    variantsAfterRestore.some((v) => v._id.toString() === variant2._id.toString());
  console.log(`  [${variantsNotDuplicated && variantIdsMatch ? 'PASS' : 'FAIL'}] Variants count preserved exactly (2 variants, zero duplication)`);

  // Inventory intact check
  const v1Reloaded = variantsAfterRestore.find((v) => v._id.toString() === variant1._id.toString());
  const v2Reloaded = variantsAfterRestore.find((v) => v._id.toString() === variant2._id.toString());
  const inventoryIntact =
    v1Reloaded?.availableQty === 12 &&
    v1Reloaded?.reservedQty === 3 &&
    v2Reloaded?.availableQty === 8 &&
    v2Reloaded?.reservedQty === 1;
  console.log(`  [${inventoryIntact ? 'PASS' : 'FAIL'}] Inventory quantities intact (no stock corruption, v1: 12 avail/3 rsv, v2: 8 avail/1 rsv)`);

  // Storefront reappearance
  const storefrontAfterRestore = await Product.find({ status: 'active', isVisible: true }).lean();
  const reappearedInStore = storefrontAfterRestore.some((p) => p._id.toString() === testProduct._id.toString());

  const getProductsRestoreCheck = await productService.getProducts({ status: 'active' });
  const reappearedInService = getProductsRestoreCheck.products.some((p) => p.id.toString() === testProduct._id.toString());

  console.log(`  [${reappearedInStore && reappearedInService ? 'PASS' : 'FAIL'}] Product appears in storefront catalog again`);

  // Images intact check
  const imagesIntactAfterRestore =
    reloadedAfterRestore?.images?.length === 2 &&
    reloadedAfterRestore?.images?.[0] === originalImages[0] &&
    reloadedAfterRestore?.images?.[1] === originalImages[1];
  console.log(`  [${imagesIntactAfterRestore ? 'PASS' : 'FAIL'}] Product images intact and ordered after restore`);

  // Historical order intact check
  const reloadedOrderAfterRestore = await Order.findById(historicalOrder._id).lean();
  const orderIntactAfterRestore =
    reloadedOrderAfterRestore?.items?.[0]?.title === testProduct.title &&
    reloadedOrderAfterRestore?.items?.[0]?.unitPrice === 1800000 &&
    reloadedOrderAfterRestore?.status === 'delivered';
  console.log(`  [${orderIntactAfterRestore ? 'PASS' : 'FAIL'}] Historical order remains 100% intact after restore`);

  // Audit log check
  const restoreAudit = await AuditLog.findOne({
    entityId: testProduct._id.toString(),
    action: 'RESTORE_PRODUCT',
  }).lean();
  const auditLoggingPass = restoreAudit !== null;
  console.log(`  [${auditLoggingPass ? 'PASS' : 'FAIL'}] Audit log record created for RESTORE_PRODUCT`);

  // ----------------------------------------------------------------
  // 5. Cleanup
  // ----------------------------------------------------------------
  console.log('\n5. Cleaning up test artifacts...');
  await Product.findByIdAndDelete(testProduct._id);
  await ProductVariant.deleteMany({ productId: testProduct._id });
  await Order.findByIdAndDelete(historicalOrder._id);
  await AuditLog.deleteMany({ entityId: testProduct._id.toString() });
  console.log(' [Cleanup] Test records purged from database successfully.\n');

  // ----------------------------------------------------------------
  // Final Evaluation
  // ----------------------------------------------------------------
  const allPassed =
    statusArchived &&
    isVisibleFalse &&
    allVariantsInactive &&
    disappearedFromStore &&
    disappearedFromService &&
    unauthRes.status === 401 &&
    custRes.status === 403 &&
    malformedRes.status === 400 &&
    nonExistentRes.status === 404 &&
    statusActive &&
    isVisibleTrue &&
    allVariantsActive &&
    variantsNotDuplicated &&
    inventoryIntact &&
    reappearedInStore &&
    reappearedInService &&
    imagesIntactAfterRestore &&
    orderIntactAfterRestore &&
    auditLoggingPass;

  if (allPassed) {
    console.log('====================================================');
    console.log(' ARCHIVE → RESTORE REGRESSION SUITE: 100% SUCCESS');
    console.log('====================================================\n');
    console.log('Archive: VERIFIED');
    console.log('Restore: VERIFIED');
    console.log('Storefront disappearance: VERIFIED');
    console.log('Storefront reappearance: VERIFIED');
    console.log('Variant restoration: VERIFIED');
    console.log('Image preservation: VERIFIED');
    console.log('Historical order preservation: VERIFIED');
    console.log('Authorization: VERIFIED');
    console.log('Audit logging: VERIFIED');
  } else {
    console.error('FAILED: One or more assertions failed during archive/restore test.');
    process.exit(1);
  }

  process.exit(0);
}

runArchiveRestoreRegressionTest().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
