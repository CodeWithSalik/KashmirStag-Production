import Product from '@/models/Product';
import ProductVariant from '@/models/ProductVariant';
import Category from '@/models/Category';
import Collection from '@/models/Collection';
import { auditService } from './audit.service';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import mongoose from 'mongoose';
import slugify from 'slugify';

export const productService = {
  getProducts: async (params: any) => {
    const { page = 1, limit = 20, search, category, collection, tags, minPrice, maxPrice, sortBy, sortOrder = 'desc', status, inStock } = params;
    const query: any = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };
    if (category) query.categoryId = category;
    if (collection) query.collectionIds = collection;
    if (tags && (Array.isArray(tags) ? tags.length > 0 : Boolean(tags))) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    
    let sortQuery: any = { createdAt: -1 };
    if (sortBy) sortQuery = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const skip = (page - 1) * limit;
    
    let products = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name')
      .lean();

    const total = await Product.countDocuments(query);
    
    const formattedProducts = await Promise.all(products.map(async (p: any) => {
      const variants = await ProductVariant.find({ productId: p._id }).lean();
      return {
        id: p._id,
        title: p.title,
        slug: p.slug,
        image: p.images[0] || variants[0]?.image || '',
        basePrice: p.basePrice || variants[0]?.price || 0,
        compareAtPrice: p.compareAtPrice,
        avgRating: p.avgRating,
        reviewCount: p.reviewCount,
        categoryName: p.categoryId?.name || '',
        status: p.status,
      };
    }));

    return { products: formattedProducts, total, page, totalPages: Math.ceil(total / limit) };
  },
  getProductBySlug: async (slug: string) => {
    const product = await Product.findOne({ slug })
      .populate('categoryId', 'name')
      .populate('collectionIds', 'name')
      .lean();
    if (!product) return null;
    const variants = await ProductVariant.find({ productId: product._id }).lean();
    return { ...product, id: product._id, variants };
  },
  getProductById: async (id: string) => {
    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('collectionIds', 'name')
      .lean();
    if (!product) return null;
    const variants = await ProductVariant.find({ productId: product._id }).lean();
    return { ...product, id: product._id, variants };
  },
  createProduct: async (data: any, actorId: any) => {
    if (!data.slug && data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }
    const product = await Product.create(data);
    await auditService.log(actorId, 'CREATE_PRODUCT', 'Product', product._id, data);
    return product;
  },
  updateProduct: async (id: string, data: any, actorId: any) => {
    const product = await Product.findByIdAndUpdate(id, data, { new: true }).lean();
    if (product) await auditService.log(actorId, 'UPDATE_PRODUCT', 'Product', id, data);
    return product;
  },
  archiveProduct: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid product ID');
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product', id);

    product.status = 'archived';
    product.isVisible = false;
    await product.save();

    await ProductVariant.updateMany({ productId: id }, { isActive: false });
    await auditService.log(actorId, 'ARCHIVE_PRODUCT', 'Product', id, { title: product.title, slug: product.slug });
    return { action: 'archived', message: 'Product archived successfully', product };
  },
  deleteOrArchiveProduct: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid product ID');
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product', id);

    // Check historical dependencies
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const orderCount = await Order.countDocuments({ 'items.productId': id });
    const reviewCount = await Review.countDocuments({ productId: id });

    // If referenced in historical orders or customer reviews, MUST ARCHIVE (soft delete)
    if (orderCount > 0 || reviewCount > 0) {
      product.status = 'archived';
      product.isVisible = false;
      await product.save();
      await ProductVariant.updateMany({ productId: id }, { isActive: false });

      await auditService.log(actorId, 'ARCHIVE_PRODUCT', 'Product', id, {
        reason: 'Protected archival: product is referenced in historical orders or reviews',
        orderCount,
        reviewCount,
      });

      return {
        action: 'archived',
        message: `Product was safely archived rather than deleted because it is referenced in historical records (${orderCount} order(s), ${reviewCount} review(s)). Historical order snapshots remain intact.`,
        product,
      };
    }

    // Zero historical dependencies: safe to hard-delete
    await ProductVariant.deleteMany({ productId: id });
    const Cart = (await import('@/models/Cart')).default;
    await Cart.updateMany({}, { $pull: { items: { productId: id } } });
    const Wishlist = (await import('@/models/Wishlist')).default;
    await Wishlist.updateMany({}, { $pull: { products: id } });
    await Product.findByIdAndDelete(id);

    await auditService.log(actorId, 'DELETE_PRODUCT', 'Product', id, { title: product.title, slug: product.slug });
    return {
      action: 'deleted',
      message: 'Product had no historical order references and was permanently deleted.',
      product,
    };
  },
  restoreProduct: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid product ID');
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product', id);

    product.status = 'active';
    product.isVisible = true;
    await product.save();

    await ProductVariant.updateMany({ productId: id }, { isActive: true });
    await auditService.log(actorId, 'RESTORE_PRODUCT', 'Product', id, { title: product.title, slug: product.slug });
    return { action: 'restored', message: 'Product restored to active catalog successfully', product };
  },
  getFeaturedProducts: async (limit = 10) => {
    return await Product.find({ status: 'active', isVisible: true })
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean();
  },
  getNewArrivals: async (limit = 10) => {
    return await Product.find({ status: 'active', isVisible: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },
  getRelatedProducts: async (productId: string, categoryId: string, limit = 4) => {
    return await Product.find({ 
      categoryId, 
      _id: { $ne: productId }, 
      status: 'active', 
      isVisible: true 
    })
    .limit(limit)
    .lean();
  }
};
