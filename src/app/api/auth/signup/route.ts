import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { signupSchema } from '@/validations/auth.schema';
import { registerUser } from '@/services/auth.service';
import { setAuthCookie } from '@/lib/auth';
import { mergeCarts } from '@/services/cart.service';
import { AppError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`signup:${ip}`, 5, 600);
    if (!rateLimit.success) {
      throw new AppError('Too many accounts created from this IP. Please try again later.', 429);
    }

    await connectDB();
    const data = await parseBody(request, signupSchema);
    const { user, token } = await registerUser(data);
    
    // Merge guest cart if sessionId cookie exists
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/sessionId=([^;]+)/);
    if (match && match[1]) {
      const sessionId = decodeURIComponent(match[1]);
      await mergeCarts(user.id, sessionId).catch((err) => {
        console.warn('Cart merge error during signup:', err);
      });
    }

    const response = successResponse({ user }, 201);
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
