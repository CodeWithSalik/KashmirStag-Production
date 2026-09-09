'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type ToastOptions = {
  title?: string;
  description?: string;
  message?: string;
  type?: ToastType;
  variant?: 'default' | 'destructive';
};

interface ToastContextType {
  toast: (optionsOrMessage: string | ToastOptions, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((optionsOrMessage: string | ToastOptions, typeArg: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    let message = '';
    let type = typeArg;

    if (typeof optionsOrMessage === 'string') {
      message = optionsOrMessage;
    } else {
      const parts = [optionsOrMessage.title, optionsOrMessage.description, optionsOrMessage.message].filter(Boolean);
      message = parts.join(' - ') || 'Notification';
      if (optionsOrMessage.type) {
        type = optionsOrMessage.type;
      } else if (optionsOrMessage.variant === 'destructive') {
        type = 'error';
      }
    }

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-elevated text-sm font-medium text-white transition-all transform animate-slide-up pointer-events-auto ${
              t.type === 'success' ? 'bg-success' :
              t.type === 'error' ? 'bg-error' :
              t.type === 'warning' ? 'bg-warning' : 'bg-brand-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
