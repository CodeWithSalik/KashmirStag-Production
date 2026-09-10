'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Plus, RefreshCw, Trash2, Edit, AlertTriangle, Archive, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminCollectionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit collection state
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete collection confirmation state
  const [deletingCollection, setDeletingCollection] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collections');
      if (!res.ok) throw new Error('Failed to load collections');
      const json = await res.json();
      const collections = json.data || [];
      setData(collections.map((c: any) => ({
        id: c._id,
        title: c.name || c.title,
        slug: c.slug,
        description: c.description || '',
        productsCount: c.productCount || (c.productIds?.length || 0),
        status: c.isActive ? 'active' : 'inactive',
      })));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title.trim(),
          title: title.trim(),
          description: description.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create collection');
      toast({ title: 'Success', description: 'Collection created successfully!' });
      setTitle('');
      setDescription('');
      setShowAdd(false);
      fetchCollections();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTitle.trim(),
          description: editDesc.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update collection');
      toast({ title: 'Success', description: 'Collection updated successfully' });
      setEditingCollection(null);
      fetchCollections();
    } catch (err: any) {
      toast({ title: 'Update Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/collections/${deletingCollection.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete collection');
      }
      toast({
        title: 'Collection Removed',
        description: json.message || `Collection "${deletingCollection.title}" unlinked and deleted.`,
      });
      setDeletingCollection(null);
      fetchCollections();
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Error occurred while deleting collection.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleArchive = async (col: any) => {
    try {
      const nextAction = col.status === 'active' ? 'archive' : 'restore';
      const res = await fetch(`/api/admin/collections/${col.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update collection status');
      toast({
        title: col.status === 'active' ? 'Collection Archived' : 'Collection Restored',
        description: json.message || `Collection status updated.`,
      });
      fetchCollections();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'productsCount',
      label: 'Products',
      render: (row: any) => (
        <Link
          href={`/admin/products?collection=${row.id}`}
          className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
          title="Filter products by this collection"
        >
          {row.productsCount} {row.productsCount === 1 ? 'product' : 'products'}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/products?collection=${row.id}`}>
              View Products
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCollection(row);
              setEditTitle(row.title);
              setEditDesc(row.description || '');
            }}
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleArchive(row)}
            title={row.status === 'active' ? 'Archive collection' : 'Restore collection'}
          >
            {row.status === 'active' ? (
              <><Archive className="w-3.5 h-3.5 mr-1" /> Archive</>
            ) : (
              <><RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore</>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingCollection(row)}
            className="text-text-secondary hover:text-error hover:bg-red-50"
            title="Delete collection"
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
          <h1 className="text-3xl font-bold text-text">Collections</h1>
          <p className="text-sm text-text-secondary mt-1">Curated product collections from MongoDB</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchCollections} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-2" /> Add Collection
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-secondary border border-border rounded-lg max-w-md space-y-3">
          <h3 className="font-semibold text-text">New Collection</h3>
          <form onSubmit={handleCreateCollection} className="space-y-3">
            <Input
              placeholder="Collection Title (e.g. Winter Essentials)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !title.trim()}>
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

      {/* Edit Collection Modal */}
      <Modal
        isOpen={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        title={`Edit Collection: ${editingCollection?.title}`}
        size="md"
      >
        <form onSubmit={handleUpdateCollection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Collection Title</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
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
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingCollection(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Collection Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCollection)}
        onClose={() => {
          if (!deleteLoading) setDeletingCollection(null);
        }}
        title="Delete Collection?"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-950">
                Delete collection &quot;{deletingCollection?.title}&quot;?
              </p>
              <p className="mt-1 text-xs text-amber-800">
                This collection will be safely deleted and unlinked from any tagged products. The products themselves will remain in your catalog intact.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingCollection(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteCollection}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Unlinking & Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
