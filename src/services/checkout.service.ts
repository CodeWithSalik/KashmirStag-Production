import { getCart, clearCart } from './cart.service';
import { validateCoupon, recordUsage } from './coupon.service';
import { getPaymentProvider } from './payment.service';
import { startSession } from '@/lib/db';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import { inventoryService } from './inventory.service';
import { AppError } from '@/lib/errors';
import { generateOrderId } from '@/lib/nanoid';
import { getAuthUser } from '@/lib/auth';

export async function processCheckout(userId: string | undefined, sessionId: string | undefined, data: any, email: string) {
  const { cart, items, subtotal } = await getCart(userId, sessionId);
  if (!items.length) {
    throw new AppError('Cart is empty', 400);
  }

  // Calculate pricing
  let discountAmount = 0;
  if (data.couponCode) {
    const { valid, discount, error } = await validateCoupon(data.couponCode, userId, subtotal, items);
    if (!valid) {
      throw new AppError(`Invalid coupon: ${error}`, 400);
    }
    discountAmount = Math.min(discount || 0, subtotal);
  }

  const shippingFee = subtotal >= 99900 ? 0 : 4900;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const session = await startSession();
  try {
    let orderIdVal = '';
    let razorpayOrderIdVal = '';
    let amountVal = total;
    let currencyVal = 'INR';

    await session.withTransaction(async () => {
      const newOrderId = generateOrderId();
      orderIdVal = newOrderId;

      // Inventory reservation with real order ID
      const reserveItems = items.map(item => ({ variantId: item.variantId.toString(), quantity: item.quantity }));
      await inventoryService.reserveStock(reserveItems, newOrderId, session);

      const orderData: any = {
        orderId: newOrderId,
        userId: userId || null,
        email,
        items: items.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          variant: item.variant,
          sku: item.sku || 'SKU',
          image: item.image,
          unitPrice: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity
        })),
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        pricing: {
          subtotal,
          shippingFee,
          taxAmount: 0,
          discountAmount,
          total
        },
        status: 'pending',
        paymentStatus: 'unpaid',
        timeline: [{ status: 'pending', comment: 'Order placed', createdAt: new Date() }]
      };

      if (data.couponCode) {
        orderData.discount = { couponCode: data.couponCode, amount: discountAmount, discountType: 'coupon' };
      }

      const order = await Order.create([orderData], { session });

      // Create Payment
      const paymentProvider = getPaymentProvider();
      const gatewayOrder = await paymentProvider.createOrder(total, 'INR', newOrderId);
      razorpayOrderIdVal = gatewayOrder.id;

      await Payment.create([{
        orderId: order[0]._id,
        gateway: 'razorpay',
        gatewayOrderId: gatewayOrder.id,
        amount: total,
        currency: 'INR',
        status: 'created'
      }], { session });

      if (data.couponCode && userId) {
        // Record usage (ignoring transaction for now or assume it's part of it if supported)
        await recordUsage(orderData.discount.couponCode, userId, order[0]._id.toString());
      }

      // Clear cart
      cart.items = [];
      cart.couponCode = undefined;
      await cart.save({ session });
    });

    const keyId = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').replace(/['"]/g, '').trim();
    return { orderId: orderIdVal, razorpayOrderId: razorpayOrderIdVal, amount: amountVal, currency: currencyVal, keyId };
  } finally {
    session.endSession();
  }
}
