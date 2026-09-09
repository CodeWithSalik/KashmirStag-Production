'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNavLinks } from '@/config/navigation';
import { APP_NAME } from '@/config/constants';
import { useAuth } from '@/providers/auth-provider';
import { 
  HiOutlineHome, HiOutlineShoppingBag, HiOutlineUsers, 
  HiOutlineTag, HiOutlineDocumentText, HiOutlineArchiveBox, 
  HiOutlineStar, HiOutlineChartBar, HiOutlineCog6Tooth,
  HiOutlineQueueList, HiOutlineBars3, HiXMark
} from 'react-icons/hi2';

const getIconForLabel = (label: string) => {
  switch (label.toLowerCase()) {
    case 'dashboard': return <HiOutlineHome className="w-5 h-5" />;
    case 'products': return <HiOutlineShoppingBag className="w-5 h-5" />;
    case 'categories': return <HiOutlineTag className="w-5 h-5" />;
    case 'collections': return <HiOutlineQueueList className="w-5 h-5" />;
    case 'inventory': return <HiOutlineArchiveBox className="w-5 h-5" />;
    case 'orders': return <HiOutlineDocumentText className="w-5 h-5" />;
    case 'customers': return <HiOutlineUsers className="w-5 h-5" />;
    case 'coupons': return <HiOutlineTag className="w-5 h-5" />;
    case 'reviews': return <HiOutlineStar className="w-5 h-5" />;
    case 'analytics': return <HiOutlineChartBar className="w-5 h-5" />;
    case 'settings': return <HiOutlineCog6Tooth className="w-5 h-5" />;
    default: return <HiOutlineArchiveBox className="w-5 h-5" />;
  }
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-border w-64">
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <Link href="/admin" className="text-xl font-bold text-brand-700">
          {APP_NAME} Admin
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {adminNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === link.href || pathname.startsWith(link.href + '/') && link.href !== '/admin'
                ? "bg-brand-50 text-brand-700"
                : "text-text-secondary hover:bg-surface-secondary hover:text-text"
            )}
          >
            {getIconForLabel(link.label)}
            {link.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-text truncate">{user?.name || 'Admin User'}</p>
          <p className="text-xs text-text-tertiary truncate mb-3">{user?.email}</p>
          <button 
            onClick={() => logout()}
            className="text-left text-sm text-error hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle & Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-surface border-b border-border h-16 w-full fixed top-0 z-40">
        <span className="text-lg font-bold text-brand-700">{APP_NAME} Admin</span>
        <button onClick={toggleSidebar} className="p-2 text-text" aria-label="Toggle admin menu">
          {isOpen ? <HiXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>
    </>
  );
}
