import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { successResponse } from '@/lib/api-helpers';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    const response = successResponse({ message: 'Logged out successfully' });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
