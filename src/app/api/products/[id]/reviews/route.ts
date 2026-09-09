import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuthUser } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    await connectDB();

    const query = { productId: id, status: 'approved' };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name')
        .lean(),
      Review.countDocuments(query),
    ]);

    const formattedReviews = reviews.map((r: any) => ({
      _id: r._id.toString(),
      rating: r.rating,
      title: r.title || '',
      body: r.body || '',
      user: {
        name: r.userId?.name || 'Customer',
        firstName: r.userId?.name ? r.userId.name.split(' ')[0] : 'Customer',
      },
      userId: r.userId,
      isVerifiedPurchase: Boolean(r.isVerified),
      isVerified: Boolean(r.isVerified),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      reviews: formattedReviews,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { rating, title, body, orderId } = data;

    await connectDB();

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId: id, userId: user.sub });
    if (existingReview) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this product' }, { status: 409 });
    }

    // Verify purchase
    let isVerified = false;
    const orderQuery: Record<string, unknown> = { userId: user.sub, 'items.productId': id };
    if (orderId) orderQuery._id = orderId;
    const order = await Order.findOne(orderQuery);
    if (order) isVerified = true;

    const review = await Review.create({
      productId: id,
      userId: user.sub,
      orderId: order?._id,
      rating,
      title,
      body,
      isVerified,
      status: 'pending',
    });

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { productId: review.productId, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(id, {
        avgRating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
