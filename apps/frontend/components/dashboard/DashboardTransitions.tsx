'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Home,
  User,
  Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/shared';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';

// Animation variants for different transition types
const transitionVariants = {
  // Fade transition
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Slide transition
  slide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  },
  
  // Scale transition
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.05, opacity: 0 }
  },
  
  // Slide up transition
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  }
};

// Transition timing configuration
const transitionConfig = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1] as const, // Custom easing curve
  reducedMotion: {
    duration: 0.1,
    ease: 'linear' as const
  }
};

interface DashboardTransitionWrapperProps {
  children: React.ReactNode;
  transitionKey: string;
  variant?: keyof typeof transitionVariants;
  className?: string;
}

/**
 * Wrapper component that provides smooth transitions between dashboard states
 */
export function DashboardTransitionWrapper({
  children,
  transitionKey,
  variant = 'fade',
  className = ''
}: DashboardTransitionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = transitionVariants[variant];
  
  const animationConfig = shouldReduceMotion 
    ? { duration: transitionConfig.reducedMotion.duration, ease: transitionConfig.reducedMotion.ease }
    : { duration: transitionConfig.duration, ease: transitionConfig.ease };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={animationConfig}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface RouteTransitionIndicatorProps {
  isTransitioning: boolean;
  fromRoute?: string;
  toRoute?: string;
  message?: string;
}

/**
 * Loading indicator shown during dashboard route transitions
 */
export function RouteTransitionIndicator({
  isTransitioning,
  fromRoute,
  toRoute,
  message
}: RouteTransitionIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Simulate progress during transition
  useEffect(() => {
    if (isTransitioning) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  if (!isTransitioning && progress === 0) return null;

  const getRouteLabel = (route?: string) => {
    if (!route) return '';
    switch (route) {
      case '/admin': return 'Admin Dashboard';
      case '/customer-dashboard': return 'Customer Dashboard';
      case '/dashboard': return 'Dashboard';
      default: return route.replace('/', '').replace('-', ' ');
    }
  };

  return (
    <AnimatePresence>
      {(isTransitioning || progress > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <div className="text-sm">
                  {message || (
                    fromRoute && toRoute 
                      ? `Navigating from ${getRouteLabel(fromRoute)} to ${getRouteLabel(toRoute)}`
                      : 'Loading dashboard...'
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(progress)}%
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <motion.div
                className="bg-blue-600 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SubscriptionStatusTransitionProps {
  children: React.ReactNode;
  subscriptionStatus: any;
  className?: string;
}

/**
 * Handles smooth transitions when subscription status changes
 */
export function SubscriptionStatusTransition({
  children,
  subscriptionStatus,
  className = ''
}: SubscriptionStatusTransitionProps) {
  const [previousStatus, setPreviousStatus] = useState(subscriptionStatus?.currentStatus);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (subscriptionStatus?.currentStatus && 
        subscriptionStatus.currentStatus !== previousStatus &&
        previousStatus !== undefined) {
      
      setIsTransitioning(true);
      
      // Show transition for a brief moment
      const timeout = setTimeout(() => {
        setPreviousStatus(subscriptionStatus.currentStatus);
        setIsTransitioning(false);
      }, shouldReduceMotion ? 100 : 500);

      return () => clearTimeout(timeout);
    } else if (subscriptionStatus?.currentStatus && previousStatus === undefined) {
      setPreviousStatus(subscriptionStatus.currentStatus);
    }
  }, [subscriptionStatus?.currentStatus, previousStatus, shouldReduceMotion]);

  const getStatusChangeMessage = (from: string, to: string) => {
    if (from === 'NONE' && to === 'ACTIVE') return 'Welcome! Your subscription is now active.';
    if (from === 'ACTIVE' && to === 'PAST_DUE') return 'Payment required to continue service.';
    if (from === 'PAST_DUE' && to === 'ACTIVE') return 'Great! Your subscription is active again.';
    if (from === 'ACTIVE' && to === 'CANCELLED') return 'Your subscription has been cancelled.';
    if (from === 'CANCELLED' && to === 'ACTIVE') return 'Welcome back! Your subscription is reactivated.';
    return 'Your subscription status has been updated.';
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="status-transition"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: shouldReduceMotion ? 0.1 : 0.2 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Status Updated
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {getStatusChangeMessage(previousStatus, subscriptionStatus?.currentStatus)}
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating dashboard...</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <DashboardTransitionWrapper
        transitionKey={subscriptionStatus?.currentStatus || 'loading'}
        variant="slideUp"
      >
        {children}
      </DashboardTransitionWrapper>
    </div>
  );
}

interface NavigationTransitionProps {
  children: React.ReactNode;
  isNavigating: boolean;
  destination?: string;
}

/**
 * Smooth transition overlay during navigation
 */
export function NavigationTransition({
  children,
  isNavigating,
  destination
}: NavigationTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative">
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="navigation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
            className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: shouldReduceMotion ? 0 : 1, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
              />
              <p className="text-gray-600">
                {destination ? `Navigating to ${destination}...` : 'Navigating...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        animate={{ 
          filter: isNavigating ? 'blur(2px)' : 'blur(0px)',
          pointerEvents: isNavigating ? 'none' : 'auto'
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface DashboardStateIndicatorProps {
  state: 'loading' | 'ready' | 'error' | 'transitioning';
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Visual indicator for different dashboard states
 */
export function DashboardStateIndicator({
  state,
  message,
  onRetry,
  className = ''
}: DashboardStateIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  const stateConfig = {
    loading: {
      icon: Loader2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      animate: true,
      defaultMessage: 'Loading dashboard...'
    },
    ready: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      animate: false,
      defaultMessage: 'Dashboard ready'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      animate: false,
      defaultMessage: 'Error loading dashboard'
    },
    transitioning: {
      icon: ArrowRight,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      animate: true,
      defaultMessage: 'Updating dashboard...'
    }
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full ${config.bgColor} ${config.color} ${className}`}
    >
      <Icon 
        className={`h-4 w-4 ${config.animate && !shouldReduceMotion ? 'animate-spin' : ''}`} 
      />
      <span className="text-sm font-medium">
        {message || config.defaultMessage}
      </span>
      
      {state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
          aria-label="Retry"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}

/**
 * Hook for managing dashboard transition states
 */
export function useDashboardTransitions(): {
  isTransitioning: boolean;
  transitionState: 'idle' | 'navigating' | 'updating';
  navigateWithTransition: (route: string, preserveParams?: boolean) => Promise<void>;
  dashboardState: 'loading' | 'ready' | 'error' | 'transitioning';
  canNavigate: boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const dashboardRouting = useDashboardRouting();
  const subscriptionStatus = useSubscriptionStatus();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionState, setTransitionState] = useState<'idle' | 'navigating' | 'updating'>('idle');
  const previousPathnameRef = useRef(pathname);

  // Track route changes
  useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      setIsTransitioning(true);
      setTransitionState('navigating');
      
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionState('idle');
        previousPathnameRef.current = pathname;
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  // Track subscription status changes
  useEffect(() => {
    if (subscriptionStatus.isLoading) {
      setTransitionState('updating');
    } else {
      setTransitionState('idle');
    }
  }, [subscriptionStatus.isLoading]);

  const navigateWithTransition = async (route: string, preserveParams = true) => {
    setIsTransitioning(true);
    setTransitionState('navigating');
    
    try {
      await dashboardRouting.navigateToRoute(route, preserveParams);
    } finally {
      // Transition will be cleared by the pathname effect
    }
  };

  const getDashboardState = (): 'loading' | 'ready' | 'error' | 'transitioning' => {
    if (dashboardRouting.isLoading || subscriptionStatus.isLoading) return 'loading';
    if (dashboardRouting.error || subscriptionStatus.error) return 'error';
    if (isTransitioning) return 'transitioning';
    return 'ready';
  };

  return {
    isTransitioning,
    transitionState,
    navigateWithTransition,
    dashboardState: getDashboardState(),
    canNavigate: !isTransitioning && !dashboardRouting.isLoading
  };
}

// Browser history management utilities
export class DashboardHistoryManager {
  private static instance: DashboardHistoryManager;
  private navigationStack: string[] = [];
  private currentIndex = -1;

  static getInstance(): DashboardHistoryManager {
    if (!DashboardHistoryManager.instance) {
      DashboardHistoryManager.instance = new DashboardHistoryManager();
    }
    return DashboardHistoryManager.instance;
  }

  pushRoute(route: string) {
    // Remove any routes after current index (when navigating from middle of stack)
    this.navigationStack = this.navigationStack.slice(0, this.currentIndex + 1);
    
    // Add new route
    this.navigationStack.push(route);
    this.currentIndex = this.navigationStack.length - 1;
    
    // Limit stack size
    if (this.navigationStack.length > 50) {
      this.navigationStack = this.navigationStack.slice(-25);
      this.currentIndex = this.navigationStack.length - 1;
    }
  }

  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentIndex < this.navigationStack.length - 1;
  }

  getPreviousRoute(): string | null {
    if (this.canGoBack()) {
      return this.navigationStack[this.currentIndex - 1];
    }
    return null;
  }

  getNextRoute(): string | null {
    if (this.canGoForward()) {
      return this.navigationStack[this.currentIndex + 1];
    }
    return null;
  }

  goBack(): string | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      return this.navigationStack[this.currentIndex];
    }
    return null;
  }

  goForward(): string | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      return this.navigationStack[this.currentIndex];
    }
    return null;
  }

  getCurrentRoute(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.navigationStack.length) {
      return this.navigationStack[this.currentIndex];
    }
    return null;
  }

  getNavigationHistory(): { stack: string[], currentIndex: number } {
    return {
      stack: [...this.navigationStack],
      currentIndex: this.currentIndex
    };
  }

  clear() {
    this.navigationStack = [];
    this.currentIndex = -1;
  }
}