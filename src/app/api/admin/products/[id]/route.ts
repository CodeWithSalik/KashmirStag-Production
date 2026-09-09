import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { productService } from '@/services/product.service';
import { updateProductSchema } from '@/validations/product.schema';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    await requireAdmin(request);
    const product = await productService.getProductById(id);
    if (!product) throw new Error('Product not found');
    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const data = updateProductSchema.parse(body);
    const product = await productService.updateProduct(id, data, user.id);
    return successResponse(product, 'Product updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const result = await productService.deleteOrArchiveProduct(id, user.id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    
    if (body.action === 'restore') {
      const result = await productService.restoreProduct(id, user.id);
      return successResponse(result, result.message);
    }
    
    const result = await productService.archiveProduct(id, user.id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}
