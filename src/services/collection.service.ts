import Collection from '@/models/Collection';
import { auditService } from './audit.service';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import mongoose from 'mongoose';
import slugify from 'slugify';

export const collectionService = {
  getCollections: async (includeInactive = false) => {
    const query = includeInactive ? {} : { isActive: true };
    const collections = await Collection.find(query).sort({ createdAt: -1 }).lean();
    const colIds = collections.map((c) => c._id);
    const Product = (await import('@/models/Product')).default;
    const counts = await Product.aggregate([
      { $match: { collectionIds: { $in: colIds }, status: { $ne: 'deleted' } } },
      { $unwind: '$collectionIds' },
      { $match: { collectionIds: { $in: colIds } } },
      { $group: { _id: '$collectionIds', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));
    return collections.map((c: any) => ({
      ...c,
      productCount: countMap.get(c._id.toString()) || 0,
    }));
  },
  getCollectionBySlug: async (slug: string) => {
    return await Collection.findOne({ slug }).lean();
  },
  createCollection: async (data: any, actorId: any) => {
    const name = data.name || data.title;
    if (!name) throw new BadRequestError('Collection name or title is required');
    const slug = data.slug || slugify(name, { lower: true, strict: true });
    const col = await Collection.create({
      name,
      slug,
      description: data.description || '',
      image: data.image || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    await auditService.log(actorId, 'CREATE_COLLECTION', 'Collection', col._id, data);
    return col;
  },
  updateCollection: async (id: string, data: any, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid collection ID');
    if (data.title && !data.name) {
      data.name = data.title;
    }
    const col = await Collection.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!col) throw new NotFoundError('Collection', id);
    await auditService.log(actorId, 'UPDATE_COLLECTION', 'Collection', id, data);
    return col;
  },
  deleteCollection: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid collection ID');
    const col = await Collection.findById(id);
    if (!col) throw new NotFoundError('Collection', id);

    // Safely unlink this collection from all products so products don't retain dangling IDs
    const Product = (await import('@/models/Product')).default;
    const updateResult = await Product.updateMany(
      { collectionIds: id },
      { $pull: { collectionIds: id } }
    );

    await Collection.findByIdAndDelete(id);
    await auditService.log(actorId, 'DELETE_COLLECTION', 'Collection', id, {
      name: col.name,
      slug: col.slug,
      productsUnlinked: updateResult.modifiedCount,
    });

    return {
      action: 'deleted',
      message: `Collection "${col.name}" deleted successfully and unlinked from ${updateResult.modifiedCount} product(s).`,
      unlinkedProducts: updateResult.modifiedCount,
    };
  },
  archiveCollection: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid collection ID');
    const col = await Collection.findById(id);
    if (!col) throw new NotFoundError('Collection', id);

    col.isActive = false;
    await col.save();

    await auditService.log(actorId, 'ARCHIVE_COLLECTION', 'Collection', id, { name: col.name });
    return { action: 'archived', message: `Collection "${col.name}" archived/deactivated successfully.` };
  },
  restoreCollection: async (id: string, actorId: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid collection ID');
    const col = await Collection.findById(id);
    if (!col) throw new NotFoundError('Collection', id);

    col.isActive = true;
    await col.save();

    await auditService.log(actorId, 'RESTORE_COLLECTION', 'Collection', id, { name: col.name });
    return { action: 'restored', message: `Collection "${col.name}" restored/activated successfully.` };
  },
};
