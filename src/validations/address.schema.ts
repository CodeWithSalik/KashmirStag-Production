import { z } from 'zod';
import { phoneSchema, pincodeSchema } from './common.schema';

export const createAddressSchema = z.object({
  name: z.string().min(1),
  phone: phoneSchema,
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: pincodeSchema,
  country: z.string().default('IN'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type UpdateAddressSchema = z.infer<typeof updateAddressSchema>;
