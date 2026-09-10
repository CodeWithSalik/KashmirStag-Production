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
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.categoryId = category;
      } else {
        const Category = (await import('@/models/Category')).default;
        const catDoc = await Category.findOne({ slug: category }).lean();
        query.categoryId = catDoc ? catDoc._id : new mongoose.Types.ObjectId();
      }
    }
    if (collection) {
      if (mongoose.Types.ObjectId.isValid(collection)) {
        query.collectionIds = collection;
      } else {
        const Collection = (await import('@/models/Collection')).default;
        const colDoc = await Collection.findOne({ slug: collection }).lean();
        query.collectionIds = colDoc ? colDoc._id : new mongoose.Types.ObjectId();
      }
    }
    if (tags && (Array.isArray(tags) ? tags.length > 0 : Boolean(tags))) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    if (search) {
      const matchingVariants = await ProductVariant.find({ sku: { $regex: search, $options: 'i' } }, 'productId').lean();
      const prodIdsFromSku = matchingVariants.map((v) => v.productId);
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { _id: { $in: prodIdsFromSku } },
      ];
    }
    
    let sortQuery: any = { createdAt: -1 };
    if (sortBy) sortQuery = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const skip = (page - 1) * limit;
    
    let products = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name')
      .populate('collectionIds', 'name title slug')
      .lean();

    const total = await Product.countDocuments(query);
    
    const formattedProducts = await Promise.all(products.map(async (p: any) => {
      const variants = await ProductVariant.find({ productId: p._id }).lean();
      const totalStock = variants.reduce((sum, v) => sum + (v.availableQty || 0), 0);
      const totalReserved = variants.reduce((sum, v) => sum + (v.reservedQty || 0), 0);
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
        categoryId: p.categoryId?._id || p.categoryId,
        collections: Array.isArray(p.collectionIds) ? p.collectionIds.map((col: any) => ({
          id: col._id,
          title: col.name || col.title,
          slug: col.slug
        })) : [],
        status: p.status,
        totalSold: p.totalSold ?? 0,
        totalStock,
        totalReserved,
        variantCount: variants.length,
      };
    }));

    return { products: formattedProducts, total, page, totalPages: Math.ceil(total / limit) };
  },
  ensureDefaultVariant: async (productId: string | mongoose.Types.ObjectId, initialStock = 10) => {
    const existing = await ProductVariant.find({ productId }).lean();
    if (existing.length > 0) return existing;

    const product = await Product.findById(productId);
    if (!product) return [];

    const generatedSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanSlugPart = (product.slug || 'PROD').substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const variantSku = `KS-${cleanSlugPart}-${generatedSuffix}`;

    const newVariant = await ProductVariant.create({
      productId: product._id,
      sku: variantSku,
      price: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      costPrice: product.costPrice,
      availableQty: initialStock,
      reservedQty: 0,
      lowStockThreshold: 5,
      image: product.images?.[0] || undefined,
      isActive: true,
    });

    if (initialStock > 0) {
      const InventoryTransaction = (await import('@/models/InventoryTransaction')).default;
      await InventoryTransaction.create({
        variantId: newVariant._id,
        productId: product._id,
        type: 'RESTOCK',
        quantity: initialStock,
        note: 'Default variant auto-provisioned',
      });
    }

    return [newVariant.toObject() as any];
  },
  getProductBySlug: async (slug: string) => {
    const product = await Product.findOne({ slug })
      .populate('categoryId', 'name')
      .populate('collectionIds', 'name')
      .lean();
    if (!product) return null;
    let variants: any[] = await ProductVariant.find({ productId: product._id }).lean();
    if (variants.length === 0 && product.status === 'active') {
      variants = await productService.ensureDefaultVariant(product._id);
    }
    return { ...product, id: product._id, variants };
  },
  getProductById: async (id: string) => {
    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('collectionIds', 'name')
      .lean();
    if (!product) return null;
    let variants: any[] = await ProductVariant.find({ productId: product._id }).lean();
    if (variants.length === 0 && product.status === 'active') {
      variants = await productService.ensureDefaultVariant(product._id);
    }
    return { ...product, id: product._id, variants };
  },
  createProduct: async (data: any, actorId: any) => {
    if (!data.slug && data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    // Extract variant fields before creating Product
    const {
      sku: customSku,
      initialStock,
      stock,
      lowStockThreshold: customThreshold,
      size,
      color,
      ...productFields
    } = data;

    const product = await Product.create(productFields);

    // Provision initial variant so product is in stock and visible in Inventory
    const generatedSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanSlugPart = (product.slug || 'PROD').substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const variantSku = customSku?.trim() || `KS-${cleanSlugPart}-${generatedSuffix}`;
    const qty = typeof initialStock === 'number' ? initialStock : (typeof stock === 'number' ? stock : 10);
    const threshold = typeof customThreshold === 'number' ? customThreshold : 5;

    const defaultVariant = await ProductVariant.create({
      productId: product._id,
      sku: variantSku,
      price: product.basePrice,
      compareAtPrice: product.compareAtPrice,
      costPrice: product.costPrice,
      size: size?.trim() || undefined,
      color: color?.trim() || undefined,
      availableQty: qty,
      reservedQty: 0,
      lowStockThreshold: threshold,
      image: product.images?.[0] || undefined,
      isActive: true,
    });

    if (qty > 0) {
      const InventoryTransaction = (await import('@/models/InventoryTransaction')).default;
      await InventoryTransaction.create({
        variantId: defaultVariant._id,
        productId: product._id,
        type: 'RESTOCK',
        quantity: qty,
        actorId,
        note: 'Initial stock quantity set upon product creation',
      });
    }

    await auditService.log(actorId, 'CREATE_PRODUCT', 'Product', product._id, data);
    return product;
  },
  updateProduct: async (id: string, data: any, actorId: any) => {
    const {
      sku,
      initialStock,
      stock,
      lowStockThreshold,
      size,
      color,
      ...productFields
    } = data;

    const product = await Product.findByIdAndUpdate(id, productFields, { new: true }).lean();
    if (product) {
      // If stock adjustment passed
      const qty = typeof initialStock === 'number' ? initialStock : (typeof stock === 'number' ? stock : undefined);
      if (qty !== undefined) {
        const variant = await ProductVariant.findOne({ productId: id, isActive: true });
        if (variant) {
          variant.availableQty = qty;
          if (sku) variant.sku = sku;
          await variant.save();
        }
      }
      await auditService.log(actorId, 'UPDATE_PRODUCT', 'Product', id, data);
    }
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
