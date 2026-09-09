import Collection from '@/models/Collection';
import { auditService } from './audit.service';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import mongoose from 'mongoose';
import slugify from 'slugify';

export const collectionService = {
  getCollections: async (includeInactive = false) => {
    const query = includeInactive ? {} : { isActive: true };
    return await Collection.find(query).sort({ createdAt: -1 }).lean();
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
};
