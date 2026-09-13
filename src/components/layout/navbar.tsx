'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, ShoppingBag, Menu } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { mainNavLinks } from '@/config/navigation';
import { MobileNav } from './mobile-nav';
import { APP_NAME } from '@/config/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const getAccountItems = () => {
    if (user) {
      const items: DropdownItem[] = [
        { label: 'My Account', onClick: () => router.push('/account') },
        { label: 'Orders', onClick: () => router.push('/account/orders') },
        { label: 'Wishlist', onClick: () => router.push('/wishlist') },
      ];

      if (user.role === 'admin' || user.role === 'manager') {
        items.push({ label: 'Admin Panel', onClick: () => router.push('/admin') });
      }

      items.push({ label: 'Logout', onClick: () => logout(), variant: 'danger' as const });
      return items;
    }

    return [
      { label: 'Sign In', onClick: () => router.push('/login') },
      { label: 'Create Account', onClick: () => router.push('/signup') },
    ];
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md shadow-xs">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 -ml-2 text-text hover:bg-surface-secondary rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-text" strokeWidth={1.75} />
            </button>
            <Link href="/" className="flex items-center">
              <span className="font-serif text-xl font-bold tracking-tight text-text">
                Kashmir<span className="text-brand-700">Stag</span>
              </span>
            </Link>
          </div>

          {/* Desktop Logo & Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="font-serif text-2xl font-bold tracking-tight text-text">
                Kashmir<span className="text-brand-700">Stag</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Main Navigation">
              {mainNavLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "text-brand-800 font-semibold bg-brand-50"
                        : "text-text-secondary hover:text-text hover:bg-surface-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/search"
              className="p-2 text-text-secondary hover:text-text hover:bg-surface-secondary rounded-lg transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" strokeWidth={1.75} />
            </Link>

            {isLoading ? (
              <div className="hidden sm:block h-8 w-20 bg-surface-secondary animate-pulse rounded-lg" />
            ) : user ? (
              <div className="hidden sm:block">
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-text hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border">
                      <User className="w-4 h-4 text-brand-700" strokeWidth={1.75} />
                      <span className="text-xs font-medium max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                    </div>
                  }
                  items={getAccountItems()}
                  align="right"
                />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-brand-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-lg transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <Link
              href="/cart"
              className="p-2 text-text-secondary hover:text-text hover:bg-surface-secondary rounded-lg transition-colors relative"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        user={user}
        logout={logout}
      />
    </>
  );
}
