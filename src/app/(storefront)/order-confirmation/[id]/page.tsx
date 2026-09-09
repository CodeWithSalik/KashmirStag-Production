import React from 'react';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Link from 'next/link';
import { formatPrice } from '@/lib/money';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const order = await Order.findOne({
    $or: [{ orderId: id }, ...(isObjectId ? [{ _id: id }] : [])],
  }).lean() as any;

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-text">Order Confirmed!</h1>
        <p className="text-text-secondary">
          Thank you for choosing KashmirStag. We have received your order and are preparing it with care.
        </p>
        <p className="text-sm font-medium text-brand-700">
          Order ID: #{order.orderId}
        </p>
      </div>

      <div className="bg-surface-secondary border border-border rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div>
            <div className="text-xs text-text-tertiary uppercase tracking-wider">Date</div>
            <div className="font-medium text-sm text-text">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-tertiary uppercase tracking-wider">Status</div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 capitalize">
              {order.status}
            </span>
          </div>
          <div>
            <div className="text-xs text-text-tertiary uppercase tracking-wider">Payment</div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 capitalize">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text mb-4">Items Ordered</h2>
          <div className="divide-y divide-border">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover border border-border shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-medium text-sm text-text">{item.title}</div>
                    {item.variant && (
                      <div className="text-xs text-text-secondary">{item.variant}</div>
                    )}
                    <div className="text-xs text-text-tertiary">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="font-medium text-sm text-text">
                  {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Shipping Details</h3>
            <div className="text-sm text-text-secondary space-y-0.5">
              <div className="font-medium text-text">{order.shippingAddress?.name}</div>
              <div>{order.shippingAddress?.line1}</div>
              {order.shippingAddress?.line2 && <div>{order.shippingAddress.line2}</div>}
              <div>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              </div>
              <div>Phone: {order.shippingAddress?.phone}</div>
              <div>Email: {order.email}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Payment Summary</h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatPrice(order.pricing?.subtotal ?? 0)}</span>
              </div>
              {(order.pricing?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(order.pricing.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>{order.pricing?.shippingFee === 0 ? 'Free' : formatPrice(order.pricing?.shippingFee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text pt-2 border-t border-border">
                <span>Total Paid</span>
                <span>{formatPrice(order.pricing?.total ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface text-text font-medium hover:bg-surface-secondary transition"
        >
          View My Orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
