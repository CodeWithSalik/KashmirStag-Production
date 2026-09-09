'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';
import { Plus, RefreshCw, Edit, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionProduct, setActionProduct] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'archive' | 'restore'>('archive');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to load products');
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : [];
      setData(items);
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleConfirmAction = async () => {
    if (!actionProduct) return;
    setActionLoading(true);

    try {
      if (actionType === 'archive') {
        const res = await fetch(`/api/admin/products/${actionProduct.id}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to archive/delete product');
        toast({
          title: 'Catalog Updated',
          description: json.message || 'Product removed from active catalog.',
        });
      } else {
        const res = await fetch(`/api/admin/products/${actionProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to restore product');
        toast({
          title: 'Product Restored',
          description: json.message || 'Product restored to active catalog.',
        });
      }

      setActionProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message || 'Could not perform operation.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row: any) => (
        <div className="w-10 h-10 rounded overflow-hidden bg-surface-secondary border border-border shrink-0">
          <img
            src={row.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'}
            alt={row.title}
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    { key: 'title', label: 'Title' },
    { key: 'categoryName', label: 'Category', render: (row: any) => row.categoryName || 'General' },
    {
      key: 'price',
      label: 'Price',
      render: (row: any) =>
        `${CURRENCY_SYMBOL}${((row.basePrice || row.price || 0) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'archived' ? 'error' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'totalSold',
      label: 'Sold',
      render: (row: any) => row.totalSold ?? 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products/${row.id}`}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
            </Link>
          </Button>
          {row.status === 'archived' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionProduct(row);
                setActionType('restore');
              }}
              title="Restore to active catalog"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionProduct(row);
                setActionType('archive');
              }}
              className="text-text-secondary hover:text-error hover:bg-red-50"
              title="Archive or remove product"
            >
              <Archive className="w-3.5 h-3.5 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Products</h1>
          <p className="text-sm text-text-secondary mt-1">Live catalog from MongoDB</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Link>
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

      {/* Confirmation UX Modal */}
      <Modal
        isOpen={Boolean(actionProduct)}
        onClose={() => {
          if (!actionLoading) setActionProduct(null);
        }}
        title={actionType === 'archive' ? 'Archive or Delete Product?' : 'Restore Product?'}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-950">
                {actionType === 'archive'
                  ? `Are you sure you want to remove "${actionProduct?.title}"?`
                  : `Restore "${actionProduct?.title}" to the active catalog?`}
              </p>
              {actionType === 'archive' && (
                <p className="mt-1 text-xs text-amber-800">
                  If this product has historical orders or customer reviews, it will be <strong>safely archived</strong> (hidden from storefront) to preserve customer receipts and historical accuracy. If it has no orders, it will be safely removed.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActionProduct(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={actionType === 'archive' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Processing...'
                : actionType === 'archive'
                ? 'Confirm Archive / Delete'
                : 'Confirm Restore'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
