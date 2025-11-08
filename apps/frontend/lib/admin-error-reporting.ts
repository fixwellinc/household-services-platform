import { ErrorInfo } from 'react';

export interface ErrorReport {
  errorId: string;
  errorType: 'network' | 'data' | 'permission' | 'component' | 'unknown';
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
  pageTitle?: string;
  componentName?: string;
  dataSource?: string;
  retryCount?: number;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackComponent?: React.ComponentType<any>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: () => void;
}

class AdminErrorReportingService {
  private static instance: AdminErrorReportingService;
  private errorQueue: ErrorReport[] = [];
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private retryInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Only set up event listeners if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Start retry mechanism for queued errors
      this.startRetryMechanism();
    }
  }

  public static getInstance(): AdminErrorReportingService {
    if (!AdminErrorReportingService.instance) {
      AdminErrorReportingService.instance = new AdminErrorReportingService();
    }
    return AdminErrorReportingService.instance;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.flushErrorQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  private startRetryMechanism() {
    this.retryInterval = setInterval(() => {
      if (this.isOnline && this.errorQueue.length > 0) {
        this.flushErrorQueue();
      }
    }, 30000); // Retry every 30 seconds
  }

  public async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    options: {
      errorType?: ErrorReport['errorType'];
      context?: string;
      pageTitle?: string;
      componentName?: string;
      dataSource?: string;
      retryCount?: number;
    } = {}
  ): Promise<void> {
    const errorReport: ErrorReport = {
      errorId: this.generateErrorId(),
      errorType: options.errorType || this.categorizeError(error),
      message: error.message,
      stack: error.stack ? error.stack : undefined,
      componentStack: errorInfo.componentStack || undefined,
      context: options.context,
      pageTitle: options.pageTitle,
      componentName: options.componentName,
      dataSource: options.dataSource,
      retryCount: options.retryCount || 0,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    // Log error locally
    this.logError(errorReport);

    // Try to send immediately if online
    if (this.isOnline) {
      try {
        await this.sendErrorReport(errorReport);
      } catch (sendError) {
        console.warn('Failed to send error report immediately, queuing for retry:', sendError);
        this.errorQueue.push(errorReport);
      }
    } else {
      // Queue for later if offline
      this.errorQueue.push(errorReport);
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    const response = await fetch('/api/admin/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport)
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.status}`);
    }
  }

  private async flushErrorQueue(): Promise<void> {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const errorReport of errors) {
      try {
        await this.sendErrorReport(errorReport);
      } catch (error) {
        console.warn('Failed to send queued error report:', error);
        // Re-queue if still failing
        this.errorQueue.push(errorReport);
      }
    }
  }

  private categorizeError(error: Error): ErrorReport['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    if (message.includes('data') || message.includes('parse') || message.includes('json') || stack.includes('api')) {
      return 'data';
    }
    if (stack.includes('react') || stack.includes('component') || message.includes('render')) {
      return 'component';
    }
    return 'unknown';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id ? String(user.id) : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    // Try to get session ID from various sources
    try {
      const sessionId = sessionStorage.getItem('sessionId');
      return sessionId ? sessionId : undefined;
    } catch {
      return undefined;
    }
  }

  private logError(errorReport: ErrorReport): void {
    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Admin Error Report: ${errorReport.errorType.toUpperCase()}`);
      console.error('Error ID:', errorReport.errorId);
      console.error('Message:', errorReport.message);
      console.error('Context:', errorReport.context);
      console.error('Component:', errorReport.componentName);
      console.error('Page:', errorReport.pageTitle);
      console.error('Stack:', errorReport.stack);
      console.error('Component Stack:', errorReport.componentStack);
      console.groupEnd();
    }

    // Store in local storage for debugging
    try {
      const storedErrors = JSON.parse(localStorage.getItem('admin_error_logs') || '[]');
      storedErrors.push(errorReport);
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('admin_error_logs', JSON.stringify(storedErrors));
    } catch (error) {
      console.warn('Failed to store error log locally:', error);
    }
  }

  public getStoredErrors(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('admin_error_logs') || '[]');
    } catch {
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      localStorage.removeItem('admin_error_logs');
    } catch (error) {
      console.warn('Failed to clear stored errors:', error);
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }
}

// Export singleton instance
export const adminErrorReporting = AdminErrorReportingService.getInstance();

// Utility functions for error recovery
export function withErrorRecovery<T extends (...args: any[]) => any>(
  fn: T,
  options: ErrorRecoveryOptions = {}
): T {
  const { maxRetries = 3, retryDelay = 1000, onError, onRecovery } = options;

  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        
        if (attempt > 0 && onRecovery) {
          onRecovery();
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (onError) {
          onError(lastError, { componentStack: '' });
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError!;
  }) as T;
}

export function createErrorBoundaryProps(
  context: string,
  options: ErrorRecoveryOptions = {}
) {
  return {
    onError: (error: Error, errorInfo: ErrorInfo) => {
      adminErrorReporting.reportError(error, errorInfo, { context });
      
      if (options.onError) {
        options.onError(error, errorInfo);
      }
    },
    context,
    ...options
  };
}