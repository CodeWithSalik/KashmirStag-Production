'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Address {
  _id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface AddressFormState {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: AddressFormState = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'IN',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/addresses');
      const json = await res.json();
      if (res.ok && json.success) {
        setAddresses(Array.isArray(json.data) ? json.data : []);
      } else {
        setError(json.error || 'Unable to load your addresses. Please try again.');
      }
    } catch (err: any) {
      setError('Unable to load your addresses. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr._id);
    setFormData({
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'IN',
      isDefault: addr.isDefault || false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const message = json.errors && json.errors.length > 0
          ? json.errors.map((e: any) => e.message || `${e.path?.join('.')}: ${e.message}`).join('. ')
          : (json.error || 'Failed to save address');
        throw new Error(message);
      }

      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDefault' }),
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/addresses/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingId(null);
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to delete address', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text">Saved Addresses</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your delivery and billing addresses
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Address
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <p className="text-sm">Loading addresses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium mb-4">{error}</p>
          <Button variant="outline" onClick={fetchAddresses}>
            Try Again
          </Button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-surface-secondary/50 rounded-xl border border-dashed border-border">
          <MapPin className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No saved addresses yet</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
            Add your shipping details now for faster checkout on future purchases.
          </p>
          <Button onClick={handleOpenAdd} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`relative border rounded-xl p-5 transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-brand-500 bg-brand-50/20 shadow-sm'
                  : 'border-border bg-white hover:border-text-muted'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text text-base">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-text-secondary space-y-1">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} - <span className="font-medium text-text">{addr.pincode}</span>
                  </p>
                  <p>{addr.country === 'IN' ? 'India' : addr.country}</p>
                  <p className="pt-2 text-text font-medium flex items-center gap-1.5">
                    <span className="text-text-muted font-normal text-xs">Phone:</span> {addr.phone}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                <div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs text-brand-700 font-semibold hover:underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(addr._id)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingId ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Recipient Full Name *</label>
            <Input
              required
              placeholder="e.g. Salik Pirzada"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Mobile Phone Number *</label>
            <Input
              required
              placeholder="10-digit mobile number (e.g. 9876543210)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Address Line 1 (House No, Street) *</label>
            <Input
              required
              placeholder="House/Flat No, Building, Street"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">Address Line 2 (Area, Landmark) (Optional)</label>
            <Input
              placeholder="Area, Landmark, Colony"
              value={formData.line2}
              onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">City *</label>
              <Input
                required
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">State *</label>
              <Input
                required
                placeholder="State / UT"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">PIN Code *</label>
              <Input
                required
                placeholder="6-digit PIN code"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Country</label>
              <Input
                disabled
                value="India (IN)"
                className="bg-surface-secondary text-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-border text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-text font-medium">Set as default delivery address</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        onClose={() => !isDeleting && setDeletingId(null)}
        title="Confirm Delete Address"
        size="sm"
      >
        <div className="p-1 space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this saved address? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Address'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
