'use client';

import { useEffect, useState } from 'react';
import { DynamicBackground } from './DynamicBackground';

interface ResponsiveBackgroundProps {
  variant?: 'gradient-mesh' | 'particle-field' | 'geometric-pattern';
  className?: string;
  children?: React.ReactNode;
}

export function ResponsiveBackground({ 
  variant = 'gradient-mesh',
  className = '',
  children 
}: ResponsiveBackgroundProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [intensity, setIntensity] = useState<'minimal' | 'standard' | 'enhanced'>('standard');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
        setIntensity('minimal'); // Reduce animations on mobile for performance
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIntensity('standard');
      } else {
        setScreenSize('desktop');
        setIntensity('enhanced');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Adjust variant based on screen size
  const getResponsiveVariant = () => {
    if (screenSize === 'mobile') {
      // Use simpler backgrounds on mobile
      return variant === 'particle-field' ? 'gradient-mesh' : variant;
    }
    return variant;
  };

  const getResponsiveClasses = () => {
    const baseClasses = 'min-h-screen';
    
    switch (screenSize) {
      case 'mobile':
        return `${baseClasses} px-4 py-16`;
      case 'tablet':
        return `${baseClasses} px-6 py-20`;
      case 'desktop':
        return `${baseClasses} px-8 py-24`;
      default:
        return baseClasses;
    }
  };

  return (
    <DynamicBackground
      variant={getResponsiveVariant()}
      intensity={intensity}
      className={`${getResponsiveClasses()} ${className}`}
    >
      {children}
    </DynamicBackground>
  );
}

// Hook for getting current screen size and performance settings
export function useResponsiveBackground() {
  const [settings, setSettings] = useState({
    screenSize: 'desktop' as 'mobile' | 'tablet' | 'desktop',
    intensity: 'standard' as 'minimal' | 'standard' | 'enhanced',
    supportsAdvancedEffects: true,
  });

  useEffect(() => {
    const updateSettings = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Check device capabilities
      const supportsAdvancedEffects = !isMobile && 
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        'deviceMemory' in navigator ? (navigator as any).deviceMemory >= 4 : true;

      setSettings({
        screenSize: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        intensity: isMobile ? 'minimal' : supportsAdvancedEffects ? 'enhanced' : 'standard',
        supportsAdvancedEffects,
      });
    };

    updateSettings();
    window.addEventListener('resize', updateSettings);
    
    return () => window.removeEventListener('resize', updateSettings);
  }, []);

  return settings;
}