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
import { useRouter } from 'next/navigation';
import { ProductImageManager } from '@/components/admin/product-image-manager';
import slugify from 'slugify';

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
  initialStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'active',
      basePrice: 0,
      description: '',
      initialStock: 10,
      lowStockThreshold: 5,
    }
  });

  // Fetch live categories and collections from MongoDB
  useEffect(() => {
    async function loadCatalogMeta() {
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
        console.error('Failed to load catalog metadata', err);
      }
    }
    loadCatalogMeta();
  }, []);

  const titleVal = watch('title');
  useEffect(() => {
    if (!slugManuallyEdited && titleVal) {
      const generated = slugify(titleVal, { lower: true, strict: true });
      setValue('slug', generated);
    }
  }, [titleVal, slugManuallyEdited, setValue]);

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
        initialStock: data.initialStock,
        sku: data.sku || undefined,
        size: data.size || undefined,
        color: data.color || undefined,
        lowStockThreshold: data.lowStockThreshold,
      };

      if (data.categoryId && data.categoryId !== 'none') {
        payload.categoryId = data.categoryId;
      }

      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      if (selectedCollections.length > 0) {
        payload.collectionIds = selectedCollections;
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create product');
      }

      toast({
        title: 'Product Created',
        description: `"${data.title}" was successfully added with ${images.length} image(s).`,
      });
      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error Creating Product',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Add New Product</h1>
          <p className="text-sm text-text-secondary mt-1">Create a new item in your catalog with media</p>
        </div>
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
              <Input
                {...register('title')}
                placeholder="e.g. Kashmiri Handwoven Pashmina Shawl"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">URL Slug *</label>
              <Input
                {...register('slug')}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setValue('slug', e.target.value);
                }}
                placeholder="kashmiri-pashmina-shawl"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Short Summary (Optional)</label>
            <Input
              {...register('shortDescription')}
              placeholder="Brief 1-liner summary for listings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Full Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full p-3 border border-border rounded-lg bg-surface text-text text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-600 transition"
              placeholder="Describe the product craftsmanship, materials, and origin..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">Pricing (in Paise — ₹1 = 100 paise)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Base Price (Paise) *</label>
              <Input type="number" {...register('basePrice')} placeholder="10000 = ₹100.00" />
              {errors.basePrice && <p className="text-red-500 text-xs mt-1">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Compare-at Price (Paise)</label>
              <Input type="number" {...register('compareAtPrice')} placeholder="Original MSRP" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Cost Price (Paise)</label>
              <Input type="number" {...register('costPrice')} placeholder="Wholesale cost" />
            </div>
          </div>
        </Card>

        {/* Inventory & Initial Stock */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Inventory & Initial Stock</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Set starting inventory quantity so this product is immediately available for purchase.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Initial Stock Quantity *</label>
              <Input
                type="number"
                min={0}
                {...register('initialStock')}
                placeholder="e.g. 10"
              />
              {errors.initialStock && <p className="text-red-500 text-xs mt-1">{errors.initialStock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">SKU (Stock Keeping Unit)</label>
              <Input
                {...register('sku')}
                placeholder="Auto-generated if empty (e.g. KS-SHAWL-01)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Low Stock Alert Threshold</label>
              <Input
                type="number"
                min={0}
                {...register('lowStockThreshold')}
                placeholder="5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Size / Dimensions (Optional)</label>
              <Input
                {...register('size')}
                placeholder="e.g. One Size, 100x200 cm, Free Size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Color / Shade (Optional)</label>
              <Input
                {...register('color')}
                placeholder="e.g. Natural Grey, Walnut, Midnight Blue"
              />
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
              <Input type="number" {...register('weight')} placeholder="e.g. 500" />
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
            <Input {...register('tags')} placeholder="pashmina, luxury, handmade, winter" />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Product...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
