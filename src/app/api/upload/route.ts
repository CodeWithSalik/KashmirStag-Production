import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { uploadFile } from '@/lib/upload';
import { BadRequestError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) throw new BadRequestError('No file provided');
    
    const url = await uploadFile(file);
    return successResponse({ url }, 'File uploaded successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
