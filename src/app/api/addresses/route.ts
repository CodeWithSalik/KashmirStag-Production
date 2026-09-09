import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { parseBody, successResponse } from "@/lib/api-helpers";
import { addressService } from "@/services/address.service";
import { createAddressSchema } from "@/validations/address.schema";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    await connectDB();
    const addresses = await addressService.getUserAddresses(user.sub);
    return successResponse(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    await connectDB();
    const data = await parseBody(request, createAddressSchema);
    const address = await addressService.createAddress(user.sub, data);
    return successResponse(address, 'Address created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
