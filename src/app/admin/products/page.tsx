'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Edit,
  Archive,
  RotateCcw,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [collectionFilter, setCollectionFilter] = useState(searchParams.get('collection') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Options
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Modal actions
  const [actionProduct, setActionProduct] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'archive' | 'restore'>('archive');
  const [actionLoading, setActionLoading] = useState(false);

  // Load Categories & Collections for filter dropdowns
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, colRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/collections'),
        ]);
        if (catRes.ok) {
          const json = await catRes.json();
          setCategories(json.data || []);
        }
        if (colRes.ok) {
          const json = await colRes.json();
          setCollections(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    }
    loadMeta();
  }, []);

  // Update filter states when URL query params change (e.g. from Category -> View Products link)
  useEffect(() => {
    const cat = searchParams.get('category');
    const col = searchParams.get('collection');
    const stat = searchParams.get('status');
    const q = searchParams.get('search');
    if (cat !== null && cat !== categoryFilter) setCategoryFilter(cat);
    if (col !== null && col !== collectionFilter) setCollectionFilter(col);
    if (stat !== null && stat !== statusFilter) setStatusFilter(stat);
    if (q !== null && q !== searchTerm) setSearchTerm(q);
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (categoryFilter) params.set('category', categoryFilter);
      if (collectionFilter) params.set('collection', collectionFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
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
  }, [page, searchTerm, categoryFilter, collectionFilter, statusFilter, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setCollectionFilter('');
    setStatusFilter('');
    setPage(1);
    router.push('/admin/products');
  };

  const hasActiveFilters = Boolean(searchTerm || categoryFilter || collectionFilter || statusFilter);

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
            src={
              row.image ||
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
            }
            alt={row.title}
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row: any) => (
        <div>
          <Link
            href={`/admin/products/${row.id}`}
            className="font-medium text-text hover:text-brand-600 hover:underline"
          >
            {row.title}
          </Link>
          <div className="text-[11px] text-text-tertiary font-mono">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: 'Category',
      render: (row: any) =>
        row.categoryName ? (
          <button
            type="button"
            onClick={() => {
              setCategoryFilter(row.categoryId || '');
              setPage(1);
            }}
            className="text-xs text-brand-600 hover:underline text-left font-medium"
          >
            {row.categoryName}
          </button>
        ) : (
          <span className="text-xs text-text-tertiary">Uncategorized</span>
        ),
    },
    {
      key: 'collections',
      label: 'Collections',
      render: (row: any) =>
        row.collections && row.collections.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.collections.map((c: any) => (
              <span
                key={c.id}
                onClick={() => {
                  setCollectionFilter(c.id);
                  setPage(1);
                }}
                className="cursor-pointer text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary hover:bg-brand-50 hover:text-brand-700 border border-border"
              >
                {c.title}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row: any) =>
        `${CURRENCY_SYMBOL}${((row.basePrice || row.price || 0) / CURRENCY_SUBUNIT).toLocaleString('en-IN')}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (row: any) => {
        const stock = row.totalStock ?? 0;
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant={stock === 0 ? 'error' : stock <= 5 ? 'warning' : 'success'}>
              {stock === 0 ? 'Out of Stock' : `${stock} available`}
            </Badge>
            {row.totalReserved > 0 && (
              <span className="text-[10px] text-text-tertiary font-medium">
                ({row.totalReserved} reserved)
              </span>
            )}
          </div>
        );
      },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Products</h1>
          <p className="text-sm text-text-secondary mt-1">
            Connected catalog, variants, and live inventory truth
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Filter Bar */}
      <div className="p-4 bg-surface border border-border rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" /> Filter Catalog
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, tag, or SKU..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.productCount ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Collection Dropdown */}
          <div>
            <select
              value={collectionFilter}
              onChange={(e) => {
                setCollectionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">All Collections</option>
              {collections.map((col) => (
                <option key={col._id} value={col._id}>
                  {col.name || col.title} ({col.productCount ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 capitalize"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
          </div>
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

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading product catalog...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
