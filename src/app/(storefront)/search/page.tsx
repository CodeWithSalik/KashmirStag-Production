import { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterSidebar } from "@/components/shared/filter-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';
import Category from '@/models/Category';
import { ProductCardType } from "@/components/product/product-card";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Search Results | KashmirStag",
  description: "Search products at KashmirStag.",
};

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  await connectDB();

  let productsDocs: any[] = [];
  if (query.trim()) {
    const searchRegex = new RegExp(query.trim(), "i");
    productsDocs = (await Product.find({
      status: 'active',
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    }).populate('categoryId', 'name').lean()) as any[];
  }

  const categoriesDocs = (await Category.find({ $or: [{ isActive: true }, { status: 'active' }] }).lean()) as any[];

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search", href: "/search" }]} className="mb-6" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">
          {query ? `Search results for "${query}"` : "Search Products"}
        </h1>
        <p className="text-text-secondary mt-2">{products.length} results found</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <FilterSidebar categories={categories} />
        </aside>
        <div className="flex-1">
          <ProductGrid products={products} emptyMessage={query ? "No products found matching your search." : "Type a query in the search bar above to find products."} />
        </div>
      </div>
    </div>
  );
}
