"use client";

import React, { useState } from 'react';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Using custom implementations since sheet and collapsible components may not be available

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  badge?: string | number;
  active?: boolean;
}

export interface ResponsiveNavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
  logo?: React.ReactNode;
  userMenu?: React.ReactNode;
}

export function ResponsiveNavigation({
  items,
  currentPath,
  onItemClick,
  className = '',
  logo,
  userMenu
}: ResponsiveNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
    } else {
      onItemClick?.(item);
      setMobileMenuOpen(false); // Close mobile menu on navigation
    }
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.active) return true;
    if (currentPath && item.href === currentPath) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = isItemActive(item);
    const IconComponent = item.icon;

    return (
      <div key={item.id} role="none">
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${level > 0 ? 'ml-4 pl-8' : ''}
            ${isActive 
              ? 'bg-blue-100 text-blue-900 font-medium' 
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-controls={hasChildren ? `nav-submenu-${item.id}` : undefined}
          aria-current={isActive ? 'page' : undefined}
          role={hasChildren ? 'button' : 'menuitem'}
        >
          <div className="flex items-center space-x-3">
            {IconComponent && (
              <IconComponent 
                className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                aria-hidden="true"
              />
            )}
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                aria-label={`${item.badge} notifications`}
              >
                {item.badge}
              </span>
            )}
          </div>
          
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" aria-hidden="true" />
              )}
            </div>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div 
            className="space-y-1 mt-1" 
            id={`nav-submenu-${item.id}`}
            role="menu"
            aria-label={`${item.label} submenu`}
          >
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden lg:block">
        <nav className="space-y-2" role="navigation" aria-label="Main navigation">
          {items.map(item => renderNavigationItem(item))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {logo && <div className="flex-shrink-0">{logo}</div>}
          
          <div className="flex items-center space-x-2">
            {userMenu && <div>{userMenu}</div>}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  {logo && <div>{logo}</div>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2"
                  >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close navigation menu</span>
                  </Button>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                    {items.map(item => renderNavigationItem(item))}
                  </nav>
                </div>

                {/* Mobile Menu Footer */}
                {userMenu && (
                  <div className="border-t border-gray-200 p-4">
                    {userMenu}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tablet Navigation - Collapsed sidebar */}
      <div className="hidden md:block lg:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {logo && <div className="flex-shrink-0">{logo}</div>}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </div>

        {/* Tablet Menu Overlay - reuse mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden lg:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  {logo && <div>{logo}</div>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2"
                  >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close navigation menu</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2" role="navigation" aria-label="Tablet navigation">
                    {items.map(item => renderNavigationItem(item))}
                  </nav>
                </div>

                {userMenu && (
                  <div className="border-t border-gray-200 p-4">
                    {userMenu}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Responsive breadcrumb component
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ResponsiveBreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick?: (item: BreadcrumbItem) => void;
  className?: string;
}

export function ResponsiveBreadcrumb({
  items,
  onItemClick,
  className = ''
}: ResponsiveBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      {/* Mobile: Show only last 2 items */}
      <div className="flex items-center space-x-1 md:hidden">
        {items.length > 2 && (
          <>
            <span className="text-gray-400">...</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </>
        )}
        {items.slice(-2).map((item, index, array) => {
          const isLast = index === array.length - 1;
          const IconComponent = item.icon;
          
          return (
            <React.Fragment key={index}>
              <div className="flex items-center space-x-1">
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {item.href && !isLast ? (
                  <button
                    onClick={() => onItemClick?.(item)}
                    className="text-blue-600 hover:text-blue-800 truncate max-w-[120px]"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={`truncate max-w-[120px] ${isLast ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                )}
              </div>
              {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Desktop: Show all items */}
      <div className="hidden md:flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const IconComponent = item.icon;
          
          return (
            <React.Fragment key={index}>
              <div className="flex items-center space-x-1">
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {item.href && !isLast ? (
                  <button
                    onClick={() => onItemClick?.(item)}
                    className="text-blue-600 hover:text-blue-800 truncate"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={`truncate ${isLast ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                )}
              </div>
              {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}