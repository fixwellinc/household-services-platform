'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsiveValue } from '@/hooks/use-container-query';

interface ContentPriorityProps {
  children: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  mobileOrder?: number;
  className?: string;
}

export function ContentPriority({
  children,
  priority,
  mobileOrder,
  className,
}: ContentPriorityProps) {
  const { isMd } = useBreakpoint();
  
  const priorityClasses = {
    high: 'order-1',
    medium: 'order-2',
    low: 'order-3',
  };

  const mobileOrderClass = mobileOrder ? `order-${mobileOrder}` : priorityClasses[priority];
  const desktopOrderClass = `md:order-none`;

  return (
    <div className={cn(
      mobileOrderClass,
      desktopOrderClass,
      'smooth-breakpoint',
      className
    )}>
      {children}
    </div>
  );
}

interface AdaptiveArticleLayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
  sidebar?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  image?: React.ReactNode;
  className?: string;
}

export function AdaptiveArticleLayout({
  title,
  subtitle,
  content,
  sidebar,
  metadata,
  actions,
  image,
  className,
}: AdaptiveArticleLayoutProps) {
  const { isMd } = useBreakpoint();

  return (
    <article className={cn('flex flex-col space-y-6', className)}>
      {/* Mobile-first layout with content priority */}
      <div className="flex flex-col md:hidden space-y-4">
        {/* High priority: Title and key actions */}
        <ContentPriority priority="high" mobileOrder={1}>
          <div className="space-y-2">
            {title}
            {actions && (
              <div className="flex flex-wrap gap-2">
                {actions}
              </div>
            )}
          </div>
        </ContentPriority>

        {/* Medium priority: Image and subtitle */}
        <ContentPriority priority="medium" mobileOrder={2}>
          <div className="space-y-3">
            {image}
            {subtitle}
          </div>
        </ContentPriority>

        {/* High priority: Main content */}
        <ContentPriority priority="high" mobileOrder={3}>
          {content}
        </ContentPriority>

        {/* Low priority: Metadata and sidebar */}
        <ContentPriority priority="low" mobileOrder={4}>
          <div className="space-y-4">
            {metadata && (
              <div className="p-4 bg-gray-50 rounded-lg">
                {metadata}
              </div>
            )}
            {sidebar && (
              <div className="border-t pt-4">
                {sidebar}
              </div>
            )}
          </div>
        </ContentPriority>
      </div>

      {/* Desktop layout with sidebar */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2 space-y-6">
          <header className="space-y-4">
            {title}
            {subtitle}
            {image}
            {actions && (
              <div className="flex flex-wrap gap-3">
                {actions}
              </div>
            )}
          </header>
          
          <main>
            {content}
          </main>
          
          {metadata && (
            <footer className="border-t pt-6">
              {metadata}
            </footer>
          )}
        </div>
        
        {sidebar && (
          <aside className="md:col-span-1">
            <div className="sticky top-6">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}

interface AdaptiveCardLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  image?: React.ReactNode;
  actions?: React.ReactNode;
  layout?: 'stacked' | 'horizontal' | 'adaptive';
  imagePosition?: 'top' | 'left' | 'right' | 'background';
  className?: string;
}

export function AdaptiveCardLayout({
  children,
  header,
  footer,
  image,
  actions,
  layout = 'adaptive',
  imagePosition = 'top',
  className,
}: AdaptiveCardLayoutProps) {
  const { isMd } = useBreakpoint();
  
  const shouldUseHorizontal = layout === 'horizontal' || (layout === 'adaptive' && isMd);

  if (imagePosition === 'background' && image) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-lg',
        'smooth-breakpoint',
        className
      )}>
        <div className="absolute inset-0">
          {image}
        </div>
        <div className="relative bg-black/40 text-white p-6">
          {header && <div className="mb-4">{header}</div>}
          <div className="mb-4">{children}</div>
          {actions && <div className="mb-4">{actions}</div>}
          {footer && <div>{footer}</div>}
        </div>
      </div>
    );
  }

  if (shouldUseHorizontal && imagePosition !== 'top') {
    return (
      <div className={cn(
        'card flex overflow-hidden',
        imagePosition === 'right' ? 'flex-row-reverse' : 'flex-row',
        'smooth-breakpoint',
        className
      )}>
        {image && (
          <div className="flex-shrink-0 w-48">
            {image}
          </div>
        )}
        <div className="flex-1 p-6 flex flex-col">
          {header && <div className="mb-4">{header}</div>}
          <div className="flex-1 mb-4">{children}</div>
          {actions && <div className="mb-4">{actions}</div>}
          {footer && <div>{footer}</div>}
        </div>
      </div>
    );
  }

  // Stacked layout (default for mobile)
  return (
    <div className={cn('card overflow-hidden', 'smooth-breakpoint', className)}>
      {image && imagePosition === 'top' && (
        <div className="aspect-video overflow-hidden">
          {image}
        </div>
      )}
      
      <div className="p-6">
        {header && <div className="mb-4">{header}</div>}
        <div className="mb-4">{children}</div>
        {actions && <div className="mb-4">{actions}</div>}
        {footer && <div>{footer}</div>}
      </div>
    </div>
  );
}

