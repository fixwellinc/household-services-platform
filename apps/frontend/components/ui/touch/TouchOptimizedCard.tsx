'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useGestureSupport } from '@/hooks/use-gesture-support';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TouchOptimizedCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  expandable?: boolean;
  interactive?: boolean;
  hapticFeedback?: boolean;
  touchFeedback?: 'none' | 'subtle' | 'medium' | 'strong';
}

export const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  className,
  title,
  description,
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  expandable = false,
  interactive = true,
  hapticFeedback = true,
  touchFeedback = 'subtle',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50,
      };
      navigator.vibrate(patterns[intensity]);
    }
  };

  const handleTap = () => {
    triggerHapticFeedback('light');
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
    onTap?.();
  };

  const handleDoubleTap = () => {
    triggerHapticFeedback('medium');
    onDoubleTap?.();
  };

  const handleLongPress = () => {
    triggerHapticFeedback('heavy');
    onLongPress?.();
  };

  const handleSwipeLeft = () => {
    triggerHapticFeedback('light');
    onSwipeLeft?.();
  };

  const handleSwipeRight = () => {
    triggerHapticFeedback('light');
    onSwipeRight?.();
  };

  const { gestureHandlers, isLongPressing } = useGestureSupport({
    onTap: handleTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    swipeThreshold: 50,
    longPressDelay: 500,
    doubleTapDelay: 300,
  });

  const getTouchFeedbackClasses = () => {
    if (!interactive) return '';
    
    switch (touchFeedback) {
      case 'subtle':
        return 'active:scale-[0.98] transition-transform duration-150';
      case 'medium':
        return 'active:scale-95 transition-transform duration-150';
      case 'strong':
        return 'active:scale-90 transition-transform duration-150';
      default:
        return '';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (interactive) {
      setIsPressed(true);
    }
    gestureHandlers.onTouchStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
    gestureHandlers.onTouchEnd(e);
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        interactive && 'cursor-pointer select-none',
        interactive && 'hover:shadow-lg hover:-translate-y-1',
        getTouchFeedbackClasses(),
        isPressed && 'brightness-95',
        isLongPressing && 'ring-2 ring-primary-500 ring-opacity-50',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={gestureHandlers.onTouchMove}
      onTouchEnd={handleTouchEnd}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={expandable ? isExpanded : undefined}
    >
      {/* Visual feedback for long press */}
      {isLongPressing && (
        <div className="absolute inset-0 bg-primary-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Card header */}
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className="text-lg font-semibold leading-tight">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}

      {/* Card content */}
      <CardContent className={cn(
        'transition-all duration-300',
        expandable && !isExpanded && 'max-h-32 overflow-hidden',
        expandable && isExpanded && 'max-h-none'
      )}>
        {children}
        
        {/* Expand/collapse indicator */}
        {expandable && (
          <div className="flex justify-center mt-4">
            <div className={cn(
              'w-8 h-1 bg-gray-300 rounded-full transition-transform duration-200',
              isExpanded && 'rotate-180'
            )} />
          </div>
        )}
      </CardContent>

      {/* Swipe indicators */}
      {(onSwipeLeft || onSwipeRight) && (
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-30">
          {onSwipeLeft && (
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
          {onSwipeRight && (
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
        </div>
      )}
    </Card>
  );
};

export default TouchOptimizedCard;