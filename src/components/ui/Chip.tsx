'use client';

import { ButtonHTMLAttributes } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Chip/Tag component for quick selections
 * Elegant, minimal styling with clear selected state
 */
export function Chip({
  children,
  selected = false,
  size = 'md',
  className = '',
  ...props
}: ChipProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium tracking-wide
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1
    select-none cursor-pointer
    border
  `;

  const selectedStyles = selected
    ? 'bg-neutral-900 text-white border-neutral-900'
    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-full',
    md: 'px-4 py-2 text-sm rounded-full',
  };

  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${selectedStyles}
        ${sizes[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
