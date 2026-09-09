export interface ProductWithVariants {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  variants: ProductVariant[];
  [key: string]: any;
}

export interface ProductCard {
  id: string;
  title: string;
  slug: string;
  image: string;
  basePrice: number;
  compareAtPrice?: number;
  avgRating: number;
  reviewCount: number;
  categoryName: string;
}

export interface VariantOption {
  size?: string;
  color?: string;
  colorHex?: string;
  available: boolean;
}

export interface ProductVariant {
  _id?: string;
  id?: string;
  productId?: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  material?: string;
  price?: number;
  compareAtPrice?: number;
  availableQty: number;
  reservedQty?: number;
  lowStockThreshold?: number;
  image?: string;
  isActive?: boolean;
}
