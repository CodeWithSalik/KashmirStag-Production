import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, paginatedResponse } from '@/lib/api-helpers';
import { productService } from '@/services/product.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const tags = searchParams.getAll('tags');
    const params = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      category: searchParams.get('category') || undefined,
      collection: searchParams.get('collection') || undefined,
      tags: tags.length > 0 ? tags : undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || 'desc',
      status: 'active',
    };
    const result = await productService.getProducts(params);
    return paginatedResponse(result.products, result.total, result.page, 20);
  } catch (error) {
    return handleApiError(error);
  }
}
