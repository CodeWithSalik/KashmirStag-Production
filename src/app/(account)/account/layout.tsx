import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import Link from "next/link";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const payload = token ? verifyJwt(token) : null;
  if (!payload) redirect("/login");

  return (
    <div className="container-page py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {[
              { href: '/account', label: 'Dashboard' },
              { href: '/account/orders', label: 'Orders' },
              { href: '/account/profile', label: 'Profile' },
              { href: '/account/addresses', label: 'Addresses' },
              { href: '/account/reviews', label: 'Reviews' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap hover:bg-surface-secondary text-text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-white rounded-lg border border-border p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
