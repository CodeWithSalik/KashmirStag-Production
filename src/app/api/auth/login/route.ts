import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { loginSchema } from '@/validations/auth.schema';
import { loginUser } from '@/services/auth.service';
import { mergeCarts } from '@/services/cart.service';
import { setAuthCookie } from '@/lib/auth';

import { AppError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60);
    if (!rateLimit.success) {
      throw new AppError('Too many login attempts. Please wait a minute and try again.', 429);
    }

    await connectDB();
    const data = await parseBody(request, loginSchema);
    const { user, token } = await loginUser(data);
    
    // Merge guest cart if sessionId cookie exists
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/sessionId=([^;]+)/);
    if (match && match[1]) {
      const sessionId = decodeURIComponent(match[1]);
      await mergeCarts(user.id, sessionId).catch((err) => {
        console.warn('Cart merge error during login:', err);
      });
    }

    const response = successResponse({ user });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
