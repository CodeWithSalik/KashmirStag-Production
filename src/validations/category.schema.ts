import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name cannot exceed 100 characters'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens').optional(),
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  parentId: objectIdSchema.optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
  }).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
