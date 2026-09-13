'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { mainNavLinks } from '@/config/navigation';
import { SessionUser } from '@/providers/auth-provider';
import { APP_NAME } from '@/config/constants';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
  logout: () => Promise<void>;
}

export function MobileNav({ isOpen, onClose, user, logout }: MobileNavProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-[70] w-4/5 max-w-sm bg-surface shadow-card animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-serif text-xl font-bold tracking-tight text-text">
            Kashmir<span className="text-brand-700">Stag</span>
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:text-text hover:bg-surface-secondary rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col px-2">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-3 text-base font-medium text-text hover:bg-surface-secondary hover:text-brand-600 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-border bg-surface-secondary">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="px-2 py-1 mb-2">
                <p className="text-sm font-medium text-text">{user.name}</p>
                <p className="text-xs text-text-tertiary">{user.email}</p>
              </div>
              <Link
                href="/account"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-text bg-surface border border-border rounded-lg text-center hover:bg-surface-secondary transition-colors"
              >
                My Account
              </Link>
              {(user.role === 'admin' || user.role === 'manager') && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-brand-800 bg-brand-50 border border-brand-200 rounded-lg text-center hover:bg-brand-100 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-4 py-2.5 text-sm font-medium text-danger-600 bg-surface border border-border rounded-lg text-center hover:bg-danger-50 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-700 rounded-lg text-center hover:bg-brand-800 transition-colors shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-text bg-surface border border-border rounded-lg text-center hover:bg-surface-secondary transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
