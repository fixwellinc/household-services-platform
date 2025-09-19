'use client';

import { useEffect, useState, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/animation-utils';

interface GeometricPatternOverlayProps {
  pattern?: 'hexagon' | 'triangle' | 'diamond' | 'circle' | 'mixed';
  density?: 'sparse' | 'medium' | 'dense';
  opacity?: number;
  interactive?: boolean;
  className?: string;
}

export function GeometricPatternOverlay({
  pattern = 'mixed',
  density = 'medium',
  opacity = 0.1,
  interactive = true,
  className = ''
}: GeometricPatternOverlayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!interactive || reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive, reducedMotion]);

  const getPatternDensity = () => {
    switch (density) {
      case 'sparse': return 20;
      case 'medium': return 35;
      case 'dense': return 50;
      default: return 35;
    }
  };

  const generatePattern = () => {
    const patternCount = getPatternDensity();
    const patterns = [];

    for (let i = 0; i < patternCount; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = 20 + Math.random() * 40;
      const rotation = Math.random() * 360;
      const delay = Math.random() * 3;

      // Calculate distance from mouse for interactive effects
      const distanceFromMouse = interactive && !reducedMotion ? 
        Math.sqrt(Math.pow(x/100 - mousePosition.x, 2) + Math.pow(y/100 - mousePosition.y, 2)) : 1;
      
      const scale = interactive && !reducedMotion ? 
        Math.max(0.5, 1 - distanceFromMouse * 0.3) : 1;

      const currentPattern = pattern === 'mixed' ? 
        ['hexagon', 'triangle', 'diamond', 'circle'][Math.floor(Math.random() * 4)] : 
        pattern;

      patterns.push(
        <GeometricShape
          key={i}
          type={currentPattern as 'hexagon' | 'triangle' | 'diamond' | 'circle'}
          x={x}
          y={y}
          size={size}
          rotation={rotation}
          delay={delay}
          scale={scale}
          opacity={opacity}
          animated={!reducedMotion}
        />
      );
    }

    return patterns;
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {generatePattern()}
      </svg>
    </div>
  );
}

interface GeometricShapeProps {
  type: 'hexagon' | 'triangle' | 'diamond' | 'circle';
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  scale: number;
  opacity: number;
  animated: boolean;
}

function GeometricShape({
  type,
  x,
  y,
  size,
  rotation,
  delay,
  scale,
  opacity,
  animated
}: GeometricShapeProps) {
  const baseProps = {
    transform: `translate(${x}%, ${y}%) rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: 'center',
    opacity: opacity * 0.6,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '0.1',
    filter: 'url(#glow)'
  };

  const animationProps = animated ? {
    style: {
      animation: `geometric-float ${3 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }
  } : {};

  const renderShape = () => {
    const halfSize = size / 2;
    
    switch (type) {
      case 'hexagon':
        const hexPoints = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          const px = halfSize * Math.cos(angle);
          const py = halfSize * Math.sin(angle);
          return `${px},${py}`;
        }).join(' ');
        
        return (
          <polygon
            points={hexPoints}
            {...baseProps}
            {...animationProps}
          />
        );

      case 'triangle':
        const triPoints = [
          `0,${-halfSize}`,
          `${halfSize * 0.866},${halfSize * 0.5}`,
          `${-halfSize * 0.866},${halfSize * 0.5}`
        ].join(' ');
        
        return (
          <polygon
            points={triPoints}
            {...baseProps}
            {...animationProps}
          />
        );

      case 'diamond':
        const diamondPoints = [
          `0,${-halfSize}`,
          `${halfSize},0`,
          `0,${halfSize}`,
          `${-halfSize},0`
        ].join(' ');
        
        return (
          <polygon
            points={diamondPoints}
            {...baseProps}
            {...animationProps}
          />
        );

      case 'circle':
        return (
          <circle
            r={halfSize}
            {...baseProps}
            {...animationProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <g>
      {renderShape()}
    </g>
  );
}

// CSS-only geometric pattern component for better performance
export function CSSGeometricPattern({
  pattern = 'grid',
  size = 40,
  opacity = 0.05,
  className = ''
}: {
  pattern?: 'grid' | 'dots' | 'diagonal' | 'hexagon';
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const getPatternStyle = () => {
    const color = `rgba(59, 130, 246, ${opacity})`;
    
    switch (pattern) {
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${size}px ${size}px`
        };
        
      case 'dots':
        return {
          backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`
        };
        
      case 'diagonal':
        return {
          backgroundImage: `
            linear-gradient(45deg, ${color} 25%, transparent 25%),
            linear-gradient(-45deg, ${color} 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, ${color} 75%),
            linear-gradient(-45deg, transparent 75%, ${color} 75%)
          `,
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: `0 0, 0 ${size/2}px, ${size/2}px -${size/2}px, -${size/2}px 0px`
        };
        
      case 'hexagon':
        return {
          backgroundImage: `
            radial-gradient(circle at 50% 0%, transparent 35%, ${color} 35%, ${color} 65%, transparent 65%),
            radial-gradient(circle at 0% 50%, transparent 35%, ${color} 35%, ${color} 65%, transparent 65%),
            radial-gradient(circle at 100% 50%, transparent 35%, ${color} 35%, ${color} 65%, transparent 65%)
          `,
          backgroundSize: `${size}px ${size * 0.866}px`
        };
        
      default:
        return {};
    }
  };

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={getPatternStyle()}
    />
  );
}