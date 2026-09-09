'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminInventoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [outOfStockFilter, setOutOfStockFilter] = useState(false);

  // Stock adjust modal state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('PURCHASE');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (lowStockFilter) params.set('lowStock', 'true');
      if (outOfStockFilter) params.set('outOfStock', 'true');

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load inventory');
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : [];
      setData(items.map((v: any) => ({
        id: v._id,
        product: v.productId?.title || 'Unknown Product',
        variant: [v.size, v.color].filter(Boolean).join(' / ') || 'Default',
        sku: v.sku,
        available: v.availableQty,
        reserved: v.reservedQty,
        threshold: v.lowStockThreshold,
        raw: v,
      })));
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, lowStockFilter, outOfStockFilter, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

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
          note: adjustNote || 'Manual adjustment via admin panel',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to adjust stock');
      toast({ title: 'Success', description: 'Stock adjusted successfully' });
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
    { key: 'product', label: 'Product' },
    { key: 'variant', label: 'Variant' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'available',
      label: 'Available',
      render: (row: any) => (
        <Badge variant={row.available === 0 ? 'error' : row.available <= row.threshold ? 'warning' : 'success'}>
          {row.available}
        </Badge>
      ),
    },
    { key: 'reserved', label: 'Reserved' },
    { key: 'threshold', label: 'Threshold' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedVariant(row)}>
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Inventory Management</h1>
          <p className="text-sm text-text-secondary mt-1">Live stock levels from MongoDB</p>
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
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {selectedVariant && (
        <div className="p-4 bg-surface-secondary border border-border rounded-lg max-w-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-text">
              Adjust Stock: {selectedVariant.product} ({selectedVariant.variant})
            </h3>
            <span className="text-xs text-text-tertiary">Current: {selectedVariant.available}</span>
          </div>
          <form onSubmit={handleAdjustSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Adjustment Quantity (+/-)</label>
                <Input
                  type="number"
                  placeholder="+5 or -2"
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Transaction Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-transparent text-sm"
                >
                  <option value="PURCHASE">PURCHASE (Restock)</option>
                  <option value="CORRECTION">CORRECTION (Audit)</option>
                  <option value="DAMAGE">DAMAGE (Write-off)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Note (Optional)</label>
              <Input
                placeholder="Reason for adjustment"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVariant(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting || adjustQty === 0}>
                {submitting ? 'Updating...' : 'Save Adjustment'}
              </Button>
            </div>
          </form>
        </div>
      )}

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
