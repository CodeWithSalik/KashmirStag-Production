import Cart from '@/models/Cart';
import ProductVariant from '@/models/ProductVariant';
import Product from '@/models/Product';
import { NotFoundError, AppError } from '@/lib/errors';
import mongoose from 'mongoose';

export async function getCart(userId?: string, sessionId?: string) {
  if (!userId && !sessionId) {
    throw new AppError('Either userId or sessionId is required to get cart', 400);
  }

  const query = userId ? { userId } : { sessionId, userId: null };
  let cart = await Cart.findOne(query);

  if (!cart) {
    cart = await Cart.create({ userId: userId || null, sessionId: sessionId || 'default_session', items: [] });
  }

  // Populate product and variant details
  let subtotal = 0;
  const populatedItems = [];
  
  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variantId);
    const product = await Product.findById(item.productId);
    
    if (variant && product && variant.isActive && product.status === 'active' && product.isVisible) {
      const price = variant.price || 0;
      populatedItems.push({
        variantId: item.variantId.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        title: product.title,
        variant: variant.size || variant.color || 'Default',
        image: variant.image || product.images?.[0] || '',
        price,
        availableQty: variant.availableQty
      });
      subtotal += price * item.quantity;
    }
  }

  return { cart, items: populatedItems, subtotal };
}

export async function addItem(userId: string | undefined, sessionId: string | undefined, variantId: string, productId: string, quantity: number) {
  const query = userId ? { userId } : { sessionId, userId: null };
  let cart = await Cart.findOne(query);

  if (!cart) {
    cart = await Cart.create({ userId: userId || null, sessionId: sessionId || 'default_session', items: [] });
  }

  const variant = await ProductVariant.findById(variantId);
  if (!variant || !variant.isActive) throw new NotFoundError('Active Product Variant');

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active' || !product.isVisible) {
    throw new AppError('This product is currently unavailable or archived', 400);
  }

  const availableQty = variant.availableQty;

  const existingItemIndex = cart.items.findIndex(i => i.variantId.toString() === variantId);
  if (existingItemIndex > -1) {
    let newQty = cart.items[existingItemIndex].quantity + quantity;
    if (newQty > availableQty) newQty = availableQty;
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    if (quantity > availableQty) quantity = availableQty;
    if (quantity > 0) {
      cart.items.push({ variantId: new mongoose.Types.ObjectId(variantId), productId: new mongoose.Types.ObjectId(productId), quantity, addedAt: new Date() });
    }
  }

  await cart.save();
  return getCart(userId, sessionId);
}

export async function updateItemQuantity(userId: string | undefined, sessionId: string | undefined, variantId: string, quantity: number) {
  const query = userId ? { userId } : { sessionId, userId: null };
  const cart = await Cart.findOne(query);
  if (!cart) throw new NotFoundError('Cart');

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.variantId.toString() !== variantId);
  } else {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw new NotFoundError('Product Variant');
    
    const existingItem = cart.items.find(i => i.variantId.toString() === variantId);
    if (existingItem) {
      existingItem.quantity = Math.min(quantity, variant.availableQty);
    }
  }

  await cart.save();
  return getCart(userId, sessionId);
}

export async function removeItem(userId: string | undefined, sessionId: string | undefined, variantId: string) {
  return updateItemQuantity(userId, sessionId, variantId, 0);
}

export async function clearCart(userId?: string, sessionId?: string) {
  const query = userId ? { userId } : { sessionId, userId: null };
  const cart = await Cart.findOne(query);
  if (cart) {
    cart.items = [];
    cart.couponCode = undefined;
    await cart.save();
  }
}

export async function mergeCarts(userId: string, sessionId: string) {
  const userCart = await Cart.findOne({ userId });
  const guestCart = await Cart.findOne({ sessionId, userId: null });

  if (!guestCart || guestCart.items.length === 0) return;

  if (!userCart) {
    guestCart.userId = new mongoose.Types.ObjectId(userId);
    await guestCart.save();
    return;
  }

  // Merge logic: prioritize user cart
  for (const guestItem of guestCart.items) {
    const userItemIndex = userCart.items.findIndex(i => i.variantId.toString() === guestItem.variantId.toString());
    if (userItemIndex === -1) {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });
}

export async function applyCoupon(userId: string | undefined, sessionId: string | undefined, code: string) {
  const query = userId ? { userId } : { sessionId, userId: null };
  const cart = await Cart.findOne(query);
  if (!cart) throw new NotFoundError('Cart');
  
  cart.couponCode = code;
  await cart.save();
}

export async function removeCoupon(userId: string | undefined, sessionId: string | undefined) {
  const query = userId ? { userId } : { sessionId, userId: null };
  const cart = await Cart.findOne(query);
  if (!cart) throw new NotFoundError('Cart');
  
  cart.couponCode = undefined;
  await cart.save();
}
