'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCouponsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add Coupon form state
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to load coupons');
      const json = await res.json();
      const coupons = json.data?.coupons || [];
      const total = json.data?.total || 0;
      setTotalPages(Math.ceil(total / 20) || 1);

      setData(coupons.map((c: any) => ({
        id: c._id,
        code: c.code,
        type: c.type,
        value: c.value,
        usage: `${c.usedCount || 0} / ${c.usageLimit || '∞'}`,
        expiry: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never',
        status: c.isActive ? 'active' : 'inactive',
      })));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'percentage' ? Number(value) : Number(value) * 100, // convert rupees to paise for fixed
        minOrderAmount: minOrder > 0 ? Number(minOrder) * 100 : undefined,
        usageLimit: usageLimit > 0 ? Number(usageLimit) : undefined,
        isActive: true,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create coupon');

      toast({ title: 'Success', description: `Coupon ${code} created successfully!` });
      setCode('');
      setShowAdd(false);
      fetchCoupons();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type' },
    {
      key: 'value',
      label: 'Value',
      render: (row: any) => (row.type === 'percentage' ? `${row.value}%` : `₹${row.value / 100}`),
    },
    { key: 'usage', label: 'Usage' },
    { key: 'expiry', label: 'Expiry' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Coupons</h1>
          <p className="text-sm text-text-secondary mt-1">Live promotions from MongoDB</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchCoupons} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-2" /> Add Coupon
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-secondary border border-border rounded-lg max-w-lg space-y-4">
          <h3 className="font-semibold text-text">Create New Promotional Coupon</h3>
          <form onSubmit={handleCreateCoupon} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Coupon Code</label>
                <Input
                  placeholder="e.g. SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2 border border-border rounded-md bg-transparent text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Discount Value</label>
                <Input
                  type="number"
                  placeholder={type === 'percentage' ? '15' : '500'}
                  value={value || ''}
                  onChange={(e) => setValue(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Min Order (₹)</label>
                <Input
                  type="number"
                  placeholder="999"
                  value={minOrder || ''}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Usage Limit</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={usageLimit || ''}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !code.trim()}>
                {saving ? 'Creating...' : 'Create Coupon'}
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
