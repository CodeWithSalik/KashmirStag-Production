'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { adminNavLinks } from '@/config/navigation';
import { APP_NAME } from '@/config/constants';
import { useAuth } from '@/providers/auth-provider';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Layers, 
  Boxes, 
  ShoppingBag, 
  Users, 
  Ticket, 
  Star, 
  BarChart3, 
  Settings,
  Menu, 
  X 
} from 'lucide-react';

const getIconForLabel = (label: string) => {
  const iconProps = { className: "w-4 h-4 shrink-0", strokeWidth: 1.75 };
  switch (label.toLowerCase()) {
    case 'dashboard': return <LayoutDashboard {...iconProps} />;
    case 'products': return <Package {...iconProps} />;
    case 'categories': return <Tag {...iconProps} />;
    case 'collections': return <Layers {...iconProps} />;
    case 'inventory': return <Boxes {...iconProps} />;
    case 'orders': return <ShoppingBag {...iconProps} />;
    case 'customers': return <Users {...iconProps} />;
    case 'coupons': return <Ticket {...iconProps} />;
    case 'reviews': return <Star {...iconProps} />;
    case 'analytics': return <BarChart3 {...iconProps} />;
    case 'settings': return <Settings {...iconProps} />;
    default: return <Boxes {...iconProps} />;
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
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold tracking-tight text-text">
            Kashmir<span className="text-brand-700">Stag</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {adminNavLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href + '/') && link.href !== '/admin');
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-800 font-semibold"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text"
              )}
            >
              {getIconForLabel(link.label)}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border shrink-0 bg-surface-secondary/40">
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-text truncate">{user?.name || 'Admin User'}</p>
          <p className="text-[11px] text-text-tertiary truncate mb-3">{user?.email}</p>
          <button 
            type="button"
            onClick={() => logout()}
            className="text-left text-xs text-danger-600 hover:text-danger-700 font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle & Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-surface border-b border-border h-16 w-full fixed top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold tracking-tight text-text">
            Kashmir<span className="text-brand-700">Stag</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
            Admin
          </span>
        </Link>
        <button onClick={toggleSidebar} className="p-2 text-text hover:bg-surface-secondary rounded-lg" aria-label="Toggle admin menu">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-card lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>
    </>
  );
}
