'use client';

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Shield, 
  Settings, 
  Bell, 
  BarChart3, 
  CreditCard,
  Gift,
  Zap,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/shared';
import { cn } from '@/lib/utils';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useDashboardTransitions } from '@/components/dashboard/DashboardTransitions';

interface MobileNavigationProps {
  isConnected?: boolean;
  notificationCount?: number;
  userTier?: string;
  onLogout?: () => void;
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  external?: boolean;
}

export default function MobileNavigation({ 
  isConnected = false, 
  notificationCount = 0,
  userTier = 'STARTER',
  onLogout 
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dashboardRouting = useDashboardRouting();
  const { navigateWithTransition, canNavigate } = useDashboardTransitions();

  // Get dynamic dashboard URL from routing hook
  const dashboardUrl = dashboardRouting.getDashboardUrl();
  const isDashboardLoading = dashboardRouting.isLoading || !canNavigate;

  const navigationItems: NavigationItem[] = [
    {
      label: isDashboardLoading ? 'Dashboard...' : 'Dashboard',
      href: dashboardUrl,
      icon: BarChart3,
    },
    {
      label: 'Services',
      href: '/services',
      icon: Zap,
    },
    {
      label: 'Perks & Benefits',
      href: `${dashboardUrl}#perks`,
      icon: Gift,
    },
    {
      label: 'Billing',
      href: '/billing',
      icon: CreditCard,
    },
    {
      label: 'Notifications',
      href: `${dashboardUrl}#notifications`,
      icon: Bell,
      badge: notificationCount > 0 ? notificationCount : undefined,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle dashboard navigation with enhanced routing
  const handleDashboardNavigation = async (item: NavigationItem) => {
    if (item.label.includes('Dashboard') && !isDashboardLoading) {
      try {
        await navigateWithTransition(dashboardUrl, true);
        closeMenu();
      } catch (error) {
        console.error('Dashboard navigation failed:', error);
        // Fallback to direct navigation
        window.location.href = dashboardUrl;
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PRIORITY':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'HOMECARE':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'STARTER':
      default:
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Customer Portal</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs px-2 py-1",
                isConnected 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mr-1",
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              )} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>

            {/* Tier Badge */}
            <Badge className={cn("text-xs px-2 py-1 border-0", getTierColor(userTier))}>
              {userTier}
            </Badge>

            {/* Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMenu}>
          <div 
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Customer Portal</h2>
                    <p className="text-sm opacity-90">{userTier} Plan</p>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Connection Status in Menu */}
              <div className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? 'bg-green-400' : 'bg-gray-300'
                )} />
                <span className="opacity-90">
                  {isConnected ? 'Real-time updates active' : 'Offline mode'}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 py-6">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isDashboard = item.label.includes('Dashboard');
                  const isDisabled = isDashboard && isDashboardLoading;
                  
                  return (
                    <li key={item.href}>
                      {isDashboard ? (
                        <button
                          onClick={() => handleDashboardNavigation(item)}
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group w-full text-left",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                        >
                          <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Menu Footer */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => {
                  closeMenu();
                  onLogout?.();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}