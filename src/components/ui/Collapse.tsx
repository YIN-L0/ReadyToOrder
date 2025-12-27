'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapseProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible section with smooth animation
 * Clean, minimal header with chevron indicator
 */
export function Collapse({
  title,
  children,
  defaultOpen = false,
  className = '',
}: CollapseProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          py-3 px-1
          text-left
          text-neutral-700 hover:text-neutral-900
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2
          rounded-lg
        "
      >
        <span className="text-sm font-medium tracking-wide uppercase">
          {title}
        </span>
        <ChevronDown
          className={`
            w-5 h-5 text-neutral-400
            transition-transform duration-300 ease-out
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>

      <div
        className={`
          overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="pt-2 pb-4">{children}</div>
      </div>
    </div>
  );
}
