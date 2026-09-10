import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse, paginatedResponse, parseBody } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { ReviewService } from '@/services/review.service';
import Review from '@/models/Review';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('productId', 'title slug')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    const formatted = reviews.map((r: any) => ({
      id: r._id.toString(),
      product: r.productId?.title || 'Unknown Product',
      productId: r.productId?._id?.toString() || r.productId?.toString(),
      user: r.userId?.name || r.userId?.email || 'Anonymous',
      userEmail: r.userId?.email || '',
      rating: r.rating,
      comment: r.body || r.title || '',
      title: r.title || '',
      date: new Date(r.createdAt).toISOString().split('T')[0],
      status: r.status,
      isVerified: Boolean(r.isVerified),
    }));

    return paginatedResponse(formatted, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

const moderateSchema = z.object({
  reviewId: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
});

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const admin = requireAdmin(request);

    const { reviewId, status } = await parseBody(request, moderateSchema);
    const updated = await ReviewService.moderateReview(reviewId, status, admin.sub);

    return successResponse(updated, `Review ${status} successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
