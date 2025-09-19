'use client';

import { useRef, useCallback, useState } from 'react';

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  pinchThreshold?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useGestureSupport = (config: GestureConfig = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 0.1,
  } = config;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const initialDistance = useRef<number>(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Calculate distance between two touch points
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
    setIsLongPressing(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: now,
    };
    
    touchEnd.current = null;

    // Handle multi-touch for pinch gestures
    if (e.touches.length === 2 && onPinch) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      e.preventDefault(); // Prevent default zoom behavior
    }

    // Start long press timer for single touch
    if (e.touches.length === 1 && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, onPinch, longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch && initialDistance.current > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        onPinch(scale);
      }
      return;
    }

    // Cancel long press if finger moves too much
    if (touchStart.current && touchEnd.current) {
      const deltaX = Math.abs(touchEnd.current.x - touchStart.current.x);
      const deltaY = Math.abs(touchEnd.current.y - touchStart.current.y);
      
      if (deltaX > 10 || deltaY > 10) {
        clearLongPressTimer();
      }
    }
  }, [onPinch, pinchThreshold, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer();

    if (!touchStart.current || !touchEnd.current) {
      // Handle tap if no movement occurred
      if (touchStart.current && !isLongPressing) {
        const now = Date.now();
        
        // Check for double tap
        if (lastTap.current && onDoubleTap) {
          const timeDiff = now - lastTap.current.timestamp;
          const distance = Math.sqrt(
            Math.pow(touchStart.current.x - lastTap.current.x, 2) +
            Math.pow(touchStart.current.y - lastTap.current.y, 2)
          );
          
          if (timeDiff < doubleTapDelay && distance < 50) {
            onDoubleTap();
            lastTap.current = null;
            return;
          }
        }
        
        // Single tap
        if (onTap) {
          onTap();
        }
        
        lastTap.current = {
          x: touchStart.current.x,
          y: touchStart.current.y,
          timestamp: now,
        };
      }
      return;
    }

    // Calculate swipe direction and distance
    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if it's a swipe gesture
    if (Math.max(absDeltaX, absDeltaY) > swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY < 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }

    // Reset touch points
    touchStart.current = null;
    touchEnd.current = null;
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    swipeThreshold,
    doubleTapDelay,
    isLongPressing,
    clearLongPressTimer,
  ]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    gestureHandlers,
    isLongPressing,
  };
};

export default useGestureSupport;