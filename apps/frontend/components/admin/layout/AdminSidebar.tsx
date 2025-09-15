"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, LogOut, ChevronLeft, ChevronRight, Star, Search, Keyboard } from 'lucide-react';
import { NavigationItem } from '../../../types/admin';
import { useAdminNavigation } from '../../../hooks/use-admin-navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  activeTab: string;
}

export function AdminSidebar({ isOpen, onClose, navigationItems, activeTab }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setActiveTab,
    toggleFavorite,
    getFavoriteItems,
    getRecentItems,
    navigationState
  } = useAdminNavigation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed');
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const handleNavClick = (itemId: string, itemPath?: string) => {
    try {
      // Update internal state for tracking
      setActiveTab(itemId);

      // Navigate to the actual route if path is provided
      if (itemPath && typeof itemPath === 'string' && itemPath.startsWith('/')) {
        router.push(itemPath);
      } else {
        console.error('Invalid navigation path for item:', itemId, 'path:', itemPath);
        // Fallback to dashboard if path is invalid
        router.push('/admin');
      }

      // Close mobile sidebar
      onClose();
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.push('/admin');
      onClose();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const filteredItems = navigationItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteItems = getFavoriteItems();
  const recentItems = getRecentItems();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          <div className="relative flex w-64 flex-col bg-white h-full shadow-xl">
            <SidebarContent 
              navigationItems={filteredItems}
              activeTab={activeTab}
              onNavClick={handleNavClick}
              onLogout={handleLogout}
              showCloseButton={true}
              onClose={onClose}
              isCollapsed={false}
              onToggleCollapse={toggleCollapse}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              favoriteItems={favoriteItems}
              recentItems={recentItems}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <SidebarContent 
            navigationItems={filteredItems}
            activeTab={activeTab}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
            showCloseButton={false}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            favoriteItems={favoriteItems}
            recentItems={recentItems}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </div>
    </>
  );
}

interface SidebarContentProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  onNavClick: (itemId: string, itemPath?: string) => void;
  onLogout: () => void;
  showCloseButton: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoriteItems: NavigationItem[];
  recentItems: NavigationItem[];
  onToggleFavorite: (itemId: string) => void;
}

function SidebarContent({ 
  navigationItems, 
  activeTab, 
  onNavClick, 
  onLogout, 
  showCloseButton, 
  onClose,
  isCollapsed,
  onToggleCollapse,
  searchQuery,
  onSearchChange,
  favoriteItems,
  recentItems,
  onToggleFavorite
}: SidebarContentProps) {
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(-1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        onToggleCollapse();
      }
      
      if (e.key === 'ArrowDown' && keyboardNavIndex < navigationItems.length - 1) {
        e.preventDefault();
        setKeyboardNavIndex(prev => prev + 1);
      }
      
      if (e.key === 'ArrowUp' && keyboardNavIndex > 0) {
        e.preventDefault();
        setKeyboardNavIndex(prev => prev - 1);
      }
      
      if (e.key === 'Enter' && keyboardNavIndex >= 0) {
        e.preventDefault();
        const item = navigationItems[keyboardNavIndex];
        onNavClick(item.id, item.path || '/admin');
      }
      
      if (e.key === 'Escape') {
        setKeyboardNavIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavIndex, navigationItems, onNavClick, onToggleCollapse]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        )}
        
        <div className="flex items-center space-x-2">
          {/* Collapse toggle - Desktop only */}
          {!showCloseButton && (
            <button 
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              title={isCollapsed ? 'Expand sidebar (Alt+N)' : 'Collapse sidebar (Alt+N)'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
          
          {/* Close button - Mobile only */}
          {showCloseButton && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {!isCollapsed && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      
      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && searchQuery && (
          <div className="text-xs text-gray-500 mb-2">
            {navigationItems.length} result{navigationItems.length !== 1 ? 's' : ''}
          </div>
        )}
        
        {navigationItems.map((item, index) => (
          <NavigationItemComponent
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => onNavClick(item.id, item.path)}
            onToggleFavorite={onToggleFavorite}
            isCollapsed={isCollapsed}
            isCompact={false}
            isFavorite={favoriteItems.some(fav => fav.id === item.id)}
            isKeyboardFocused={keyboardNavIndex === index}
          />
        ))}
        
        {navigationItems.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No navigation items found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}
      </nav>

      {/* Keyboard shortcuts hint */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex items-center text-xs text-gray-500">
            <Keyboard className="h-3 w-3 mr-1" />
            <span>Alt+N to toggle sidebar</span>
          </div>
        </div>
      )}
      
      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Logout'}
        </button>
      </div>
    </>
  );
}

// Enhanced Navigation Item Component
interface NavigationItemComponentProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: (itemId: string) => void;
  isCollapsed: boolean;
  isCompact: boolean;
  isFavorite: boolean;
  isKeyboardFocused?: boolean;
}

function NavigationItemComponent({
  item,
  isActive,
  onClick,
  onToggleFavorite,
  isCollapsed,
  isCompact,
  isFavorite,
  isKeyboardFocused = false
}: NavigationItemComponentProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${
          isKeyboardFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        } ${
          isCompact ? 'py-1.5 text-xs' : ''
        } ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title={isCollapsed ? item.name : ''}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${
          isCollapsed ? '' : 'mr-3'
        } ${
          isCompact ? 'h-4 w-4' : ''
        }`} />
        
        {!isCollapsed && (
          <>
            <span className="truncate flex-1 text-left">{item.name}</span>
            
            {/* Badge */}
            {item.badge && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                item.badge.variant === 'error' ? 'bg-red-100 text-red-800' :
                item.badge.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {item.badge.count}
              </span>
            )}
          </>
        )}
      </button>

      {/* Favorite toggle */}
      {!isCollapsed && !isCompact && (
        <button
          onClick={handleFavoriteClick}
          className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isFavorite ? 'text-yellow-500 opacity-100' : 'text-gray-400 hover:text-yellow-500'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {item.name}
          {item.badge && (
            <span className="ml-2 bg-white text-gray-900 px-1 rounded">
              {item.badge.count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}