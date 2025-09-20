'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  Search, 
  Bell, 
  User,
  ArrowLeft
} from 'lucide-react';

// Mobile Navigation Item
interface MobileNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children?: MobileNavItem[];
}

// Mobile Bottom Navigation
interface MobileBottomNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: number;
  }>;
  activeItem?: string;
  className?: string;
}

export function MobileBottomNav({
  items,
  activeItem,
  className
}: MobileBottomNavProps) {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden',
      className
    )}>
      <div className="grid grid-cols-4 gap-1 px-2 py-1">
        {items.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors min-h-[60px]',
              activeItem === item.id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs mt-1 font-medium truncate w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Mobile Drawer Navigation
interface MobileDrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: MobileNavItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileDrawerNav({
  isOpen,
  onClose,
  items,
  header,
  footer,
  className
}: MobileDrawerNavProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderNavItem = (item: MobileNavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              item.onClick?.();
              onClose();
            }
          }}
          className={cn(
            'w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors',
            level > 0 && 'pl-8 border-l-2 border-gray-100 ml-4'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <span className="text-gray-500">
                {item.icon}
              </span>
            )}
            <span className="font-medium text-gray-900">
              {item.label}
            </span>
            {item.badge && item.badge > 0 && (
              <Badge variant="secondary" className="ml-2">
                {item.badge}
              </Badge>
            )}
          </div>
          
          {hasChildren && (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {header || <h2 className="text-lg font-semibold">Menu</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          {items.map(item => renderNavItem(item))}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t p-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// Mobile Header with Navigation
interface MobileHeaderProps {
  title?: string;
  leftAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
  };
  rightActions?: Array<{
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    badge?: number;
  }>;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function MobileHeader({
  title,
  leftAction,
  rightActions = [],
  showMenuButton = true,
  onMenuClick,
  className
}: MobileHeaderProps) {
  return (
    <header className={cn(
      'bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden',
      className
    )}>
      {/* Left Side */}
      <div className="flex items-center gap-2">
        {leftAction ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={leftAction.onClick}
            className="p-2"
            aria-label={leftAction.label}
          >
            {leftAction.icon}
          </Button>
        ) : showMenuButton && onMenuClick ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      {/* Center - Title */}
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center">
          {title}
        </h1>
      )}

      {/* Right Side */}
      <div className="flex items-center gap-1">
        {rightActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="p-2 relative"
            aria-label={action.label}
          >
            {action.icon}
            {action.badge && action.badge > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
              >
                {action.badge > 9 ? '9+' : action.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </header>
  );
}

// Mobile Breadcrumb Navigation
interface MobileBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export function MobileBreadcrumb({ items, className }: MobileBreadcrumbProps) {
  if (items.length <= 1) return null;

  const currentItem = items[items.length - 1];
  const parentItem = items[items.length - 2];

  return (
    <div className={cn(
      'bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 lg:hidden',
      className
    )}>
      <Button
        variant="ghost"
        size="sm"
        onClick={parentItem.onClick}
        className="p-1 text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={parentItem.onClick}
          className="text-sm text-blue-600 hover:text-blue-800 truncate"
        >
          {parentItem.label}
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 truncate">
          {currentItem.label}
        </span>
      </div>
    </div>
  );
}

// Mobile Search Header
interface MobileSearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

export function MobileSearchHeader({
  value,
  onChange,
  onCancel,
  placeholder = 'Search...',
  className
}: MobileSearchHeaderProps) {
  return (
    <div className={cn(
      'bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden',
      className
    )}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="text-blue-600 hover:text-blue-800"
      >
        Cancel
      </Button>
    </div>
  );
}

// Complete Mobile Navigation System
interface MobileNavigationSystemProps {
  drawerItems: MobileNavItem[];
  bottomNavItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: number;
  }>;
  activeBottomItem?: string;
  headerTitle?: string;
  headerActions?: Array<{
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
    badge?: number;
  }>;
  children: React.ReactNode;
  className?: string;
}

export function MobileNavigationSystem({
  drawerItems,
  bottomNavItems,
  activeBottomItem,
  headerTitle,
  headerActions,
  children,
  className
}: MobileNavigationSystemProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={cn('lg:hidden', className)}>
      {/* Mobile Header */}
      <MobileHeader
        title={headerTitle}
        rightActions={headerActions}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Drawer Navigation */}
      <MobileDrawerNav
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerItems}
      />

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        items={bottomNavItems}
        activeItem={activeBottomItem}
      />
    </div>
  );
}