"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) setAddresses(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add New</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : addresses.length === 0 ? (
        <p className="text-text-muted">You have no saved addresses.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr._id} className="border border-surface-200 rounded-lg p-4">
              {addr.isDefault && <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded font-medium mb-2 inline-block">Default</span>}
              <div className="font-medium">{addr.fullName}</div>
              <div className="text-sm text-text-secondary mt-1">
                {addr.street}<br/>
                {addr.city}, {addr.state} {addr.zipCode}<br/>
                {addr.country}<br/>
                {addr.phone}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Address">
        <div className="p-4">Address form would go here</div>
      </Modal>
    </div>
  );
}
