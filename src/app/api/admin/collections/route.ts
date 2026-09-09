import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { collectionService } from '@/services/collection.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const collections = await collectionService.getCollections(true);
    return successResponse(collections);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const collection = await collectionService.createCollection(body, user.id);
    return successResponse(collection, 'Collection created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
