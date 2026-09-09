import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/auth';
import { getAllOrders } from '@/services/order.service';
import { successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const status = url.searchParams.get('status') || undefined;
    const paymentStatus = url.searchParams.get('paymentStatus') || undefined;

    const { orders, total } = await getAllOrders({ page, limit, status, paymentStatus });
    return successResponse({ orders, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
