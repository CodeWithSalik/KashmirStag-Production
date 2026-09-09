import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { categoryService } from '@/services/category.service';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const category = await categoryService.updateCategory(id, body, user.id);
    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const result = await categoryService.deleteCategory(id, user.id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));

    if (body.action === 'archive' || body.isActive === false) {
      const result = await categoryService.archiveCategory(id, user.id);
      return successResponse(result, result.message);
    }

    const category = await categoryService.updateCategory(id, body, user.id);
    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
