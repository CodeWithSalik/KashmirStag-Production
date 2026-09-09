import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import ProductVariant from '@/models/ProductVariant';
import { updateVariantSchema } from '@/validations/product.schema';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  try {
    const { id, variantId } = await params;
    await connectDB();
    await requireAdmin(request);
    const body = await request.json();
    const data = updateVariantSchema.parse(body);
    const variant = await ProductVariant.findOneAndUpdate({ _id: variantId, productId: id }, data, { new: true }).lean();
    if (!variant) throw new Error('Variant not found');
    return successResponse(variant, 'Variant updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  try {
    const { id, variantId } = await params;
    await connectDB();
    await requireAdmin(request);
    const variant = await ProductVariant.findOneAndUpdate({ _id: variantId, productId: id }, { isActive: false }, { new: true }).lean();
    if (!variant) throw new Error('Variant not found');
    return successResponse(null, 'Variant deactivated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
