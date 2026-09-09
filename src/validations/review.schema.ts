import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const createReviewSchema = z.object({
  productId: objectIdSchema,
  orderId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  body: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export type CreateReviewSchema = z.infer<typeof createReviewSchema>;
export type ModerateReviewSchema = z.infer<typeof moderateReviewSchema>;
