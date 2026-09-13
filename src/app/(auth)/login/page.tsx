'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text">Welcome Back</h1>
        <p className="text-xs text-text-secondary mt-1">
          Sign in to access your orders, wishlist, and saved addresses.
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
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-text">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-700 hover:text-brand-800 font-medium">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-secondary">
        Don&apos;t have an account yet?{' '}
        <Link href="/signup" className="text-brand-700 hover:text-brand-800 font-semibold transition-colors">
          Create an Account
        </Link>
      </div>
    </div>
  );
}
