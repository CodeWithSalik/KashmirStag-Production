import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse, paginatedResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { productService } from '@/services/product.service';
import { createProductSchema } from '@/validations/product.schema';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      collection: searchParams.get('collection'),
      status: searchParams.get('status'),
    };
    const result = await productService.getProducts(params);
    return paginatedResponse(result.products, result.total, result.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const data = createProductSchema.parse(body);
    const product = await productService.createProduct(data, user.id);
    return successResponse(product, 'Product created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
