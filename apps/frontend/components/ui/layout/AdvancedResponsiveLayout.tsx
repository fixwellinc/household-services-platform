'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useContainerQuery, useBreakpoint, useResponsiveValue } from '@/hooks/use-container-query';

interface AdvancedResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerQuery?: boolean;
  adaptiveSpacing?: boolean;
}

export function AdvancedResponsiveLayout({
  children,
  className,
  containerQuery = true,
  adaptiveSpacing = true,
}: AdvancedResponsiveLayoutProps) {
  const [containerRef, containerResult] = useContainerQuery({
    minWidth: 768,
  });

  const { current: breakpoint } = useBreakpoint();

  const spacing = useResponsiveValue({
    xs: 'p-4',
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-10',
    xl: 'p-12',
  });

  const containerClasses = cn(
    'w-full',
    adaptiveSpacing && spacing,
    containerQuery && 'container-query',
    'smooth-breakpoint',
    className
  );

  return (
    <div ref={containerRef} className={containerClasses}>
      <div className="space-y-fluid-lg">
        {children}
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          <div>Breakpoint: {breakpoint}</div>
          <div>Container: {containerResult.width}x{containerResult.height}</div>
          <div>Matches: {containerResult.matches ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  maxColumns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveCardGrid({
  children,
  minCardWidth = 300,
  maxColumns = 4,
  gap = 'md',
  className,
}: ResponsiveCardGridProps) {
  const [containerRef, containerResult] = useContainerQuery({
    minWidth: minCardWidth,
  });

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  // Calculate optimal columns based on container width
  const calculateColumns = () => {
    if (containerResult.width === 0) return 1;
    
    const availableWidth = containerResult.width - 32; // Account for padding
    const possibleColumns = Math.floor(availableWidth / minCardWidth);
    return Math.min(possibleColumns, maxColumns);
  };

  const columns = calculateColumns();

  return (
    <div
      ref={containerRef}
      className={cn(
        'container-query grid w-full',
        gapClasses[gap],
        'smooth-breakpoint',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {children}
    </div>
  );
}

interface AdaptiveContentLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: number;
  breakpoint?: number;
  className?: string;
}

export function AdaptiveContentLayout({
  children,
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 300,
  breakpoint = 1024,
  className,
}: AdaptiveContentLayoutProps) {
  const [containerRef, containerResult] = useContainerQuery({
    minWidth: breakpoint,
  });

  const showSidebar = containerResult.matches && sidebar;

  const gridAreas = sidebarPosition === 'left' 
    ? '"sidebar main"'
    : '"main sidebar"';

  const gridColumns = showSidebar 
    ? `${sidebarWidth}px 1fr`
    : '1fr';

  return (
    <div
      ref={containerRef}
      className={cn(
        'container-query w-full',
        'smooth-breakpoint',
        className
      )}
    >
      {showSidebar ? (
        <div
          className="grid gap-fluid-lg"
          style={{
            gridTemplateAreas: gridAreas,
            gridTemplateColumns: gridColumns,
          }}
        >
          <main className="grid-area-main min-w-0">
            {children}
          </main>
          <aside className="grid-area-sidebar">
            {sidebar}
          </aside>
        </div>
      ) : (
        <div className="w-full">
          {children}
          {sidebar && (
            <div className="mt-fluid-lg">
              {sidebar}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ResponsiveHeroLayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  media?: React.ReactNode;
  actions?: React.ReactNode;
  layout?: 'stacked' | 'side-by-side' | 'media-first';
  alignment?: 'left' | 'center' | 'right';
  className?: string;
}

export function ResponsiveHeroLayout({
  title,
  subtitle,
  content,
  media,
  actions,
  layout = 'side-by-side',
  alignment = 'left',
  className,
}: ResponsiveHeroLayoutProps) {
  const [containerRef, containerResult] = useContainerQuery({
    minWidth: 1024,
  });

  const isLargeContainer = containerResult.matches;
  const shouldStack = !isLargeContainer || layout === 'stacked';

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const contentOrder = layout === 'media-first' ? 'order-2' : 'order-1';
  const mediaOrder = layout === 'media-first' ? 'order-1' : 'order-2';

  return (
    <div
      ref={containerRef}
      className={cn(
        'container-query w-full',
        'smooth-breakpoint',
        className
      )}
    >
      <div className={cn(
        'grid gap-fluid-xl items-center',
        shouldStack ? 'grid-cols-1' : 'grid-cols-2',
        alignmentClasses[alignment]
      )}>
        <div className={cn('space-y-fluid-lg', contentOrder)}>
          <div className="space-y-fluid-md">
            {title}
            {subtitle}
          </div>
          
          {content && (
            <div className="space-y-fluid-md">
              {content}
            </div>
          )}
          
          {actions && (
            <div className="space-y-fluid-sm">
              {actions}
            </div>
          )}
        </div>
        
        {media && (
          <div className={cn('w-full', mediaOrder)}>
            {media}
          </div>
        )}
      </div>
    </div>
  );
}

interface FluidTypographyProps {
  children: React.ReactNode;
  variant?: 'display' | 'heading' | 'subheading' | 'body';
  className?: string;
}

export function FluidTypography({
  children,
  variant = 'body',
  className,
}: FluidTypographyProps) {
  const variantClasses = {
    display: 'text-responsive-display font-bold',
    heading: 'text-responsive-heading font-semibold',
    subheading: 'text-responsive-subheading font-medium',
    body: 'text-responsive-body',
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
}

interface ResponsiveSpacingProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  type?: 'padding' | 'margin' | 'gap';
  direction?: 'all' | 'vertical' | 'horizontal' | 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function ResponsiveSpacing({
  children,
  size = 'md',
  type = 'padding',
  direction = 'all',
  className,
}: ResponsiveSpacingProps) {
  const getSpacingClass = () => {
    const prefix = type === 'padding' ? 'p' : type === 'margin' ? 'm' : 'gap';
    const directionSuffix = {
      all: '',
      vertical: 'y',
      horizontal: 'x',
      top: 't',
      bottom: 'b',
      left: 'l',
      right: 'r',
    }[direction];

    return `${prefix}${directionSuffix}-fluid-${size}`;
  };

  return (
    <div className={cn(getSpacingClass(), className)}>
      {children}
    </div>
  );
}

interface BreakpointVisibilityProps {
  children: React.ReactNode;
  show?: ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')[];
  hide?: ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')[];
  className?: string;
}

export function BreakpointVisibility({
  children,
  show,
  hide,
  className,
}: BreakpointVisibilityProps) {
  const { current } = useBreakpoint();

  const shouldShow = () => {
    if (show && !show.includes(current as any)) return false;
    if (hide && hide.includes(current as any)) return false;
    return true;
  };

  if (!shouldShow()) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
}