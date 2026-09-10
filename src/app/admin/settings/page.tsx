'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Save, AlertTriangle, ShieldCheck, Truck, Bell, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    storeName: 'KashmirStag',
    supportEmail: 'support@kashmirstag.com',
    supportPhone: '+91 9906000000',
    freeShippingThreshold: 1999,
    standardShippingRate: 99,
    orderPrefix: 'KS',
    announcementBarText: 'Crafted in Kashmir • Free shipping on orders over ₹1,999',
    announcementBarActive: true,
    maintenanceMode: false,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = await res.json();
      if (json.data) {
        setForm((prev) => ({
          ...prev,
          ...json.data,
        }));
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save settings');

      toast({ title: 'Settings Saved', description: 'Store configuration updated successfully in MongoDB.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Store Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Live configuration saved to MongoDB database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading || saving}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Reload
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Store Info */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Store className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-text">Store Identity & Contact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Store Name</label>
              <Input
                value={form.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Order ID Prefix</label>
              <Input
                value={form.orderPrefix}
                onChange={(e) => handleChange('orderPrefix', e.target.value.toUpperCase())}
                placeholder="KS"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Support Email</label>
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Support Phone</label>
              <Input
                value={form.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Shipping & Delivery */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Truck className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-text">Shipping & Thresholds</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Free Shipping Order Threshold (₹)</label>
              <Input
                type="number"
                min="0"
                value={form.freeShippingThreshold}
                onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
              />
              <span className="text-[11px] text-text-tertiary">Orders above this subtotal qualify for free shipping.</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Standard Shipping Fee (₹)</label>
              <Input
                type="number"
                min="0"
                value={form.standardShippingRate}
                onChange={(e) => handleChange('standardShippingRate', Number(e.target.value))}
              />
              <span className="text-[11px] text-text-tertiary">Default flat shipping fee for orders below threshold.</span>
            </div>
          </div>
        </Card>

        {/* Announcement Bar */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-text">Storefront Announcement Bar</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={form.announcementBarActive}
                onChange={(e) => handleChange('announcementBarActive', e.target.checked)}
                className="rounded border-border text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              Enable Banner
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Banner Text</label>
            <Input
              value={form.announcementBarText}
              onChange={(e) => handleChange('announcementBarText', e.target.value)}
              placeholder="e.g. Complimentary shipping across India on orders above ₹1,999"
            />
          </div>
        </Card>

        {/* System & Maintenance */}
        <Card className="p-6 space-y-4 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-text">Store Maintenance Mode</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-600">
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="rounded border-border text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              Enable Maintenance Mode
            </label>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            When enabled, visitors will see a graceful maintenance page informing them of scheduled updates.
            Logged-in administrators retain full access to all admin tools.
          </p>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={fetchSettings} disabled={saving}>
            Discard Changes
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
