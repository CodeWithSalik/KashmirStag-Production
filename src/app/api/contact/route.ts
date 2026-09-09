import { NextRequest } from 'next/server';
import { handleApiError, AppError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { sendContactInquiry } from '@/lib/email';
import { contactSchema } from '@/validations/contact.schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`contact:${ip}`, 10, 60);
    if (!rateLimit.success) {
      throw new AppError('Too many inquiries sent. Please wait a minute before trying again.', 429);
    }

    const validated = await parseBody(request, contactSchema);

    await sendContactInquiry({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
    });

    return successResponse({ message: 'Inquiry received successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
