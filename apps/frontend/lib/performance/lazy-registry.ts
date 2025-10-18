/**
 * Lazy Loading Registry
 * Central registry for managing all lazy-loaded components with intelligent preloading
 */

import { ComponentType } from 'react';

// =============================================================================
// LAZY LOADING REGISTRY
// =============================================================================

interface LazyComponentConfig {
  component: () => Promise<{ default: ComponentType<any> }>;
  preloadConditions?: string[];
  priority: 'high' | 'medium' | 'low';
  chunkName?: string;
  dependencies?: string[];
}

class LazyLoadingRegistry {
  private components = new Map<string, LazyComponentConfig>();
  private loadedComponents = new Set<string>();
  private preloadQueue = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  /**
   * Register a lazy component
   */
  register(name: string, config: LazyComponentConfig): void {
    this.components.set(name, config);
  }

  /**
   * Get a lazy component by name
   */
  get(name: string): (() => Promise<{ default: ComponentType<any> }>) | null {
    const config = this.components.get(name);
    if (!config) return null;

    return config.component;
  }

  /**
   * Preload a component
   */
  async preload(name: string): Promise<void> {
    if (this.loadedComponents.has(name) || this.preloadQueue.has(name)) {
      return;
    }

    const config = this.components.get(name);
    if (!config) return;

    this.preloadQueue.add(name);

    try {
      // Preload dependencies first
      if (config.dependencies) {
        await Promise.all(
          config.dependencies.map(dep => this.preload(dep))
        );
      }

      // Cache the loading promise to avoid duplicate requests
      if (!this.loadingPromises.has(name)) {
        this.loadingPromises.set(name, config.component());
      }

      await this.loadingPromises.get(name);
      this.loadedComponents.add(name);
    } catch (error) {
      console.warn(`Failed to preload component ${name}:`, error);
    } finally {
      this.preloadQueue.delete(name);
      this.loadingPromises.delete(name);
    }
  }

  /**
   * Preload components based on route or conditions
   */
  async preloadByCondition(condition: string): Promise<void> {
    const componentsToPreload = Array.from(this.components.entries())
      .filter(([_, config]) => 
        config.preloadConditions?.includes(condition)
      )
      .sort(([_, a], [__, b]) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    // Preload high priority components first
    const highPriority = componentsToPreload.filter(([_, config]) => config.priority === 'high');
    await Promise.all(highPriority.map(([name]) => this.preload(name)));

    // Then medium priority
    const mediumPriority = componentsToPreload.filter(([_, config]) => config.priority === 'medium');
    await Promise.all(mediumPriority.map(([name]) => this.preload(name)));

    // Finally low priority (don't await these)
    const lowPriority = componentsToPreload.filter(([_, config]) => config.priority === 'low');
    lowPriority.forEach(([name]) => this.preload(name));
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      total: this.components.size,
      loaded: this.loadedComponents.size,
      preloading: this.preloadQueue.size,
      loadingRate: this.loadedComponents.size / this.components.size
    };
  }

  /**
   * Clear all caches (useful for development)
   */
  clear(): void {
    this.loadedComponents.clear();
    this.preloadQueue.clear();
    this.loadingPromises.clear();
  }
}

// Global registry instance
export const lazyRegistry = new LazyLoadingRegistry();

// =============================================================================
// COMPONENT REGISTRATIONS
// =============================================================================

// Admin Components
lazyRegistry.register('admin-dashboard', {
  component: () => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })),
  preloadConditions: ['admin-route', 'admin-login'],
  priority: 'high',
  chunkName: 'admin-dashboard'
});

lazyRegistry.register('user-management', {
  component: () => Promise.resolve({ default: () => null }),
  preloadConditions: ['admin-route', 'admin-users'],
  priority: 'medium',
  chunkName: 'admin-users'
});

lazyRegistry.register('subscription-management', {
  component: () => Promise.resolve({ default: () => null }),
  preloadConditions: ['admin-route', 'admin-subscriptions'],
  priority: 'medium',
  chunkName: 'admin-subscriptions'
});

lazyRegistry.register('enhanced-analytics', {
  component: () => import('@/components/admin/EnhancedAnalytics'),
  preloadConditions: ['admin-route', 'admin-analytics'],
  priority: 'low',
  dependencies: ['recharts-components'],
  chunkName: 'admin-analytics'
});

// Customer Components
lazyRegistry.register('customer-dashboard', {
  component: () => Promise.resolve({ default: () => null }),
  preloadConditions: ['customer-route', 'customer-login'],
  priority: 'high',
  chunkName: 'customer-dashboard'
});

