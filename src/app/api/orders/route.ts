import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { getOrdersByUser } from '@/services/order.service';
import { successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = requireAuth(request);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const { orders, total } = await getOrdersByUser(user.sub, page, limit);
    return successResponse({ orders, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
