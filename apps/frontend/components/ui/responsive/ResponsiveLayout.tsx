'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Breakpoint Context
interface BreakpointContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
}

const BreakpointContext = createContext<BreakpointContextValue>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLargeDesktop: false,
  width: 1024
});

export function useBreakpoint() {
  return useContext(BreakpointContext);
}

// Breakpoint Provider
interface BreakpointProviderProps {
  children: React.ReactNode;
}

export function BreakpointProvider({ children }: BreakpointProviderProps) {
  const [width, setWidth] = useState(1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    
    // Set initial width
    setWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value: BreakpointContextValue = {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024 && width < 1280,
    isLargeDesktop: width >= 1280,
    width
  };

  return (
    <BreakpointContext.Provider value={value}>
      {children}
    </BreakpointContext.Provider>
  );
}

// Responsive Container
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'full',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive Grid
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const getGridCols = () => {
    const classes = [];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Mobile Sidebar
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  children,
  className
}: MobileSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

// Responsive Layout with Sidebar
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  sidebarWidth?: 'sm' | 'md' | 'lg';
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  className,
  sidebarWidth = 'md'
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  const sidebarWidthClasses = {
    sm: 'lg:w-64',
    md: 'lg:w-80',
    lg: 'lg:w-96'
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile Header */}
      {header && (
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          {sidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            {header}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebar && (
          <div className={cn(
            'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r',
            sidebarWidthClasses[sidebarWidth]
          )}>
            {header && (
              <div className="border-b px-6 py-4">
                {header}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        {sidebar && isMobile && (
          <MobileSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          >
            {sidebar}
          </MobileSidebar>
        )}

        {/* Main Content */}
        <div className={cn(
          'flex-1',
          sidebar && sidebarWidthClasses[sidebarWidth] && 'lg:ml-80'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Responsive Stack
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    default?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  className,
  direction = { default: 'col', md: 'row' },
  spacing = 'md',
  align = 'start',
  justify = 'start'
}: ResponsiveStackProps) {
  const getDirectionClasses = () => {
    const classes = [];
    
    if (direction.default === 'row') classes.push('flex-row');
    else classes.push('flex-col');
    
    if (direction.sm === 'row') classes.push('sm:flex-row');
    else if (direction.sm === 'col') classes.push('sm:flex-col');
    
    if (direction.md === 'row') classes.push('md:flex-row');
    else if (direction.md === 'col') classes.push('md:flex-col');
    
    if (direction.lg === 'row') classes.push('lg:flex-row');
    else if (direction.lg === 'col') classes.push('lg:flex-col');
    
    return classes.join(' ');
  };

  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div className={cn(
      'flex',
      getDirectionClasses(),
      spacingClasses[spacing],
      alignClasses[align],
      justifyClasses[justify],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive Show/Hide
interface ResponsiveShowProps {
  children: React.ReactNode;
  on?: ('mobile' | 'tablet' | 'desktop' | 'large-desktop')[];
  className?: string;
}

export function ResponsiveShow({ children, on = ['desktop'], className }: ResponsiveShowProps) {
  const getVisibilityClasses = () => {
    const classes = ['hidden']; // Hidden by default
    
    if (on.includes('mobile')) classes.push('block', 'md:hidden');
    if (on.includes('tablet')) classes.push('md:block', 'lg:hidden');
    if (on.includes('desktop')) classes.push('lg:block', 'xl:hidden');
    if (on.includes('large-desktop')) classes.push('xl:block');
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getVisibilityClasses(), className)}>
      {children}
    </div>
  );
}

export function ResponsiveHide({ children, on = [], className }: ResponsiveShowProps) {
  const getVisibilityClasses = () => {
    const classes = ['block']; // Visible by default
    
    if (on.includes('mobile')) classes.push('hidden', 'md:block');
    if (on.includes('tablet')) classes.push('md:hidden', 'lg:block');
    if (on.includes('desktop')) classes.push('lg:hidden', 'xl:block');
    if (on.includes('large-desktop')) classes.push('xl:hidden');
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getVisibilityClasses(), className)}>
      {children}
    </div>
  );
}