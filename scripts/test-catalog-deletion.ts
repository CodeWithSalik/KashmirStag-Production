import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runCatalogDeletionTests() {
  console.log('====================================================');
  console.log('  CATALOG DELETE & ARCHIVE MANAGEMENT — QA TEST');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const { signJwt } = await import('../src/lib/auth');
  const { productService } = await import('../src/services/product.service');
  const { categoryService } = await import('../src/services/category.service');
  const { collectionService } = await import('../src/services/collection.service');

  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: Category } = await import('../src/models/Category');
  const { default: Collection } = await import('../src/models/Collection');
  const { default: Order } = await import('../src/models/Order');
  const { default: AuditLog } = await import('../src/models/AuditLog');
  const { default: mongoose } = await import('mongoose');

  await connectDB();
  console.log(' [DB] Connected to MongoDB Atlas');

  const adminId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  // ----------------------------------------------------
  // 1. Authorization & Security Tests
  // ----------------------------------------------------
  console.log('\n1. Testing Authorization & Input Security:');
  const { requireAdmin } = await import('../src/lib/auth');
  const { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } = await import('../src/lib/errors');

  // Unauthenticated
  let unauthPass = false;
  try {
    const fakeReqNoAuth = { cookies: { get: () => undefined }, headers: new Headers() } as any;
    requireAdmin(fakeReqNoAuth);
  } catch (err: any) {
    unauthPass = err instanceof UnauthorizedError || err.statusCode === 401;
  }
  console.log(`  [${unauthPass ? 'PASS' : 'FAIL'}] Unauthenticated delete request rejected (401)`);

  // Customer
  let customerPass = false;
  try {
    const custToken = signJwt({ sub: customerId.toString(), email: 'cust@test.com', role: 'customer' });
    const fakeReqCust = {
      cookies: { get: (name: string) => name === 'auth-token' ? { value: custToken } : undefined },
      headers: new Headers(),
    } as any;
    requireAdmin(fakeReqCust);
  } catch (err: any) {
    customerPass = err instanceof ForbiddenError || err.statusCode === 403;
  }
  console.log(`  [${customerPass ? 'PASS' : 'FAIL'}] Customer delete request rejected (403 Forbidden)`);

  // Malformed ID
  let malformedPass = false;
  try {
    await productService.deleteOrArchiveProduct('invalid-hex-id', adminId);
  } catch (err: any) {
    malformedPass = err instanceof BadRequestError || err.statusCode === 400;
  }
  console.log(`  [${malformedPass ? 'PASS' : 'FAIL'}] Malformed ObjectId rejected (400 Bad Request)`);

  // Non-existent ID
  let notFoundPass = false;
  try {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await productService.deleteOrArchiveProduct(fakeId, adminId);
  } catch (err: any) {
    notFoundPass = err instanceof NotFoundError || err.statusCode === 404;
  }
  console.log(`  [${notFoundPass ? 'PASS' : 'FAIL'}] Non-existent product ID rejected (404 Not Found)`);

  // ----------------------------------------------------
  // 2. Product Protected Archival (Historical Order Safety)
  // ----------------------------------------------------
  console.log('\n2. Testing Product Protected Archival (Historical Order Safety):');
  const historicalProd = await Product.create({
    title: 'Heritage Woolen Tweed Coat',
    slug: `test-tweed-coat-${Date.now()}`,
    description: 'Coat with historical order reference',
    basePrice: 850000,
    status: 'active',
    isVisible: true,
  });

  const historicalVariant = await ProductVariant.create({
    productId: historicalProd._id,
    sku: `SKU-TWEED-${Date.now()}`,
    price: 850000,
    availableQty: 10,
    reservedQty: 0,
    isActive: true,
  });

  // Create historical order referencing this product
  const historicalOrder = await Order.create({
    orderId: `KS-HIST-${Date.now()}`,
    userId: customerId,
    email: 'cust@test.com',
    items: [{
      productId: historicalProd._id,
      variantId: historicalVariant._id,
      title: 'Heritage Woolen Tweed Coat',
      variant: 'L',
      sku: historicalVariant.sku,
      image: '/uploads/products/tweed.jpg',
      unitPrice: 850000,
      quantity: 1,
      lineTotal: 850000,
    }],
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
    pricing: { subtotal: 850000, shippingFee: 0, taxAmount: 0, discountAmount: 0, total: 850000 },
    status: 'delivered',
    paymentStatus: 'paid',
  });

  // Attempt to delete the product
  const archiveResult = await productService.deleteOrArchiveProduct(historicalProd._id.toString(), adminId);
  const reloadedArchived = await Product.findById(historicalProd._id).lean();
  const reloadedVariant = await ProductVariant.findById(historicalVariant._id).lean();

  const archivePass = archiveResult.action === 'archived' &&
                      reloadedArchived?.status === 'archived' &&
                      reloadedArchived?.isVisible === false &&
                      reloadedVariant?.isActive === false;

  console.log(`  [${archivePass ? 'PASS' : 'FAIL'}] Product with historical orders safely archived (not destroyed)`);
  console.log(`  [${reloadedArchived?.status === 'archived' ? 'PASS' : 'FAIL'}] Product status in DB: '${reloadedArchived?.status}'`);
  console.log(`  [${reloadedVariant?.isActive === false ? 'PASS' : 'FAIL'}] Variant deactivated: isActive=${reloadedVariant?.isActive}`);

  // Verify historical order integrity
  const reloadedOrder = await Order.findById(historicalOrder._id).lean();
  const orderIntactPass = reloadedOrder?.items?.[0]?.title === 'Heritage Woolen Tweed Coat' &&
                          reloadedOrder?.items?.[0]?.unitPrice === 850000;
  console.log(`  [${orderIntactPass ? 'PASS' : 'FAIL'}] Historical order remains 100% intact and readable`);

  // Verify storefront exclusion
  const storefrontCatalog = await Product.find({ status: 'active', isVisible: true }).lean();
  const excludedFromCatalog = !storefrontCatalog.some(p => p._id.toString() === historicalProd._id.toString());
  console.log(`  [${excludedFromCatalog ? 'PASS' : 'FAIL'}] Archived product excluded from active storefront catalog`);

  // ----------------------------------------------------
  // 3. Unreferenced Product Permanent Deletion
  // ----------------------------------------------------
  console.log('\n3. Testing Unreferenced Product Permanent Deletion:');
  const tempProd = await Product.create({
    title: 'Unreferenced Draft Sample',
    slug: `test-draft-${Date.now()}`,
    description: 'Sample with zero orders and zero reviews',
    basePrice: 50000,
    status: 'draft',
    isVisible: false,
  });
  const tempVariant = await ProductVariant.create({
    productId: tempProd._id,
    sku: `SKU-TEMP-${Date.now()}`,
    price: 50000,
    availableQty: 5,
    reservedQty: 0,
    isActive: true,
  });

  const deleteResult = await productService.deleteOrArchiveProduct(tempProd._id.toString(), adminId);
  const reloadedDeleted = await Product.findById(tempProd._id).lean();
  const reloadedDeletedVariant = await ProductVariant.findById(tempVariant._id).lean();

  const permanentPass = deleteResult.action === 'deleted' &&
                        reloadedDeleted === null &&
                        reloadedDeletedVariant === null;

  console.log(`  [${permanentPass ? 'PASS' : 'FAIL'}] Unreferenced product permanently deleted with variants`);

  // ----------------------------------------------------
  // 4. Category Protected Deletion
  // ----------------------------------------------------
  console.log('\n4. Testing Category Protected Deletion:');
  const testCat = await Category.create({
    name: 'Protected Test Category',
    slug: `test-cat-${Date.now()}`,
    description: 'Category with assigned product',
    isActive: true,
  });

  const catProduct = await Product.create({
    title: 'Product in Category',
    slug: `prod-in-cat-${Date.now()}`,
    description: 'Belongs to test category',
    basePrice: 100000,
    categoryId: testCat._id,
    status: 'active',
  });

  // Attempt to delete category when products are assigned
  let blockedCategoryDeletion = false;
  try {
    await categoryService.deleteCategory(testCat._id.toString(), adminId);
  } catch (err: any) {
    blockedCategoryDeletion = err instanceof BadRequestError && err.message.includes('assigned to this category');
  }
  console.log(`  [${blockedCategoryDeletion ? 'PASS' : 'FAIL'}] Deletion blocked when products belong to category`);

  // Now delete the product and delete the category
  await Product.findByIdAndDelete(catProduct._id);
  const catDeleteResult = await categoryService.deleteCategory(testCat._id.toString(), adminId);
  const reloadedCat = await Category.findById(testCat._id).lean();
  const catSafeDeletePass = catDeleteResult.action === 'deleted' && reloadedCat === null;
  console.log(`  [${catSafeDeletePass ? 'PASS' : 'FAIL'}] Unreferenced category safely deleted`);

  // ----------------------------------------------------
  // 5. Collection Safe Deletion & Product Unlinking
  // ----------------------------------------------------
  console.log('\n5. Testing Collection Safe Deletion & Product Unlinking:');
  const testCol = await Collection.create({
    name: 'Autumn Velvet Collection',
    slug: `autumn-velvet-${Date.now()}`,
    description: 'Test collection for unlinking',
    isActive: true,
  });

  const colProduct = await Product.create({
    title: 'Velvet Stole',
    slug: `velvet-stole-${Date.now()}`,
    description: 'Product tagged with collection',
    basePrice: 200000,
    collectionIds: [testCol._id],
    status: 'active',
  });

  const colDeleteResult = await collectionService.deleteCollection(testCol._id.toString(), adminId);
  const reloadedCol = await Collection.findById(testCol._id).lean();
  const reloadedColProduct = await Product.findById(colProduct._id).lean();

  const colPass = colDeleteResult.action === 'deleted' &&
                  reloadedCol === null &&
                  reloadedColProduct !== null &&
                  !reloadedColProduct.collectionIds?.map(id => id.toString()).includes(testCol._id.toString());

  console.log(`  [${colPass ? 'PASS' : 'FAIL'}] Collection deleted and cleanly unlinked from products`);
  console.log(`  [${reloadedColProduct !== null ? 'PASS' : 'FAIL'}] Product was NOT deleted; collection tag was removed`);

  // ----------------------------------------------------
  // 6. Cleanup
  // ----------------------------------------------------
  await Product.findByIdAndDelete(historicalProd._id);
  await ProductVariant.findByIdAndDelete(historicalVariant._id);
  await Order.findByIdAndDelete(historicalOrder._id);
  await Product.findByIdAndDelete(colProduct._id);
  console.log('\n [Cleanup] Test entities cleaned up.');

  const allPassed = unauthPass && customerPass && malformedPass && notFoundPass &&
                    archivePass && orderIntactPass && excludedFromCatalog &&
                    permanentPass && blockedCategoryDeletion && catSafeDeletePass && colPass;

  if (allPassed) {
    console.log('\n====================================================');
    console.log(' ALL CATALOG DELETION & ARCHIVE TESTS: 100% SUCCESS');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('\n CATALOG DELETION TESTS FAILED');
    process.exit(1);
  }
}

runCatalogDeletionTests().catch((err) => {
  console.error('Fatal error running catalog deletion QA:', err);
  process.exit(1);
});
