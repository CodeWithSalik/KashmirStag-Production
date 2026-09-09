import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Address from "@/models/Address";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    await connectDB();
    const addresses = await Address.find({ userId: user.sub }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    const data = await request.json();
    await connectDB();

    if (data.isDefault) {
      await Address.updateMany({ userId: user.sub }, { isDefault: false });
    }

    const address = await Address.create({ ...data, userId: user.sub });
    return NextResponse.json({ success: true, data: address }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
