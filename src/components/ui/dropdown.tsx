'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      // Return focus to trigger could go here
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        role="button" 
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-40 mt-2 w-56 rounded-md bg-surface shadow-elevated border border-border py-1 animate-fade-in focus:outline-none',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          )}
          role="menu"
          tabIndex={-1}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={cn(
                'group flex w-full items-center px-4 py-2 text-sm text-left transition-colors',
                item.variant === 'danger' 
                  ? 'text-error hover:bg-red-50 hover:text-red-700' 
                  : 'text-text hover:bg-surface-secondary hover:text-text'
              )}
              role="menuitem"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.icon && <span className="mr-3 h-4 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
