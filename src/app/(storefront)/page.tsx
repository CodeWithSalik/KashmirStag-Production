import { Metadata } from 'next';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { ProductCard, ProductCardType } from '@/components/product/product-card';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'KashmirStag — Authentic Artisanal Fashion & Heritage Craft from Kashmir',
  description: 'Discover genuine Kashmiri Pashmina shawls, artisanal apparel, handcrafted footwear, and lifestyle essentials. Hand-spun craftsmanship delivered worldwide.',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  await connectDB();

  // Fetch active categories with lean projection
  const categoriesDocs = await Category.find({ isActive: { $ne: false } })
    .select('name slug description image sortOrder')
    .sort({ sortOrder: 1 })
    .lean();

  // Aggregate product counts across active categories in a single query (eliminates N+1)
  const categoryIds = categoriesDocs.map((c: any) => c._id);
  const countAggregations = await Product.aggregate([
    {
      $match: {
        status: 'active',
        $or: [
          { categoryId: { $in: categoryIds } },
          { category: { $in: categoryIds } },
        ],
      },
    },
    {
      $group: {
        _id: { $ifNull: ['$categoryId', '$category'] },
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map<string, number>(
    countAggregations.map((item: any) => [item._id?.toString(), item.count])
  );

  const categories = categoriesDocs.map((cat: any) => ({
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    image: cat.image || '',
    productCount: countMap.get(cat._id.toString()) || 0,
  }));

  // Fetch featured products with lean projections
  const productsDocs = await Product.find({ status: 'active', isVisible: true })
    .select('title slug images basePrice compareAtPrice avgRating reviewCount categoryId')
    .sort({ totalSold: -1, createdAt: -1 })
    .limit(4)
    .populate('categoryId', 'name')
    .lean();

  const featuredProducts: ProductCardType[] = productsDocs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    image: doc.images?.[0] || '',
    basePrice: doc.basePrice,
    compareAtPrice: doc.compareAtPrice,
    avgRating: doc.avgRating || 0,
    reviewCount: doc.reviewCount || 0,
    categoryName: doc.categoryId?.name,
  }));

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative bg-surface-inverse text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ca8a04_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="container-page relative py-20 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-400 bg-brand-950/60 border border-brand-800/60 rounded-full mb-4">
              Authentic Kashmiri Craft &amp; Lifestyle
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl text-white">
              Timeless Elegance,
              <br />
              <span className="text-brand-400">Direct From Kashmir</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 leading-relaxed">
              Experience the pinnacle of craftsmanship — from hand-spun Merino wool shawls with royal Tilla embroidery to heavyweight organic cotton tees and artisanal footwear.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-md bg-brand-700 px-8 py-3.5 text-sm font-semibold text-white transition-all shadow-md hover:bg-brand-800 hover:shadow-lg"
              >
                Shop Collection &rarr;
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center rounded-md border border-gray-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-brand-500 hover:text-brand-300"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-b border-border bg-surface-secondary py-10" aria-label="Store Benefits">
        <h2 className="sr-only">Why Choose KashmirStag</h2>
        <div className="container-page">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: '🏔️', title: 'Authentic Kashmir Craft', desc: 'Directly sourced from master artisans' },
              { icon: '🚚', title: 'Free Express Shipping', desc: 'On all orders above ₹999' },
              { icon: '🔒', title: 'Secure Checkout', desc: 'Protected by Razorpay 256-bit encryption' },
              { icon: '↩️', title: '7-Day Easy Returns', desc: 'No-hassle returns and exchanges' },
            ].map((item) => (
              <div key={item.title} className="text-center p-3">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-brand-50 border-b border-brand-100 py-3">
        <div className="container-page flex items-center justify-center gap-3 text-center text-sm">
          <span className="font-semibold text-brand-800">Special Welcome Offer:</span>
          <span className="text-brand-700">
            Use code <span className="font-mono font-bold bg-brand-200/80 px-2 py-0.5 rounded text-brand-900">WELCOME10</span> for 10% off your first order!
          </span>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl text-text">Shop by Category</h2>
              <p className="mt-2 text-text-secondary">
                Curated collections handcrafted with care and heritage
              </p>
            </div>
            <Link
              href="/categories"
              className="mt-4 sm:mt-0 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              View All Categories &rarr;
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group relative flex flex-col justify-end h-72 overflow-hidden rounded-xl bg-surface-tertiary p-6 border border-border transition-all duration-300 hover:shadow-elevated hover:border-brand-500"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10" />
                <div className="relative z-20 text-white">
                  <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">
                    {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                  </span>
                  <h3 className="text-xl font-bold mt-1 group-hover:text-brand-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 mt-3 group-hover:translate-x-1 transition-transform">
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-surface-secondary border-t border-border">
          <div className="container-page">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl text-text">Featured Products</h2>
                <p className="mt-2 text-text-secondary">
                  Our most popular pieces crafted for comfort and distinction
                </p>
              </div>
              <Link
                href="/shop"
                className="mt-4 sm:mt-0 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                Shop All Products &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Heritage Story */}
      <section className="py-16 md:py-20">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              The KashmirStag Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-text mt-3">
              Rooted in Srinagar, Crafted for the Modern World
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              Every garment and accessory at KashmirStag is born from the rich textile heritage of Jammu &amp; Kashmir. By pairing centuries-old needlecraft with contemporary cuts and premium organic textiles, we create garments that endure — both in quality and timeless style.
            </p>
            <div className="mt-8">
              <Link
                href="/about"
                className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                Read Our Story &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-brand-700 py-16 text-center text-white">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to Upgrade Your Wardrobe?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">
            Join thousands of customers who experience authentic quality and craftsmanship with KashmirStag.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center rounded-md bg-white px-8 py-3.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 shadow-md"
          >
            Explore Complete Shop
          </Link>
        </div>
      </section>
    </main>
  );
}
