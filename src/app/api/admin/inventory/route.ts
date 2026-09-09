import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, paginatedResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import ProductVariant from '@/models/ProductVariant';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    
    let query: any = {};
    if (searchParams.get('lowStock') === 'true') {
      query = { $expr: { $lte: ['$availableQty', '$lowStockThreshold'] } };
    }
    if (searchParams.get('outOfStock') === 'true') {
      query.availableQty = 0;
    }

    const variants = await ProductVariant.find(query)
      .populate('productId', 'title slug')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await ProductVariant.countDocuments(query);
    
    return paginatedResponse(variants, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
