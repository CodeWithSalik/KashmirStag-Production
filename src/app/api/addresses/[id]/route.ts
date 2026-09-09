import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Address from "@/models/Address";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const data = await request.json();
    await connectDB();

    if (data.isDefault) {
      await Address.updateMany({ userId: user.sub }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, userId: user.sub },
      data,
      { new: true }
    );

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: address });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await connectDB();
    await Address.findOneAndDelete({ _id: id, userId: user.sub });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
