import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, paginatedResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { auditService } from '@/services/audit.service';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      actorId: searchParams.get('actorId') || undefined,
      entity: searchParams.get('entity') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      action: searchParams.get('action') || undefined,
    };
    const result = await auditService.getAuditLogs(params);
    return paginatedResponse(result.logs, result.total, result.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}
