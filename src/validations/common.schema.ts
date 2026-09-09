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

export const phoneSchema = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  let digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}, z.string().regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number')) as z.ZodType<string>;

export const pincodeSchema = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/\s+/g, '').trim();
}, z.string().regex(/^\d{6}$/, 'Please provide a valid 6-digit PIN code')) as z.ZodType<string>;

export const priceSchema = z.number().int().min(0, 'Price cannot be negative');

export type PaginationSchema = z.infer<typeof paginationSchema>;
export type SortSchema = z.infer<typeof sortSchema>;
export type SearchSchema = z.infer<typeof searchSchema>;
