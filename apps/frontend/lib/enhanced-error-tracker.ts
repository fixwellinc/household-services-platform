/**
 * Enhanced Error Tracking Service
 * 
 * Provides comprehensive error tracking with user context and analytics
 */

interface ErrorContext {
  userId?: string;
  userRole?: string;
  userTier?: string;
  sessionId: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  performance: {
    memoryUsage?: number;
    connectionType?: string;
    loadTime?: number;
  };
  customContext?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'network' | 'react' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  breadcrumbs: Array<{
    timestamp: Date;
    action: string;
    data?: any;
  }>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

class EnhancedErrorTracker {
  private sessionId: string;
  private breadcrumbs: Array<{ timestamp: Date; action: string; data?: any }> = [];
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = true;
  private userContext: Partial<ErrorContext> = {};

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize error tracking
   */
  private initializeTracking(): void {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Set up online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Set up page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.flushErrorQueue();
      }
    });

    // Set up beforeunload to flush errors
    window.addEventListener('beforeunload', () => {
      this.flushErrorQueue();
    });
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Only set up on client side
    if (typeof window === 'undefined') {
      return;
    }

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: 'high',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        type: 'javascript',
        severity: 'high',
        reason: event.reason,
      });
    });

    // Network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.trackError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            url: args[0] as string,
            status: response.status,
            statusText: response.statusText,
          });
        }
        
        return response;
      } catch (error) {
        this.trackError({
          message: error instanceof Error ? error.message : 'Network Error',
          stack: error instanceof Error ? error.stack : undefined,
          type: 'network',
          severity: 'high',
          url: args[0] as string,
        });
        throw error;
      }
    };
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Only set up on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.userContext.performance = {
          ...this.userContext.performance,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        };
      }, 30000); // Every 30 seconds
    }

    // Monitor connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.userContext.performance = {
        ...this.userContext.performance,
        connectionType: connection.effectiveType,
      };
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.userContext.performance = {
        ...this.userContext.performance,
        loadTime,
      };
    });
  }

  /**
   * Set user context
   */
  setUserContext(context: Partial<ErrorContext>): void {
    this.userContext = { ...this.userContext, ...context };
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(action: string, data?: any): void {
    this.breadcrumbs.push({
      timestamp: new Date(),
      action,
      data,
    });

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  /**
   * Track an error
   */
  trackError(error: {
    message: string;
    stack?: string;
    type: 'javascript' | 'network' | 'react' | 'custom';
    severity: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  }): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      type: error.type,
      severity: error.severity,
      context: this.buildErrorContext(),
      breadcrumbs: [...this.breadcrumbs],
      resolved: false,
    };

    // Add error-specific data
    Object.keys(error).forEach(key => {
      if (!['message', 'stack', 'type', 'severity'].includes(key)) {
        errorReport.context.customContext = {
          ...errorReport.context.customContext,
          [key]: error[key],
        };
      }
    });

    this.errorQueue.push(errorReport);

    // Send immediately if online, otherwise queue for later
    if (this.isOnline) {
      this.sendErrorReport(errorReport);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorReport);
    }
  }

  /**
   * Track React errors
   */
  trackReactError(error: Error, errorInfo: any): void {
    this.trackError({
      message: error.message,
      stack: error.stack,
      type: 'react',
      severity: 'high',
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Track custom errors
   */
  trackCustomError(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', data?: any): void {
    this.trackError({
      message,
      type: 'custom',
      severity,
      ...data,
    });
  }

  /**
   * Build error context
   */
  private buildErrorContext(): ErrorContext {
    const baseContext = {
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      deviceInfo: this.getDeviceInfo(),
      performance: this.userContext.performance,
      ...this.userContext,
    };

    // Add browser-specific context only on client side
    if (typeof window !== 'undefined') {
      return {
        ...baseContext,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    }

    return baseContext;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): { type: 'desktop' | 'mobile' | 'tablet'; os: string; browser: string } {
    const userAgent = navigator.userAgent;
    
    // Determine device type
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      type = 'mobile';
    } else if (/iPad|Tablet/.test(userAgent)) {
      type = 'tablet';
    }

    // Determine OS
    let os = 'Unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/.test(userAgent)) os = 'iOS';

    // Determine browser
    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    return { type, os, browser };
  }

  /**
   * Send error report to server
   */
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  /**
   * Flush error queue
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await Promise.all(errorsToSend.map(error => this.sendErrorReport(error)));
    } catch (error) {
      console.error('Failed to flush error queue:', error);
      // Re-queue errors if sending failed
      this.errorQueue.unshift(...errorsToSend);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorQueue.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorQueue.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorQueue.slice(-10), // Last 10 errors
    };
  }
}

// Create singleton instance
export const errorTracker = new EnhancedErrorTracker();

export default EnhancedErrorTracker;
