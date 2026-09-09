import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { forgotPasswordSchema } from '@/validations/auth.schema';
import { forgotPassword } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await parseBody(request, forgotPasswordSchema);
    await forgotPassword(email);
    return successResponse({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    return handleApiError(error);
  }
}
