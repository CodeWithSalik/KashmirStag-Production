'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Plus, RefreshCw, Trash2, Edit, AlertTriangle, ExternalLink, Archive, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import slugify from 'slugify';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit category state
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete category confirmation state
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const json = await res.json();
      const categories = json.data || [];
      setData(categories.map((c: any) => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        productsCount: c.productCount || 0,
        isActive: c.isActive ?? true,
      })));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      };
      if (newCatSlug.trim()) {
        payload.slug = newCatSlug.trim();
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create category');
      toast({ title: 'Success', description: 'Category created successfully' });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setSlugManuallyEdited(false);
      setShowAddModal(false);
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      };
      if (editSlug.trim()) {
        payload.slug = editSlug.trim();
      }

      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update category');
      toast({ title: 'Success', description: 'Category updated successfully' });
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Update Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete category');
      }
      toast({
        title: 'Category Deleted',
        description: json.message || `Category "${deletingCategory.name}" removed successfully.`,
      });
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Cannot Delete Category',
        description: err.message || 'Error occurred while deleting category.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleArchive = async (cat: any) => {
    try {
      const nextAction = cat.isActive ? 'archive' : 'restore';
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update category status');
      toast({
        title: cat.isActive ? 'Category Archived' : 'Category Restored',
        description: json.message || `Category status updated.`,
      });
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'productsCount',
      label: 'Products',
      render: (row: any) => (
        <Link
          href={`/admin/products?category=${row.id}`}
          className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
          title="Filter products by this category"
        >
          {row.productsCount} {row.productsCount === 1 ? 'product' : 'products'}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.isActive ? 'success' : 'default'}>
          {row.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products?category=${row.id}`}>
              View Products
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(row);
              setEditName(row.name);
              setEditSlug(row.slug || '');
              setEditDesc(row.description || '');
            }}
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleArchive(row)}
            title={row.isActive ? 'Archive category' : 'Restore category'}
          >
            {row.isActive ? (
              <><Archive className="w-3.5 h-3.5 mr-1" /> Archive</>
            ) : (
              <><RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore</>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingCategory(row)}
            className="text-text-secondary hover:text-error hover:bg-red-50"
            title="Delete category"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Categories</h1>
          <p className="text-sm text-text-secondary mt-1">Managed directly in MongoDB</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>
      </div>

      {showAddModal && (
        <div className="p-4 bg-surface-secondary border border-border rounded-lg max-w-md space-y-3">
          <h3 className="font-semibold text-text">New Category</h3>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text mb-1">Category Name *</label>
              <Input
                placeholder="Category Name (e.g. Pashmina)"
                value={newCatName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCatName(val);
                  if (!slugManuallyEdited) {
                    setNewCatSlug(slugify(val, { lower: true, strict: true }));
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text mb-1">URL Slug (auto-generated)</label>
              <Input
                placeholder="URL Slug (e.g. pashmina)"
                value={newCatSlug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setNewCatSlug(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text mb-1">Description (Optional)</label>
              <Input
                placeholder="Description (optional)"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <DataTable 
        columns={columns}
        data={data}
        loading={loading}
      />

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title={`Edit Category: ${editingCategory?.name}`}
        size="md"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Category Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text">URL Slug</label>
            <Input
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              placeholder="category-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Description</label>
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        onClose={() => {
          if (!deleteLoading) setDeletingCategory(null);
        }}
        title="Delete Category?"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-950">
                Are you sure you want to delete &quot;{deletingCategory?.name}&quot;?
              </p>
              <p className="mt-1 text-xs text-red-800">
                Categories with assigned products cannot be deleted. If products belong to this category, deletion will be rejected to prevent orphaned products.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingCategory(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteCategory}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Checking dependencies & deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
