'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility } from './AccessibilityProvider';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Zap, 
  Keyboard, 
  Volume2, 
  Contrast,
  Settings,
  RotateCcw
} from 'lucide-react';

// Accessibility Settings Panel
interface AccessibilitySettingsProps {
  className?: string;
}

export function AccessibilitySettings({ className }: AccessibilitySettingsProps) {
  const {
    highContrast,
    reducedMotion,
    largeText,
    screenReaderMode,
    keyboardNavigation,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleScreenReaderMode,
    toggleKeyboardNavigation,
    announce
  } = useAccessibility();

  const handleToggle = (setting: string, toggle: () => void) => {
    toggle();
    announce(`${setting} ${setting.includes('enabled') ? 'disabled' : 'enabled'}`);
  };

  const resetAllSettings = () => {
    if (highContrast) toggleHighContrast();
    if (reducedMotion) toggleReducedMotion();
    if (largeText) toggleLargeText();
    if (screenReaderMode) toggleScreenReaderMode();
    if (keyboardNavigation) toggleKeyboardNavigation();
    announce('All accessibility settings reset to default');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Accessibility Preferences
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customize your experience with accessibility features
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Contrast className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="high-contrast" className="text-sm font-medium">
                High Contrast Mode
              </Label>
              <p className="text-xs text-gray-600">
                Increases contrast for better visibility
              </p>
            </div>
          </div>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={() => handleToggle('High contrast mode', toggleHighContrast)}
            aria-describedby="high-contrast-desc"
          />
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="reduced-motion" className="text-sm font-medium">
                Reduced Motion
              </Label>
              <p className="text-xs text-gray-600">
                Minimizes animations and transitions
              </p>
            </div>
          </div>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={() => handleToggle('Reduced motion', toggleReducedMotion)}
            aria-describedby="reduced-motion-desc"
          />
        </div>

        {/* Large Text */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="large-text" className="text-sm font-medium">
                Large Text
              </Label>
              <p className="text-xs text-gray-600">
                Increases text size for better readability
              </p>
            </div>
          </div>
          <Switch
            id="large-text"
            checked={largeText}
            onCheckedChange={() => handleToggle('Large text', toggleLargeText)}
            aria-describedby="large-text-desc"
          />
        </div>

        {/* Screen Reader Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="screen-reader" className="text-sm font-medium">
                Screen Reader Optimizations
              </Label>
              <p className="text-xs text-gray-600">
                Enhanced support for screen readers
              </p>
            </div>
          </div>
          <Switch
            id="screen-reader"
            checked={screenReaderMode}
            onCheckedChange={() => handleToggle('Screen reader mode', toggleScreenReaderMode)}
            aria-describedby="screen-reader-desc"
          />
        </div>

        {/* Keyboard Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-gray-500" />
            <div>
              <Label htmlFor="keyboard-nav" className="text-sm font-medium">
                Enhanced Keyboard Navigation
              </Label>
              <p className="text-xs text-gray-600">
                Improved keyboard navigation indicators
              </p>
            </div>
          </div>
          <Switch
            id="keyboard-nav"
            checked={keyboardNavigation}
            onCheckedChange={() => handleToggle('Keyboard navigation', toggleKeyboardNavigation)}
            aria-describedby="keyboard-nav-desc"
          />
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetAllSettings}
            className="w-full flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Accessibility Toggle
interface QuickAccessibilityToggleProps {
  className?: string;
}

export function QuickAccessibilityToggle({ className }: QuickAccessibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { highContrast, toggleHighContrast, announce } = useAccessibility();

  const handleQuickToggle = () => {
    toggleHighContrast();
    announce(`High contrast mode ${highContrast ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label="Accessibility options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Accessibility</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-3">
            <h3 className="font-medium text-sm">Quick Accessibility</h3>
            
            <button
              onClick={handleQuickToggle}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm"
            >
              <span className="flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                High Contrast
              </span>
              <span className={cn(
                'text-xs px-2 py-1 rounded',
                highContrast ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              )}>
                {highContrast ? 'ON' : 'OFF'}
              </span>
            </button>

            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full text-xs"
              >
                More Settings...
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Accessibility Status Indicator
export function AccessibilityStatusIndicator() {
  const {
    highContrast,
    reducedMotion,
    largeText,
    screenReaderMode,
    keyboardNavigation
  } = useAccessibility();

  const activeFeatures = [
    highContrast && 'High Contrast',
    reducedMotion && 'Reduced Motion',
    largeText && 'Large Text',
    screenReaderMode && 'Screen Reader',
    keyboardNavigation && 'Keyboard Navigation'
  ].filter(Boolean);

  if (activeFeatures.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-40">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm">
          {activeFeatures.length} accessibility feature{activeFeatures.length !== 1 ? 's' : ''} active
        </span>
      </div>
      <div className="text-xs opacity-90 mt-1">
        {activeFeatures.join(', ')}
      </div>
    </div>
  );
}

// Color Blind Friendly Palette Component
interface ColorBlindFriendlyPaletteProps {
  className?: string;
}

export function ColorBlindFriendlyPalette({ className }: ColorBlindFriendlyPaletteProps) {
  const colors = [
    { name: 'Success', standard: '#10B981', colorBlind: '#0066CC' },
    { name: 'Warning', standard: '#F59E0B', colorBlind: '#FF6600' },
    { name: 'Error', standard: '#EF4444', colorBlind: '#CC0000' },
    { name: 'Info', standard: '#3B82F6', colorBlind: '#0099CC' }
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-medium">Color Accessibility</h3>
      <div className="grid grid-cols-2 gap-4">
        {colors.map((color) => (
          <div key={color.name} className="space-y-2">
            <h4 className="text-sm font-medium">{color.name}</h4>
            <div className="flex gap-2">
              <div
                className="w-12 h-12 rounded border"
                style={{ backgroundColor: color.standard }}
                title={`Standard: ${color.standard}`}
              />
              <div
                className="w-12 h-12 rounded border"
                style={{ backgroundColor: color.colorBlind }}
                title={`Color-blind friendly: ${color.colorBlind}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}