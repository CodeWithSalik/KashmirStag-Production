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
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-secondary border border-border group-hover:border-neutral-300 transition-all duration-200">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          onError={() => setImgSrc("/images/placeholder.svg")}
        />
        {hasDiscount && (
          <span className="absolute left-2.5 top-2.5 bg-brand-700 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        {product.categoryName && (
          <span className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
            {product.categoryName}
          </span>
        )}
        <h3 className="text-sm font-medium text-text line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
          {product.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StarRating rating={product.avgRating} />
          <span className="text-xs text-text-tertiary">({product.reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <Price amount={product.basePrice} className="text-sm font-semibold text-text" />
          {hasDiscount && (
            <Price
              amount={product.compareAtPrice!}
              className="text-xs text-text-tertiary line-through"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
