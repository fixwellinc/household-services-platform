'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useGestureSupport } from '@/hooks/use-gesture-support';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useDashboardTransitions } from '@/components/dashboard/DashboardTransitions';
import { 
  Menu, 
  X, 
  Home, 
  Wrench, 
  Info, 
  MessageCircle,
  DollarSign,
  Gift,
  ChevronRight,
  User,
  Settings,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
  className?: string;
}

const defaultNavigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: '/services',
    label: 'Services',
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    href: '/pricing',
    label: 'Plans',
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    href: '/members-discount',
    label: 'Members Discount',
    icon: <Gift className="h-5 w-5" />,
    badge: 'New',
  },
  {
    href: '/about',
    label: 'About',
    icon: <Info className="h-5 w-5" />,
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: <MessageCircle className="h-5 w-5" />,
  },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onToggle,
  onClose,
  user,
  onLogout,
  className,
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  
  // Enhanced routing hooks
  const dashboardRouting = useDashboardRouting();
  const { navigateWithTransition, canNavigate } = useDashboardTransitions();

  // Handle swipe to close gesture
  const { gestureHandlers } = useGestureSupport({
    onSwipeLeft: () => {
      if (isOpen) {
        onClose();
      }
    },
    swipeThreshold: 100,
  });

  // Handle escape key and outside clicks
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        backdropRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Animation handling
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleItemClick = (onClick?: () => void) => {
    onClick?.();
    onClose();
  };

  // Enhanced dashboard navigation with loading states
  const handleDashboardNavigation = async () => {
    if (!canNavigate || dashboardRouting.isLoading) return;
    
    try {
      const dashboardUrl = dashboardRouting.getDashboardUrl();
      await navigateWithTransition(dashboardUrl, true);
      onClose();
    } catch (error) {
      console.error('Dashboard navigation failed:', error);
      // Fallback to direct navigation
      const fallbackUrl = user?.role === 'ADMIN' ? '/admin' : 
                         dashboardRouting.shouldRedirectToCustomerDashboard ? '/customer-dashboard' : '/dashboard';
      window.location.href = fallbackUrl;
    }
  };

  // Get dashboard label with loading state
  const getDashboardLabel = () => {
    if (dashboardRouting.isLoading || !canNavigate) {
      return 'Dashboard...';
    }
    
    if (user?.role === 'ADMIN') {
      return 'Admin Dashboard';
    }
    
    return dashboardRouting.shouldRedirectToCustomerDashboard ? 'Customer Dashboard' : 'Dashboard';
  };

  const MenuToggleButton = () => (
    <TouchOptimizedButton
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden relative z-50"
      touchFeedback="medium"
      hapticFeedback={true}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="relative w-6 h-6">
        <Menu 
          className={cn(
            'absolute inset-0 h-6 w-6 transition-all duration-300',
            isOpen ? 'opacity-0 rotate-180 scale-75' : 'opacity-100 rotate-0 scale-100'
          )} 
        />
        <X 
          className={cn(
            'absolute inset-0 h-6 w-6 transition-all duration-300',
            isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-75'
          )} 
        />
      </div>
    </TouchOptimizedButton>
  );

  const NavigationMenu = () => (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        {...gestureHandlers}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Menu
          </h2>
          <TouchOptimizedButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            touchFeedback="medium"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </TouchOptimizedButton>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {defaultNavigationItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleItemClick(item.onClick)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group',
                  'min-h-[48px] touch-manipulation', // Touch-friendly height
                  `animate-slide-in-from-right`,
                  `animation-delay-${index * 50}ms`
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </Link>
            ))}

            {/* User-specific items */}
            {user && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <button
                  onClick={handleDashboardNavigation}
                  disabled={dashboardRouting.isLoading || !canNavigate}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group min-h-[48px] touch-manipulation w-full text-left",
                    (dashboardRouting.isLoading || !canNavigate) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="font-medium">{getDashboardLabel()}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>

                <Link
                  href="/profile"
                  onClick={() => handleItemClick()}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group min-h-[48px] touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="font-medium">Profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </Link>

                <Link
                  href="/settings"
                  onClick={() => handleItemClick()}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group min-h-[48px] touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="font-medium">Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {user ? (
            <TouchOptimizedButton
              variant="outline"
              size="lg"
              onClick={() => handleItemClick(onLogout)}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              icon={<LogOut className="h-5 w-5" />}
              touchFeedback="medium"
            >
              Sign Out
            </TouchOptimizedButton>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => handleItemClick()}>
                <TouchOptimizedButton
                  variant="outline"
                  size="lg"
                  className="w-full justify-center"
                  touchFeedback="medium"
                >
                  Sign In
                </TouchOptimizedButton>
              </Link>
              <Link href="/register" onClick={() => handleItemClick()}>
                <TouchOptimizedButton
                  variant="default"
                  size="lg"
                  className="w-full justify-center"
                  touchFeedback="medium"
                >
                  Get Started
                </TouchOptimizedButton>
              </Link>
            </div>
          )}
        </div>

        {/* Swipe indicator */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30" />
      </div>
    </>
  );

  return (
    <div className={cn('relative', className)}>
      <MenuToggleButton />
      {(isOpen || isAnimating) && <NavigationMenu />}
    </div>
  );
};

export default MobileNavigation;