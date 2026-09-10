import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/auth';
import { updateCoupon, deleteCoupon } from '@/services/coupon.service';
import { successResponse, parseBody } from '@/lib/api-helpers';
import { updateCouponSchema } from '@/validations/coupon.schema';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const admin = requireAdmin(request);
    const data = await parseBody(request, updateCouponSchema);
    
    const coupon = await updateCoupon(id, data, admin.sub);
    return successResponse(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const admin = requireAdmin(request);
    const body = await request.json();
    
    const coupon = await updateCoupon(id, body, admin.sub);
    return successResponse(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const admin = requireAdmin(request);
    const url = new URL(request.url);
    const soft = url.searchParams.get('soft') === 'true';

    if (soft) {
      const coupon = await updateCoupon(id, { isActive: false }, admin.sub);
      return successResponse(coupon);
    }

    const coupon = await deleteCoupon(id, admin.sub);
    return successResponse({ message: 'Coupon deleted', coupon });
  } catch (error) {
    return handleApiError(error);
  }
}
