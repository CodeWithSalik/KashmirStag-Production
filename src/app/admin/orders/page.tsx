'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';
import { RefreshCw, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [customerFilter, setCustomerFilter] = useState(searchParams.get('customer') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const cust = searchParams.get('customer');
    const stat = searchParams.get('status');
    const s = searchParams.get('search');
    if (cust !== null && cust !== customerFilter) setCustomerFilter(cust);
    if (stat !== null && stat !== statusFilter) setStatusFilter(stat);
    if (s !== null && s !== searchTerm) setSearchTerm(s);
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (customerFilter) params.set('customer', customerFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const json = await res.json();
      const orders = json.data?.orders || [];
      const total = json.data?.total || 0;
      setTotalPages(Math.ceil(total / 20) || 1);

      setData(
        orders.map((o: any) => ({
          id: o.orderId,
          date: new Date(o.createdAt).toLocaleDateString('en-IN'),
          customerName: o.shippingAddress?.name || 'Customer',
          customerEmail: o.email,
          total: o.pricing?.total || 0,
          status: o.status,
          paymentStatus: o.paymentStatus,
        }))
      );
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, customerFilter, searchTerm, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setCustomerFilter('');
    setSearchTerm('');
    setPage(1);
    router.push('/admin/orders');
  };

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row: any) => (
        <Link href={`/admin/orders/${row.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
          #{row.id}
        </Link>
      ),
    },
    { key: 'date', label: 'Date' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: any) => (
        <div>
          <div className="font-medium text-text">{row.customerName}</div>
          <Link
            href={`/admin/customers?search=${row.customerEmail}`}
            className="text-xs text-text-secondary hover:text-brand-600 hover:underline"
            title="View customer details"
          >
            {row.customerEmail}
          </Link>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: any) =>
        `${CURRENCY_SYMBOL}${((row.total || 0) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge
          variant={
            row.status === 'confirmed' || row.status === 'delivered'
              ? 'success'
              : row.status === 'cancelled'
              ? 'error'
              : 'warning'
          }
        >
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Orders</h1>
          <p className="text-sm text-text-secondary mt-1">Live customer orders and fulfillment from MongoDB</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search Order ID, email, or customer name..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {customerFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-800 text-xs font-medium">
            <span>Customer: {customerFilter}</span>
            <button
              type="button"
              onClick={() => {
                setCustomerFilter('');
                router.push('/admin/orders');
              }}
              className="text-brand-600 hover:text-brand-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {(statusFilter || searchTerm || customerFilter) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-brand-600 hover:underline flex items-center gap-1 self-center"
          >
            Clear All
          </button>
        )}
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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
