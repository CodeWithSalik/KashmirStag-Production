'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PRODUCT_STATUSES } from '@/config/constants';
import { useRouter, useParams } from 'next/navigation';
import { ProductImageManager } from '@/components/admin/product-image-manager';
import { ArrowLeft, Loader2, ExternalLink, Archive, AlertTriangle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  shortDescription: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'Base price cannot be negative'),
  compareAtPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived'] as const),
  weight: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [productSlug, setProductSlug] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Stock adjustment state
  const [adjustingVariantId, setAdjustingVariantId] = useState<string | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [provisioning, setProvisioning] = useState<boolean>(false);

  // Add Variant modal state
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState<number>(0);
  const [newVariantStock, setNewVariantStock] = useState<number>(10);
  const [creatingVariant, setCreatingVariant] = useState(false);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'active',
      basePrice: 0,
      description: '',
    }
  });

  const loadData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [prodRes, catRes, colRes] = await Promise.all([
        fetch(`/api/admin/products/${id}`),
        fetch('/api/admin/categories'),
        fetch('/api/admin/collections'),
      ]);

      if (catRes.ok) {
        const catJson = await catRes.json();
        setCategories(catJson.data || []);
      }

      if (colRes.ok) {
        const colJson = await colRes.json();
        setCollections(colJson.data || []);
      }

      if (!prodRes.ok) {
        throw new Error('Failed to load product details');
      }

      const prodJson = await prodRes.json();
      const p = prodJson.data;

      setProductSlug(p.slug || '');
      setImages(Array.isArray(p.images) ? p.images : []);
      setVariants(Array.isArray(p.variants) ? p.variants : []);

      const existingColIds = Array.isArray(p.collectionIds)
        ? p.collectionIds.map((c: any) => (typeof c === 'object' && c !== null ? c._id : c))
        : [];
      setSelectedCollections(existingColIds);

      reset({
        title: p.title || '',
        slug: p.slug || '',
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        basePrice: p.basePrice || 0,
        compareAtPrice: p.compareAtPrice || 0,
        costPrice: p.costPrice || 0,
        categoryId: p.categoryId?._id || p.categoryId || 'none',
        status: p.status || 'active',
        weight: p.weight || 0,
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      });
    } catch (err: any) {
      toast({
        title: 'Error Loading Product',
        description: err.message || 'Could not fetch product information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, reset, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProvisionDefaultVariant = async () => {
    setProvisioning(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: `KS-${(productSlug || 'PROD').substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          availableQty: 10,
          price: watch('basePrice') || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to provision variant');
      toast({ title: 'Variant Created', description: 'Default variant provisioned with 10 units in stock.' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProvisioning(false);
    }
  };

  const handleCreateNewVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariantSku.trim()) {
      toast({ title: 'Validation Error', description: 'SKU is required', variant: 'destructive' });
      return;
    }
    setCreatingVariant(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newVariantSku.trim().toUpperCase(),
          size: newVariantSize.trim() || undefined,
          color: newVariantColor.trim() || undefined,
          price: Number(newVariantPrice) || Number(watch('basePrice')) || 0,
          availableQty: Number(newVariantStock) || 0,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create variant');
      toast({ title: 'Variant Added', description: `Variant ${newVariantSku} created with ${newVariantStock} stock.` });
      setShowAddVariantModal(false);
      setNewVariantSku('');
      setNewVariantSize('');
      setNewVariantColor('');
      setNewVariantStock(10);
      loadData();
    } catch (err: any) {
      toast({ title: 'Failed to Add Variant', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingVariant(false);
    }
  };

  const handleToggleVariantActive = async (v: any) => {
    try {
      const nextActive = v.isActive === false;
      const res = await fetch(`/api/admin/products/${id}/variants/${v._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update variant');
      toast({
        title: nextActive ? 'Variant Activated' : 'Variant Deactivated',
        description: `Variant "${v.sku}" is now ${nextActive ? 'active' : 'inactive'}.`,
      });
      loadData();
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleStockAdjust = async (variantId: string) => {
    if (stockAdjustment === 0) return;
    try {
      const res = await fetch(`/api/admin/inventory/${variantId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: stockAdjustment,
          type: stockAdjustment > 0 ? 'PURCHASE' : 'DAMAGE',
          note: adjustReason || 'Manual adjustment via product edit page',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to adjust stock');
      toast({ title: 'Stock Updated', description: 'Inventory quantity updated successfully.' });
      setAdjustingVariantId(null);
      setStockAdjustment(0);
      setAdjustReason('');
      loadData();
    } catch (err: any) {
      toast({ title: 'Adjustment Failed', description: err.message, variant: 'destructive' });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription || undefined,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice || undefined,
        costPrice: data.costPrice || undefined,
        status: data.status,
        weight: data.weight || undefined,
        images,
      };

      if (data.categoryId && data.categoryId !== 'none') {
        payload.categoryId = data.categoryId;
      } else {
        payload.categoryId = null;
      }

      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        payload.tags = [];
      }

      payload.collectionIds = selectedCollections;

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to update product');
      }

      setProductSlug(data.slug);
      toast({
        title: 'Product Updated',
        description: `Changes to "${data.title}" saved successfully with ${images.length} image(s).`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to save product changes.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm text-text-secondary">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4 mr-1" /> Products
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text">Edit Product</h1>
            <p className="text-xs text-text-secondary">Manage catalog content, images, and pricing</p>
          </div>
        </div>

        {productSlug && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/product/${productSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View on Storefront
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Media & Images Section */}
        <Card className="p-6">
          <ProductImageManager
            images={images}
            onChange={setImages}
            disabled={isSubmitting}
          />
        </Card>

        {/* Basic Information */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Product Title *</label>
              <Input {...register('title')} placeholder="Product Title" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">URL Slug *</label>
              <Input {...register('slug')} placeholder="product-slug" />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Short Summary</label>
            <Input {...register('shortDescription')} placeholder="Brief 1-liner summary" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Full Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full p-3 border border-border rounded-lg bg-surface text-text text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-600 transition"
              placeholder="Product description..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Pricing (in Paise)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Base Price (Paise) *</label>
              <Input type="number" {...register('basePrice')} />
              {errors.basePrice && <p className="text-red-500 text-xs mt-1">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Compare-at Price (Paise)</label>
              <Input type="number" {...register('compareAtPrice')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Cost Price (Paise)</label>
              <Input type="number" {...register('costPrice')} />
            </div>
          </div>
        </Card>

        {/* Inventory & Variants */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text">Inventory &amp; Variants</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage sellable stock units, SKUs, and inventory reservations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAddVariantModal(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
              </Button>
              {variants.length === 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleProvisionDefaultVariant}
                  disabled={provisioning}
                >
                  {provisioning ? 'Provisioning...' : 'Provision Default Variant (10 Units)'}
                </Button>
              )}
            </div>
          </div>

          {variants.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-950">No Inventory Variants Found</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  This product has 0 variants, causing it to display as &quot;Out of Stock&quot; on the storefront.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleProvisionDefaultVariant}
                disabled={provisioning}
                className="bg-white hover:bg-amber-100 whitespace-nowrap"
              >
                Create Variant &amp; Set Stock
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-secondary text-xs uppercase text-text-secondary border-b border-border">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Variant / Options</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Reserved</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variants.map((v) => {
                    const isAdjusting = adjustingVariantId === v._id;
                    const isLow = (v.availableQty ?? 0) <= (v.lowStockThreshold ?? 5);
                    const isOut = (v.availableQty ?? 0) === 0;

                    return (
                      <React.Fragment key={v._id}>
                        <tr className="hover:bg-surface-secondary/50">
                          <td className="p-3 font-mono text-xs">
                            <Link
                              href={`/admin/inventory?search=${v.sku}`}
                              className="text-brand-600 hover:underline font-semibold"
                              title="View this variant in Inventory management"
                            >
                              {v.sku}
                            </Link>
                          </td>
                          <td className="p-3">{[v.size, v.color].filter(Boolean).join(' / ') || 'Standard'}</td>
                          <td className="p-3 font-semibold">{v.availableQty ?? 0}</td>
                          <td className="p-3 text-text-secondary">{v.reservedQty ?? 0}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 items-center">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  In Stock
                                </span>
                              )}
                              <Badge variant={v.isActive === false ? 'default' : 'success'} className="text-[10px]">
                                {v.isActive === false ? 'Inactive' : 'Active'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAdjustingVariantId(isAdjusting ? null : v._id);
                                  setStockAdjustment(0);
                                  setAdjustReason('');
                                }}
                                className="text-xs"
                              >
                                {isAdjusting ? 'Close' : 'Adjust Stock'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleVariantActive(v)}
                                className="text-xs text-text-secondary hover:text-text"
                                title={v.isActive === false ? 'Activate variant' : 'Deactivate variant'}
                              >
                                {v.isActive === false ? 'Activate' : 'Deactivate'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-xs text-brand-600 hover:text-brand-700"
                              >
                                <Link href={`/admin/inventory?search=${v.sku}`} title="Jump to Inventory">
                                  Inventory →
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {isAdjusting && (
                          <tr className="bg-surface-secondary/70">
                            <td colSpan={6} className="p-4">
                              <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="w-full sm:w-44">
                                  <label className="block text-[11px] font-medium text-text mb-1">
                                    Quantity (+ to add, - to reduce)
                                  </label>
                                  <Input
                                    type="number"
                                    value={stockAdjustment || ''}
                                    onChange={(e) => setStockAdjustment(parseInt(e.target.value, 10) || 0)}
                                    placeholder="+10 or -2"
                                  />
                                </div>
                                <div className="w-full sm:flex-1">
                                  <label className="block text-[11px] font-medium text-text mb-1">
                                    Reason / Note
                                  </label>
                                  <Input
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="e.g. Restocked 20 units from workshop"
                                  />
                                </div>
                                <div className="flex gap-2 self-end pt-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={stockAdjustment === 0}
                                    onClick={() => handleStockAdjust(v._id)}
                                  >
                                    Apply Adjustment
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Organization */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Catalog Organization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Category</label>
              <select
                {...register('categoryId')}
                className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="none">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Status</label>
              <select
                {...register('status')}
                className="w-full p-2.5 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 capitalize"
              >
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Weight (grams)</label>
              <Input type="number" {...register('weight')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-text">Collections</label>
            {collections.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">No collections created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {collections.map((col) => {
                  const isChecked = selectedCollections.includes(col._id);
                  return (
                    <button
                      type="button"
                      key={col._id}
                      onClick={() => {
                        setSelectedCollections((prev) =>
                          isChecked ? prev.filter((id) => id !== col._id) : [...prev, col._id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isChecked
                          ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold'
                          : 'bg-surface border-border text-text-secondary hover:border-text-secondary'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {col.name || col.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Tags (Comma-separated)</label>
            <Input {...register('tags')} placeholder="e.g. pashmina, luxury, handmade" />
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowArchiveModal(true)}
            disabled={isSubmitting || archiveLoading}
            className="self-start"
          >
            <Archive className="w-4 h-4 mr-1.5" /> Archive / Remove Product
          </Button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Back to Products
            </Button>
            <Button type="submit" disabled={isSubmitting || archiveLoading}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation UX Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          if (!archiveLoading) setShowArchiveModal(false);
        }}
        title="Archive or Remove Product?"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-950">
                Are you sure you want to remove this product from the active store?
              </p>
              <p className="mt-1 text-xs text-amber-800">
                If this product has historical orders or customer reviews, it will be <strong>safely archived</strong> (hidden from the active catalog) to preserve historical receipts and order accuracy.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowArchiveModal(false)}
              disabled={archiveLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={async () => {
                setArchiveLoading(true);
                try {
                  const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || 'Failed to archive product');
                  toast({
                    title: 'Catalog Updated',
                    description: json.message || 'Product removed from active catalog.',
                  });
                  router.push('/admin/products');
                } catch (err: any) {
                  toast({
                    title: 'Action Failed',
                    description: err.message || 'Could not archive product.',
                    variant: 'destructive',
                  });
                } finally {
                  setArchiveLoading(false);
                }
              }}
              disabled={archiveLoading}
            >
              {archiveLoading ? 'Processing...' : 'Confirm Archive / Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add New Variant Modal */}
      <Modal
        isOpen={showAddVariantModal}
        onClose={() => {
          if (!creatingVariant) setShowAddVariantModal(false);
        }}
        title="Add Sellable Variant"
        size="md"
      >
        <form onSubmit={handleCreateNewVariant} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <Input
              value={newVariantSku}
              onChange={(e) => setNewVariantSku(e.target.value)}
              placeholder="e.g. KS-SHAWL-NAVY-M"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Size / Dimension</label>
              <Input
                value={newVariantSize}
                onChange={(e) => setNewVariantSize(e.target.value)}
                placeholder="e.g. M, L, Free Size"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Color / Pattern</label>
              <Input
                value={newVariantColor}
                onChange={(e) => setNewVariantColor(e.target.value)}
                placeholder="e.g. Navy Blue, Walnut"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Price (Paise)</label>
              <Input
                type="number"
                value={newVariantPrice || ''}
                onChange={(e) => setNewVariantPrice(parseInt(e.target.value, 10) || 0)}
                placeholder="Leave blank to use Base Price"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Initial Stock (Units)</label>
              <Input
                type="number"
                value={newVariantStock}
                onChange={(e) => setNewVariantStock(parseInt(e.target.value, 10) || 0)}
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddVariantModal(false)}
              disabled={creatingVariant}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={creatingVariant || !newVariantSku.trim()}>
              {creatingVariant ? 'Creating Variant...' : 'Create Variant'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
