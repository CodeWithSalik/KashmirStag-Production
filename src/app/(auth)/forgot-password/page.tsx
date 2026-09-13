'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
      setMessage(data.data?.message || 'If that email exists, a password reset link has been sent to your inbox.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An error occurred while processing your request.');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text">Reset Password</h1>
        <p className="text-xs text-text-secondary mt-1">
          Enter your registered email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {status === 'success' ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">{message}</p>
          <Link href="/login" className="inline-block w-full">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'error' && (
            <div className="p-3.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{message}</span>
            </div>
          )}

          <Input
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            disabled={status === 'loading'}
            className="w-full mt-2"
            size="lg"
          >
            {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
          </Button>

          <div className="mt-6 pt-5 border-t border-border text-center text-xs text-text-secondary">
            Remembered your password?{' '}
            <Link href="/login" className="text-brand-700 hover:text-brand-800 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
