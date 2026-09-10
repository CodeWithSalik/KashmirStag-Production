import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import ProductVariant from '@/models/ProductVariant';
import { createVariantSchema } from '@/validations/product.schema';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    await requireAdmin(request);
    const variants = await ProductVariant.find({ productId: id }).lean();
    return successResponse(variants);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await requireAdmin(request);
    const body = await request.json();
    const data = createVariantSchema.parse({ ...body, productId: id });
    const variant = await ProductVariant.create(data);

    if (data.availableQty > 0) {
      const InventoryTransaction = (await import('@/models/InventoryTransaction')).default;
      await InventoryTransaction.create({
        variantId: variant._id,
        productId: id,
        type: 'RESTOCK',
        quantity: data.availableQty,
        actorId: user.id,
        note: 'Opening stock for newly added variant',
      });
    }

    const { auditService } = await import('@/services/audit.service');
    await auditService.log(user.id, 'CREATE_VARIANT', 'ProductVariant', variant._id, {
      sku: variant.sku,
      productId: id,
      availableQty: data.availableQty,
      price: data.price,
    });

    return successResponse(variant, 'Variant created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
