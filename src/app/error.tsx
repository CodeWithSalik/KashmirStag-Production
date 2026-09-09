'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-text">Something went wrong</h1>
        <p className="mt-3 text-text-secondary">
          We encountered an unexpected error. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-text-tertiary">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
