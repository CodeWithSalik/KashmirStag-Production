'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminReviewsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load reviews');
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
  }, [page, statusFilter, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (reviewId: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update review');

      toast({ title: 'Success', description: `Review marked as ${action}.` });
      fetchReviews();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'product', label: 'Product' },
    { key: 'user', label: 'User' },
    { key: 'rating', label: 'Rating', render: (row: any) => `${row.rating}/5 ⭐` },
    { key: 'comment', label: 'Comment' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'error'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(row.id, 'approved')}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(row.id, 'rejected')}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(row.id, 'rejected')}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Reject
            </Button>
          )}
          {row.status === 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(row.id, 'approved')}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Reviews Moderation</h1>
          <p className="text-sm text-text-secondary mt-1">Live customer product reviews from MongoDB</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 border border-border rounded-md bg-transparent text-sm"
          >
            <option value="">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
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
    </div>
  );
}
