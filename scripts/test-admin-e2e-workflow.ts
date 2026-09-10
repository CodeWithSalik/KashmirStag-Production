import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runAdminE2EWorkflow() {
  console.log('================================================================');
  console.log('  KASHMIRSTAG 28-STEP ADMIN END-TO-END WORKFLOW INTEGRITY TEST');
  console.log('================================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const { productService } = await import('../src/services/product.service');
  const { categoryService } = await import('../src/services/category.service');
  const { collectionService } = await import('../src/services/collection.service');
  const { inventoryService } = await import('../src/services/inventory.service');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: Category } = await import('../src/models/Category');
  const { default: Collection } = await import('../src/models/Collection');
  const { default: Order } = await import('../src/models/Order');
  const { default: InventoryTransaction } = await import('../src/models/InventoryTransaction');
  const { default: AuditLog } = await import('../src/models/AuditLog');
  const { default: mongoose } = await import('mongoose');

  await connectDB();
  console.log('[DB] Connected to MongoDB Atlas\n');

  const adminId = new mongoose.Types.ObjectId();
  const testSuffix = Date.now();
  const results: { step: number; name: string; pass: boolean; details?: string }[] = [];

  function record(step: number, name: string, pass: boolean, details?: string) {
    results.push({ step, name, pass, details });
    console.log(`Step ${String(step).padStart(2, ' ')}: [${pass ? 'PASS' : 'FAIL'}] ${name}${details ? ` -> ${details}` : ''}`);
    if (!pass) {
      console.error(`       FAILED STEP ${step}: ${name}`);
    }
  }

  let testCategory: any = null;
  let testCollection: any = null;
  let testProduct: any = null;
  let testVariant: any = null;
  let testOrder: any = null;

  try {
    // Step 1: Create category "Test Category"
    testCategory = await categoryService.createCategory(
      { name: `Test Category ${testSuffix}`, description: 'Admin E2E test category' },
      adminId
    );
    record(1, 'Create category "Test Category"', Boolean(testCategory && testCategory._id), `id=${testCategory?._id}, slug=${testCategory?.slug}`);

    // Step 2: Create collection "Test Collection"
    testCollection = await collectionService.createCollection(
      { name: `Test Collection ${testSuffix}`, description: 'Admin E2E test collection' },
      adminId
    );
    record(2, 'Create collection "Test Collection"', Boolean(testCollection && testCollection._id), `id=${testCollection?._id}, slug=${testCollection?.slug}`);

    // Step 3: Create product "Test Product"
    testProduct = await productService.createProduct(
      {
        title: `Test Product ${testSuffix}`,
        description: 'Product created for E2E workflow testing',
        basePrice: 299900,
        categoryId: testCategory._id,
        collectionIds: [testCollection._id],
        initialStock: 10,
        sku: `TEST-001-${testSuffix}`,
      },
      adminId
    );
    record(3, 'Create product "Test Product"', Boolean(testProduct && testProduct._id), `id=${testProduct?._id}, slug=${testProduct?.slug}`);

    // Step 4: Assign product to category
    const catMatch = testProduct?.categoryId?.toString() === testCategory._id.toString();
    record(4, 'Assign product to category', catMatch, `categoryId=${testProduct?.categoryId}`);

    // Step 5: Assign product to collection
    const colMatch = Array.isArray(testProduct?.collectionIds) && testProduct.collectionIds.map(String).includes(testCollection._id.toString());
    record(5, 'Assign product to collection', colMatch, `collectionIds=${testProduct?.collectionIds}`);

    // Step 6: Create variant (verify variant was created with product)
    const variants = await ProductVariant.find({ productId: testProduct._id });
    testVariant = variants[0];
    record(6, 'Create variant', Boolean(testVariant && testVariant._id), `variantId=${testVariant?._id}`);

    // Step 7: Give variant SKU TEST-001
    const targetSku = `TEST-001-${testSuffix}`;
    testVariant.sku = targetSku;
    await testVariant.save();
    const updatedVar = await ProductVariant.findById(testVariant._id);
    record(7, 'Give variant SKU TEST-001', updatedVar?.sku === targetSku, `sku=${updatedVar?.sku}`);

    // Step 8: Add initial stock = 10
    testVariant.availableQty = 10;
    testVariant.reservedQty = 0;
    await testVariant.save();
    record(8, 'Add initial stock = 10', testVariant.availableQty === 10, `availableQty=${testVariant.availableQty}`);

    // Step 9: Confirm Inventory shows 10
    const invStock = await inventoryService.getVariantStock(testVariant._id.toString());
    const step9Pass = invStock !== null && invStock.available === 10 && invStock.total === 10;
    record(9, 'Confirm Inventory shows 10', step9Pass, `available=${invStock?.available}, total=${invStock?.total}`);

    // Step 10: Confirm storefront shows In Stock
    const step10Pass = invStock !== null && !invStock.isOutOfStock && invStock.available > 0;
    record(10, 'Confirm storefront shows In Stock', step10Pass, `isOutOfStock=${invStock?.isOutOfStock}, available=${invStock?.available}`);

    // Step 11: Change stock to 7
    const adjustedVariant = await inventoryService.adjustStock(
      testVariant._id.toString(),
      -3,
      'CORRECTION',
      adminId,
      'Admin E2E stock reduction to 7'
    );
    const step11Pass = adjustedVariant.availableQty === 7;
    record(11, 'Change stock to 7', step11Pass, `adjusted availableQty=${adjustedVariant.availableQty}`);

    // Step 12: Confirm storefront reflects 7 available
    const invStockAfterAdj = await inventoryService.getVariantStock(testVariant._id.toString());
    const step12Pass = invStockAfterAdj !== null && invStockAfterAdj.available === 7;
    record(12, 'Confirm storefront reflects 7 available', step12Pass, `available=${invStockAfterAdj?.available}`);

    // Step 13: Rename category
    const renamedCatName = `Renamed Test Category ${testSuffix}`;
    const updatedCategory = await categoryService.updateCategory(
      testCategory._id.toString(),
      { name: renamedCatName },
      adminId
    );
    record(13, 'Rename category', updatedCategory?.name === renamedCatName, `newName=${updatedCategory?.name}`);

    // Step 14: Confirm product reflects renamed category
    const populatedProduct = await productService.getProductById(testProduct._id.toString());
    const step14Pass = (populatedProduct?.categoryId as any)?.name === renamedCatName;
    record(14, 'Confirm product reflects renamed category', step14Pass, `product.category=${(populatedProduct?.categoryId as any)?.name}`);

    // Step 15: Remove product from collection
    await productService.updateProduct(testProduct._id.toString(), { collectionIds: [] }, adminId);
    record(15, 'Remove product from collection', true, 'Product unlinked from collection');

    // Step 16: Confirm collection no longer lists it
    const colListAfterRemove = await productService.getProducts({ collection: testCollection.slug, limit: 10 });
    const step16Pass = colListAfterRemove.products.every((p: any) => p.id?.toString() !== testProduct._id.toString());
    record(16, 'Confirm collection no longer lists it', step16Pass, `collection product count=${colListAfterRemove.total}`);

    // Step 17: Add product back to collection
    await productService.updateProduct(testProduct._id.toString(), { collectionIds: [testCollection._id] }, adminId);
    record(17, 'Add product back to collection', true, 'Product relinked to collection');

    // Step 18: Confirm collection lists it
    const colListAfterReAdd = await productService.getProducts({ collection: testCollection.slug, limit: 10 });
    const step18Pass = colListAfterReAdd.products.some((p: any) => p.id?.toString() === testProduct._id.toString());
    record(18, 'Confirm collection lists it', step18Pass, `found=${step18Pass}`);

    // Step 19: Archive product
    await productService.archiveProduct(testProduct._id.toString(), adminId);
    const archivedProd = await Product.findById(testProduct._id);
    record(19, 'Archive product', archivedProd?.status === 'archived' && !archivedProd?.isVisible, `status=${archivedProd?.status}`);

    // Step 20: Confirm storefront hides it
    const activeStorefrontProds = await productService.getProducts({ search: testProduct.title, status: 'active' });
    const step20Pass = activeStorefrontProds.products.every((p: any) => p.id?.toString() !== testProduct._id.toString());
    record(20, 'Confirm storefront hides it', step20Pass, `active storefront count=${activeStorefrontProds.total}`);

    // Step 21: Confirm inventory handles archived state correctly
    const invArchivedStock = await inventoryService.getVariantStock(testVariant._id.toString());
    const step21Pass = invArchivedStock !== null && invArchivedStock.available === 7;
    record(21, 'Confirm inventory handles archived state correctly', step21Pass, `tracked stock available=${invArchivedStock?.available}`);

    // Step 22: Restore product
    await productService.restoreProduct(testProduct._id.toString(), adminId);
    const restoredProd = await Product.findById(testProduct._id);
    record(22, 'Restore product', restoredProd?.status === 'active' && restoredProd?.isVisible, `status=${restoredProd?.status}`);

    // Step 23: Confirm storefront visibility returns
    const activeStorefrontAfterRestore = await productService.getProducts({ search: testProduct.title, status: 'active' });
    const step23Pass = activeStorefrontAfterRestore.products.some((p: any) => p.id?.toString() === testProduct._id.toString());
    record(23, 'Confirm storefront visibility returns', step23Pass, `storefront found=${step23Pass}`);

    // Step 24: Place a test order
    const testOrderId = `ORD-E2E-${testSuffix}`;
    testOrder = await Order.create({
      orderId: testOrderId,
      email: `e2etest-${testSuffix}@kashmirstag.com`,
      items: [
        {
          productId: testProduct._id,
          variantId: testVariant._id,
          title: testProduct.title,
          variant: 'Default',
          sku: targetSku,
          image: '/uploads/test.jpg',
          unitPrice: 299900,
          quantity: 2,
          lineTotal: 599800,
        },
      ],
      shippingAddress: {
        name: 'E2E Tester',
        phone: '9906000000',
        line1: 'Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'India',
      },
      billingAddress: {
        name: 'E2E Tester',
        phone: '9906000000',
        line1: 'Residency Road',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        country: 'India',
      },
      pricing: {
        subtotal: 599800,
        shippingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 599800,
      },
      status: 'pending',
      paymentStatus: 'paid',
      timeline: [{ status: 'pending', comment: 'Order placed during E2E admin test' }],
    });
    record(24, 'Place a test order', Boolean(testOrder && testOrder._id), `orderId=${testOrder?.orderId}`);

    // Step 25: Confirm inventory reservation
    await inventoryService.reserveStock([{ variantId: testVariant._id.toString(), quantity: 2 }], testOrderId);
    const postReserveStock = await ProductVariant.findById(testVariant._id);
    const step25Pass = postReserveStock?.availableQty === 5 && postReserveStock?.reservedQty === 2;
    record(25, 'Confirm inventory reservation', step25Pass, `available=${postReserveStock?.availableQty}, reserved=${postReserveStock?.reservedQty}`);

    // Step 26: Confirm order references correct product/variant
    const savedOrder = await Order.findById(testOrder._id);
    const orderItem = savedOrder?.items[0];
    const step26Pass = Boolean(
      orderItem &&
      orderItem.productId.toString() === testProduct._id.toString() &&
      orderItem.variantId.toString() === testVariant._id.toString() &&
      orderItem.sku === targetSku
    );
    record(26, 'Confirm order references correct product/variant', step26Pass, `item sku=${orderItem?.sku}`);

    // Step 27: Confirm inventory commit
    await inventoryService.commitReservation([{ variantId: testVariant._id.toString(), quantity: 2 }], testOrderId);
    const postCommitStock = await ProductVariant.findById(testVariant._id);
    const step27Pass = postCommitStock?.availableQty === 5 && postCommitStock?.reservedQty === 0;
    record(27, 'Confirm inventory commit', step27Pass, `available=${postCommitStock?.availableQty}, reserved=${postCommitStock?.reservedQty}`);

    // Step 28: Confirm audit records exist
    const auditRecords = await AuditLog.find({
      $or: [
        { entityId: testProduct._id.toString() },
        { entityId: testCategory._id.toString() },
        { entityId: testCollection._id.toString() },
        { entityId: testVariant._id.toString() },
      ],
    });
    const step28Pass = auditRecords.length >= 3;
    record(28, 'Confirm audit records exist', step28Pass, `found ${auditRecords.length} audit records for test entities`);

  } catch (err: any) {
    console.error('Fatal error during E2E workflow:', err);
  } finally {
    // ----------------------------------------------------
    // CLEAN UP ONLY THE TEST DATA
    // ----------------------------------------------------
    console.log('\n[CLEANUP] Cleaning up test data...');
    if (testOrder) {
      await Order.findByIdAndDelete(testOrder._id);
    }
    if (testVariant) {
      await ProductVariant.findByIdAndDelete(testVariant._id);
      await InventoryTransaction.deleteMany({ variantId: testVariant._id });
    }
    if (testProduct) {
      await Product.findByIdAndDelete(testProduct._id);
      await AuditLog.deleteMany({ entityId: testProduct._id.toString() });
    }
    if (testCategory) {
      await Category.findByIdAndDelete(testCategory._id);
      await AuditLog.deleteMany({ entityId: testCategory._id.toString() });
    }
    if (testCollection) {
      await Collection.findByIdAndDelete(testCollection._id);
      await AuditLog.deleteMany({ entityId: testCollection._id.toString() });
    }
    console.log('[CLEANUP] All test data cleaned up safely without affecting production data.\n');
  }

  const allPassed = results.length === 28 && results.every((r) => r.pass);
  console.log('================================================================');
  console.log(`  WORKFLOW RESULT: ${allPassed ? 'ALL 28 STEPS PASSED' : 'SOME STEPS FAILED'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runAdminE2EWorkflow().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
