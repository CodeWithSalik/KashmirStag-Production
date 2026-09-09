import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, AppError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { confirmPayment } from '@/services/order.service';
import { getPaymentProvider } from '@/services/payment.service';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string()
    });
    const data = await parseBody(request, schema);
    
    const provider = getPaymentProvider();
    const isValid = provider.verifyPayment({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature
    });

    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    await confirmPayment(data.razorpay_order_id, data.razorpay_payment_id);
    
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
