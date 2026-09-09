'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text">
            {label} {required && <span className="text-error">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          className={cn(
            'flex w-full rounded-md border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y',
            error ? 'border-error focus-visible:ring-error' : 'border-border'
          )}
          {...props}
        />
        {hint && !error && <span className="text-xs text-text-secondary">{hint}</span>}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
