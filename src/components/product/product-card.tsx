'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";

export type ProductCardType = {
  id: string;
  title: string;
  slug: string;
  image: string;
  basePrice: number;
  compareAtPrice?: number;
  avgRating: number;
  reviewCount: number;
  categoryName?: string;
};

export function ProductCard({ product }: { product: ProductCardType }) {
  const [imgSrc, setImgSrc] = useState<string>(product.image || "/images/placeholder.svg");
  const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.basePrice);
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-secondary border border-border">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgSrc("/images/placeholder.svg")}
        />
        {hasDiscount && (
          <Badge className="absolute left-2 top-2 bg-brand-600 text-white hover:bg-brand-700">
            {discountPercent}% OFF
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {product.categoryName && (
          <span className="text-xs text-text-secondary">{product.categoryName}</span>
        )}
        <h3 className="text-sm font-medium text-text line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <StarRating rating={product.avgRating} />
          <span className="text-xs text-text-secondary">({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Price amount={product.basePrice} className="font-semibold text-text" />
          {hasDiscount && (
            <Price
              amount={product.compareAtPrice!}
              className="text-sm text-text-secondary line-through"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
