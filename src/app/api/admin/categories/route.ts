import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { categoryService } from '@/services/category.service';
import { createCategorySchema } from '@/validations/category.schema';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const categories = await categoryService.getCategories(true);
    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(validatedData, user.id);
    return successResponse(category, 'Category created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
