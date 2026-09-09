import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';
import Category from '@/models/Category';
import { ProductCardType } from "@/components/product/product-card";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const category = await Category.findOne({ slug }).lean() as any;
  if (!category) return { title: "Category Not Found | KashmirStag" };
  return { 
    title: `${category.name} | KashmirStag`, 
    description: category.description || `Shop ${category.name} at KashmirStag.` 
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const category = await Category.findOne({ slug }).lean() as any;
  if (!category) notFound();

  const productsDocs = (await Product.find({
    $or: [{ categoryId: category._id }, { category: category._id }],
    status: 'active'
  }).lean()) as any[];

  const products: ProductCardType[] = productsDocs.map(doc => ({
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    image: doc.images?.[0] || "",
    basePrice: doc.basePrice,
    compareAtPrice: doc.compareAtPrice,
    avgRating: doc.avgRating || 0,
    reviewCount: doc.reviewCount || 0
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Categories", href: "/categories" },
        { label: category.name, href: `/category/${category.slug}` }
      ]} className="mb-6" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text">{category.name}</h1>
        {category.description && <p className="text-text-secondary">{category.description}</p>}
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
