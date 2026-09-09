import AuditLog from '@/models/AuditLog';

export const auditService = {
  log: async (actorId: any, action: string, entity: string, entityId?: any, changes?: any, request?: Request) => {
    let ip, userAgent;
    if (request) {
      ip = request.headers?.get?.('x-forwarded-for') || request.headers?.get?.('x-real-ip');
      userAgent = request.headers?.get?.('user-agent');
    }
    await AuditLog.create({
      actorId,
      action,
      entity,
      entityId,
      changes,
      ip,
      userAgent
    });
  },
  getAuditLogs: async (params: { page?: number; limit?: number; actorId?: any; entity?: string; entityId?: any; action?: string }) => {
    const { page = 1, limit = 20, actorId, entity, entityId, action } = params;
    const query: any = {};
    if (actorId) query.actorId = actorId;
    if (entity) query.entity = entity;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;

    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email')
      .lean();

    const total = await AuditLog.countDocuments(query);
    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
};
