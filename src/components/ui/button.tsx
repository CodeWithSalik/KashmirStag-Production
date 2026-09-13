'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';
    
    const variants = {
      primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm',
      secondary: 'bg-surface-secondary text-text border border-border hover:bg-surface-tertiary active:bg-surface-200',
      outline: 'border border-border text-text bg-surface hover:bg-surface-secondary hover:border-brand-300 active:bg-surface-tertiary',
      ghost: 'text-text-secondary hover:text-text hover:bg-surface-secondary active:bg-surface-tertiary',
      danger: 'bg-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 py-2 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ref,
        className: cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          child.props?.className,
          className
        ),
        disabled: isLoading || disabled,
        ...props,
      } as any);
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="mr-2" />}
        {isLoading ? 'Loading...' : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
