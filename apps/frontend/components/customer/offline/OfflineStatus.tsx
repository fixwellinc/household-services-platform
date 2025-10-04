/**
 * Offline Status Component
 * 
 * Displays offline status and pending actions
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline-manager';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onClear?: () => void;
}

export function OfflineStatus({ 
  className = '', 
  showDetails = false,
  onRetry,
  onClear 
}: OfflineStatusProps) {
  const { isOnline, isOfflineMode, hasPendingActions, pendingCount } = useOfflineStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  // Don't show anything if online and no pending actions
  if (isOnline && !hasPendingActions) {
    return null;
  }

  return (
    <Card className={`border-l-4 ${isOnline ? 'border-green-500' : 'border-red-500'} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                
                {hasPendingActions && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              
              {showDetails && (
                <p className="text-sm text-gray-600 mt-1">
                  {isOnline 
                    ? hasPendingActions 
                      ? `${pendingCount} actions waiting to sync`
                      : 'All actions synced'
                    : 'Some features may be limited'
                  }
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPendingActions && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying || !isOnline}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Syncing...' : 'Sync'}
                </Button>
                
                {onClear && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detailed status for offline mode */}
        {isOfflineMode && showDetails && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Offline Mode Active
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Some features are limited while offline. Your actions will be synced when you're back online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message for synced actions */}
        {isOnline && !hasPendingActions && showDetails && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  All Actions Synced
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your offline actions have been successfully synchronized.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact offline indicator for mobile
 */
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, hasPendingActions, pendingCount } = useOfflineStatus();

  if (isOnline && !hasPendingActions) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg ${
        isOnline 
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <span className="text-sm font-medium">
          {isOnline ? 'Syncing...' : 'Offline'}
        </span>
        
        {hasPendingActions && (
          <Badge className="bg-white text-gray-800 text-xs px-1.5 py-0.5">
            {pendingCount}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default OfflineStatus;
