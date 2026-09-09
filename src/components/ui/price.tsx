import React from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { Badge } from './badge';

export interface PriceProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Price({ amount, compareAt, size = 'md', className, ...props }: PriceProps) {
  const sizes = {
    sm: {
      current: 'text-sm font-semibold',
      compare: 'text-xs',
    },
    md: {
      current: 'text-lg font-bold',
      compare: 'text-sm',
    },
    lg: {
      current: 'text-2xl font-bold',
      compare: 'text-base',
    },
  };

  const discount = compareAt && compareAt > amount 
    ? Math.round(((compareAt - amount) / compareAt) * 100) 
    : 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      <span className={cn('text-brand-700', sizes[size].current)}>
        {formatPrice(amount)}
      </span>
      
      {compareAt && compareAt > amount && (
        <>
          <span className={cn('text-text-tertiary line-through', sizes[size].compare)}>
            {formatPrice(compareAt)}
          </span>
          <Badge variant="error" size="sm" className="ml-1">
            -{discount}%
          </Badge>
        </>
      )}
    </div>
  );
}
