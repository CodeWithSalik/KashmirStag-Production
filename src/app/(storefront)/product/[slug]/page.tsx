import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from '@/models/Product';
import ProductVariant from '@/models/ProductVariant';
import Category from '@/models/Category';
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductReviews } from "@/components/product/product-reviews";
import { RelatedProducts } from "@/components/product/related-products";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/star-rating";
import { AddToCartButton } from "./add-to-cart-button";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const product = await Product.findOne({ slug }).lean() as any;
  if (!product) return { title: "Product Not Found | KashmirStag" };
  return { 
    title: `${product.title} | KashmirStag`, 
    description: product.description || `Buy ${product.title} at KashmirStag.` 
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  
  const productDoc = await Product.findOne({ slug, status: 'active' }).lean() as any;
  if (!productDoc) notFound();

  // Find category if exists
  let categoryDoc = null;
  if (productDoc.categoryId) {
    categoryDoc = await Category.findById(productDoc.categoryId).lean() as any;
  }

  // Find variants
  const variantsDocs = (await ProductVariant.find({ 
    productId: productDoc._id,
    isActive: true 
  }).lean()) as any[];

  // Serialize productDoc and variantsDocs into plain JSON objects for Client Components (RSC boundary)
  const product = JSON.parse(JSON.stringify({ 
    ...productDoc, 
    _id: productDoc._id.toString(),
    categoryId: productDoc.categoryId ? productDoc.categoryId.toString() : null,
    collectionIds: Array.isArray(productDoc.collectionIds) ? productDoc.collectionIds.map((id: any) => id.toString()) : [],
    category: categoryDoc ? { ...categoryDoc, _id: categoryDoc._id.toString() } : null 
  }));
  
  const variants = JSON.parse(JSON.stringify(
    variantsDocs.map(v => ({ 
      ...v, 
      _id: v._id.toString(), 
      productId: v.productId ? v.productId.toString() : '',
      product: v.productId ? v.productId.toString() : '' 
    }))
  ));

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];
  if (product.category) {
    breadcrumbItems.push({ label: product.category.name, href: `/category/${product.category.slug}` });
  }
  breadcrumbItems.push({ label: product.title, href: `/product/${product.slug}` });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <ProductGallery images={product.images || []} title={product.title} />
        
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{product.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <StarRating rating={product.avgRating || 0} />
                <span className="text-sm text-text-secondary">({product.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <Price amount={product.basePrice} className="text-2xl font-bold text-brand-700" />
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <Price amount={product.compareAtPrice} className="text-lg text-text-secondary line-through" />
            )}
          </div>

          <div className="prose prose-sm text-text-secondary whitespace-pre-line">
            {product.description}
          </div>

          <AddToCartButton product={product} variants={variants} />

          <div className="border-t border-border pt-6 mt-6 text-sm text-text-secondary space-y-2">
            <p><strong>Shipping:</strong> Free shipping on orders over ₹999.</p>
            <p><strong>Returns:</strong> 7-day easy return policy.</p>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <ProductReviews productId={product._id} avgRating={product.avgRating || 0} reviewCount={product.reviewCount || 0} />
      </div>

      {product.categoryId && (
        <RelatedProducts productId={product._id} categoryId={product.categoryId.toString()} />
      )}
    </div>
  );
}
