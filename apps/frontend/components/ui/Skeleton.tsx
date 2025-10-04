import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-white dark:bg-gray-800 p-6 shadow-sm', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonServiceCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-lg space-y-4',
        className
      )}
    >
      {/* Icon/Image */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4" />

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Features */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      {/* Price and Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonPricingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg space-y-6',
        className
      )}
    >
      {/* Icon */}
      <div className="flex justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>

      {/* Title */}
      <div className="space-y-2 text-center">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Price */}
      <div className="space-y-2 text-center">
        <Skeleton className="h-12 w-40 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Features */}
      <div className="space-y-3 pt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-12" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Shimmer variant with enhanced effect
export function SkeletonShimmer({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700',
        'before:absolute before:inset-0',
        'before:translate-x-[-100%] before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

// Grid of skeleton cards
export function SkeletonGrid({
  count = 6,
  variant = 'card',
}: {
  count?: number;
  variant?: 'card' | 'service' | 'pricing';
}) {
  const SkeletonComponent =
    variant === 'service'
      ? SkeletonServiceCard
      : variant === 'pricing'
      ? SkeletonPricingCard
      : SkeletonCard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
