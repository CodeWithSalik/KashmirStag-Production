import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-brand-700">404</h1>
      <p className="mt-4 text-xl text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <p className="mt-2 text-text-tertiary">
        It might have been moved or deleted.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Back to Home
      </Link>
    </main>
  );
}
