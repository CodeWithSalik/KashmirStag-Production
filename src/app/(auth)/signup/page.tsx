'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text">Create an Account</h1>
        <p className="text-xs text-text-secondary mt-1">
          Join KashmirStag to track orders, save favorites, and receive exclusive offers.
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
          type="text"
          label="Full Name"
          placeholder="Your full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          hint="Must be at least 8 characters with uppercase, lowercase, and a number"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-700 hover:text-brand-800 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
