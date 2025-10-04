/**
 * PWA Installation Component
 * 
 * Provides PWA installation functionality and prompts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  X, 
  CheckCircle,
  Info,
  Wifi,
  WifiOff,
  Bell,
  Settings
} from 'lucide-react';

interface PWAInstallPromptProps {
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt({ className = '', onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowPrompt(false);
      setInstallOutcome('accepted');
      
      if (onInstall) {
        onInstall();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      setInstallOutcome(choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setShowPrompt(false);
        
        if (onInstall) {
          onInstall();
        }
      } else {
        setShowPrompt(false);
        
        if (onDismiss) {
          onDismiss();
        }
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Install App</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          Install the Customer Dashboard app for a better experience
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">Access from your home screen</span>
          </div>
          <div className="flex items-center gap-3">
            <WifiOff className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">Works offline</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">Push notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">Faster loading</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Maybe Later
          </Button>
        </div>

        {/* Success message */}
        {installOutcome === 'accepted' && (
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">App installed successfully!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * PWA Status Component
 * Shows current PWA status and capabilities
 */
export function PWAStatus({ className = '' }: { className?: string }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check installation status
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      } else if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    };

    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check service worker
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          setHasServiceWorker(!!registration);
        } catch (error) {
          console.error('Service worker check failed:', error);
        }
      }
    };

    checkInstallStatus();
    checkOnlineStatus();
    checkServiceWorker();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Monitor className="h-5 w-5" />
          App Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Installation</span>
          <Badge className={isInstalled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isInstalled ? 'Installed' : 'Not Installed'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection</span>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Offline Support</span>
          <Badge className={hasServiceWorker ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {hasServiceWorker ? 'Available' : 'Not Available'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Installable</span>
          <Badge className={canInstall ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
            {canInstall ? 'Yes' : 'No'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default PWAInstallPrompt;
