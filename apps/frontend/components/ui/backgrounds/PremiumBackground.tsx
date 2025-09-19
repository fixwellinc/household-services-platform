'use client';

import { useEffect, useState } from 'react';
import { DynamicBackground } from './DynamicBackground';
import { GeometricPatternOverlay, CSSGeometricPattern } from './GeometricPatternOverlay';
import { TextureOverlay, CSSTextureOverlay } from './TextureOverlay';
import { InteractiveBackground, CSSInteractiveBackground } from './InteractiveBackground';
import { prefersReducedMotion } from '@/lib/animation-utils';

interface PremiumBackgroundProps {
  variant?: 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom';
  performance?: 'high' | 'balanced' | 'optimized';
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
  customConfig?: {
    baseVariant?: 'gradient-mesh' | 'particle-field' | 'geometric-pattern';
    geometricPattern?: 'hexagon' | 'triangle' | 'diamond' | 'circle' | 'mixed';
    textureType?: 'noise' | 'paper' | 'fabric' | 'concrete' | 'subtle-grain';
    interactiveEffect?: 'ripple' | 'magnetic' | 'particle-trail' | 'glow-follow' | 'distortion';
  };
}

export function PremiumBackground({
  variant = 'modern',
  performance = 'balanced',
  interactive = true,
  className = '',
  children,
  customConfig
}: PremiumBackgroundProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsAdvancedEffects: true,
    isMobile: false,
    hasLowMemory: false
  });

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    // Detect device capabilities
    const isMobile = window.innerWidth < 768;
    const hasLowMemory = 'deviceMemory' in navigator ? (navigator as any).deviceMemory < 4 : false;
    const supportsAdvancedEffects = !isMobile && !hasLowMemory && !reducedMotion;

    setDeviceCapabilities({
      supportsAdvancedEffects,
      isMobile,
      hasLowMemory
    });

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      setDeviceCapabilities(prev => ({
        ...prev,
        supportsAdvancedEffects: !e.matches && !prev.isMobile && !prev.hasLowMemory
      }));
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getVariantConfig = () => {
    if (customConfig) return customConfig;

    switch (variant) {
      case 'luxury':
        return {
          baseVariant: 'gradient-mesh' as const,
          geometricPattern: 'diamond' as const,
          textureType: 'fabric' as const,
          interactiveEffect: 'glow-follow' as const
        };
      
      case 'modern':
        return {
          baseVariant: 'gradient-mesh' as const,
          geometricPattern: 'hexagon' as const,
          textureType: 'subtle-grain' as const,
          interactiveEffect: 'magnetic' as const
        };
      
      case 'minimal':
        return {
          baseVariant: 'gradient-mesh' as const,
          geometricPattern: 'circle' as const,
          textureType: 'paper' as const,
          interactiveEffect: 'glow-follow' as const
        };
      
      case 'dynamic':
        return {
          baseVariant: 'particle-field' as const,
          geometricPattern: 'mixed' as const,
          textureType: 'noise' as const,
          interactiveEffect: 'particle-trail' as const
        };
      
      default:
        return {
          baseVariant: 'gradient-mesh' as const,
          geometricPattern: 'hexagon' as const,
          textureType: 'subtle-grain' as const,
          interactiveEffect: 'glow-follow' as const
        };
    }
  };

  const getPerformanceSettings = () => {
    const baseSettings = {
      intensity: 'standard' as const,
      geometricDensity: 'medium' as const,
      textureIntensity: 'light' as const,
      interactiveIntensity: 'moderate' as const,
      useCSS: false,
      enableAnimations: true
    };

    // Adjust based on performance preference and device capabilities
    if (performance === 'optimized' || deviceCapabilities.isMobile || deviceCapabilities.hasLowMemory) {
      return {
        ...baseSettings,
        intensity: 'minimal' as const,
        geometricDensity: 'sparse' as const,
        textureIntensity: 'light' as const,
        interactiveIntensity: 'subtle' as const,
        useCSS: true,
        enableAnimations: !reducedMotion
      };
    }

    if (performance === 'high' && deviceCapabilities.supportsAdvancedEffects) {
      return {
        ...baseSettings,
        intensity: 'enhanced' as const,
        geometricDensity: 'dense' as const,
        textureIntensity: 'medium' as const,
        interactiveIntensity: 'strong' as const,
        useCSS: false,
        enableAnimations: true
      };
    }

    return baseSettings;
  };

  const config = getVariantConfig();
  const settings = getPerformanceSettings();

  const BackgroundWrapper = interactive && settings.enableAnimations ? 
    InteractiveBackground : 
    'div';

  const interactiveProps = interactive && settings.enableAnimations ? {
    effect: config.interactiveEffect,
    intensity: settings.interactiveIntensity
  } : {};

  return (
    <BackgroundWrapper 
      className={className}
      {...interactiveProps}
    >
      {/* Base dynamic background */}
      <DynamicBackground
        variant={config.baseVariant}
        intensity={settings.intensity}
        className="absolute inset-0"
      />

      {/* Geometric pattern overlay */}
      {settings.useCSS ? (
        <CSSGeometricPattern
          pattern="grid"
          opacity={0.03}
          className="absolute inset-0"
        />
      ) : (
        <GeometricPatternOverlay
          pattern={config.geometricPattern}
          density={settings.geometricDensity}
          opacity={0.08}
          interactive={interactive && settings.enableAnimations}
          className="absolute inset-0"
        />
      )}

      {/* Texture overlay */}
      {settings.useCSS ? (
        <CSSTextureOverlay
          intensity={settings.textureIntensity}
          className="absolute inset-0"
        />
      ) : (
        <TextureOverlay
          texture={config.textureType}
          intensity={settings.textureIntensity}
          animated={settings.enableAnimations}
          className="absolute inset-0"
        />
      )}

      {/* Additional premium effects for high performance mode */}
      {performance === 'high' && deviceCapabilities.supportsAdvancedEffects && (
        <>
          {/* Premium gradient overlay */}
          <div 
            className="absolute inset-0 opacity-20 animate-premium-gradient"
            style={{
              background: `
                linear-gradient(45deg, 
                  rgba(59, 130, 246, 0.1) 0%, 
                  rgba(139, 92, 246, 0.1) 25%, 
                  rgba(236, 72, 153, 0.1) 50%, 
                  rgba(59, 130, 246, 0.1) 75%, 
                  rgba(16, 185, 129, 0.1) 100%
                )
              `
            }}
          />
          
          {/* Floating premium elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-premium-mesh"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-premium-mesh"
              style={{ animationDelay: '2s' }}
            />
            <div 
              className="absolute top-1/2 left-3/4 w-20 h-20 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-full blur-xl animate-premium-mesh"
              style={{ animationDelay: '4s' }}
            />
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </BackgroundWrapper>
  );
}

// Preset configurations for common use cases
export const PremiumBackgroundPresets = {
  hero: {
    variant: 'luxury' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
    performance: 'high' as 'high' | 'balanced' | 'optimized',
    interactive: true
  },
  
  section: {
    variant: 'modern' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
    performance: 'balanced' as 'high' | 'balanced' | 'optimized',
    interactive: true
  },
  
  card: {
    variant: 'minimal' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
    performance: 'optimized' as 'high' | 'balanced' | 'optimized',
    interactive: false
  },
  
  mobile: {
    variant: 'minimal' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
    performance: 'optimized' as 'high' | 'balanced' | 'optimized',
    interactive: false
  }
} as const;

// Hook for getting optimal background settings
export function usePremiumBackgroundSettings() {
  const [settings, setSettings] = useState({
    recommendedVariant: 'modern' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
    recommendedPerformance: 'balanced' as 'high' | 'balanced' | 'optimized',
    shouldUseInteractive: true
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const hasLowMemory = 'deviceMemory' in navigator ? (navigator as any).deviceMemory < 4 : false;
    const reducedMotion = prefersReducedMotion();

    if (isMobile || hasLowMemory || reducedMotion) {
      setSettings({
        recommendedVariant: 'minimal' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
        recommendedPerformance: 'optimized' as 'high' | 'balanced' | 'optimized',
        shouldUseInteractive: false
      });
    } else if (window.innerWidth > 1200) {
      setSettings({
        recommendedVariant: 'luxury' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
        recommendedPerformance: 'high' as 'high' | 'balanced' | 'optimized',
        shouldUseInteractive: true
      });
    } else {
      setSettings({
        recommendedVariant: 'modern' as 'luxury' | 'modern' | 'minimal' | 'dynamic' | 'custom',
        recommendedPerformance: 'balanced' as 'high' | 'balanced' | 'optimized',
        shouldUseInteractive: true
      });
    }
  }, []);

  return settings;
}