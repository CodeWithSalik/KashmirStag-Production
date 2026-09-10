import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function healCatalogVariants() {
  console.log('====================================================');
  console.log('  KASHMIRSTAG CATALOG & VARIANT HEALING SCRIPT');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const Product = (await import('../src/models/Product')).default;
  const ProductVariant = (await import('../src/models/ProductVariant')).default;
  const InventoryTransaction = (await import('../src/models/InventoryTransaction')).default;
  const Category = (await import('../src/models/Category')).default;

  await connectDB();
  console.log('[DB] Connected to MongoDB Atlas');

  // 1. Find all active products
  const products = await Product.find({ status: 'active' });
  console.log(`[Healing] Inspecting ${products.length} active product(s)...`);

  let healedCount = 0;

  for (const product of products) {
    const existingVariants = await ProductVariant.find({ productId: product._id });
    if (existingVariants.length === 0) {
      console.log(`\n -> Product "${product.title}" (${product._id}) has 0 variants.`);
      
      const cleanSlug = (product.slug || 'PROD').substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const generatedSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const variantSku = `KS-${cleanSlug}-${generatedSuffix}`;
      const initialStock = 25; // Good starting inventory for live catalog

      const variant = await ProductVariant.create({
        productId: product._id,
        sku: variantSku,
        price: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        size: '100 x 200 cm',
        color: 'Natural Grey',
        material: '100% Pashmina',
        availableQty: initialStock,
        reservedQty: 0,
        lowStockThreshold: 5,
        image: product.images?.[0] || undefined,
        isActive: true,
      });

      await InventoryTransaction.create({
        variantId: variant._id,
        productId: product._id,
        type: 'RESTOCK',
        quantity: initialStock,
        note: 'Auto-provisioned initial inventory for live catalog product',
      });

      console.log(`    Created variant SKU: ${variantSku}, Available Qty: ${initialStock}`);
      healedCount++;
    } else {
      console.log(` -> Product "${product.title}" already has ${existingVariants.length} variant(s).`);
    }
  }

  // 2. Ensure at least 1 core Category exists if none exist
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    console.log('\n[Healing] 0 categories found. Creating default "Pashmina Shawls" category...');
    const pashminaCat = await Category.create({
      name: 'Pashmina Shawls',
      slug: 'pashmina-shawls',
      description: 'Authentic handwoven Kashmiri Pashmina shawls, stoles, and scarves.',
      isActive: true,
      sortOrder: 1,
    });
    console.log(`    Created Category: ${pashminaCat.name} (slug: ${pashminaCat.slug})`);

    // Assign orphaned products to this category
    const uncatProducts = await Product.find({ categoryId: null });
    for (const p of uncatProducts) {
      p.categoryId = pashminaCat._id;
      await p.save();
      console.log(`    Assigned product "${p.title}" to category "${pashminaCat.name}"`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`  HEALING COMPLETED: ${healedCount} product(s) healed with inventory.`);
  console.log('====================================================\n');
  process.exit(0);
}

healCatalogVariants().catch((err) => {
  console.error('[FATAL] Healing error:', err);
  process.exit(1);
});
