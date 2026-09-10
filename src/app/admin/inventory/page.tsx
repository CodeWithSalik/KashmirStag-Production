'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RefreshCw, Search, History, ArrowUpDown, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function AdminInventoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [outOfStockFilter, setOutOfStockFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Stock adjust modal state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('RESTOCK');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // History modal state
  const [historyVariant, setHistoryVariant] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (lowStockFilter) params.set('lowStock', 'true');
      if (outOfStockFilter) params.set('outOfStock', 'true');

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load inventory');
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : [];
      setData(
        items.map((v: any) => ({
          id: v._id,
          productId: v.productId?._id || v.productId,
          productTitle: v.productId?.title || 'Unknown Product',
          productSlug: v.productId?.slug || '',
          variant: [v.size, v.color].filter(Boolean).join(' / ') || 'Standard',
          sku: v.sku,
          available: v.availableQty ?? 0,
          reserved: v.reservedQty ?? 0,
          onHand: (v.availableQty ?? 0) + (v.reservedQty ?? 0),
          threshold: v.lowStockThreshold ?? 5,
          isActive: v.isActive !== false,
          raw: v,
        }))
      );
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, lowStockFilter, outOfStockFilter, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const fetchHistory = async (variant: any) => {
    setHistoryVariant(variant);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${variant.id}/history`);
      if (!res.ok) throw new Error('Failed to fetch transaction history');
      const json = await res.json();
      setHistoryList(json.data?.history || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || adjustQty === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/inventory/${selectedVariant.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: adjustQty,
          type: adjustType,
          note: adjustNote.trim() || 'Manual adjustment via inventory dashboard',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to adjust stock');
      toast({
        title: 'Stock Adjusted',
        description: `SKU "${selectedVariant.sku}" stock updated by ${adjustQty > 0 ? '+' : ''}${adjustQty}.`,
      });
      setSelectedVariant(null);
      setAdjustQty(0);
      setAdjustNote('');
      fetchInventory();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      label: 'Product / Variant',
      render: (row: any) => (
        <div>
          <Link
            href={`/admin/products/${row.productId}`}
            className="font-medium text-text hover:text-brand-600 hover:underline"
            title="Edit product"
          >
            {row.productTitle}
          </Link>
          <div className="text-xs text-text-secondary">{row.variant}</div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row: any) => (
        <span className="font-mono text-xs font-semibold text-text">{row.sku}</span>
      ),
    },
    {
      key: 'onHand',
      label: 'On-Hand',
      render: (row: any) => <span className="text-sm font-semibold">{row.onHand}</span>,
    },
    {
      key: 'reserved',
      label: 'Reserved',
      render: (row: any) => (
        <span className={row.reserved > 0 ? 'text-amber-700 font-semibold text-xs' : 'text-text-tertiary text-xs'}>
          {row.reserved}
        </span>
      ),
    },
    {
      key: 'available',
      label: 'Available',
      render: (row: any) => (
        <Badge variant={row.available === 0 ? 'error' : row.available <= row.threshold ? 'warning' : 'success'}>
          {row.available === 0 ? '0 (Out of Stock)' : `${row.available} units`}
        </Badge>
      ),
    },
    {
      key: 'threshold',
      label: 'Alert Threshold',
      render: (row: any) => <span className="text-xs text-text-tertiary">{row.threshold} units</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedVariant(row);
              setAdjustQty(0);
              setAdjustType('RESTOCK');
              setAdjustNote('');
            }}
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Adjust
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHistory(row)}
            title="View inventory transaction history"
          >
            <History className="w-3.5 h-3.5 mr-1" /> History
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Inventory Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real on-hand, reserved, and available stock levels from MongoDB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={lowStockFilter ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setLowStockFilter(!lowStockFilter);
              setPage(1);
            }}
          >
            Low Stock Only
          </Button>
          <Button
            variant={outOfStockFilter ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setOutOfStockFilter(!outOfStockFilter);
              setPage(1);
            }}
          >
            Out of Stock Only
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-text-tertiary" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by SKU or product title..."
            className="pl-9 text-xs"
          />
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              router.push('/admin/inventory');
            }}
            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
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

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={Boolean(selectedVariant)}
        onClose={() => {
          if (!submitting) setSelectedVariant(null);
        }}
        title="Adjust Inventory Stock"
        size="md"
      >
        {selectedVariant && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="p-3 bg-surface-secondary border border-border rounded-lg text-xs space-y-1">
              <div>
                <strong>Product:</strong> {selectedVariant.productTitle}
              </div>
              <div>
                <strong>Variant:</strong> {selectedVariant.variant} | <strong>SKU:</strong> {selectedVariant.sku}
              </div>
              <div>
                <strong>Current Available:</strong> {selectedVariant.available} units (
                {selectedVariant.reserved} reserved)
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Adjustment Operation</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="RESTOCK">Receive / Restock Inventory (+)</option>
                <option value="CORRECTION">Inventory Count Correction (+ or -)</option>
                <option value="DAMAGE">Damaged / Defective Loss (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Quantity to Change <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={adjustQty || ''}
                onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 10 or -3"
                required
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                Resulting Available Stock:{' '}
                <strong>{Math.max(0, (selectedVariant.available || 0) + (adjustQty || 0))}</strong> units
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Reason / Note</label>
              <Input
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. Received new shipment from Srinagar warehouse"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedVariant(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting || adjustQty === 0}>
                {submitting ? 'Applying Adjustment...' : 'Apply Adjustment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        isOpen={Boolean(historyVariant)}
        onClose={() => setHistoryVariant(null)}
        title={`Inventory History: ${historyVariant?.sku || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Product: <strong>{historyVariant?.productTitle}</strong> ({historyVariant?.variant})
          </p>

          {historyLoading ? (
            <div className="py-8 text-center text-xs text-text-secondary">
              Loading inventory transaction history...
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-tertiary italic">
              No inventory transactions recorded for this variant yet.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary uppercase text-[10px] text-text-secondary border-b border-border sticky top-0">
                  <tr>
                    <th className="p-2.5">Date &amp; Time</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Delta Qty</th>
                    <th className="p-2.5">Actor</th>
                    <th className="p-2.5">Note / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyList.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-surface-secondary/40">
                      <td className="p-2.5 whitespace-nowrap text-text-secondary">
                        {new Date(tx.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5">
                        <Badge
                          variant={
                            tx.type === 'RESTOCK'
                              ? 'success'
                              : tx.type === 'SALE'
                              ? 'brand'
                              : tx.type === 'RESERVATION'
                              ? 'warning'
                              : tx.type === 'DAMAGE'
                              ? 'error'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-semibold">
                        <span className={tx.quantity > 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="p-2.5 text-text-secondary">
                        {tx.actorId?.name || tx.actorId?.email || 'System / Customer'}
                      </td>
                      <td className="p-2.5 text-text-secondary max-w-xs truncate">
                        {tx.note || tx.reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="outline" onClick={() => setHistoryVariant(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading inventory...</div>}>
      <AdminInventoryContent />
    </Suspense>
  );
}
