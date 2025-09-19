'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useAccessibilityContext } from './AccessibilityProvider';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface AccessibleAnimationProps {
  children: ReactNode;
  fallback?: ReactNode;
  animationName?: string;
  className?: string;
  announceStart?: string;
  announceEnd?: string;
}

export function AccessibleAnimation({ 
  children, 
  fallback, 
  animationName = 'animation',
  className = '',
  announceStart,
  announceEnd
}: AccessibleAnimationProps) {
  const { prefersReducedMotion, announce } = useAccessibilityContext();
  const reducedMotion = useReducedMotion();
  const [animationComplete, setAnimationComplete] = useState(false);

  const shouldReduceMotion = prefersReducedMotion || reducedMotion;

  useEffect(() => {
    if (announceStart && !shouldReduceMotion) {
      announce(announceStart, 'polite');
    }
  }, [announceStart, shouldReduceMotion, announce]);

  useEffect(() => {
    if (animationComplete && announceEnd) {
      announce(announceEnd, 'polite');
    }
  }, [animationComplete, announceEnd, announce]);

  const handleAnimationEnd = () => {
    setAnimationComplete(true);
  };

  if (shouldReduceMotion && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`
        ${className}
        ${shouldReduceMotion ? 'motion-reduce:transform-none motion-reduce:transition-none' : ''}
      `}
      onAnimationEnd={handleAnimationEnd}
      aria-label={animationName}
      role="img"
      aria-hidden={shouldReduceMotion ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}

// Accessible scroll animation wrapper
interface AccessibleScrollAnimationProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  announceOnVisible?: string;
}

export function AccessibleScrollAnimation({
  children,
  threshold = 0.1,
  rootMargin = '0px',
  className = '',
  announceOnVisible
}: AccessibleScrollAnimationProps) {
  const { prefersReducedMotion, announce } = useAccessibilityContext();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnnounced, setHasAnnounced] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          if (announceOnVisible && !hasAnnounced) {
            announce(announceOnVisible, 'polite');
            setHasAnnounced(true);
          }
        }
      },
      { threshold, rootMargin }
    );

    const element = document.querySelector(`[data-scroll-animation]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, announceOnVisible, hasAnnounced, announce]);

  return (
    <div
      data-scroll-animation
      className={`
        ${className}
        ${isVisible ? 'animate-in' : 'opacity-0'}
        ${prefersReducedMotion ? 'motion-reduce:opacity-100 motion-reduce:transform-none' : ''}
      `}
      aria-hidden={!isVisible && !prefersReducedMotion ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}