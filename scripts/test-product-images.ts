import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runProductImageWorkflowTests() {
  console.log('====================================================');
  console.log('  PRODUCT IMAGE MANAGEMENT — COMPLETE WORKFLOW QA');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const { signJwt } = await import('../src/lib/auth');
  const { uploadFile, saveUploadedFile } = await import('../src/lib/upload');
  const { productService } = await import('../src/services/product.service');
  const { default: Product } = await import('../src/models/Product');
  const { default: ProductVariant } = await import('../src/models/ProductVariant');
  const { default: Category } = await import('../src/models/Category');
  const { default: Collection } = await import('../src/models/Collection');
  const { default: AuditLog } = await import('../src/models/AuditLog');
  const { default: User } = await import('../src/models/User');

  await connectDB();
  console.log(' [DB] Connected to MongoDB Atlas');

  // ----------------------------------------------------
  // 1. API Authorization Tests
  // ----------------------------------------------------
  console.log('\n1. Testing Upload API Authorization:');
  const adminToken = signJwt({ sub: 'admin-test-id', email: 'admin@test.com', role: 'admin' });
  const customerToken = signJwt({ sub: 'cust-test-id', email: 'customer@test.com', role: 'customer' });

  // Simulate requireAdmin logic
  const { requireAdmin } = await import('../src/lib/auth');
  const { UnauthorizedError, ForbiddenError } = await import('../src/lib/errors');

  let unauthPass = false;
  try {
    const fakeReqNoAuth = { cookies: { get: () => undefined }, headers: new Headers() } as any;
    requireAdmin(fakeReqNoAuth);
  } catch (err: any) {
    unauthPass = err instanceof UnauthorizedError || err.statusCode === 401;
  }
  console.log(`  [${unauthPass ? 'PASS' : 'FAIL'}] Unauthenticated upload request rejected (401)`);

  let customerPass = false;
  try {
    const fakeReqCust = {
      cookies: { get: (name: string) => name === 'auth-token' ? { value: customerToken } : undefined },
      headers: new Headers(),
    } as any;
    requireAdmin(fakeReqCust);
  } catch (err: any) {
    customerPass = err instanceof ForbiddenError || err.statusCode === 403;
  }
  console.log(`  [${customerPass ? 'PASS' : 'FAIL'}] Customer upload request rejected (403 Forbidden)`);

  let adminPass = false;
  try {
    const fakeReqAdmin = {
      cookies: { get: (name: string) => name === 'auth-token' ? { value: adminToken } : undefined },
      headers: new Headers(),
    } as any;
    const user = requireAdmin(fakeReqAdmin);
    adminPass = user.role === 'admin';
  } catch (err) {
    adminPass = false;
  }
  console.log(`  [${adminPass ? 'PASS' : 'FAIL'}] Admin upload request authorized (200)`);

  // ----------------------------------------------------
  // 2. Upload Security & Magic Byte Inspection
  // ----------------------------------------------------
  console.log('\n2. Testing Upload Security & Magic Byte Inspection:');

  // A. Disguised executable/HTML
  let disguisedRejected = false;
  try {
    const maliciousBuffer = Buffer.from('<html><script>alert("XSS")</script></html>');
    const disguisedFile = new File([maliciousBuffer], 'exploit.jpg', { type: 'image/jpeg' });
    await uploadFile(disguisedFile, 'test-products');
  } catch (err: any) {
    disguisedRejected = err.message.includes('Invalid image content') || err.statusCode === 400;
  }
  console.log(`  [${disguisedRejected ? 'PASS' : 'FAIL'}] Disguised executable/HTML payload rejected`);

  // B. Oversized file (> 4MB)
  let oversizedRejected = false;
  try {
    const hugeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
    hugeBuffer[0] = 0xFF; hugeBuffer[1] = 0xD8; hugeBuffer[2] = 0xFF; // JPEG magic bytes
    const oversizedFile = new File([hugeBuffer], 'huge.jpg', { type: 'image/jpeg' });
    await uploadFile(oversizedFile, 'test-products');
  } catch (err: any) {
    oversizedRejected = err.message.includes('File too large') || err.statusCode === 400;
  }
  console.log(`  [${oversizedRejected ? 'PASS' : 'FAIL'}] Oversized file (>4MB) safely rejected`);

  // C. Genuine JPEG upload
  let genuineUploadedPath = '';
  try {
    // Valid 1x1 JPEG binary
    const validJpegBytes = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
      0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01,
      0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xBF, 0xFF, 0xD9
    ]);
    const validFile = new File([validJpegBytes], 'authentic-pashmina.jpg', { type: 'image/jpeg' });
    genuineUploadedPath = await uploadFile(validFile, 'test-products');
  } catch (err: any) {
    console.error('Error uploading genuine file:', err);
  }
  const genuinePass = Boolean(genuineUploadedPath && genuineUploadedPath.startsWith('/uploads/test-products/') && genuineUploadedPath.endsWith('.jpg'));
  console.log(`  [${genuinePass ? 'PASS' : 'FAIL'}] Genuine JPEG accepted: ${genuineUploadedPath}`);

  // ----------------------------------------------------
  // 3. Product Creation with Multiple Images & Primary Image Selection
  // ----------------------------------------------------
  console.log('\n3. Testing Product Creation with Multiple Images:');
  const imgA = genuineUploadedPath;
  const imgB = '/uploads/test-products/secondary-detail.jpg';
  const imgC = '/uploads/test-products/craft-closeup.jpg';

  const testSlug = `test-qa-pashmina-${Date.now()}`;
  const { default: mongoose } = await import('mongoose');
  const validAdminId = new mongoose.Types.ObjectId();

  const createdProduct = await productService.createProduct({
    title: 'QA Handcrafted Pashmina Shawl',
    slug: testSlug,
    description: 'Detailed description for QA testing product image workflow',
    basePrice: 150000,
    status: 'active',
    isVisible: true,
    images: [imgA, imgB, imgC], // 3 images, imgA is primary
  }, validAdminId);

  const creationPass = createdProduct.images.length === 3 && createdProduct.images[0] === imgA;
  console.log(`  [${creationPass ? 'PASS' : 'FAIL'}] Product created with 3 images`);
  console.log(`  [${createdProduct.images[0] === imgA ? 'PASS' : 'FAIL'}] Primary image set to index 0 (${createdProduct.images[0]})`);

  // ----------------------------------------------------
  // 4. Persistence After Refresh (Reload from Database)
  // ----------------------------------------------------
  console.log('\n4. Testing Persistence After Refresh (Database Retrieval):');
  const reloaded = await Product.findById(createdProduct._id).lean();
  const persistencePass = reloaded?.images?.length === 3 && reloaded?.images[0] === imgA && reloaded?.images[1] === imgB && reloaded?.images[2] === imgC;
  console.log(`  [${persistencePass ? 'PASS' : 'FAIL'}] All 3 images persist in order after reload`);

  // ----------------------------------------------------
  // 5. Image Reordering, Removal & Setting New Primary Image
  // ----------------------------------------------------
  console.log('\n5. Testing Image Reordering & Removal (Edit Workflow):');
  // Admin removes imgA, promotes imgB to primary, reorders imgC, and uploads imgD
  const imgD = '/uploads/test-products/new-box-packaging.jpg';
  const updatedImages = [imgB, imgD, imgC]; // imgB is now primary, imgA removed, imgD added

  const updatedProduct = await productService.updateProduct(
    createdProduct._id.toString(),
    { images: updatedImages },
    validAdminId
  );

  const reloadedUpdated = await Product.findById(createdProduct._id).lean();
  const reorderPass = reloadedUpdated?.images?.length === 3 &&
                      reloadedUpdated?.images[0] === imgB &&
                      reloadedUpdated?.images[1] === imgD &&
                      reloadedUpdated?.images[2] === imgC &&
                      !reloadedUpdated?.images.includes(imgA);

  console.log(`  [${reorderPass ? 'PASS' : 'FAIL'}] Old primary removed, new primary is imgB, new image imgD added`);
  console.log(`  [${reloadedUpdated?.images[0] === imgB ? 'PASS' : 'FAIL'}] Primary image updated to: ${reloadedUpdated?.images[0]}`);

  // ----------------------------------------------------
  // 6. Storefront Display & Catalog Card Verification
  // ----------------------------------------------------
  console.log('\n6. Testing Storefront Catalog & Detail Page Display:');
  const storefrontProduct = await productService.getProductBySlug(testSlug);
  const galleryImages = storefrontProduct?.images || [];
  const primaryStorefrontImage = storefrontProduct?.images[0];

  const storefrontPass = galleryImages.length === 3 && primaryStorefrontImage === imgB;
  console.log(`  [${storefrontPass ? 'PASS' : 'FAIL'}] Storefront gallery receives all 3 images`);
  console.log(`  [${primaryStorefrontImage === imgB ? 'PASS' : 'FAIL'}] Storefront primary image matches admin choice: ${primaryStorefrontImage}`);

  // ----------------------------------------------------
  // 7. Cleanup
  // ----------------------------------------------------
  await Product.findByIdAndDelete(createdProduct._id);
  console.log('\n [Cleanup] Test product deleted safely.');

  const allPassed = unauthPass && customerPass && adminPass && disguisedRejected && oversizedRejected &&
                    genuinePass && creationPass && persistencePass && reorderPass && storefrontPass;

  if (allPassed) {
    console.log('\n====================================================');
    console.log(' ALL PRODUCT IMAGE WORKFLOW CHECKS: 100% SUCCESS');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('\n PRODUCT IMAGE WORKFLOW TESTS FAILED');
    process.exit(1);
  }
}

runProductImageWorkflowTests().catch((err) => {
  console.error('Fatal error running product image QA:', err);
  process.exit(1);
});
