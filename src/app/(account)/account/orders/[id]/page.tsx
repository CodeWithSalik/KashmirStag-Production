import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import mongoose from "mongoose";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const user = token ? verifyJwt(token) : null;

  if (!user) notFound();

  await connectDB();

  // Search by public orderId first, fallback to _id
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const order = await Order.findOne({
    userId: user.sub,
    $or: [{ orderId: id }, ...(isObjectId ? [{ _id: id }] : [])],
  }).lean() as any;

  if (!order) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Link href="/account/orders" className="text-brand-700 text-sm hover:underline">
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-surface-secondary p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-6 justify-between">
        <div>
          <div className="text-sm text-text-tertiary">Order Number</div>
          <div className="font-medium">#{order.orderId}</div>
        </div>
        <div>
          <div className="text-sm text-text-tertiary">Date Placed</div>
          <div className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
        </div>
        <div>
          <div className="text-sm text-text-tertiary">Total Amount</div>
          <div className="font-medium">{formatPrice(order.pricing?.total ?? 0)}</div>
        </div>
        <div>
          <div className="text-sm text-text-tertiary">Status</div>
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
          <div className="space-y-3">
            {order.timeline.map((event: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-brand-600 shrink-0" />
                <div>
                  <div className="text-sm font-medium capitalize">{event.status}</div>
                  {event.comment && <div className="text-xs text-text-secondary">{event.comment}</div>}
                  <div className="text-xs text-text-tertiary">
                    {new Date(event.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Items</h2>
      <div className="border border-border rounded-lg divide-y divide-border mb-8">
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="p-4 flex gap-4">
            <div className="w-16 h-16 bg-surface-tertiary rounded-md shrink-0 overflow-hidden">
              {item.image && (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              {item.variant && (
                <div className="text-sm text-text-secondary">{item.variant}</div>
              )}
              <div className="text-sm text-text-tertiary">Qty: {item.quantity}</div>
            </div>
            <div className="font-medium">{formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          <div className="p-4 border border-border rounded-lg text-sm text-text-secondary">
            {order.shippingAddress?.name}<br />
            {order.shippingAddress?.line1}<br />
            {order.shippingAddress?.line2 && <>{order.shippingAddress.line2}<br /></>}
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
            {order.shippingAddress?.phone}
          </div>
        </div>

        {/* Tracking */}
        {order.fulfillment?.trackingNumber && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Tracking</h2>
            <div className="p-4 border border-border rounded-lg text-sm">
              <div><span className="text-text-tertiary">Carrier:</span> {order.fulfillment.carrier}</div>
              <div><span className="text-text-tertiary">Tracking:</span> {order.fulfillment.trackingNumber}</div>
              {order.fulfillment.trackingUrl && (
                <a
                  href={order.fulfillment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 font-medium mt-2 inline-block hover:underline"
                >
                  Track Package →
                </a>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="p-4 border border-border rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal</span>
              <span>{formatPrice(order.pricing?.subtotal ?? 0)}</span>
            </div>
            {(order.pricing?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatPrice(order.pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Shipping</span>
              <span>{order.pricing?.shippingFee === 0 ? 'Free' : formatPrice(order.pricing?.shippingFee ?? 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span>{formatPrice(order.pricing?.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
