"use client";

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installMethod, setInstallMethod] = useState<'browser' | 'manual'>('browser');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Load minimized state from localStorage
    const savedMinimizedState = localStorage.getItem('pwa-install-minimized');
    if (savedMinimizedState) {
      setIsMinimized(JSON.parse(savedMinimizedState));
    }
  }, []);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      setIsInstalled(false);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      setInstallMethod('browser');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store dismissal in localStorage to avoid showing again immediately
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Click the three dots menu (⋮) in your browser',
          'Select "Install FixWell Admin" or "Add to Home screen"',
          'Click "Install" when prompted'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the menu button (☰) in your browser',
          'Select "Install" or "Add to Home Screen"',
          'Click "Add" when prompted'
        ]
      };
    } else if (userAgent.includes('safari') && userAgent.includes('mobile')) {
      return {
        browser: 'Safari (iOS)',
        steps: [
          'Tap the Share button (□↗) at the bottom',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari (macOS)',
        steps: [
          'Click "File" in the menu bar',
          'Select "Add to Dock" or "Add to Home Screen"',
          'Confirm the installation'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        steps: [
          'Click the three dots menu (⋯) in your browser',
          'Select "Apps" then "Install this site as an app"',
          'Click "Install" when prompted'
        ]
      };
    } else {
      return {
        browser: 'Your Browser',
        steps: [
          'Look for an install option in your browser menu',
          'Or add this page to your bookmarks',
          'Check your browser\'s help section for PWA installation'
        ]
      };
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">App Installed</h3>
              <p className="text-sm text-green-700">
                FixWell Admin is installed and ready to use offline
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install FixWell Admin
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newMinimizedState = !isMinimized;
                  setIsMinimized(newMinimizedState);
                  localStorage.setItem('pwa-install-minimized', JSON.stringify(newMinimizedState));
                }}
                className="text-blue-600 hover:text-blue-800"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="space-y-4">
            <p className="text-blue-700">
              Install FixWell Admin as a Progressive Web App for better performance and offline access.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">Mobile Access</h4>
                  <p className="text-sm text-blue-600">Use on your phone like a native app</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <WifiOff className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">Offline Support</h4>
                  <p className="text-sm text-blue-600">Works without internet connection</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleInstallClick} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
            </div>
          </CardContent>
        )}
        
        {isMinimized && (
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-600">Install FixWell Admin for better experience</p>
              <Button onClick={handleInstallClick} size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Show manual install instructions
  const instructions = getInstallInstructions();
  
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Install as App
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newMinimizedState = !isMinimized;
                setIsMinimized(newMinimizedState);
                localStorage.setItem('pwa-install-minimized', JSON.stringify(newMinimizedState));
              }}
              className="text-gray-600 hover:text-gray-800"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Install FixWell Admin as a Progressive Web App for better performance and offline access.
          </p>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">
              Install on {instructions.browser}:
            </h4>
            <ol className="space-y-2 text-sm text-gray-600">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Badge variant="outline" className="mt-0.5 text-xs">
                    {index + 1}
                  </Badge>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Once installed, you can access FixWell Admin from your device's home screen or app drawer.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      
      {isMinimized && (
        <CardContent className="py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Install FixWell Admin for better experience</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                const newMinimizedState = false;
                setIsMinimized(newMinimizedState);
                localStorage.setItem('pwa-install-minimized', JSON.stringify(newMinimizedState));
              }}
            >
              <Monitor className="h-3 w-3 mr-1" />
              View Instructions
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function PWAStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs text-gray-600">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {isInstalled && (
        <Badge variant="outline" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          PWA Installed
        </Badge>
      )}
    </div>
  );
}
