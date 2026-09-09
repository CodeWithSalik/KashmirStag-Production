import { z } from 'zod';
import { phoneSchema, pincodeSchema } from './common.schema';

export const createAddressSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  phone: phoneSchema,
  line1: z.string().trim().min(1, 'Street address is required'),
  line2: z.preprocess(
    (val) => (val === null || val === '' ? undefined : typeof val === 'string' ? val.trim() : val),
    z.string().optional()
  ) as z.ZodType<string | undefined>,
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: pincodeSchema,
  country: z.string().trim().default('IN'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type UpdateAddressSchema = z.infer<typeof updateAddressSchema>;
