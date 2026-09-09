import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse, parseSearchParams } from '@/lib/api-helpers';
import { getAuthUser } from '@/lib/auth';
import { getCart, addItem, updateItemQuantity, removeItem, clearCart } from '@/services/cart.service';
import { z } from 'zod';
import { generateSessionId } from '@/lib/nanoid';

function getSessionId(request: NextRequest): string {
  let sessionId = request.cookies.get('sessionId')?.value;
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = getSessionId(request);
    
    const cart = await getCart(user?.sub, sessionId);
    const response = successResponse(cart);
    if (!user) setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = getSessionId(request);
    
    const schema = z.object({
      variantId: z.string(),
      productId: z.string(),
      quantity: z.number().min(1),
    });
    const data = await parseBody(request, schema);
    
    const cart = await addItem(user?.sub, sessionId, data.variantId, data.productId, data.quantity);
    const response = successResponse(cart);
    if (!user) setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = getSessionId(request);
    
    // We expect variantId and quantity in the body, OR we could use URL param.
    // The instructions say "PUT: Body: { variantId, quantity }"
    const schema = z.object({
      variantId: z.string(),
      quantity: z.number().min(0),
    });
    const data = await parseBody(request, schema);
    
    const cart = await updateItemQuantity(user?.sub, sessionId, data.variantId, data.quantity);
    const response = successResponse(cart);
    if (!user) setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);
    const sessionId = getSessionId(request);
    const url = new URL(request.url);
    const variantId = url.searchParams.get('variantId');

    let cartResult;
    if (variantId) {
      cartResult = await removeItem(user?.sub, sessionId, variantId);
    } else {
      await clearCart(user?.sub, sessionId);
      cartResult = await getCart(user?.sub, sessionId);
    }
    
    const response = successResponse(cartResult);
    if (!user) setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
