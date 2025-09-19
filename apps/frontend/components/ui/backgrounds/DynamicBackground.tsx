'use client';

import { useEffect, useState, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/animation-utils';

interface DynamicBackgroundProps {
  variant?: 'gradient-mesh' | 'particle-field' | 'geometric-pattern';
  intensity?: 'minimal' | 'standard' | 'enhanced';
  className?: string;
  children?: React.ReactNode;
}

export function DynamicBackground({ 
  variant = 'gradient-mesh', 
  intensity = 'standard',
  className = '',
  children 
}: DynamicBackgroundProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getBackgroundClasses = () => {
    const baseClasses = 'relative overflow-hidden';
    
    if (reducedMotion || intensity === 'minimal') {
      return `${baseClasses} bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`;
    }

    switch (variant) {
      case 'gradient-mesh':
        return `${baseClasses} bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`;
      case 'particle-field':
        return `${baseClasses} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20`;
      case 'geometric-pattern':
        return `${baseClasses} bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`;
      default:
        return `${baseClasses} bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`;
    }
  };

  return (
    <div ref={containerRef} className={`${getBackgroundClasses()} ${className}`}>
      {/* Animated Background Elements */}
      {!reducedMotion && (
        <>
          {variant === 'gradient-mesh' && (
            <GradientMeshBackground intensity={intensity} />
          )}
          {variant === 'particle-field' && (
            <ParticleFieldBackground intensity={intensity} />
          )}
          {variant === 'geometric-pattern' && (
            <GeometricPatternBackground intensity={intensity} />
          )}
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function GradientMeshBackground({ intensity }: { intensity: string }) {
  const getAnimationClasses = () => {
    switch (intensity) {
      case 'enhanced':
        return 'animate-pulse';
      case 'standard':
        return 'animate-pulse-slow';
      default:
        return '';
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary gradient orbs */}
      <div 
        className={`absolute top-20 left-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-3xl ${getAnimationClasses()}`}
        style={{ animationDelay: '0s' }}
      />
      <div 
        className={`absolute top-40 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-400/10 rounded-full blur-3xl ${getAnimationClasses()}`}
        style={{ animationDelay: '1s' }}
      />
      <div 
        className={`absolute bottom-20 left-1/4 w-64 h-64 bg-emerald-400/15 dark:bg-emerald-400/10 rounded-full blur-3xl ${getAnimationClasses()}`}
        style={{ animationDelay: '2s' }}
      />
      
      {intensity === 'enhanced' && (
        <>
          <div 
            className={`absolute top-1/3 right-1/3 w-48 h-48 bg-pink-400/15 dark:bg-pink-400/8 rounded-full blur-2xl ${getAnimationClasses()}`}
            style={{ animationDelay: '0.5s' }}
          />
          <div 
            className={`absolute bottom-1/3 right-20 w-80 h-80 bg-cyan-400/15 dark:bg-cyan-400/8 rounded-full blur-3xl ${getAnimationClasses()}`}
            style={{ animationDelay: '1.5s' }}
          />
        </>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/10 dark:to-purple-400/10" />
    </div>
  );
}

function ParticleFieldBackground({ intensity }: { intensity: string }) {
  const particleCount = intensity === 'enhanced' ? 20 : intensity === 'standard' ? 12 : 6;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 dark:bg-blue-400/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
      
      {/* Larger floating elements */}
      {intensity !== 'minimal' && (
        <>
          <div 
            className="absolute w-2 h-2 bg-purple-400/20 dark:bg-purple-400/15 rounded-full animate-float"
            style={{
              left: '20%',
              top: '30%',
              animationDelay: '1s',
              animationDuration: '4s',
            }}
          />
          <div 
            className="absolute w-3 h-3 bg-emerald-400/20 dark:bg-emerald-400/15 rounded-full animate-float"
            style={{
              left: '80%',
              top: '70%',
              animationDelay: '2s',
              animationDuration: '5s',
            }}
          />
        </>
      )}
    </div>
  );
}

function GeometricPatternBackground({ intensity }: { intensity: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(139, 92, 246, 0.05) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(139, 92, 246, 0.05) 75%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
        }}
      />
      
      {/* Floating geometric shapes */}
      {intensity !== 'minimal' && (
        <>
          <div 
            className="absolute w-16 h-16 border border-blue-400/20 dark:border-blue-400/15 rotate-45 animate-rotate-slow"
            style={{
              left: '15%',
              top: '20%',
            }}
          />
          <div 
            className="absolute w-12 h-12 bg-purple-400/10 dark:bg-purple-400/8 rounded-full animate-pulse-slow"
            style={{
              right: '20%',
              top: '60%',
            }}
          />
          <div 
            className="absolute w-8 h-8 bg-emerald-400/15 dark:bg-emerald-400/10 transform rotate-12 animate-float"
            style={{
              left: '70%',
              bottom: '30%',
            }}
          />
        </>
      )}
      
      {intensity === 'enhanced' && (
        <>
          <div 
            className="absolute w-20 h-20 border-2 border-pink-400/15 dark:border-pink-400/10 rounded-lg rotate-12 animate-pulse"
            style={{
              right: '10%',
              top: '15%',
            }}
          />
          <div 
            className="absolute w-6 h-6 bg-cyan-400/20 dark:bg-cyan-400/15 rotate-45 animate-bounce-in"
            style={{
              left: '40%',
              bottom: '20%',
              animationDelay: '1s',
            }}
          />
        </>
      )}
    </div>
  );
}