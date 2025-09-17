'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/shared';

// Base skeleton component with animation
export function Skeleton({ 
  className = '', 
  width, 
  height,
  rounded = 'rounded',
  animate = true 
}: { 
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'rounded' | 'rounded-full' | 'rounded-lg' | 'rounded-md' | 'rounded-sm' | 'rounded-none';
  animate?: boolean;
}) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`
        bg-gray-200 
        ${rounded}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
}

// Text skeleton with different sizes
export function TextSkeleton({ 
  lines = 1, 
  className = '',
  size = 'base'
}: { 
  lines?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}) {
  const sizeClasses = {
    xs: 'h-3',
    sm: 'h-4',
    base: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
    '2xl': 'h-8'
  };

  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'];

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`${sizeClasses[size]} ${
            index === lines - 1 && lines > 1 
              ? widths[Math.min(index, widths.length - 1)]
              : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

// Button skeleton
export function ButtonSkeleton({ 
  size = 'default',
  variant = 'default',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 px-3',
    default: 'h-10 px-4',
    lg: 'h-12 px-6'
  };

  return (
    <Skeleton 
      className={`${sizeClasses[size]} rounded-md ${className}`}
    />
  );
}

// Avatar skeleton
export function AvatarSkeleton({ 
  size = 'default',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <Skeleton 
      className={`${sizeClasses[size]} rounded-full ${className}`}
    />
  );
}

// Badge skeleton
export function BadgeSkeleton({ className = '' }: { className?: string }) {
  return (
    <Skeleton 
      className={`h-5 w-16 rounded-full ${className}`}
    />
  );
}

// Icon skeleton
export function IconSkeleton({ 
  size = 'default',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Skeleton 
      className={`${sizeClasses[size]} rounded ${className}`}
    />
  );
}

// Card skeleton with header and content
export function CardSkeleton({ 
  hasHeader = true,
  contentLines = 3,
  hasFooter = false,
  className = ''
}: {
  hasHeader?: boolean;
  contentLines?: number;
  hasFooter?: boolean;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      {hasHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconSkeleton />
              <TextSkeleton size="lg" className="w-32" />
            </div>
            <BadgeSkeleton />
          </div>
        </CardHeader>
      )}
      <CardContent className={hasHeader ? 'pt-0' : ''}>
        <TextSkeleton lines={contentLines} />
        {hasFooter && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <TextSkeleton className="w-24" />
            <ButtonSkeleton size="sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stats card skeleton
export function StatsCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <TextSkeleton size="sm" className="w-20" />
            <TextSkeleton size="2xl" className="w-16" />
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <IconSkeleton size="lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = ''
}: {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {hasHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <TextSkeleton key={index} size="sm" className="w-20" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex}
            className="grid gap-4 py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TextSkeleton key={colIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ 
  height = 200,
  className = ''
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <TextSkeleton size="lg" className="w-32" />
        <div className="flex space-x-2">
          <BadgeSkeleton />
          <BadgeSkeleton />
        </div>
      </div>
      <Skeleton height={height} className="w-full rounded-lg" />
      <div className="flex justify-center space-x-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <TextSkeleton size="sm" className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({ 
  items = 5,
  hasAvatar = false,
  hasActions = false,
  className = ''
}: {
  items?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {hasAvatar && <AvatarSkeleton />}
            <div className="space-y-1">
              <TextSkeleton className="w-32" />
              <TextSkeleton size="sm" className="w-48" />
            </div>
          </div>
          {hasActions && (
            <div className="flex space-x-2">
              <ButtonSkeleton size="sm" />
              <ButtonSkeleton size="sm" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ 
  fields = 4,
  hasSubmitButton = true,
  className = ''
}: {
  fields?: number;
  hasSubmitButton?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <TextSkeleton size="sm" className="w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      {hasSubmitButton && (
        <div className="flex justify-end space-x-3">
          <ButtonSkeleton variant="outline" />
          <ButtonSkeleton />
        </div>
      )}
    </div>
  );
}