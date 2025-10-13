"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  BarChart3,
  Users,
  UserCheck,
  DollarSign,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  FileText,
  Activity,
  Shield,
  Calendar,
  BookOpen,
  Wand2
} from 'lucide-react';
import { NavigationItem, NavigationState, AdminPreferences } from '../types/admin';

const defaultNavigationItems: NavigationItem[] = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: Home,
    path: '/admin'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics'
  },
  {
    id: 'appointments',
    name: 'Appointments',
    icon: Calendar,
    path: '/admin/appointments'
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    path: '/admin/users',
    badge: { count: 5, variant: 'info' }
  },
  {
    id: 'salesmen',
    name: 'Salesmen',
    icon: UserCheck,
    path: '/admin/salesmen'
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: DollarSign,
    path: '/admin/subscriptions'
  },
  {
    id: 'communications',
    name: 'Communications',
    icon: MessageSquare,
    path: '/admin/communications',
    badge: { count: 23, variant: 'warning' }
  },
  { 
    id: 'audit', 
    name: 'Audit Logs', 
    icon: Shield,
    path: '/admin/audit'
  },
  { 
    id: 'reports', 
    name: 'Reports', 
    icon: FileText,
    path: '/admin/reports'
  },
  { 
    id: 'monitoring', 
    name: 'System Health', 
    icon: Activity,
    path: '/admin/monitoring'
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: Settings,
    path: '/admin/settings'
  },
  { 
    id: 'api-docs', 
    name: 'API Documentation', 
    icon: BookOpen,
    path: '/admin/api-docs'
  },
  { 
    id: 'logo-generator', 
    name: 'Logo Generator', 
    icon: Wand2,
    path: '/admin/logo-generator'
  }
];

