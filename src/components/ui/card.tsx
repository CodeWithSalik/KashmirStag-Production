import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  className,
  padding = 'md',
  hover = false,
  children,
  ...props
}: CardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-elevated',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
