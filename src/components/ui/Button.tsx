'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Luxury-styled button component with multiple variants
 * Following Nordstrom-like minimal aesthetic
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium tracking-wide
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      select-none
    `;

    const variants = {
      primary: `
        bg-neutral-900 text-white
        hover:bg-neutral-800
        active:bg-neutral-950
      `,
      secondary: `
        bg-neutral-100 text-neutral-900
        hover:bg-neutral-200
        active:bg-neutral-300
      `,
      ghost: `
        bg-transparent text-neutral-700
        hover:bg-neutral-100
        active:bg-neutral-200
      `,
      outline: `
        bg-transparent text-neutral-900
        border border-neutral-300
        hover:border-neutral-400 hover:bg-neutral-50
        active:bg-neutral-100
      `,
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-lg',
      md: 'px-6 py-3 text-base rounded-xl',
      lg: 'px-8 py-4 text-lg rounded-xl',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${widthClass}
          ${className}
        `.trim()}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
