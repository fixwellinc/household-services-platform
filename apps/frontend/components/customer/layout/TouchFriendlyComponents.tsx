'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';

// Touch-friendly button with haptic feedback simulation
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function TouchButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  ...props 
}: TouchButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95 active:shadow-sm", // Touch feedback
    "touch-manipulation", // Optimize for touch
    {
      // Variants
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg': variant === 'default',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
      
      // Sizes - larger for touch
      'h-10 px-4 py-2 text-sm': size === 'sm',
      'h-12 px-6 py-3 text-base': size === 'md',
      'h-14 px-8 py-4 text-lg': size === 'lg',
      
      // Full width
      'w-full': fullWidth,
    },
    className
  );

  return (
    <button 
      className={baseClasses} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

// Touch-friendly card with better tap targets
interface TouchCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function TouchCard({ 
  children, 
  className, 
  onClick, 
  interactive = false,
  padding = 'md' 
}: TouchCardProps) {
  const cardClasses = cn(
    "bg-white rounded-lg border border-gray-200 shadow-sm",
    {
      'hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] active:shadow-sm': interactive || onClick,
      'touch-manipulation': interactive || onClick,
    },
    className
  );

  const contentClasses = cn(
    {
      'p-3': padding === 'sm',
      'p-4': padding === 'md',
      'p-6': padding === 'lg',
    }
  );

  if (onClick) {
    return (
      <button className={cardClasses} onClick={onClick}>
        <div className={contentClasses}>
          {children}
        </div>
      </button>
    );
  }

  return (
    <div className={cardClasses}>
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
}

// Touch-friendly tab navigation
interface TouchTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TouchTabs({ tabs, activeTab, onTabChange, className }: TouchTabsProps) {
  return (
    <div className={cn("flex bg-gray-100 rounded-lg p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-150",
            "touch-manipulation active:scale-95",
            {
              'bg-white text-gray-900 shadow-sm': activeTab === tab.id,
              'text-gray-600 hover:text-gray-900': activeTab !== tab.id,
            }
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Touch-friendly toggle switch
interface TouchToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function TouchToggle({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false,
  className 
}: TouchToggleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex-1">
        {label && (
          <label className="text-sm font-medium text-gray-900 block">
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation active:scale-95",
          {
            'bg-primary': checked,
            'bg-gray-200': !checked,
          }
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            {
              'translate-x-6': checked,
              'translate-x-0': !checked,
            }
          )}
        />
      </button>
    </div>
  );
}

// Touch-friendly action sheet (bottom sheet for mobile)
interface TouchActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function TouchActionSheet({ isOpen, onClose, title, children }: TouchActionSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Touch-friendly swipe indicator
interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

export function SwipeIndicator({ direction, className }: SwipeIndicatorProps) {
  const arrows = {
    left: '←',
    right: '→',
    up: '↑',
    down: '↓',
  };

  return (
    <div className={cn(
      "flex items-center justify-center text-gray-400 text-sm animate-pulse",
      className
    )}>
      <span className="mr-2">{arrows[direction]}</span>
      <span>Swipe to see more</span>
    </div>
  );
}

// Touch-friendly floating action button
interface TouchFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export function TouchFAB({ 
  onClick, 
  icon, 
  label, 
  position = 'bottom-right',
  className 
}: TouchFABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
        "touch-manipulation active:scale-90",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        {
          'w-14 h-14': !label,
          'px-6 py-4 flex items-center gap-2': label,
        },
        positionClasses[position],
        className
      )}
    >
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}