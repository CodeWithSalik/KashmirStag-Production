import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Categories | KashmirStag',
  description: 'Browse all categories of premium clothing and lifestyle products from KashmirStag.',
};

export default async function CategoriesPage() {
  await connectDB();
  const categories = await Category.find({ isActive: { $ne: false } }).sort({ sortOrder: 1 }).lean();

  // Get product count per category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat: any) => {
      const count = await Product.countDocuments({
        $or: [{ categoryId: cat._id }, { category: cat._id }],
        status: 'active',
      });
      return {
        ...cat,
        productCount: count,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
        ]}
        className="mb-6"
      />

      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">Shop by Category</h1>
        <p className="text-text-secondary">
          Explore our exclusive collections handcrafted and selected for comfort, style, and quality.
        </p>
      </div>

      {categoriesWithCount.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          No categories found. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithCount.map((cat: any) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group relative flex flex-col justify-end h-72 overflow-hidden rounded-xl bg-surface-tertiary p-6 border border-border transition-all duration-300 hover:shadow-elevated hover:border-brand-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="relative z-20 text-white">
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">
                  {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                </span>
                <h2 className="text-2xl font-bold mt-1 group-hover:text-brand-300 transition-colors">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-sm text-gray-200 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-400 mt-3 group-hover:translate-x-1 transition-transform">
                  Browse Collection &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
