import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import bcrypt from 'bcryptjs';

async function seed() {
  const { connectDB } = await import('../src/lib/db');
  const User = (await import('../src/models/User')).default;
  const Category = (await import('../src/models/Category')).default;
  const Collection = (await import('../src/models/Collection')).default;
  const Product = (await import('../src/models/Product')).default;
  const ProductVariant = (await import('../src/models/ProductVariant')).default;
  const Coupon = (await import('../src/models/Coupon')).default;
  const Review = (await import('../src/models/Review')).default;

  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB.');

    // 1. Clear existing data
    console.log('[Seed] Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Collection.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('[Seed] Cleaned database.');

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const admin = await User.create({
      name: 'Salik Pirzada',
      email: 'pirzadasalik543@gmail.com',
      password: passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    const customer = await User.create({
      name: 'Ayaan Khan',
      email: 'customer@kashmirstag.com',
      password: passwordHash,
      role: 'customer',
      status: 'active',
      emailVerified: true,
    });

    console.log('[Seed] Created users: Admin (pirzadasalik543@gmail.com), Customer (customer@kashmirstag.com)');

    // 3. Seed Categories
    const tshirts = await Category.create({
      name: 'T-Shirts',
      slug: 'tshirts',
      description: 'Premium organic cotton everyday tees crafted with modern Kashmiri minimalist flair.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      sortOrder: 1,
      isActive: true,
    });

    const hoodies = await Category.create({
      name: 'Hoodies & Sweatshirts',
      slug: 'hoodies',
      description: 'Heavyweight, fleece-lined comfort engineered for winter resilience and timeless style.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
      sortOrder: 2,
      isActive: true,
    });

    const shawls = await Category.create({
      name: 'Kashmiri Shawls & Stoles',
      slug: 'shawls',
      description: 'Hand-woven masterpieces with exquisite Tilla and Sozni needlework by master artisans.',
      image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
      sortOrder: 3,
      isActive: true,
    });

    const footwear = await Category.create({
      name: 'Artisanal Footwear',
      slug: 'footwear',
      description: 'Handcrafted leather and ethnic footwear combining regal heritage with contemporary ergonomics.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      sortOrder: 4,
      isActive: true,
    });

    console.log('[Seed] Created categories.');

    // 4. Seed Collections
    const winterCollection = await Collection.create({
      name: 'Winter Warmth 2026',
      slug: 'winter-2026',
      description: 'Curated cold-weather essentials designed to protect against freezing Himalayan winds.',
      image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&q=80',
      isActive: true,
    });

    const signatureHeritage = await Collection.create({
      name: 'Signature Heritage',
      slug: 'signature-heritage',
      description: 'Timeless apparel and accessories celebrating authentic Kashmiri craft and culture.',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      isActive: true,
    });

    console.log('[Seed] Created collections.');

    // 5. Seed Products & Variants

    // Product 1: Classic Stag Tee
    const prod1 = await Product.create({
      title: 'Classic KashmirStag Signature Tee',
      slug: 'classic-kashmirstag-signature-tee',
      description: 'Crafted from 100% super-combed organic cotton, this signature crewneck features the embossed stag motif with breathable comfort that lasts all day.',
      shortDescription: '100% organic cotton, breathable everyday crewneck tee.',
      categoryId: tshirts._id,
      collectionIds: [signatureHeritage._id],
      tags: ['tshirt', 'casual', 'organic', 'signature'],
      basePrice: 69900,
      compareAtPrice: 99900,
      costPrice: 25000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      ],
      avgRating: 4.8,
      reviewCount: 14,
      totalSold: 82,
    });

    await ProductVariant.create([
      {
        productId: prod1._id,
        sku: 'STAG-TEE-BLK-S',
        color: 'Onyx Black',
        colorHex: '#111827',
        size: 'S',
        price: 69900,
        availableQty: 45,
        isActive: true,
      },
      {
        productId: prod1._id,
        sku: 'STAG-TEE-BLK-M',
        color: 'Onyx Black',
        colorHex: '#111827',
        size: 'M',
        price: 69900,
        availableQty: 60,
        isActive: true,
      },
      {
        productId: prod1._id,
        sku: 'STAG-TEE-BLK-L',
        color: 'Onyx Black',
        colorHex: '#111827',
        size: 'L',
        price: 69900,
        availableQty: 50,
        isActive: true,
      },
      {
        productId: prod1._id,
        sku: 'STAG-TEE-WHT-M',
        color: 'Pure White',
        colorHex: '#ffffff',
        size: 'M',
        price: 69900,
        availableQty: 30,
        isActive: true,
      },
    ]);

    // Product 2: Gulmarg Graphic Tee
    const prod2 = await Product.create({
      title: 'Gulmarg Pine Minimalist Graphic Tee',
      slug: 'gulmarg-pine-graphic-tee',
      description: 'An ode to the fragrant pine forests of Gulmarg, featuring an artistic geometric pine graphic hand-screened on ultra-soft jersey cotton.',
      shortDescription: 'Artistic pine motif on soft jersey cotton.',
      categoryId: tshirts._id,
      collectionIds: [signatureHeritage._id],
      tags: ['tshirt', 'graphic', 'nature', 'summer'],
      basePrice: 84900,
      compareAtPrice: 119900,
      costPrice: 28000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
        'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80',
      ],
      avgRating: 4.6,
      reviewCount: 9,
      totalSold: 41,
    });

    await ProductVariant.create([
      {
        productId: prod2._id,
        sku: 'GUL-TEE-GRN-M',
        color: 'Pine Green',
        colorHex: '#1e3a2f',
        size: 'M',
        price: 84900,
        availableQty: 25,
        isActive: true,
      },
      {
        productId: prod2._id,
        sku: 'GUL-TEE-GRN-L',
        color: 'Pine Green',
        colorHex: '#1e3a2f',
        size: 'L',
        price: 84900,
        availableQty: 35,
        isActive: true,
      },
    ]);

    // Product 3: Heavyweight Fleece Hoodie
    const prod3 = await Product.create({
      title: 'Himalayan Ridge Heavyweight Fleece Hoodie',
      slug: 'himalayan-ridge-heavyweight-fleece-hoodie',
      description: 'Built with 400 GSM brushed organic cotton fleece, custom ribbing, and double-layered thermal hood to keep you comfortable in sub-zero Himalayan weather.',
      shortDescription: '400 GSM heavyweight thermal fleece hoodie.',
      categoryId: hoodies._id,
      collectionIds: [winterCollection._id],
      tags: ['hoodie', 'winter', 'heavyweight', 'fleece'],
      basePrice: 189900,
      compareAtPrice: 269900,
      costPrice: 75000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80',
      ],
      avgRating: 4.9,
      reviewCount: 22,
      totalSold: 110,
    });

    await ProductVariant.create([
      {
        productId: prod3._id,
        sku: 'HIM-HD-GRY-M',
        color: 'Heather Gray',
        colorHex: '#6b7280',
        size: 'M',
        price: 189900,
        availableQty: 40,
        isActive: true,
      },
      {
        productId: prod3._id,
        sku: 'HIM-HD-GRY-L',
        color: 'Heather Gray',
        colorHex: '#6b7280',
        size: 'L',
        price: 189900,
        availableQty: 35,
        isActive: true,
      },
      {
        productId: prod3._id,
        sku: 'HIM-HD-BLK-L',
        color: 'Jet Black',
        colorHex: '#000000',
        size: 'L',
        price: 189900,
        availableQty: 50,
        isActive: true,
      },
    ]);

    // Product 4: Dal Lake Embroidered Pullover
    const prod4 = await Product.create({
      title: 'Dal Lake Embroidered Pullover Hoodie',
      slug: 'dal-lake-embroidered-pullover-hoodie',
      description: 'Featuring delicate tone-on-tone embroidery across the chest reflecting the shikaras of Dal Lake. Luxurious brushed cotton with a tailored modern drape.',
      shortDescription: 'Fine embroidered cotton pullover with plush interior.',
      categoryId: hoodies._id,
      collectionIds: [winterCollection._id, signatureHeritage._id],
      tags: ['hoodie', 'embroidered', 'pullover', 'winter'],
      basePrice: 229900,
      compareAtPrice: 319900,
      costPrice: 90000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
        'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
      ],
      avgRating: 4.7,
      reviewCount: 16,
      totalSold: 65,
    });

    await ProductVariant.create([
      {
        productId: prod4._id,
        sku: 'DAL-HD-NAV-M',
        color: 'Midnight Navy',
        colorHex: '#1e293b',
        size: 'M',
        price: 229900,
        availableQty: 20,
        isActive: true,
      },
      {
        productId: prod4._id,
        sku: 'DAL-HD-NAV-L',
        color: 'Midnight Navy',
        colorHex: '#1e293b',
        size: 'L',
        price: 229900,
        availableQty: 25,
        isActive: true,
      },
    ]);

    // Product 5: Authentic Kashmiri Tilla Shawl
    const prod5 = await Product.create({
      title: 'Authentic Royal Tilla Embroidered Woolen Shawl',
      slug: 'authentic-royal-tilla-embroidered-shawl',
      description: 'A genuine treasure of Kashmiri craftsmanship. Woven from 100% fine Merino wool and embellished with delicate golden Tilla thread embroidery by master artisans in Old Srinagar.',
      shortDescription: '100% fine Merino wool adorned with hand-stitched golden Tilla embroidery.',
      categoryId: shawls._id,
      collectionIds: [signatureHeritage._id],
      tags: ['shawl', 'tilla', 'embroidery', 'luxury', 'heritage'],
      basePrice: 549900,
      compareAtPrice: 799900,
      costPrice: 250000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
      ],
      avgRating: 5.0,
      reviewCount: 8,
      totalSold: 28,
    });

    await ProductVariant.create([
      {
        productId: prod5._id,
        sku: 'SHAWL-TILLA-IVR',
        color: 'Royal Ivory',
        colorHex: '#faf5ef',
        size: 'Free Size',
        price: 549900,
        availableQty: 12,
        isActive: true,
      },
      {
        productId: prod5._id,
        sku: 'SHAWL-TILLA-BLK',
        color: 'Midnight Black',
        colorHex: '#0f172a',
        size: 'Free Size',
        price: 549900,
        availableQty: 15,
        isActive: true,
      },
    ]);

    // Product 6: Artisanal Leather Peshawari Footwear
    const prod6 = await Product.create({
      title: 'Handcrafted Heritage Leather Peshawari Sandals',
      slug: 'handcrafted-heritage-leather-peshawari-sandals',
      description: 'Traditional Peshawari sandals crafted from full-grain vegetable-tanned leather. Features tire-tread rubber outsoles for exceptional grip and enduring durability.',
      shortDescription: 'Full-grain vegetable-tanned leather handcrafted sandals.',
      categoryId: footwear._id,
      collectionIds: [signatureHeritage._id],
      tags: ['footwear', 'leather', 'peshawari', 'handmade'],
      basePrice: 249900,
      compareAtPrice: 349900,
      costPrice: 110000,
      status: 'active',
      isVisible: true,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80',
      ],
      avgRating: 4.8,
      reviewCount: 11,
      totalSold: 37,
    });

    await ProductVariant.create([
      {
        productId: prod6._id,
        sku: 'PESH-BRN-8',
        color: 'Tan Brown',
        colorHex: '#854d0e',
        size: 'UK 8',
        price: 249900,
        availableQty: 18,
        isActive: true,
      },
      {
        productId: prod6._id,
        sku: 'PESH-BRN-9',
        color: 'Tan Brown',
        colorHex: '#854d0e',
        size: 'UK 9',
        price: 249900,
        availableQty: 22,
        isActive: true,
      },
      {
        productId: prod6._id,
        sku: 'PESH-BLK-9',
        color: 'Jet Black',
        colorHex: '#111827',
        size: 'UK 9',
        price: 249900,
        availableQty: 15,
        isActive: true,
      },
    ]);

    console.log('[Seed] Created products and variants.');

    // 6. Seed Coupons
    await Coupon.create([
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrderAmount: 50000, // ₹500
        maxDiscount: 20000, // ₹200
        usageLimit: 1000,
        perUserLimit: 1,
        usedCount: 12,
        isActive: true,
      },
      {
        code: 'KASHMIR50',
        type: 'fixed',
        value: 50000, // ₹500 flat off
        minOrderAmount: 199900, // min order ₹1,999
        usageLimit: 500,
        perUserLimit: 1,
        usedCount: 5,
        isActive: true,
      },
    ]);
    console.log('[Seed] Created coupons.');

    // 7. Seed Sample Reviews
    await Review.create([
      {
        productId: prod1._id,
        userId: customer._id,
        rating: 5,
        title: 'Outstanding fabric and fit!',
        body: 'The organic cotton feels so smooth and breathable. Even after several washes, the color has not faded at all. Kashmiri pride indeed!',
        isVerified: true,
        status: 'approved',
      },
      {
        productId: prod3._id,
        userId: customer._id,
        rating: 5,
        title: 'Genuinely warm and heavy duty',
        body: 'Best hoodie I have bought this year. The 400 GSM fleece is thick, premium, and cozy. Will definitely buy another color.',
        isVerified: true,
        status: 'approved',
      },
    ]);
    console.log('[Seed] Created sample reviews.');

    // Update product counts on categories
    await Category.findByIdAndUpdate(tshirts._id, { productCount: 2 });
    await Category.findByIdAndUpdate(hoodies._id, { productCount: 2 });
    await Category.findByIdAndUpdate(shawls._id, { productCount: 1 });
    await Category.findByIdAndUpdate(footwear._id, { productCount: 1 });

    console.log('[Seed] ========================================');
    console.log('[Seed] Database successfully seeded!');
    console.log('[Seed] Admin User: pirzadasalik543@gmail.com / Password123!');
    console.log('[Seed] Customer:   customer@kashmirstag.com / Password123!');
    console.log('[Seed] Categories: 4 | Products: 6 | Variants: 16 | Coupons: 2');
    console.log('[Seed] ========================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Failed:', error);
    process.exit(1);
  }
}

seed();
