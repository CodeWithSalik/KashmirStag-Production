import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { successResponse } from '@/lib/api-helpers';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    const supportEmail = process.env.SUPPORT_EMAIL || 'support@kashmirstag.com';
    const emailContent = `
      <h2>New Contact Inquiry from KashmirStag Storefront</h2>
      <p><strong>Name:</strong> ${validated.name}</p>
      <p><strong>Email:</strong> ${validated.email}</p>
      <p><strong>Subject:</strong> ${validated.subject}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${validated.message.replace(/\n/g, '<br />')}</p>
    `;

    await sendEmail(supportEmail, `[Contact Form] ${validated.subject}`, emailContent);

    return successResponse({ message: 'Inquiry received successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
