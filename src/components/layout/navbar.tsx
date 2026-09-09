'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HiOutlineMagnifyingGlass, HiOutlineUser, HiOutlineShoppingBag, HiOutlineBars3 } from 'react-icons/hi2';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { mainNavLinks } from '@/config/navigation';
import { MobileNav } from './mobile-nav';
import { APP_NAME } from '@/config/constants';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 -ml-2 text-text hover:bg-surface-secondary rounded-md"
              aria-label="Open menu"
            >
              <HiOutlineBars3 className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-brand-700">{APP_NAME}</span>
            </Link>
          </div>

          {/* Desktop Logo & Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-brand-700">{APP_NAME}</span>
            </Link>
            <nav className="flex items-center gap-6">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className="p-2 text-text hover:bg-surface-secondary rounded-md transition-colors"
              aria-label="Search"
            >
              <HiOutlineMagnifyingGlass className="w-6 h-6" />
            </Link>

            {isLoading ? (
              <div className="hidden sm:block h-8 w-20 bg-surface-secondary animate-pulse rounded-md" />
            ) : user ? (
              <div className="hidden sm:block">
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-1.5 p-2 text-text hover:bg-surface-secondary rounded-md transition-colors cursor-pointer">
                      <HiOutlineUser className="w-5 h-5 text-brand-700" />
                      <span className="text-sm font-medium max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
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
                  className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-brand-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <Link
              href="/cart"
              className="p-2 text-text hover:bg-surface-secondary rounded-md transition-colors relative"
              aria-label="Cart"
            >
              <HiOutlineShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
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
