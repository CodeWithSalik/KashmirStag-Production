import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { getOrderById } from '@/services/order.service';
import { successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = requireAuth(request);
    
    const order = await getOrderById(id, user.sub);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
