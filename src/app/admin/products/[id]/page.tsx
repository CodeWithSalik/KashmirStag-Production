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
import { ArrowLeft, Loader2, ExternalLink, Archive, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
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
  const [images, setImages] = useState<string[]>([]);
  const [productSlug, setProductSlug] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'active',
      basePrice: 0,
      description: '',
    }
  });

  // Fetch product data and categories on load
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch('/api/admin/categories')
        ]);

        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories(catJson.data || []);
        }

        if (!prodRes.ok) {
          throw new Error('Failed to load product details');
        }

        const prodJson = await prodRes.json();
        const p = prodJson.data;

        setProductSlug(p.slug || '');
        setImages(Array.isArray(p.images) ? p.images : []);

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
    }

    loadData();
  }, [id, reset, toast]);

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
    </div>
  );
}
