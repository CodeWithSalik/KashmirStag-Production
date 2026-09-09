import crypto from 'crypto';
import { getRazorpay } from '@/lib/razorpay';
import { AppError } from '@/lib/errors';

export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  createOrder(amount: number, currency: string, receipt: string): Promise<GatewayOrder>;
  verifyPayment(params: { orderId: string, paymentId: string, signature: string }): boolean;
  verifyWebhook(body: string, signature: string): any;
  refund(paymentId: string, amount: number): Promise<any>;
}

class RazorpayProvider implements PaymentProvider {
  async createOrder(amount: number, currency: string, receipt: string): Promise<GatewayOrder> {
    try {
      const rzp = getRazorpay();
      const order = await rzp.orders.create({
        amount: Math.round(amount),
        currency,
        receipt
      });
      return {
        id: order.id,
        amount: order.amount as number,
        currency: order.currency
      };
    } catch (err: any) {
      console.error('Razorpay createOrder error:', err);
      const desc = err?.error?.description || err?.message || 'Payment gateway order creation failed';
      throw new AppError(`Payment Error: ${desc}`, 400);
    }
  }

  verifyPayment({ orderId, paymentId, signature }: { orderId: string, paymentId: string, signature: string }): boolean {
    const secret = (process.env.RAZORPAY_KEY_SECRET || '').replace(/['"]/g, '').trim();
    if (!secret || !signature) return false;
    
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");
      
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }

  verifyWebhook(body: string, signature: string): any {
    const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').replace(/['"]/g, '').trim();
    if (!secret || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return null;
    }

    if (crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
      try {
        return JSON.parse(body);
      } catch {
        return null;
      }
    }
    return null;
  }

  async refund(paymentId: string, amount: number): Promise<any> {
    const rzp = getRazorpay();
    return await rzp.payments.refund(paymentId, { amount });
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new RazorpayProvider();
}
