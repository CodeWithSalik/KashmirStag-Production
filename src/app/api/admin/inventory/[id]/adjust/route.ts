import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { inventoryService } from '@/services/inventory.service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const { quantity, type, note } = body;
    const variant = await inventoryService.adjustStock(id, quantity, type, user.id, note);
    return successResponse(variant, 'Stock adjusted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
