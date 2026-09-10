'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ORDER_STATUSES, CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState('pending');
  const [statusComment, setStatusComment] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const json = await res.json();
      const o = json.data;
      setOrder(o);
      setStatus(o.status);
      if (o.fulfillment) {
        setCarrier(o.fulfillment.carrier || '');
        setTrackingNumber(o.fulfillment.trackingNumber || '');
        setTrackingUrl(o.fulfillment.trackingUrl || '');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment: statusComment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update order status');
      toast({ title: 'Success', description: `Order status updated to ${status}` });
      setStatusComment('');
      fetchOrder();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTracking = async () => {
    if (!carrier || !trackingNumber) {
      toast({ title: 'Validation Error', description: 'Carrier and tracking number are required', variant: 'destructive' });
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, trackingNumber, trackingUrl: trackingUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update tracking');
      toast({ title: 'Success', description: 'Tracking information added and order marked shipped' });
      fetchOrder();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be restocked/released.')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', comment: 'Cancelled by admin from dashboard' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to cancel order');
      toast({ title: 'Order Cancelled', description: 'Order cancelled and inventory updated' });
      fetchOrder();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-text">Order #{order.orderId}</h1>
          <Badge variant={order.status === 'confirmed' || order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}>
            {order.status}
          </Badge>
          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'default'}>
            Payment: {order.paymentStatus}
          </Badge>
        </div>
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50" onClick={handleCancelOrder} disabled={updating}>
            Cancel Order
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Ordered Items</h2>
            <div className="divide-y divide-border">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover border border-border" />
                    )}
                    <div>
                      {item.productId ? (
                        <Link
                          href={`/admin/products/${item.productId}`}
                          className="font-medium text-sm text-text hover:text-brand-500 hover:underline inline-flex items-center gap-1"
                        >
                          {item.title}
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </Link>
                      ) : (
                        <div className="font-medium text-sm text-text">{item.title}</div>
                      )}
                      {item.variant && <div className="text-xs text-text-secondary">{item.variant}</div>}
                      <div className="text-xs text-text-tertiary">SKU: {item.sku} | Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-medium text-sm text-text">
                    {CURRENCY_SYMBOL}{((item.lineTotal || item.unitPrice * item.quantity) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span>{CURRENCY_SYMBOL}{((order.pricing?.total || 0) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Order Timeline</h2>
            <div className="space-y-3">
              {order.timeline?.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 text-sm border-l-2 border-brand-500 pl-3">
                  <div className="text-xs text-text-secondary w-36">
                    {new Date(event.createdAt).toLocaleString('en-IN')}
                  </div>
                  <div>
                    <span className="font-semibold capitalize text-text">{event.status}</span>
                    {event.comment && <span className="text-text-secondary ml-2">— {event.comment}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold">Customer & Shipping</h2>
            <div className="text-sm space-y-1 text-text-secondary">
              <p><strong>Name:</strong> {order.shippingAddress?.name}</p>
              <p>
                <strong>Email:</strong>{' '}
                <Link
                  href={`/admin/customers?search=${encodeURIComponent(order.email || '')}`}
                  className="text-brand-500 hover:underline inline-flex items-center gap-1"
                >
                  {order.email}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </p>
              <p><strong>Phone:</strong> {order.shippingAddress?.phone}</p>
              <div className="pt-2 border-t border-border">
                <p>{order.shippingAddress?.line1}</p>
                {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Update Status</h2>
            <div className="space-y-3">
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="p-2 border border-border rounded-md bg-transparent w-full text-sm"
              >
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                placeholder="Comment (optional)"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
              />
              <Button onClick={handleUpdateStatus} disabled={updating || status === order.status} className="w-full">
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Fulfillment & Tracking</h2>
            <div className="space-y-3">
              <Input 
                value={carrier} 
                onChange={(e) => setCarrier(e.target.value)} 
                placeholder="Carrier (e.g. BlueDart, Delhivery)" 
              />
              <Input 
                value={trackingNumber} 
                onChange={(e) => setTrackingNumber(e.target.value)} 
                placeholder="Tracking Number" 
              />
              <Input 
                value={trackingUrl} 
                onChange={(e) => setTrackingUrl(e.target.value)} 
                placeholder="Tracking URL (optional)" 
              />
              <Button onClick={handleAddTracking} disabled={updating || !carrier || !trackingNumber} className="w-full">
                {updating ? 'Saving...' : 'Save & Mark Shipped'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
