'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const json = await res.json();
      const orders = json.data?.orders || [];
      const total = json.data?.total || 0;
      setTotalPages(Math.ceil(total / 20) || 1);

      setData(orders.map((o: any) => ({
        id: o.orderId,
        date: new Date(o.createdAt).toLocaleDateString('en-IN'),
        customer: o.shippingAddress?.name ? `${o.shippingAddress.name} (${o.email})` : o.email,
        total: o.pricing?.total || 0,
        status: o.status,
        paymentStatus: o.paymentStatus,
      })));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    {
      key: 'total',
      label: 'Total',
      render: (row: any) => `${CURRENCY_SYMBOL}${((row.total || 0) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'confirmed' || row.status === 'delivered' ? 'success' : row.status === 'cancelled' ? 'error' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'paid' ? 'success' : 'default'}>
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/orders/${row.id}`}>Manage</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Orders</h1>
          <p className="text-sm text-text-secondary mt-1">Live orders from MongoDB</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 border border-border rounded-md bg-transparent text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={data}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
