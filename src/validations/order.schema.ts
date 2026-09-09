import { z } from 'zod';
import { phoneSchema, pincodeSchema } from './common.schema';
import { ORDER_STATUSES } from '@/config/constants';

export const addressSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  phone: phoneSchema,
  line1: z.string().trim().min(1, 'Street address is required'),
  line2: z.preprocess((val) => (val === null || val === '' ? undefined : typeof val === 'string' ? val.trim() : val), z.string().optional()),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: pincodeSchema,
  country: z.string().trim().default('IN'),
});

export const checkoutSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? val.trim().toLowerCase() : undefined),
    z.string().email('Please provide a valid email address').optional()
  ) as z.ZodType<string | undefined>,
  shippingAddress: addressSchema,
  billingAddress: z.preprocess((val) => (val === null ? undefined : val), addressSchema.optional()) as z.ZodType<AddressSchema | undefined>,
  couponCode: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? val.trim().toUpperCase() : undefined),
    z.string().max(50).optional()
  ) as z.ZodType<string | undefined>,
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  comment: z.string().max(500).optional(),
});

export const addTrackingSchema = z.object({
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().url().optional(),
});

export type AddressSchema = z.infer<typeof addressSchema>;
export type CheckoutSchema = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusSchema = z.infer<typeof updateOrderStatusSchema>;
export type AddTrackingSchema = z.infer<typeof addTrackingSchema>;
