'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onDismiss, duration = 5000 }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onDismiss, 300);
  };

  const types = {
    success: {
      bg: 'bg-surface border-green-200',
      icon: 'text-green-500',
      progress: 'bg-green-500',
      iconSvg: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-surface border-red-200',
      icon: 'text-red-500',
      progress: 'bg-red-500',
      iconSvg: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    info: {
      bg: 'bg-surface border-blue-200',
      icon: 'text-blue-500',
      progress: 'bg-blue-500',
      iconSvg: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-surface border-yellow-200',
      icon: 'text-yellow-500',
      progress: 'bg-yellow-500',
      iconSvg: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const style = types[type];

  return (
    <div
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-lg border shadow-elevated transition-all duration-300',
        style.bg,
        isClosing ? 'translate-x-full opacity-0' : 'animate-slide-in-right'
      )}
      role="alert"
    >
      <div className="flex p-4">
        <div className={cn('flex-shrink-0', style.icon)}>
          {style.iconSvg}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-text">{message}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md text-text-tertiary hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div 
        className={cn('absolute bottom-0 left-0 h-1 w-full', style.progress)}
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
