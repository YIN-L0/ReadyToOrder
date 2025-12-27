'use client';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton loading placeholder
 * Subtle shimmer animation for elegant loading states
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = 'bg-neutral-100';

  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationStyles = animate
    ? 'animate-pulse'
    : '';

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${animationStyles}
        ${className}
      `.trim()}
      style={style}
    />
  );
}

/**
 * Image skeleton with aspect ratio
 */
export function ImageSkeleton({
  className = '',
  aspectRatio = '1/1',
}: {
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-neutral-100 rounded-xl
        animate-pulse
        ${className}
      `.trim()}
      style={{ aspectRatio }}
    >
      {/* Centered camera/image icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-neutral-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}
