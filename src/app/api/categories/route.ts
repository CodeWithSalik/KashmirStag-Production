import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { categoryService } from '@/services/category.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const categories = await categoryService.getCategories(false);
    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
