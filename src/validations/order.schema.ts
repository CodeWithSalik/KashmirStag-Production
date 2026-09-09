import { z } from 'zod';
import { phoneSchema, pincodeSchema } from './common.schema';
import { ORDER_STATUSES } from '@/config/constants';

export const addressSchema = z.object({
  name: z.string().min(1),
  phone: phoneSchema,
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: pincodeSchema,
  country: z.string().default('IN'),
});

export const checkoutSchema = z.object({
  email: z.string().email().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  couponCode: z.string().max(50).toUpperCase().optional(),
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
