import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { getAuthUser } from '@/lib/auth';
import { validateCoupon } from '@/services/coupon.service';
import { getCart } from '@/services/cart.service';
import { successResponse, parseBody } from '@/lib/api-helpers';
import { AppError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`coupon:${ip}`, 15, 60);
    if (!rateLimit.success) {
      throw new AppError('Too many coupon validation requests. Please wait a moment.', 429);
    }

    await connectDB();
    const user = getAuthUser(request);
    const sessionId = request.cookies.get('sessionId')?.value;
    
    const schema = z.object({ code: z.string() });
    const { code } = await parseBody(request, schema);
    
    const { items, subtotal } = await getCart(user?.sub, sessionId);
    
    const result = await validateCoupon(code, user?.sub, subtotal, items);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
