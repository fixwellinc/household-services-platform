'use client';

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/animation-utils';

interface TextureOverlayProps {
  texture?: 'noise' | 'paper' | 'fabric' | 'concrete' | 'subtle-grain';
  intensity?: 'light' | 'medium' | 'strong';
  blend?: 'multiply' | 'overlay' | 'soft-light' | 'normal';
  animated?: boolean;
  className?: string;
}

export function TextureOverlay({
  texture = 'subtle-grain',
  intensity = 'light',
  blend = 'overlay',
  animated = false,
  className = ''
}: TextureOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getOpacity = () => {
    switch (intensity) {
      case 'light': return 0.03;
      case 'medium': return 0.06;
      case 'strong': return 0.1;
      default: return 0.03;
    }
  };

  const getTexturePattern = () => {
    switch (texture) {
      case 'noise':
        return generateNoisePattern();
      case 'paper':
        return generatePaperPattern();
      case 'fabric':
        return generateFabricPattern();
      case 'concrete':
        return generateConcretePattern();
      case 'subtle-grain':
        return generateSubtleGrainPattern();
      default:
        return generateSubtleGrainPattern();
    }
  };

  const generateNoisePattern = () => {
    // Create a noise pattern using CSS filters and pseudo-elements
    return {
      background: `
        radial-gradient(circle at 20% 80%, rgba(0,0,0,0.02) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0,0,0,0.02) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(0,0,0,0.01) 0%, transparent 50%)
      `,
      filter: 'contrast(1.1) brightness(0.98)'
    };
  };

  const generatePaperPattern = () => {
    return {
      background: `
        linear-gradient(90deg, transparent 79px, rgba(0,0,0,0.01) 81px, rgba(0,0,0,0.01) 82px, transparent 84px),
        linear-gradient(0deg, transparent 79px, rgba(0,0,0,0.01) 81px, rgba(0,0,0,0.01) 82px, transparent 84px),
        radial-gradient(circle at 50% 50%, rgba(0,0,0,0.005) 0%, transparent 70%)
      `,
      backgroundSize: '100px 100px, 100px 100px, 50px 50px'
    };
  };

  const generateFabricPattern = () => {
    return {
      background: `
        linear-gradient(45deg, rgba(0,0,0,0.01) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.01) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.005) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.005) 75%)
      `,
      backgroundSize: '8px 8px',
      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
    };
  };

  const generateConcretePattern = () => {
    return {
      background: `
        radial-gradient(circle at 25% 25%, rgba(0,0,0,0.02) 0%, transparent 25%),
        radial-gradient(circle at 75% 75%, rgba(0,0,0,0.015) 0%, transparent 25%),
        radial-gradient(circle at 75% 25%, rgba(0,0,0,0.01) 0%, transparent 25%),
        radial-gradient(circle at 25% 75%, rgba(0,0,0,0.01) 0%, transparent 25%)
      `,
      backgroundSize: '60px 60px, 80px 80px, 40px 40px, 70px 70px',
      filter: 'blur(0.5px)'
    };
  };

  const generateSubtleGrainPattern = () => {
    return {
      background: `
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.008) 1px, transparent 0),
        radial-gradient(circle at 2px 2px, rgba(0,0,0,0.005) 1px, transparent 0)
      `,
      backgroundSize: '3px 3px, 5px 5px'
    };
  };

  const animationClass = animated && !reducedMotion ? 'animate-texture-drift' : '';

  return (
    <>
      <div 
        className={`absolute inset-0 pointer-events-none ${animationClass} ${className}`}
        style={{
          ...getTexturePattern(),
          opacity: getOpacity(),
          mixBlendMode: blend as any
        }}
      />
      
      {/* Additional subtle overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, rgba(0,0,0,0.002) 0%, rgba(255,255,255,0.002) 100%)',
          opacity: getOpacity() * 0.5
        }}
      />
    </>
  );
}

// SVG-based texture patterns for more complex effects
export function SVGTextureOverlay({
  pattern = 'organic',
  intensity = 'light',
  className = ''
}: {
  pattern?: 'organic' | 'geometric' | 'flowing' | 'crystalline';
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
}) {
  const getOpacity = () => {
    switch (intensity) {
      case 'light': return 0.02;
      case 'medium': return 0.04;
      case 'strong': return 0.08;
      default: return 0.02;
    }
  };

  const renderPattern = () => {
    switch (pattern) {
      case 'organic':
        return (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: getOpacity() }}>
            <defs>
              <filter id="organic-noise">
                <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="currentColor" filter="url(#organic-noise)"/>
          </svg>
        );

      case 'geometric':
        return (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: getOpacity() }}>
            <defs>
              <pattern id="geometric-texture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none"/>
                <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.3"/>
                <rect x="5" y="5" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geometric-texture)"/>
          </svg>
        );

      case 'flowing':
        return (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: getOpacity() }}>
            <defs>
              <filter id="flowing-texture">
                <feTurbulence baseFrequency="0.02 0.1" numOctaves="2" result="turbulence"/>
                <feColorMatrix in="turbulence" type="saturate" values="0"/>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="currentColor" filter="url(#flowing-texture)"/>
          </svg>
        );

      case 'crystalline':
        return (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: getOpacity() }}>
            <defs>
              <pattern id="crystalline-texture" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.3"/>
                <polygon points="10,10 30,10 30,30 10,30" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.2"/>
                <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#crystalline-texture)"/>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {renderPattern()}
    </div>
  );
}

// Performance-optimized CSS-only texture
export function CSSTextureOverlay({
  intensity = 'light',
  className = ''
}: {
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
}) {
  const getOpacity = () => {
    switch (intensity) {
      case 'light': return 0.015;
      case 'medium': return 0.03;
      case 'strong': return 0.06;
      default: return 0.015;
    }
  };

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(0,0,0,${getOpacity()}) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,${getOpacity() * 0.5}) 0%, transparent 50%),
          radial-gradient(circle at 40% 70%, rgba(0,0,0,${getOpacity() * 0.7}) 0%, transparent 30%),
          radial-gradient(circle at 70% 30%, rgba(255,255,255,${getOpacity() * 0.3}) 0%, transparent 40%)
        `,
        backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px',
        mixBlendMode: 'overlay'
      }}
    />
  );
}