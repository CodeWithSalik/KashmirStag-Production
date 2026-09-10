'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';

function AdminCustomersContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState('');
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchTerm) params.set('search', searchTerm);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load customers');
      const json = await res.json();
      const users = json.data || [];
      setData(users);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row: any) => (
        <Badge variant={row.role === 'admin' ? 'brand' : 'default'}>{row.role}</Badge>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (row: any) => (
        <div className="text-xs">
          <span className="font-semibold">{row.orderCount || 0}</span> orders
          {row.totalSpent > 0 && (
            <div className="text-text-secondary">
              {CURRENCY_SYMBOL}{Math.round(row.totalSpent / CURRENCY_SUBUNIT).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      ),
    },
    { key: 'joined', label: 'Joined Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'active' ? 'success' : 'error'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Link
          href={`/admin/orders?customer=${encodeURIComponent(row.email)}`}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          View Orders
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Registered Users</h1>
          <p className="text-sm text-text-secondary mt-1">Live customers & accounts from MongoDB</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-3 text-text-tertiary" />
            <Input
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-sm w-56"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 border border-border rounded-md bg-transparent text-sm"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
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

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading customers...</div>}>
      <AdminCustomersContent />
    </Suspense>
  );
}
