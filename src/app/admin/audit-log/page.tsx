'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminAuditLogPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedChanges, setSelectedChanges] = useState<any>(null);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-log?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const json = await res.json();
      const logs = json.data || [];
      setData(logs.map((l: any) => ({
        id: l._id,
        date: new Date(l.createdAt).toLocaleString('en-IN'),
        actor: l.actorId?.name ? `${l.actorId.name} (${l.actorId.email})` : 'System',
        action: l.action,
        entity: `${l.entity} ${l.entityId ? `(#${l.entityId.toString().slice(-6)})` : ''}`,
        changes: l.changes,
        ip: l.ip || 'N/A',
      })));
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    { key: 'date', label: 'Timestamp' },
    { key: 'actor', label: 'Actor' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'ip', label: 'IP Address' },
    {
      key: 'changes',
      label: 'Changes',
      render: (row: any) => (
        row.changes ? (
          <Button variant="outline" size="sm" onClick={() => setSelectedChanges(row.changes)}>
            View JSON
          </Button>
        ) : (
          <span className="text-xs text-text-tertiary">None</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Audit Logs</h1>
          <p className="text-sm text-text-secondary mt-1">Immutable system audit trail from MongoDB</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {selectedChanges && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-lg w-full space-y-4 max-h-[80vh] flex flex-col">
            <h3 className="font-semibold text-lg text-text">Audit Log Changes</h3>
            <pre className="bg-surface-secondary p-4 rounded text-xs font-mono overflow-auto flex-1">
              {JSON.stringify(selectedChanges, null, 2)}
            </pre>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedChanges(null)}>Close</Button>
            </div>
          </div>
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
