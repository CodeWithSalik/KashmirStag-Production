import Category from '@/models/Category';
import Product from '@/models/Product';
import { auditService } from './audit.service';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import mongoose from 'mongoose';

export const categoryService = {
  getCategories: async (includeInactive = false) => {
    const query = includeInactive ? {} : { isActive: true };
    return await Category.find(query).sort({ sortOrder: 1 }).lean();
  },
  getCategoryBySlug: async (slug: string) => {
    const category = await Category.findOne({ slug }).lean();
    return category;
  },
  createCategory: async (data: any, actorId: any) => {
    const category = await Category.create(data);
    await auditService.log(actorId, 'CREATE_CATEGORY', 'Category', category._id, data);
    return category;
  },
  updateCategory: async (id: string, data: any, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid category ID');
    const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    if (category) await auditService.log(actorId, 'UPDATE_CATEGORY', 'Category', id, data);
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
  recountProducts: async (categoryId: string) => {
    const count = await Product.countDocuments({ categoryId, status: 'active', isVisible: true });
    await Category.findByIdAndUpdate(categoryId, { productCount: count });
  }
};
