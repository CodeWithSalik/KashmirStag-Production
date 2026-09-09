import Address, { IAddress } from '@/models/Address';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import mongoose from 'mongoose';
import { CreateAddressSchema, UpdateAddressSchema } from '@/validations/address.schema';

export const addressService = {
  getUserAddresses: async (userId: string) => {
    if (!userId) throw new UnauthorizedError('User authentication required');
    return await Address.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  },

  getAddressById: async (userId: string, addressId: string) => {
    if (!userId) throw new UnauthorizedError('User authentication required');
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new BadRequestError('Invalid address ID');
    }

    const address = await Address.findOne({ _id: addressId, userId }).lean();
    if (!address) {
      throw new NotFoundError('Address', addressId);
    }
    return address;
  },

  createAddress: async (userId: string, data: any) => {
    if (!userId) throw new UnauthorizedError('User authentication required');

    // Count existing addresses for user
    const count = await Address.countDocuments({ userId });
    const isFirstAddress = count === 0;
    const makeDefault = Boolean(data.isDefault || isFirstAddress);

    if (makeDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = await Address.create({
      ...data,
      country: data.country || 'IN',
      userId: new mongoose.Types.ObjectId(userId),
      isDefault: makeDefault,
    });

    return address.toObject();
  },

  updateAddress: async (userId: string, addressId: string, data: any) => {
    if (!userId) throw new UnauthorizedError('User authentication required');
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new BadRequestError('Invalid address ID');
    }

    const existing = await Address.findOne({ _id: addressId, userId });
    if (!existing) {
      throw new NotFoundError('Address', addressId);
    }

    if (data.isDefault) {
      await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    return updated;
  },

  deleteAddress: async (userId: string, addressId: string) => {
    if (!userId) throw new UnauthorizedError('User authentication required');
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new BadRequestError('Invalid address ID');
    }

    const deleted = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!deleted) {
      throw new NotFoundError('Address', addressId);
    }

    // If the deleted address was default, promote the newest remaining address to default
    if (deleted.isDefault) {
      const nextDefault = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return { success: true, message: 'Address deleted successfully' };
  },

  setDefaultAddress: async (userId: string, addressId: string) => {
    if (!userId) throw new UnauthorizedError('User authentication required');
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new BadRequestError('Invalid address ID');
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw new NotFoundError('Address', addressId);
    }

    await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    return address.toObject();
  },
};
