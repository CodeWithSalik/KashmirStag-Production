import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    await connectDB();
    const items = await Wishlist.find({ userId: user.sub })
      .populate({
        path: 'productId',
        select: 'title slug images basePrice compareAtPrice avgRating reviewCount',
      })
      .lean();

    const products = items
      .filter((w) => w.productId)
      .map((w: any) => w.productId);

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    const { productId } = await request.json();
    await connectDB();

    await Wishlist.findOneAndUpdate(
      { userId: user.sub, productId },
      { userId: user.sub, productId },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    await connectDB();

    await Wishlist.findOneAndDelete({ userId: user.sub, productId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
