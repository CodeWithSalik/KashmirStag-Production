'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { accountNavLinks } from '@/config/navigation';

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 w-full lg:w-64 shrink-0">
      <div className="lg:hidden flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar border-b border-border">
        {accountNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === link.href 
                ? "bg-brand-50 text-brand-700" 
                : "text-text-secondary hover:bg-surface-secondary hover:text-text"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="hidden lg:flex flex-col gap-1">
        {accountNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-4 py-3 text-sm font-medium rounded-md transition-colors",
              pathname === link.href 
                ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600 pl-3" 
                : "text-text-secondary hover:bg-surface-secondary hover:text-text pl-4 border-l-4 border-transparent"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
