'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { featureDetector, FeatureSupport } from '@/lib/feature-detection';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

interface ProgressiveEnhancementProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredFeatures?: (keyof FeatureSupport)[];
  performanceThreshold?: {
    minFPS?: number;
    maxFrameTime?: number;
  };
  className?: string;
}

export function ProgressiveEnhancement({
  children,
  fallback,
  requiredFeatures = [],
  performanceThreshold,
  className = ''
}: ProgressiveEnhancementProps) {
  const [featuresSupported, setFeaturesSupported] = useState<boolean | null>(null);
  const { metrics, isLowPerformance } = usePerformanceMonitor();

  useEffect(() => {
    // Check feature support
    const checkFeatures = () => {
      if (requiredFeatures.length === 0) {
        setFeaturesSupported(true);
        return;
      }

      const features = featureDetector.getAllFeatures();
      const supported = requiredFeatures.every(feature => features[feature]);
      setFeaturesSupported(supported);
    };

    checkFeatures();
  }, [requiredFeatures]);

  // Check performance threshold
  const performanceOk = !performanceThreshold || !metrics || (
    (!performanceThreshold.minFPS || metrics.fps >= performanceThreshold.minFPS) &&
    (!performanceThreshold.maxFrameTime || metrics.frameTime <= performanceThreshold.maxFrameTime)
  );

  // Show fallback if features not supported or performance is poor
  if (featuresSupported === false || (performanceThreshold && !performanceOk)) {
    return (
      <div className={className} data-progressive-fallback="true">
        {fallback || children}
      </div>
    );
  }

  // Show loading state while checking features
  if (featuresSupported === null) {
    return (
      <div className={className} data-progressive-loading="true">
        {fallback || children}
      </div>
    );
  }

  return (
    <div className={className} data-progressive-enhanced="true">
      {children}
    </div>
  );
}

// Enhanced component wrapper with automatic fallbacks
interface EnhancedComponentProps {
  children: ReactNode;
  enhancedVersion: ReactNode;
  basicVersion?: ReactNode;
  className?: string;
}

export function EnhancedComponent({
  children,
  enhancedVersion,
  basicVersion,
  className = ''
}: EnhancedComponentProps) {
  const features = featureDetector.getAllFeatures();
  const { isLowPerformance } = usePerformanceMonitor();

  // Use basic version if performance is poor or key features are missing
  const useBasicVersion = 
    isLowPerformance || 
    !features.cssAnimations || 
    !features.cssTransitions ||
    features.reducedMotion;

  if (useBasicVersion && basicVersion) {
    return (
      <div className={className} data-component-version="basic">
        {basicVersion}
      </div>
    );
  }

  return (
    <div className={className} data-component-version="enhanced">
      {enhancedVersion}
    </div>
  );
}

// CSS feature detection component
interface CSSFeatureProps {
  feature: keyof typeof featureDetector;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function CSSFeature({
  feature,
  children,
  fallback,
  className = ''
}: CSSFeatureProps) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSupport = () => {
      const method = featureDetector[feature as keyof typeof featureDetector];
      if (typeof method === 'function') {
        setSupported(method.call(featureDetector));
      } else {
        setSupported(false);
      }
    };

    checkSupport();
  }, [feature]);

  if (supported === null) {
    return <div className={className}>{fallback || children}</div>;
  }

  if (!supported) {
    return <div className={className}>{fallback || null}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Animation capability wrapper
interface AnimationCapabilityProps {
  children: ReactNode;
  staticFallback?: ReactNode;
  reducedMotionFallback?: ReactNode;
  className?: string;
}

export function AnimationCapability({
  children,
  staticFallback,
  reducedMotionFallback,
  className = ''
}: AnimationCapabilityProps) {
  const features = featureDetector.getAllFeatures();
  const { isLowPerformance } = usePerformanceMonitor();

  // Check if animations should be disabled
  const disableAnimations = 
    features.reducedMotion || 
    !features.cssAnimations || 
    isLowPerformance;

  if (disableAnimations) {
    const fallback = features.reducedMotion ? reducedMotionFallback : staticFallback;
    return (
      <div 
        className={className} 
        data-animation-disabled="true"
        aria-hidden={features.reducedMotion ? "false" : "true"}
      >
        {fallback || children}
      </div>
    );
  }

  return (
    <div className={className} data-animation-enabled="true">
      {children}
    </div>
  );
}

// Touch capability detection
interface TouchCapabilityProps {
  children: ReactNode;
  touchVersion?: ReactNode;
  mouseVersion?: ReactNode;
  className?: string;
}

export function TouchCapability({
  children,
  touchVersion,
  mouseVersion,
  className = ''
}: TouchCapabilityProps) {
  const features = featureDetector.getAllFeatures();

  if (features.touchEvents && touchVersion) {
    return (
      <div className={className} data-input-type="touch">
        {touchVersion}
      </div>
    );
  }

  if (!features.touchEvents && mouseVersion) {
    return (
      <div className={className} data-input-type="mouse">
        {mouseVersion}
      </div>
    );
  }

  return (
    <div className={className} data-input-type="universal">
      {children}
    </div>
  );
}

// Performance-aware component loader
interface PerformanceAwareProps {
  children: ReactNode;
  lowPerformanceVersion?: ReactNode;
  performanceThreshold?: {
    minFPS: number;
    maxFrameTime: number;
  };
  className?: string;
}

export function PerformanceAware({
  children,
  lowPerformanceVersion,
  performanceThreshold = { minFPS: 30, maxFrameTime: 33.33 },
  className = ''
}: PerformanceAwareProps) {
  const { metrics, isLowPerformance } = usePerformanceMonitor();

  const customLowPerformance = metrics && (
    metrics.fps < performanceThreshold.minFPS ||
    metrics.frameTime > performanceThreshold.maxFrameTime
  );

  if ((isLowPerformance || customLowPerformance) && lowPerformanceVersion) {
    return (
      <div className={className} data-performance="low">
        {lowPerformanceVersion}
      </div>
    );
  }

  return (
    <div className={className} data-performance="normal">
      {children}
    </div>
  );
}