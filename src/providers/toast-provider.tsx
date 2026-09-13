'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  title?: string;
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
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((optionsOrMessage: string | ToastOptions, typeArg: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    let title: string | undefined = undefined;
    let message = '';
    let type = typeArg;

    if (typeof optionsOrMessage === 'string') {
      message = optionsOrMessage;
    } else {
      title = optionsOrMessage.title;
      message = optionsOrMessage.description || optionsOrMessage.message || '';
      if (!message && title) {
        message = title;
        title = undefined;
      }
      if (optionsOrMessage.type) {
        type = optionsOrMessage.type;
      } else if (optionsOrMessage.variant === 'destructive') {
        type = 'error';
      }
    }

    // Anti-spam deduplication: Ignore if identical toast is already active
    setToasts((prev) => {
      const isDuplicate = prev.some((t) => t.message === message && t.type === type);
      if (isDuplicate) return prev;
      return [...prev.slice(-4), { id, title, message, type }]; // Keep at most 5
    });

    setTimeout(() => {
      dismiss(id);
    }, 4500);
  }, [dismiss]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />;
      default:
        return <Info className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className="w-full bg-surface border border-border rounded-lg shadow-elevated p-3.5 flex items-start gap-3 pointer-events-auto transition-all animate-slide-up duration-200"
          >
            {getIcon(t.type)}
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-semibold text-text leading-tight mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-text-secondary leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-text-tertiary hover:text-text p-1 rounded-md transition-colors -mr-1 -mt-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
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
