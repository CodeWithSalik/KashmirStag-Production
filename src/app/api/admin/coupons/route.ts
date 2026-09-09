import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/auth';
import { getCoupons, createCoupon } from '@/services/coupon.service';
import { successResponse, parseBody } from '@/lib/api-helpers';
import { createCouponSchema } from '@/validations/coupon.schema';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await getCoupons({ page, limit });
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const admin = requireAdmin(request);
    const data = await parseBody(request, createCouponSchema);
    
    const coupon = await createCoupon(data, admin.sub);
    return successResponse(coupon, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
