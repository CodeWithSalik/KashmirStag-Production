'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('success');
      setMessage(data.data?.message || 'If that email exists, a reset link has been sent.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An error occurred');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-center">Reset Password</h1>
      {status === 'success' ? (
        <div className="text-center">
          <p className="text-green-600 mb-4">{message}</p>
          <Link href="/login" className="text-blue-600 hover:underline">Back to Sign In</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'error' && <div className="text-red-500 text-sm text-center">{message}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:underline">Back to Sign In</Link>
          </div>
        </form>
      )}
    </div>
  );
}
