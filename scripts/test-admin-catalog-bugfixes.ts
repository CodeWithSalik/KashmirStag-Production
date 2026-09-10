import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runBugfixTestSuite() {
  console.log('====================================================');
  console.log('  KASHMIRSTAG ADMIN CATALOG & INVENTORY BUGFIX QA');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const { signJwt } = await import('../src/lib/auth');
  const { uploadFile } = await import('../src/lib/upload');
  const { productService } = await import('../src/services/product.service');
  const { categoryService } = await import('../src/services/category.service');
  const { inventoryService } = await import('../src/services/inventory.service');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: Category } = await import('../src/models/Category');
  const { default: UploadedImage } = await import('../src/models/UploadedImage');
  const { default: InventoryTransaction } = await import('../src/models/InventoryTransaction');
  const { default: mongoose } = await import('mongoose');

  await connectDB();
  console.log('[DB] Connected to MongoDB Atlas\n');

  const adminToken = signJwt({ sub: 'admin-test-id', email: 'pirzadasalik543@gmail.com', role: 'admin' });
  const adminId = new mongoose.Types.ObjectId();

  // ----------------------------------------------------
  // Test 1: Category Creation Without Slug & Auto-Generation (Problem #6)
  // ----------------------------------------------------
  console.log('Test 1: Category Creation Without Slug:');
  const testCatName = `QA Test Silk Scarves ${Date.now()}`;
  let createdCategory: any = null;
  try {
    createdCategory = await categoryService.createCategory(
      { name: testCatName, description: 'Handmade Kashmiri silk scarves' },
      adminId
    );
  } catch (err: any) {
    console.error('Error in Test 1:', err);
  }
  const test1Pass = Boolean(createdCategory && createdCategory.slug && createdCategory.slug.includes('qa-test-silk-scarves'));
  console.log(`  [${test1Pass ? 'PASS' : 'FAIL'}] Category auto-generated slug: "${createdCategory?.slug}"`);

  // ----------------------------------------------------
  // Test 2: Category Duplicate Conflict Guard (Problem #6)
  // ----------------------------------------------------
  console.log('\nTest 2: Category Duplicate Slug Rejection (409 Conflict):');
  let duplicateConflictPass = false;
  try {
    await categoryService.createCategory(
      { name: testCatName, slug: createdCategory.slug, description: 'Duplicate attempt' },
      adminId
    );
  } catch (err: any) {
    duplicateConflictPass = err.statusCode === 409 || err.message.includes('already exists');
  }
  console.log(`  [${duplicateConflictPass ? 'PASS' : 'FAIL'}] Duplicate category rejected with ConflictError (409)`);

  // ----------------------------------------------------
  // Test 3: Image Upload & Serverless Persistence (Problem #4)
  // ----------------------------------------------------
  console.log('\nTest 3: Image Upload & MongoDB Persistence:');
  const testJpegBytes = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
    0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01,
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xBF, 0xFF, 0xD9
  ]);
  const fakeFile = new File([testJpegBytes], 'qa-upload.jpg', { type: 'image/jpeg' });
  const uploadedUrl = await uploadFile(fakeFile, 'products');

  // Verify stored in MongoDB Atlas
  const storedDoc = await UploadedImage.findOne({ pathname: uploadedUrl }).lean();
  const test3Pass = Boolean(uploadedUrl.startsWith('/uploads/products/') && storedDoc && (storedDoc.size > 0 || Boolean(storedDoc.data)));
  console.log(`  [${test3Pass ? 'PASS' : 'FAIL'}] Image saved and indexed in MongoDB Atlas at: ${uploadedUrl}`);

  // ----------------------------------------------------
  // Test 4: Product Creation with Initial Stock & SKU (Problems #1, #2)
  // ----------------------------------------------------
  console.log('\nTest 4: Product Creation with Initial Stock & Variant Provisioning:');
  const testProductSlug = `qa-test-pashmina-wrap-${Date.now()}`;
  const customSku = `KS-WRAP-999`;
  const initialStock = 30;

  const createdProduct = await productService.createProduct({
    title: 'QA Test Pure Pashmina Wrap',
    slug: testProductSlug,
    description: 'Test product for inventory and initial stock QA',
    basePrice: 1999900,
    status: 'active',
    isVisible: true,
    images: [
      uploadedUrl,
      'https://shahkaar.in/cdn/shop/files/sample_external.jpg'
    ],
    categoryId: createdCategory._id,
    initialStock,
    sku: customSku,
    size: 'Free Size',
    color: 'Saffron Gold',
  }, adminId);

  const variants = await ProductVariant.find({ productId: createdProduct._id }).lean();
  const primaryVariant = variants[0];

  const test4Pass = Boolean(
    variants.length === 1 &&
    primaryVariant.sku === customSku &&
    primaryVariant.availableQty === initialStock &&
    primaryVariant.isActive === true
  );
  console.log(`  [${test4Pass ? 'PASS' : 'FAIL'}] Variant created automatically: SKU=${primaryVariant?.sku}, AvailableQty=${primaryVariant?.availableQty}`);

  // ----------------------------------------------------
  // Test 5: Initial Inventory Transaction Logged
  // ----------------------------------------------------
  console.log('\nTest 5: Opening Inventory Transaction:');
  const invTx = await InventoryTransaction.findOne({ variantId: primaryVariant._id }).lean();
  const test5Pass = Boolean(invTx && invTx.type === 'RESTOCK' && invTx.quantity === initialStock);
  console.log(`  [${test5Pass ? 'PASS' : 'FAIL'}] RESTOCK transaction logged with qty=${invTx?.quantity}, type=${invTx?.type}`);

  // ----------------------------------------------------
  // Test 6: Newly Created Product Appears in Inventory Query (Problem #5)
  // ----------------------------------------------------
  console.log('\nTest 6: Inventory Management Visibility:');
  const lowStockThreshold = primaryVariant.lowStockThreshold;
  const inStockVariants = await ProductVariant.find({ availableQty: { $gt: 0 } }).lean();
  const foundInInventory = inStockVariants.some(v => v.productId.toString() === createdProduct._id.toString());
  console.log(`  [${foundInInventory ? 'PASS' : 'FAIL'}] Product appears in inventory queries with available stock`);

  // ----------------------------------------------------
  // Test 7: Storefront Product Availability & External Image URLs (Problems #3, #7)
  // ----------------------------------------------------
  console.log('\nTest 7: Storefront Availability & External Image URL Support:');
  const storefrontProduct = await productService.getProductBySlug(testProductSlug);
  const isOutOfStock = !storefrontProduct?.variants || storefrontProduct.variants.length === 0 || storefrontProduct.variants[0].availableQty <= 0;
  const externalImagePreserved = storefrontProduct?.images.includes('https://shahkaar.in/cdn/shop/files/sample_external.jpg');

  const test7Pass = !isOutOfStock && Boolean(externalImagePreserved);
  console.log(`  [${!isOutOfStock ? 'PASS' : 'FAIL'}] Product marked IN STOCK on storefront (Stock: ${storefrontProduct?.variants[0]?.availableQty})`);
  console.log(`  [${externalImagePreserved ? 'PASS' : 'FAIL'}] External merchant image URL preserved in product gallery`);

  // ----------------------------------------------------
  // Test 8: Live Pashmina Shawl Health Verification
  // ----------------------------------------------------
  console.log('\nTest 8: Live Pashmina Shawl Catalog State:');
  const liveProduct = await productService.getProductBySlug(
    'natural-grey-hashia-embroidered-kashmiri-pashmina-shawl-timeless-handwoven-luxury'
  );
  const liveVariants = liveProduct?.variants || [];
  const liveInStock = liveVariants.length > 0 && (liveVariants[0].availableQty || 0) > 0;
  console.log(`  [${liveInStock ? 'PASS' : 'FAIL'}] Live product has ${liveVariants.length} variant(s), stock: ${liveVariants[0]?.availableQty}`);
  console.log(`  [${liveProduct?.images?.length === 3 ? 'PASS' : 'FAIL'}] Live product has ${liveProduct?.images?.length} image(s) from shahkaar.in`);

  // ----------------------------------------------------
  // Test 9: Stock Adjustment on Variant
  // ----------------------------------------------------
  console.log('\nTest 9: Stock Adjustment API Service:');
  const updatedVariant = await inventoryService.adjustStock(
    primaryVariant._id.toString(),
    -5,
    'DAMAGE',
    adminId,
    'QA stock reduction test'
  );
  const test9Pass = updatedVariant.availableQty === initialStock - 5;
  console.log(`  [${test9Pass ? 'PASS' : 'FAIL'}] Stock reduced by 5: new availableQty=${updatedVariant.availableQty}`);

  // ----------------------------------------------------
  // Cleanup Test Artifacts
  // ----------------------------------------------------
  console.log('\n[Cleanup] Removing temporary test entities...');
  await Product.findByIdAndDelete(createdProduct._id);
  await ProductVariant.deleteMany({ productId: createdProduct._id });
  await InventoryTransaction.deleteMany({ productId: createdProduct._id });
  await Category.findByIdAndDelete(createdCategory._id);
  await UploadedImage.deleteOne({ pathname: uploadedUrl });
  console.log('[Cleanup] Test entities removed cleanly.');

  const allPassed = test1Pass && duplicateConflictPass && test3Pass && test4Pass && test5Pass && foundInInventory && test7Pass && liveInStock && test9Pass;

  if (allPassed) {
    console.log('\n====================================================');
    console.log(' ALL 7 BUG FIXES & WORKFLOWS VERIFIED: 100% SUCCESS');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('\n BUGFIX TEST SUITE FAILED');
    process.exit(1);
  }
}

runBugfixTestSuite().catch((err) => {
  console.error('[FATAL] Bugfix QA error:', err);
  process.exit(1);
});
