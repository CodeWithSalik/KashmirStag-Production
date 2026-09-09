import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number');

export const pincodeSchema = z.string().regex(/^\d{6}$/, 'Invalid pincode');

export const priceSchema = z.number().int().min(0, 'Price cannot be negative');

export type PaginationSchema = z.infer<typeof paginationSchema>;
export type SortSchema = z.infer<typeof sortSchema>;
export type SearchSchema = z.infer<typeof searchSchema>;
