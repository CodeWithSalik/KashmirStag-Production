import { z } from 'zod';
import { objectIdSchema, priceSchema } from './common.schema';
import { PRODUCT_STATUSES } from '@/config/constants';

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().default(''),
  shortDescription: z.string().max(500).optional(),
  images: z.array(z.string().min(1)).max(10).default([]),
  categoryId: objectIdSchema.optional().nullable(),
  collectionIds: z.array(objectIdSchema).optional(),
  tags: z.array(z.string()).max(20).optional(),
  basePrice: priceSchema,
  compareAtPrice: priceSchema.optional(),
  costPrice: priceSchema.optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  isVisible: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  // Initial inventory & variant options
  sku: z.string().optional(),
  initialStock: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  productId: objectIdSchema,
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  material: z.string().optional(),
  price: priceSchema.optional(),
  compareAtPrice: priceSchema.optional(),
  costPrice: priceSchema.optional(),
  availableQty: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  image: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ productId: true });

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type CreateVariantSchema = z.infer<typeof createVariantSchema>;
export type UpdateVariantSchema = z.infer<typeof updateVariantSchema>;
