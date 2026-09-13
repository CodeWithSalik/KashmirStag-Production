import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import mongoose from "mongoose";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  ExternalLink,
  AlertCircle 
} from "lucide-react";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
    case 'delivered':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'processing':
    case 'packed':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'cancelled':
    case 'refunded':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'return_requested':
    case 'returned':
    case 'pending':
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const user = token ? verifyJwt(token) : null;

  if (!user) notFound();

  await connectDB();

  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const order = await Order.findOne({
    userId: user.sub,
    $or: [{ orderId: id }, ...(isObjectId ? [{ _id: id }] : [])],
  }).lean() as any;

  if (!order) notFound();

  const steps = [
    { key: 'placed', label: 'Order Placed', statuses: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'] },
    { key: 'processing', label: 'Processing', statuses: ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'] },
    { key: 'packed', label: 'Packed', statuses: ['packed', 'shipped', 'out_for_delivery', 'delivered'] },
    { key: 'shipped', label: 'Shipped', statuses: ['shipped', 'out_for_delivery', 'delivered'] },
    { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  ];

  const isTerminal = ['cancelled', 'refunded', 'returned'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/account/orders" className="text-text-secondary hover:text-text transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-text">Order #{order.orderId}</h1>
          </div>
          <p className="text-xs text-text-secondary">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Fulfillment Stepper */}
      {!isTerminal ? (
        <div className="p-6 rounded-xl bg-surface border border-border shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-6">Delivery Progress</h2>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-surface-secondary -z-0" />
            {steps.map((step, idx) => {
              const isCompleted = step.statuses.includes(order.status);
              const isCurrent = (step.key === 'placed' && (order.status === 'pending' || order.status === 'confirmed')) ||
                                (step.key === 'processing' && order.status === 'processing') ||
                                (step.key === 'packed' && order.status === 'packed') ||
                                (step.key === 'shipped' && (order.status === 'shipped' || order.status === 'out_for_delivery')) ||
                                (step.key === 'delivered' && order.status === 'delivered');
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted 
                      ? 'bg-brand-700 text-white shadow-xs' 
                      : 'bg-surface border border-border text-text-muted'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] mt-2 font-medium text-center ${
                    isCurrent ? 'text-brand-900 font-bold' : isCompleted ? 'text-text' : 'text-text-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 shrink-0" />
          <span>This order was <strong>{order.status}</strong>. If you have questions regarding this order, please reach out to our concierge support.</span>
        </div>
      )}

      {/* Items Section */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-xs">
        <h2 className="text-sm font-bold text-text mb-4 pb-3 border-b border-border">Order Items ({order.items?.length || 0})</h2>
        <div className="divide-y divide-border">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-secondary rounded-lg shrink-0 relative overflow-hidden border border-border">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">No Image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text text-sm truncate">{item.title}</div>
                {item.variant && (
                  <div className="text-xs text-text-secondary mt-0.5">Option: {item.variant}</div>
                )}
                <div className="text-xs text-text-muted mt-0.5">Quantity: {item.quantity} &times; {formatPrice(item.unitPrice)}</div>
              </div>
              <div className="font-bold text-text text-sm">{formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Shipping, Tracking, Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-surface border border-border shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border text-text font-semibold text-sm">
              <MapPin className="w-4 h-4 text-brand-700" />
              <span>Delivery Address</span>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed space-y-1">
              <p className="font-semibold text-text">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              <p className="font-medium text-text pt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {order.fulfillment?.trackingNumber && (
            <div className="p-6 rounded-xl bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border text-text font-semibold text-sm">
                <Truck className="w-4 h-4 text-brand-700" />
                <span>Courier Tracking</span>
              </div>
              <div className="text-xs text-text-secondary space-y-1.5">
                <div><span className="text-text-muted">Carrier:</span> <span className="font-semibold text-text">{order.fulfillment.carrier}</span></div>
                <div><span className="text-text-muted">Waybill / Tracking:</span> <span className="font-mono font-medium text-text">{order.fulfillment.trackingNumber}</span></div>
                {order.fulfillment.trackingUrl && (
                  <a
                    href={order.fulfillment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors pt-2"
                  >
                    <span>Track Package on Carrier Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border shadow-xs h-fit">
          <h2 className="text-sm font-bold text-text mb-3 pb-2 border-b border-border">Payment Summary</h2>
          <div className="text-xs space-y-2.5">
            <div className="flex justify-between text-text-secondary">
              <span>Items Subtotal</span>
              <span className="font-medium text-text">{formatPrice(order.pricing?.subtotal ?? 0)}</span>
            </div>
            {(order.pricing?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <span>Promotional Discount</span>
                <span>-{formatPrice(order.pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Shipping Fee</span>
              <span className="font-medium text-text">
                {order.pricing?.shippingFee === 0 ? 'Free Express' : formatPrice(order.pricing?.shippingFee ?? 0)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-3 border-t border-border mt-3 text-text">
              <span>Total Paid</span>
              <span className="text-lg text-brand-900">{formatPrice(order.pricing?.total ?? 0)}</span>
            </div>
            <div className="pt-2 text-[11px] text-text-muted flex justify-between">
              <span>Payment Status</span>
              <span className="font-semibold uppercase tracking-wider text-text">{order.paymentStatus || 'Paid'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
