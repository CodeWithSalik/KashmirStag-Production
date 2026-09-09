'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { HiXMark } from 'react-icons/hi2';
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
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-[70] w-4/5 max-w-sm bg-surface shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-xl font-bold text-brand-700">{APP_NAME}</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:bg-surface-secondary rounded-md"
            aria-label="Close menu"
          >
            <HiXMark className="w-6 h-6" />
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
                className="px-4 py-2 text-sm font-medium text-text bg-white border border-border rounded-md text-center hover:bg-gray-50"
              >
                My Account
              </Link>
              {(user.role === 'admin' || user.role === 'manager') && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md text-center hover:bg-brand-100"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-error bg-white border border-border rounded-md text-center hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md text-center hover:bg-brand-700"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text bg-white border border-border rounded-md text-center hover:bg-gray-50"
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
