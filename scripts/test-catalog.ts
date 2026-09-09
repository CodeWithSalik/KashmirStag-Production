import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testCatalog() {
  const { connectDB } = await import('../src/lib/db');
  const { categoryService } = await import('../src/services/category.service');
  const { productService } = await import('../src/services/product.service');
  const Category = (await import('../src/models/Category')).default;
  const Product = (await import('../src/models/Product')).default;

  try {
    await connectDB();
    console.log('[CatalogTest] Connected to DB.');

    // 1. Categories
    const categories = await categoryService.getCategories(false);
    console.log(`[CatalogTest] Found ${categories.length} active categories:`);
    categories.forEach(c => console.log(`  - ${c.name} (slug: ${c.slug}, sortOrder: ${c.sortOrder})`));

    if (categories.length !== 4) {
      throw new Error(`Expected 4 categories, got ${categories.length}`);
    }

    // 2. Products
    const productsRes = await productService.getProducts({ limit: 10 });
    console.log(`[CatalogTest] Found ${productsRes.products.length} products (total: ${productsRes.total}):`);
    productsRes.products.forEach(p => console.log(`  - ${p.title} (₹${p.basePrice / 100}, slug: ${p.slug})`));

    if (productsRes.products.length < 6) {
      throw new Error(`Expected at least 6 products, got ${productsRes.products.length}`);
    }

    // 3. Product by slug with variants
    const productDetail = await productService.getProductBySlug('classic-kashmirstag-signature-tee');
    if (!productDetail) {
      throw new Error('Product classic-kashmirstag-signature-tee not found');
    }
    console.log(`[CatalogTest] Fetched detail for "${productDetail.title}" with ${(productDetail as any).variants?.length} variants.`);

    // 4. Category page simulation
    const categoryDoc = await Category.findOne({ slug: 'tshirts', isActive: true }).lean();
    if (!categoryDoc) {
      throw new Error('Category tshirts not found');
    }
    const catProducts = await Product.find({
      $or: [{ categoryId: categoryDoc._id }, { category: categoryDoc._id }],
      status: 'active',
    }).lean();
    console.log(`[CatalogTest] Category /category/tshirts has ${catProducts.length} products.`);

    console.log('[CatalogTest] All catalog tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[CatalogTest] Test failed:', err);
    process.exit(1);
  }
}

testCatalog();
