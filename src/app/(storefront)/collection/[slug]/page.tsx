import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';
import Collection from '@/models/Collection';
import { ProductCardType } from "@/components/product/product-card";

import { APP_NAME, APP_URL } from "@/config/constants";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const collection = await Collection.findOne({ slug }).lean() as any;
  if (!collection) return { title: `Collection Not Found | ${APP_NAME}` };
  const desc = collection.description || `Browse the ${collection.name} collection at ${APP_NAME}.`;
  return { 
    title: `${collection.name} | ${APP_NAME}`, 
    description: desc,
    alternates: {
      canonical: `${APP_URL}/collection/${collection.slug}`,
    },
    openGraph: {
      type: 'website',
      title: `${collection.name} | ${APP_NAME}`,
      description: desc,
      url: `${APP_URL}/collection/${collection.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${collection.name} | ${APP_NAME}`,
      description: desc,
    },
  };
}


export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const collection = await Collection.findOne({ slug, isActive: true }).lean() as any;
  if (!collection) notFound();

  const productsDocs = (await Product.find({ 
    collectionIds: collection._id,
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
        { label: "Shop", href: "/shop" },
        { label: collection.name, href: `/collection/${collection.slug}` }
      ]} className="mb-6" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text">{collection.name}</h1>
        {collection.description && <p className="text-text-secondary">{collection.description}</p>}
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
