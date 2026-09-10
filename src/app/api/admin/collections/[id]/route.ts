import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { collectionService } from '@/services/collection.service';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const collection = await collectionService.updateCollection(id, body, user.id);
    return successResponse(collection, 'Collection updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const result = await collectionService.deleteCollection(id, user.id);
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
      const result = await collectionService.archiveCollection(id, user.id);
      return successResponse(result, result.message);
    }

    if (body.action === 'restore' || body.isActive === true) {
      const result = await collectionService.restoreCollection(id, user.id);
      return successResponse(result, result.message);
    }

    const collection = await collectionService.updateCollection(id, body, user.id);
    return successResponse(collection, 'Collection updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
