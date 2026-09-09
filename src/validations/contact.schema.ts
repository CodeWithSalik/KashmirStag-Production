import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(2, 'Subject must be at least 2 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(3000, 'Message cannot exceed 3000 characters'),
});

export type ContactInput = z.infer<typeof contactSchema>;
