import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { getAuthUser } from '@/lib/auth';
import { applyCoupon, removeCoupon } from '@/services/cart.service';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = request.cookies.get('sessionId')?.value;
    
    const schema = z.object({ code: z.string() });
    const { code } = await parseBody(request, schema);
    
    await applyCoupon(user?.sub, sessionId, code);
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = request.cookies.get('sessionId')?.value;
    
    await removeCoupon(user?.sub, sessionId);
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
