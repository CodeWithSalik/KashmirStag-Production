import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { collectionService } from '@/services/collection.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const collections = await collectionService.getCollections(false);
    return successResponse(collections);
  } catch (error) {
    return handleApiError(error);
  }
}
