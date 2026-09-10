import Category from '@/models/Category';
import Product from '@/models/Product';
import { auditService } from './audit.service';
import { BadRequestError, NotFoundError, ConflictError } from '@/lib/errors';
import mongoose from 'mongoose';
import slugify from 'slugify';

export const categoryService = {
  getCategories: async (includeInactive = false) => {
    const query = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ sortOrder: 1 }).lean();
    const categoryIds = categories.map((c) => c._id);
    const counts = await Product.aggregate([
      { $match: { categoryId: { $in: categoryIds }, status: { $ne: 'deleted' } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));
    return categories.map((c: any) => ({
      ...c,
      productCount: countMap.get(c._id.toString()) || 0,
    }));
  },
  getCategoryBySlug: async (slug: string) => {
    const category = await Category.findOne({ slug }).lean();
    return category;
  },
  createCategory: async (data: any, actorId: any) => {
    let slug = data.slug?.trim();
    if (!slug && data.name) {
      slug = slugify(data.name, { lower: true, strict: true });
    }
    if (!slug) {
      throw new BadRequestError('Category name or slug is required to generate a valid slug.');
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ConflictError(`A category with slug "${slug}" already exists.`);
    }

    const categoryData = {
      ...data,
      slug,
    };

    const category = await Category.create(categoryData);
    await auditService.log(actorId, 'CREATE_CATEGORY', 'Category', category._id, categoryData);
    return category;
  },
  updateCategory: async (id: string, data: any, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid category ID');

    if (data.slug) {
      const existing = await Category.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError(`A category with slug "${data.slug}" already exists.`);
      }
    }

    const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!category) throw new NotFoundError('Category', id);
    await auditService.log(actorId, 'UPDATE_CATEGORY', 'Category', id, data);
    return category;
  },
  deleteCategory: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid category ID');
    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Category', id);

    const productCount = await Product.countDocuments({
      $or: [{ categoryId: id }, { category: id }],
    });
    if (productCount > 0) {
      throw new BadRequestError(
        `Cannot delete category "${category.name}". ${productCount} product(s) are currently assigned to this category. Reassign or delete those products first.`
      );
    }

    const subCount = await Category.countDocuments({ parentId: id });
    if (subCount > 0) {
      throw new BadRequestError(
        `Cannot delete category "${category.name}". It has ${subCount} child subcategories. Reassign or delete those subcategories first.`
      );
    }

    await Category.findByIdAndDelete(id);
    await auditService.log(actorId, 'DELETE_CATEGORY', 'Category', id, { name: category.name, slug: category.slug });
    return { action: 'deleted', message: `Category "${category.name}" deleted successfully.` };
  },
  archiveCategory: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid category ID');
    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Category', id);

    category.isActive = false;
    await category.save();

    await auditService.log(actorId, 'ARCHIVE_CATEGORY', 'Category', id, { name: category.name, slug: category.slug });
    return { action: 'archived', message: `Category "${category.name}" archived/deactivated successfully.` };
  },
  restoreCategory: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid category ID');
    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Category', id);

    category.isActive = true;
    await category.save();

    await auditService.log(actorId, 'RESTORE_CATEGORY', 'Category', id, { name: category.name, slug: category.slug });
    return { action: 'restored', message: `Category "${category.name}" restored/activated successfully.` };
  },
  recountProducts: async (categoryId: string) => {
    const count = await Product.countDocuments({ categoryId, status: 'active', isVisible: true });
    await Category.findByIdAndUpdate(categoryId, { productCount: count });
  }
};
