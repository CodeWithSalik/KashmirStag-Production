'use client';

import React, { useState } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQItemProps[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className="border border-border rounded-lg bg-white overflow-hidden transition-all duration-200"
          >
            <button
              className="flex items-center justify-between w-full p-5 text-left bg-white hover:bg-surface-secondary transition-colors focus:outline-none"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-text pr-8">{faq.question}</span>
              <HiOutlineChevronDown 
                className={cn(
                  "w-5 h-5 text-text-secondary shrink-0 transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )} 
              />
            </button>
            <div 
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="p-5 pt-0 text-text-secondary border-t border-border mt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
