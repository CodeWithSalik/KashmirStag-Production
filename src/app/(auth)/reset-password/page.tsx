'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="mb-4 p-3.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
          <span>Invalid or expired password reset link. Please request a new link.</span>
        </div>
        <Link href="/forgot-password" className="inline-block w-full">
          <Button variant="outline" className="w-full">
            Request New Reset Link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text">Set New Password</h1>
        <p className="text-xs text-text-secondary mt-1">
          Create a strong password of at least 8 characters.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          label="New Password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}
