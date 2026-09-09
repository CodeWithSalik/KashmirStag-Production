import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/auth';
import { getOrderById, updateOrderStatus, addTrackingInfo } from '@/services/order.service';
import { successResponse, parseBody } from '@/lib/api-helpers';
import { updateOrderStatusSchema, addTrackingSchema } from '@/validations/order.schema';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    requireAdmin(request);
    
    const order = await getOrderById(id);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const admin = requireAdmin(request);
    const data = await parseBody(request, updateOrderStatusSchema);
    
    const order = await updateOrderStatus(id, data.status, admin.sub, data.comment);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const admin = requireAdmin(request);
    const data = await parseBody(request, addTrackingSchema);
    
    const order = await addTrackingInfo(id, data.carrier, data.trackingNumber, data.trackingUrl, admin.sub);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
