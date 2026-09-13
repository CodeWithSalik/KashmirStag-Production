import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface-secondary p-4 sm:p-6">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
        <Link href="/" className="font-serif text-xl font-bold tracking-tight text-text">
          Kashmir<span className="text-brand-700">Stag</span>
        </Link>
      </div>
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card border border-border p-6 sm:p-8">
        {children}
      </div>
      <div className="mt-8 text-center text-xs text-text-muted">
        &copy; {new Date().getFullYear()} KashmirStag. All rights reserved.
      </div>
    </div>
  );
}
