import { z } from 'zod';
import { objectIdSchema, priceSchema } from './common.schema';
import { COUPON_TYPES } from '@/config/constants';

export const createCouponSchema = z.object({
  code: z.string().trim().min(1).max(50).toUpperCase(),
  type: z.enum(COUPON_TYPES),
  value: z.number().positive(),
  minOrderAmount: priceSchema.optional(),
  maxDiscount: priceSchema.optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  applicableTo: z.object({
    categoryIds: z.array(objectIdSchema).optional(),
    productIds: z.array(objectIdSchema).optional(),
  }).optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export type CreateCouponSchema = z.infer<typeof createCouponSchema>;
export type UpdateCouponSchema = z.infer<typeof updateCouponSchema>;
