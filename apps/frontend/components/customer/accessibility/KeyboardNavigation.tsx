'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Hook for managing focus trap in modals/dialogs
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

// Hook for managing roving tabindex (for tab panels, menus, etc.)
export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  activeIndex: number,
  onActiveIndexChange: (index: number) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      let nextIndex = activeIndex;

      const isHorizontal = orientation === 'horizontal';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

      switch (key) {
        case prevKey:
          e.preventDefault();
          nextIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
          break;
        case nextKey:
          e.preventDefault();
          nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      onActiveIndexChange(nextIndex);
      items[nextIndex]?.focus();
    };

    const activeItem = items[activeIndex];
    if (activeItem) {
      activeItem.addEventListener('keydown', handleKeyDown);
      return () => activeItem.removeEventListener('keydown', handleKeyDown);
    }
  }, [items, activeIndex, onActiveIndexChange, orientation]);

  // Set tabindex for all items
  useEffect(() => {
    items.forEach((item, index) => {
      item.tabIndex = index === activeIndex ? 0 : -1;
    });
  }, [items, activeIndex]);
}

// Keyboard navigation helper component
interface KeyboardNavigationProps {
  children: React.ReactNode;
  className?: string;
  onEscape?: () => void;
  trapFocus?: boolean;
}

export function KeyboardNavigation({
  children,
  className,
  onEscape,
  trapFocus = false
}: KeyboardNavigationProps) {
  const containerRef = useFocusTrap(trapFocus);

  useEffect(() => {
    if (!onEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onEscape]);

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}

// Skip navigation component
interface SkipNavigationProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipNavigation({ links }: SkipNavigationProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Accessible dropdown menu with keyboard navigation
interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  items: Array<{
    id: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function AccessibleDropdown({
  trigger,
  items,
  isOpen,
  onToggle,
  className
}: AccessibleDropdownProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useRovingTabIndex(
    itemRefs.current.filter(Boolean) as HTMLButtonElement[],
    activeIndex,
    setActiveIndex,
    'vertical'
  );

  useEffect(() => {
    if (isOpen) {
      // Focus first item when menu opens
      itemRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const handleItemClick = (item: typeof items[0]) => {
    if (!item.disabled) {
      item.onClick();
      onToggle();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {trigger}
      </button>

      {isOpen && (
        <KeyboardNavigation onEscape={onToggle}>
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => (itemRefs.current[index] = el)}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  "focus:outline-none focus:bg-blue-50 focus:text-blue-900",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </KeyboardNavigation>
      )}
    </div>
  );
}

// Accessible breadcrumb navigation
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AccessibleBreadcrumb({ items, className }: AccessibleBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "px-1",
                  item.current ? "text-gray-900 font-medium" : "text-gray-500"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Accessible pagination with keyboard navigation
interface AccessiblePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: AccessiblePaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showEllipsis = totalPages > 7;
  
  let visiblePages = pages;
  if (showEllipsis) {
    if (currentPage <= 4) {
      visiblePages = [...pages.slice(0, 5), -1, totalPages];
    } else if (currentPage >= totalPages - 3) {
      visiblePages = [1, -1, ...pages.slice(totalPages - 5)];
    } else {
      visiblePages = [1, -1, ...pages.slice(currentPage - 2, currentPage + 1), -1, totalPages];
    }
  }

  return (
    <nav aria-label="Pagination" className={className}>
      <div className="flex items-center justify-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:bg-gray-100"
          )}
        >
          Previous
        </button>

        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === -1 ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:bg-gray-100"
          )}
        >
          Next
        </button>
      </div>
    </nav>
  );
}