import { ProductGrid } from "./product-grid";
import { ProductCardType } from "./product-card";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';

export async function RelatedProducts({ productId, categoryId }: { productId: string, categoryId: string }) {
  await connectDB();
  
  const relatedDocs = (await Product.find({
    $or: [{ categoryId }, { category: categoryId }],
    _id: { $ne: productId },
    status: 'active'
  })
  .limit(4)
  .lean()) as any[];

  if (!relatedDocs.length) return null;

  const products: ProductCardType[] = relatedDocs.map(doc => ({
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    image: doc.images[0] || "",
    basePrice: doc.basePrice,
    compareAtPrice: doc.compareAtPrice,
    avgRating: doc.avgRating || 0,
    reviewCount: doc.reviewCount || 0
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">You Might Also Like</h2>
      <ProductGrid products={products} />
    </div>
  );
}