export function useAdminNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeItem: 'dashboard',
    expandedItems: [],
    favoriteItems: [],
    recentItems: []
  });

  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems);
  const [preferences, setPreferences] = useState<AdminPreferences>({
    theme: 'light',
    sidebarCollapsed: false,
    defaultFilters: {},
    notificationSettings: {
      email: true,
      push: true,
      sms: false,
      desktop: true,
      frequency: 'immediate'
    }
  });

  const navigationStateRef = useRef(navigationState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Update ref when state changes
  useEffect(() => {
    navigationStateRef.current = navigationState;
  }, [navigationState]);

  // Debounced save function
  const debouncedSave = useCallback((state: NavigationState) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('admin_navigation_state', JSON.stringify(state));
    }, 300);
  }, []);

  // Load navigation state and preferences from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('admin_navigation_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setNavigationState(prev => ({ ...prev, ...parsed }));
      }

      const savedPreferences = localStorage.getItem('admin_preferences');
      if (savedPreferences) {
        const parsedPrefs = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsedPrefs }));
      }
    } catch (error) {
      console.error('Failed to parse saved navigation data:', error);
    }
  }, []);

  // Save navigation state to localStorage with debouncing
  useEffect(() => {
    debouncedSave(navigationState);
  }, [navigationState, debouncedSave]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('admin_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Enhanced navigation functions with analytics and validation
  const setActiveTab = useCallback((tabId: string, source: 'click' | 'keyboard' | 'url' = 'click') => {
    const item = navigationItems.find(item => item.id === tabId);
    if (!item) {
      console.warn(`Navigation item with id "${tabId}" not found`);
      return;
    }

    setNavigationState(prev => {
      const newRecentItems = [tabId, ...prev.recentItems.filter(id => id !== tabId)].slice(0, 5);
      
      // Track navigation analytics
      trackNavigationEvent('navigate', {
        from: prev.activeItem,
        to: tabId,
        source,
        timestamp: new Date().toISOString()
      });

      return {
        ...prev,
        activeItem: tabId,
        recentItems: newRecentItems
      };
    });
  }, [navigationItems]);

  const toggleExpanded = useCallback((itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId]
    }));
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const isFavorite = prev.favoriteItems.includes(itemId);
      const newFavorites = isFavorite
        ? prev.favoriteItems.filter(id => id !== itemId)
        : [...prev.favoriteItems, itemId].slice(0, 10); // Limit to 10 favorites

      // Track favorite analytics
      trackNavigationEvent(isFavorite ? 'unfavorite' : 'favorite', {
        itemId,
        timestamp: new Date().toISOString()
      });

      return {
        ...prev,
        favoriteItems: newFavorites
      };
    });
  }, []);

  const updateBadge = useCallback((itemId: string, badge: NavigationItem['badge']) => {
    setNavigationItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, badge } : item
      )
    );
  }, []);

  const clearRecentItems = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      recentItems: []
    }));
  }, []);

  const clearFavorites = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      favoriteItems: []
    }));
  }, []);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setNavigationState(prev => {
      const newFavorites = [...prev.favoriteItems];
      const [removed] = newFavorites.splice(fromIndex, 1);
      newFavorites.splice(toIndex, 0, removed);
      return {
        ...prev,
        favoriteItems: newFavorites
      };
    });
  }, []);

  // Keyboard navigation support
  const navigateWithKeyboard = useCallback((direction: 'up' | 'down' | 'home' | 'end') => {
    const currentIndex = navigationItems.findIndex(item => item.id === navigationState.activeItem);
    let newIndex = currentIndex;

    switch (direction) {
      case 'up':
        newIndex = currentIndex > 0 ? currentIndex - 1 : navigationItems.length - 1;
        break;
      case 'down':
        newIndex = currentIndex < navigationItems.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'home':
        newIndex = 0;
        break;
      case 'end':
        newIndex = navigationItems.length - 1;
        break;
    }

    if (newIndex !== currentIndex && navigationItems[newIndex]) {
      setActiveTab(navigationItems[newIndex].id, 'keyboard');
    }
  }, [navigationItems, navigationState.activeItem, setActiveTab]);

  // Accessibility helpers
  const getNavigationAnnouncement = useCallback((itemId: string) => {
    const item = navigationItems.find(item => item.id === itemId);
    if (!item) return '';

    const parts = [item.name];
    
    if (item.badge) {
      parts.push(`${item.badge.count} ${item.badge.variant} items`);
    }
    
    if (navigationState.favoriteItems.includes(itemId)) {
      parts.push('favorited');
    }
    
    return parts.join(', ');
  }, [navigationItems, navigationState.favoriteItems]);

  // Analytics tracking
  const trackNavigationEvent = useCallback((event: string, data: any) => {
    // Store navigation analytics for insights
    const analytics = JSON.parse(localStorage.getItem('admin_navigation_analytics') || '[]');
    analytics.push({
      event,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 events
    const recentAnalytics = analytics.slice(-100);
    localStorage.setItem('admin_navigation_analytics', JSON.stringify(recentAnalytics));
  }, []);

  // Preference management
  const updatePreferences = useCallback((updates: Partial<AdminPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Getters with memoization
  const getActiveItem = useCallback(() => {
    return navigationItems.find(item => item.id === navigationState.activeItem);
  }, [navigationItems, navigationState.activeItem]);

  const getFavoriteItems = useCallback(() => {
    return navigationState.favoriteItems
      .map(id => navigationItems.find(item => item.id === id))
      .filter(Boolean) as NavigationItem[];
  }, [navigationItems, navigationState.favoriteItems]);

  const getRecentItems = useCallback(() => {
    return navigationState.recentItems
      .map(id => navigationItems.find(item => item.id === id))
      .filter(Boolean) as NavigationItem[];
  }, [navigationItems, navigationState.recentItems]);

  const getNavigationStats = useCallback(() => {
    const analytics = JSON.parse(localStorage.getItem('admin_navigation_analytics') || '[]');
    const recentAnalytics = analytics.filter((event: any) => 
      new Date(event.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    const navigationCounts = recentAnalytics
      .filter((event: any) => event.event === 'navigate')
      .reduce((acc: any, event: any) => {
        const itemId = event.data.to;
        acc[itemId] = (acc[itemId] || 0) + 1;
        return acc;
      }, {});

    return {
      totalNavigations: recentAnalytics.filter((event: any) => event.event === 'navigate').length,
      favoriteCount: navigationState.favoriteItems.length,
      recentCount: navigationState.recentItems.length,
      mostUsed: Object.entries(navigationCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([itemId, count]) => ({
          item: navigationItems.find(item => item.id === itemId),
          count
        }))
        .filter(item => item.item)
    };
  }, [navigationItems, navigationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    navigationItems,
    navigationState,
    preferences,
    activeTab: navigationState.activeItem,
    
    // Navigation actions
    setActiveTab,
    toggleExpanded,
    toggleFavorite,
    updateBadge,
    clearRecentItems,
    clearFavorites,
    reorderFavorites,
    
    // Keyboard navigation
    navigateWithKeyboard,
    
    // Accessibility
    getNavigationAnnouncement,
    
    // Preferences
    updatePreferences,
    
    // Getters
    getActiveItem,
    getFavoriteItems,
    getRecentItems,
    getNavigationStats,
    
    // Analytics
    trackNavigationEvent
  };
}