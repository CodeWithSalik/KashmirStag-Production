import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, paginatedResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import User from '@/models/User';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role status createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const userIds = users.map((u: any) => u._id);
    const userEmails = users.map((u: any) => (u.email || '').toLowerCase());

    const orderStats = await Order.find({
      $or: [
        { userId: { $in: userIds } },
        { email: { $in: userEmails } },
      ],
    })
      .select('userId email pricing paymentStatus status')
      .lean();

    const statsMap = new Map<string, { orderCount: number; totalSpent: number }>();

    for (const order of orderStats) {
      const orderEmail = (order.email || '').toLowerCase();
      const orderUserId = order.userId?.toString();

      for (const u of users) {
        const uId = (u as any)._id.toString();
        const uEmail = (u.email || '').toLowerCase();

        if (orderUserId === uId || orderEmail === uEmail) {
          const cur = statsMap.get(uId) || { orderCount: 0, totalSpent: 0 };
          cur.orderCount += 1;
          if (order.paymentStatus === 'paid') {
            cur.totalSpent += (order.pricing?.total || 0);
          }
          statsMap.set(uId, cur);
          break;
        }
      }
    }

    const formattedUsers = users.map((u: any) => {
      const uId = u._id.toString();
      const stats = statsMap.get(uId) || { orderCount: 0, totalSpent: 0 };

      return {
        id: uId,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        joined: new Date(u.createdAt).toISOString().split('T')[0],
        lastLoginAt: u.lastLoginAt,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
      };
    });

    return paginatedResponse(formattedUsers, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
