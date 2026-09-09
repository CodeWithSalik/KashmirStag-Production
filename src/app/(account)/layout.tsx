import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AccountSidebar } from '@/components/layout/account-sidebar';
import { AuthProvider } from '@/providers/auth-provider';
import { CartProvider } from '@/providers/cart-provider';
import { ToastProvider } from '@/providers/toast-provider';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen bg-surface">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12">
              <div className="flex flex-col lg:flex-row gap-8">
                <AccountSidebar />
                <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-border">
                  {children}
                </div>
              </div>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
