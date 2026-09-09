import Product from '@/models/Product';
import ProductVariant from '@/models/ProductVariant';

export const searchService = {
  searchProducts: async (query: string, filters: any = {}, page = 1, limit = 20) => {
    const filterQuery: any = { status: 'active', isVisible: true };
    if (query) filterQuery.$text = { $search: query };
    if (filters.category) filterQuery.categoryId = filters.category;
    if (filters.minPrice || filters.maxPrice) {
      filterQuery.basePrice = {};
      if (filters.minPrice) filterQuery.basePrice.$gte = Number(filters.minPrice);
      if (filters.maxPrice) filterQuery.basePrice.$lte = Number(filters.maxPrice);
    }
    if (filters.tags) filterQuery.tags = { $in: filters.tags };
    
    let sortQuery: any = { createdAt: -1 };
    if (filters.sortBy) sortQuery = { [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 };

    const skip = (page - 1) * limit;
    const products = await Product.find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name')
      .lean();
    
    const total = await Product.countDocuments(filterQuery);
    return { products, total, page, totalPages: Math.ceil(total / limit) };
  },
  getSuggestions: async (query: string, limit = 5) => {
    if (!query) return [];
    return await Product.find(
      { $text: { $search: query }, status: 'active', isVisible: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .select('title slug images')
    .lean();
  }
};
