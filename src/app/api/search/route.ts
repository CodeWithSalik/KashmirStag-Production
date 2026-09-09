import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, paginatedResponse } from '@/lib/api-helpers';
import { searchService } from '@/services/search.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const filters = {
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      sortBy: searchParams.get('sort'),
      sortOrder: searchParams.get('order') || 'desc',
    };
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await searchService.searchProducts(query, filters, page, limit);
    return paginatedResponse(result.products, result.total, result.page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
