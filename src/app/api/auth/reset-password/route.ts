import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { parseBody, successResponse } from '@/lib/api-helpers';
import { resetPasswordSchema } from '@/validations/auth.schema';
import { resetPassword } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { token, password } = await parseBody(request, resetPasswordSchema);
    await resetPassword(token, password);
    return successResponse({ message: 'Password reset successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
