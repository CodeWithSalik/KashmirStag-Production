import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { parseBody, successResponse } from "@/lib/api-helpers";
import { addressService } from "@/services/address.service";
import { updateAddressSchema } from "@/validations/address.schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await connectDB();
    const address = await addressService.getAddressById(user.sub, id);
    return successResponse(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await connectDB();
    const data = await parseBody(request, updateAddressSchema);
    const address = await addressService.updateAddress(user.sub, id, data);
    return successResponse(address, 'Address updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await connectDB();
    const body = await request.json().catch(() => ({}));

    if (body.action === 'setDefault') {
      const address = await addressService.setDefaultAddress(user.sub, id);
      return successResponse(address, 'Default address updated successfully');
    }

    const data = updateAddressSchema.parse(body);
    const address = await addressService.updateAddress(user.sub, id, data);
    return successResponse(address, 'Address updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await connectDB();
    const result = await addressService.deleteAddress(user.sub, id);
    return successResponse(result, 'Address deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
