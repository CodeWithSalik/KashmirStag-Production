import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="mb-8">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">KashmirStag</span>
        </Link>
      </div>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {children}
      </div>
    </div>
  );
}