lazyRegistry.register('booking-form', {
  component: () => Promise.resolve({ default: () => null }),
  preloadConditions: ['customer-route', 'booking-intent'],
  priority: 'high',
  chunkName: 'customer-booking'
});

lazyRegistry.register('service-request-form', {
  component: () => import('@/components/customer/services/ServiceRequestForm'),
  preloadConditions: ['customer-route', 'service-intent'],
  priority: 'medium',
  chunkName: 'customer-services'
});

// Heavy Library Components
lazyRegistry.register('recharts-components', {
  component: () => Promise.resolve({ default: () => null }),
  preloadConditions: ['analytics-view', 'dashboard-charts'],
  priority: 'low',
  chunkName: 'recharts'
});

lazyRegistry.register('rich-text-editor', {
  component: () => import('react-quill').then(m => ({ default: m.default })),
  preloadConditions: ['form-editing', 'content-creation'],
  priority: 'low',
  chunkName: 'rich-text-editor'
});

// =============================================================================
// PRELOADING STRATEGIES
// =============================================================================

export class PreloadingStrategy {
  /**
   * Preload components on route change
   */
  static async onRouteChange(pathname: string): Promise<void> {
    if (pathname.startsWith('/admin')) {
      await lazyRegistry.preloadByCondition('admin-route');
      
      // Specific admin routes
      if (pathname.includes('/users')) {
        await lazyRegistry.preload('user-management');
      } else if (pathname.includes('/subscriptions')) {
        await lazyRegistry.preload('subscription-management');
      } else if (pathname.includes('/analytics')) {
        await lazyRegistry.preload('enhanced-analytics');
      }
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/customer-dashboard')) {
      await lazyRegistry.preloadByCondition('customer-route');
    } else if (pathname.includes('/book-appointment')) {
      await lazyRegistry.preload('booking-form');
    }
  }

  /**
   * Preload components on user interaction
   */
  static async onUserInteraction(interaction: string): Promise<void> {
    switch (interaction) {
      case 'hover-booking-button':
        await lazyRegistry.preload('booking-form');
        break;
      case 'hover-analytics-tab':
        await lazyRegistry.preload('enhanced-analytics');
        break;
      case 'focus-rich-text-field':
        await lazyRegistry.preload('rich-text-editor');
        break;
    }
  }

  /**
   * Preload components on idle time
   */
  static async onIdle(): Promise<void> {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        lazyRegistry.preloadByCondition('low-priority');
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        lazyRegistry.preloadByCondition('low-priority');
      }, 2000);
    }
  }

  /**
   * Preload based on network conditions
   */
  static async onNetworkChange(): Promise<void> {
    const connection = (navigator as any).connection;
    if (!connection) return;

    // Only preload on fast connections
    if (connection.effectiveType === '4g' && !connection.saveData) {
      await lazyRegistry.preloadByCondition('low-priority');
    }
  }
}

// =============================================================================
// HOOKS FOR LAZY LOADING
// =============================================================================

export function useLazyComponent(name: string) {
  const componentLoader = lazyRegistry.get(name);
  
  return {
    loader: componentLoader,
    preload: () => lazyRegistry.preload(name),
    isLoaded: lazyRegistry['loadedComponents'].has(name)
  };
}

export function useLazyPreloading() {
  return {
    preloadByRoute: PreloadingStrategy.onRouteChange,
    preloadByInteraction: PreloadingStrategy.onUserInteraction,
    preloadOnIdle: PreloadingStrategy.onIdle,
    stats: lazyRegistry.getStats()
  };
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export class LazyLoadingMonitor {
  private static metrics = {
    loadTimes: new Map<string, number>(),
    errorCounts: new Map<string, number>(),
    successCounts: new Map<string, number>()
  };

  static trackLoadStart(componentName: string): number {
    return performance.now();
  }

  static trackLoadEnd(componentName: string, startTime: number, success: boolean): void {
    const loadTime = performance.now() - startTime;
    
    this.metrics.loadTimes.set(componentName, loadTime);
    
    if (success) {
      const current = this.metrics.successCounts.get(componentName) || 0;
      this.metrics.successCounts.set(componentName, current + 1);
    } else {
      const current = this.metrics.errorCounts.get(componentName) || 0;
      this.metrics.errorCounts.set(componentName, current + 1);
    }

    // Report to performance monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lazy_component_load', {
        component_name: componentName,
        load_time: loadTime,
        success: success
      });
    }
  }

  static getMetrics() {
    return {
      loadTimes: Object.fromEntries(this.metrics.loadTimes),
      errorCounts: Object.fromEntries(this.metrics.errorCounts),
      successCounts: Object.fromEntries(this.metrics.successCounts)
    };
  }
}