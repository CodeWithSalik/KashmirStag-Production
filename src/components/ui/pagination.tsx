'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({ page, currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const activePage = currentPage !== undefined ? currentPage : (page ?? 1);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set('page', newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const generatePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (activePage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="text-sm text-text-secondary hidden sm:block">
        Page <span className="font-medium text-text">{activePage}</span> of <span className="font-medium text-text">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(activePage - 1)}
          disabled={activePage <= 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <div className="hidden sm:flex items-center space-x-1">
          {generatePages().map((p, i) => (
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-text-secondary">...</span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                  activePage === p 
                    ? 'bg-brand-700 text-white shadow-sm' 
                    : 'text-text hover:bg-surface-secondary border border-transparent hover:border-border'
                )}
                aria-current={activePage === p ? 'page' : undefined}
              >
                {p}
              </button>
            )
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