interface ResponsiveTableProps {
  headers: string[];
  data: Array<Record<string, React.ReactNode>>;
  mobileLayout?: 'cards' | 'stacked' | 'horizontal-scroll';
  priorityColumns?: string[];
  className?: string;
}

export function ResponsiveTable({
  headers,
  data,
  mobileLayout = 'cards',
  priorityColumns = [],
  className,
}: ResponsiveTableProps) {
  const { isMd } = useBreakpoint();

  if (!isMd && mobileLayout === 'cards') {
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((row, index) => (
          <div key={index} className="card p-4 space-y-3">
            {headers.map((header) => {
              const isPriority = priorityColumns.includes(header);
              return (
                <div
                  key={header}
                  className={cn(
                    'flex justify-between items-start',
                    isPriority && 'font-semibold text-lg'
                  )}
                >
                  <span className="text-gray-600 text-sm font-medium min-w-0 flex-1 mr-4">
                    {header}
                  </span>
                  <span className="text-right min-w-0 flex-1">
                    {row[header]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (!isMd && mobileLayout === 'stacked') {
    return (
      <div className={cn('space-y-6', className)}>
        {data.map((row, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            {headers.map((header) => {
              const isPriority = priorityColumns.includes(header);
              return (
                <div
                  key={header}
                  className={cn(
                    'mb-2 last:mb-0',
                    isPriority && 'mb-3'
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium text-gray-600 mb-1',
                    isPriority && 'text-base font-semibold text-gray-900'
                  )}>
                    {header}
                  </div>
                  <div className={cn(
                    'text-gray-900',
                    isPriority && 'text-lg font-semibold'
                  )}>
                    {row[header]}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (!isMd && mobileLayout === 'horizontal-scroll') {
    return (
      <div className={cn('overflow-x-auto', className)}>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b">
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {headers.map((header) => (
                <td
                  key={header}
                  className="px-6 py-4 text-sm text-gray-900"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AdaptiveNavigationProps {
  items: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
    priority?: 'high' | 'medium' | 'low';
  }>;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdaptiveNavigation({
  items,
  logo,
  actions,
  className,
}: AdaptiveNavigationProps) {
  const { isMd } = useBreakpoint();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const highPriorityItems = items.filter(item => item.priority === 'high');
  const mediumPriorityItems = items.filter(item => item.priority === 'medium');
  const lowPriorityItems = items.filter(item => item.priority === 'low');

  if (!isMd) {
    return (
      <nav className={cn('bg-white border-b', className)}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {isMobileMenuOpen && (
            <div className="mt-4 space-y-2">
              {/* High priority items first */}
              {highPriorityItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-100"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
              
              {/* Medium priority items */}
              {mediumPriorityItems.length > 0 && (
                <>
                  <div className="border-t pt-2 mt-2">
                    {mediumPriorityItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        {item.icon && <span className="mr-3">{item.icon}</span>}
                        {item.label}
                      </a>
                    ))}
                  </div>
                </>
              )}
              
              {/* Actions */}
              {actions && (
                <div className="border-t pt-2 mt-2">
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Desktop navigation
  return (
    <nav className={cn('bg-white border-b', className)}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            
            <div className="flex space-x-6">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </nav>
  );
}

interface BreakpointTransitionProps {
  children: React.ReactNode;
  duration?: 'fast' | 'normal' | 'slow';
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  className?: string;
}

export function BreakpointTransition({
  children,
  duration = 'normal',
  easing = 'ease-in-out',
  className,
}: BreakpointTransitionProps) {
  const durationClasses = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
  };

  const easingClasses = {
    linear: 'ease-linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
  };

  return (
    <div className={cn(
      'transition-all',
      durationClasses[duration],
      easingClasses[easing],
      className
    )}>
      {children}
    </div>
  );
}