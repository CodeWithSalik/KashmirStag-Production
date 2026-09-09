'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value?: number;
  rating?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

export function StarRating({ value, rating, onChange, size = 'md', readonly = false, className }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const actualValue = rating !== undefined ? rating : (value ?? 0);
  const displayValue = hoverValue !== null ? hoverValue : actualValue;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, index: number) => {
    if (readonly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    setHoverValue(percent < 0.5 ? index - 0.5 : index);
  };

  const handleClick = (index: number, e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly || !onChange) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    onChange(percent < 0.5 ? index - 0.5 : index);
  };

  return (
    <div 
      className={cn('flex items-center space-x-1', className)}
      role="radiogroup"
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = displayValue >= index;
        const isHalf = displayValue >= index - 0.5 && displayValue < index;
        
        return (
          <svg
            key={index}
            className={cn(
              sizes[size],
              readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110',
              isFilled || isHalf ? 'text-brand-500' : 'text-surface-tertiary'
            )}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            onClick={(e) => handleClick(index, e)}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`half-${index}`} x1="0" x2="100%" y1="0" y2="0">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill={`url(#half-${index})`}
                  className="text-brand-500"
                />
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-surface-tertiary"
                />
              </>
            ) : (
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            )}
          </svg>
        );
      })}
    </div>
  );
}
