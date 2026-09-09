import { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterSidebar } from "@/components/shared/filter-sidebar";
import { SortDropdown } from "@/components/shared/sort-dropdown";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/pagination";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';
import Category from '@/models/Category';
import { ProductCardType } from "@/components/product/product-card";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Shop All Products | KashmirStag",
  description: "Browse our complete collection of premium fashion and lifestyle products.",
};

export default async function ShopPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams;
  await connectDB();

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const limit = 12;
  const categorySlug = typeof resolvedParams.category === 'string' ? resolvedParams.category : null;
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'newest';

  let query: any = { status: 'active' };

  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).lean() as any;
    if (cat) {
      query.$or = [{ categoryId: cat._id }, { category: cat._id }];
    }
  }

  let sortObj: any = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { basePrice: 1 };
  if (sort === 'price_desc') sortObj = { basePrice: -1 };
  if (sort === 'popular') sortObj = { totalSold: -1 };
  if (sort === 'rating') sortObj = { avgRating: -1 };

  const [productsDocs, totalDocs, categoriesDocs] = (await Promise.all([
    Product.find(query)
      .select('title slug images basePrice compareAtPrice avgRating reviewCount categoryId')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('categoryId', 'name')
      .lean(),
    Product.countDocuments(query),
    Category.find({ $or: [{ isActive: true }, { status: 'active' }] })
      .select('name slug')
      .lean()
  ])) as [any[], number, any[]];

  const products: ProductCardType[] = productsDocs.map(doc => ({
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    image: doc.images?.[0] || "",
    basePrice: doc.basePrice,
    compareAtPrice: doc.compareAtPrice,
    avgRating: doc.avgRating || 0,
    reviewCount: doc.reviewCount || 0,
    categoryName: doc.categoryId?.name
  }));

  const categories = categoriesDocs.map(c => ({ id: c._id.toString(), name: c.name, slug: c.slug }));
  const totalPages = Math.ceil(totalDocs / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" }
      ]} className="mb-6" />

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <FilterSidebar categories={categories} />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text">All Products ({totalDocs})</h1>
            <SortDropdown />
          </div>

          <ProductGrid products={products} />

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
