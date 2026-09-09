import Coupon from '@/models/Coupon';
import CouponUsage from '@/models/CouponUsage';
import { AppError } from '@/lib/errors';
import mongoose from 'mongoose';

export async function validateCoupon(code: string, userId: string | undefined, cartSubtotal: number, cartItems: any[]) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  
  if (!coupon) return { valid: false, error: 'Invalid coupon' };
  
  if (coupon.startsAt && new Date() < coupon.startsAt) return { valid: false, error: 'Coupon not active yet' };
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return { valid: false, error: 'Coupon expired' };
  if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) return { valid: false, error: `Minimum order amount is ₹${(coupon.minOrderAmount/100).toFixed(2)}` };
  
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: 'Coupon usage limit reached' };

  if (userId) {
    const userUsage = await CouponUsage.countDocuments({ couponId: coupon._id, userId });
    if (userUsage >= coupon.perUserLimit) return { valid: false, error: 'You have reached the usage limit for this coupon' };
  }

  // For applicableTo check (simplified for now)
  let discount = 0;
  if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, cartSubtotal);
  } else if (coupon.type === 'percentage') {
    discount = Math.floor((cartSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    discount = Math.min(discount, cartSubtotal);
  }

  return { valid: true, discount, coupon };
}

export function calculateDiscount(coupon: any, cartSubtotal: number) {
  let discount = 0;
  if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, cartSubtotal);
  } else if (coupon.type === 'percentage') {
    discount = Math.floor((cartSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    discount = Math.min(discount, cartSubtotal);
  }
  return discount;
}

export async function recordUsage(couponIdOrCode: string, userId: string, orderId: string) {
  let coupon: any = null;
  if (mongoose.Types.ObjectId.isValid(couponIdOrCode)) {
    coupon = await Coupon.findById(couponIdOrCode);
  }
  if (!coupon) {
    coupon = await Coupon.findOne({ code: couponIdOrCode.toUpperCase() });
  }
  if (coupon) {
    await CouponUsage.create({ couponId: coupon._id, userId, orderId });
    const updateQuery: any = { _id: coupon._id };
    if (coupon.usageLimit) {
      updateQuery.$or = [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ];
    }
    await Coupon.findOneAndUpdate(updateQuery, { $inc: { usedCount: 1 } });
  }
}

export async function createCoupon(data: any, actorId: string) {
  const coupon = await Coupon.create(data);
  return coupon;
}

export async function updateCoupon(id: string, data: any, actorId: string) {
  const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
  return coupon;
}

export async function getCoupons(params: { page: number, limit: number }) {
  const skip = (params.page - 1) * params.limit;
  const coupons = await Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(params.limit);
  const total = await Coupon.countDocuments();
  return { coupons, total };
}
