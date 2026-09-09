'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      if (res.ok) {
        await refreshUser();
        setMessage('Profile updated successfully!');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update profile.');
      }
    } catch {
      setMessage('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <Input
          label="Email"
          value={user?.email || ''}
          disabled
        />
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 XXXXX XXXXX"
        />
        <Button type="submit" isLoading={loading}>
          Save Changes
        </Button>
        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-success' : 'text-error'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
