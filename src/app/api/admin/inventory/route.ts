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

    const search = searchParams.get('search');
    if (search) {
      const Product = (await import('@/models/Product')).default;
      const matchingProducts = await Product.find({ title: { $regex: search, $options: 'i' } }, '_id').lean();
      const prodIds = matchingProducts.map((p) => p._id);
      query.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { size: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
        { productId: { $in: prodIds } },
      ];
    }

    const variants = await ProductVariant.find(query)
      .populate('productId', 'title slug')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await ProductVariant.countDocuments(query);
    
    return paginatedResponse(variants, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
