import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { getAuthUser } from '@/lib/auth';
import { checkoutSchema } from '@/validations/order.schema';
import { processCheckout } from '@/services/checkout.service';
import { generateSessionId } from '@/lib/nanoid';

import { AppError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`checkout:${ip}`, 10, 60);
    if (!rateLimit.success) {
      throw new AppError('Too many checkout requests. Please wait a moment.', 429);
    }

    await connectDB();
    const user = getAuthUser(request);
    let sessionId = request.cookies.get('sessionId')?.value;
    if (!user && !sessionId) {
      sessionId = generateSessionId();
    }
    
    const data = await parseBody(request, checkoutSchema);
    
    const email = data.email || user?.email || 'customer@kashmirstag.com';
    
    const checkoutResult = await processCheckout(user?.sub, sessionId, data, email);
    
    const response = successResponse(checkoutResult);
    if (!user && sessionId) {
      response.cookies.set('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 });
    }
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
