import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { productService } from '@/services/product.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const product = isObjectId 
      ? await productService.getProductById(id) 
      : await productService.getProductBySlug(id);
      
    if (!product || product.status !== 'active' || !product.isVisible) {
      throw new Error('Product not found');
    }
    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}
