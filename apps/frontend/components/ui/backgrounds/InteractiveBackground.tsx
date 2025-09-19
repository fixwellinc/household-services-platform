'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { prefersReducedMotion } from '@/lib/animation-utils';

interface InteractiveBackgroundProps {
  effect?: 'ripple' | 'magnetic' | 'particle-trail' | 'glow-follow' | 'distortion';
  intensity?: 'subtle' | 'moderate' | 'strong';
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export function InteractiveBackground({
  effect = 'glow-follow',
  intensity = 'moderate',
  color = 'rgba(59, 130, 246, 0.1)',
  className = '',
  children
}: InteractiveBackgroundProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || reducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [reducedMotion]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, reducedMotion]);

  // Canvas-based effects for more complex interactions
  useEffect(() => {
    if (reducedMotion || effect === 'glow-follow') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let particles: Particle[] = [];
    let ripples: Ripple[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.maxLife = 60 + Math.random() * 60;
        this.size = 1 + Math.random() * 3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vx *= 0.99;
        this.vy *= 0.99;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 100 + Math.random() * 100;
        this.alpha = 1;
      }

      update() {
        this.radius += 2;
        this.alpha = 1 - (this.radius / this.maxRadius);
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      if (effect === 'particle-trail' && isHovering) {
        if (Math.random() < 0.3) {
          particles.push(new Particle(mousePosition.x, mousePosition.y));
        }
      }

      particles = particles.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return particle.life > 0;
      });

      // Update and draw ripples
      if (effect === 'ripple') {
        ripples = ripples.filter(ripple => {
          ripple.update();
          ripple.draw(ctx);
          return ripple.alpha > 0;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Add ripple on click
    const handleClick = (e: MouseEvent) => {
      if (effect === 'ripple') {
        const rect = canvas.getBoundingClientRect();
        ripples.push(new Ripple(e.clientX - rect.left, e.clientY - rect.top));
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effect, isHovering, mousePosition, color, reducedMotion]);

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'subtle': return 0.5;
      case 'moderate': return 1;
      case 'strong': return 1.5;
      default: return 1;
    }
  };

  const getGlowStyle = () => {
    if (reducedMotion || !isHovering || effect !== 'glow-follow') return {};

    const multiplier = getIntensityMultiplier();
    return {
      background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, ${color} 0%, transparent 70%)`,
      opacity: 0.6 * multiplier,
      transition: 'opacity 0.3s ease-out'
    };
  };

  const getMagneticStyle = () => {
    if (reducedMotion || !isHovering || effect !== 'magnetic') return {};

    const multiplier = getIntensityMultiplier();
    const offsetX = (mousePosition.x - (containerRef.current?.offsetWidth || 0) / 2) * 0.02 * multiplier;
    const offsetY = (mousePosition.y - (containerRef.current?.offsetHeight || 0) / 2) * 0.02 * multiplier;

    return {
      transform: `translate(${offsetX}px, ${offsetY}px)`,
      transition: 'transform 0.1s ease-out'
    };
  };

  const getDistortionStyle = () => {
    if (reducedMotion || !isHovering || effect !== 'distortion') return {};

    const multiplier = getIntensityMultiplier();
    const distortionX = Math.sin(Date.now() * 0.001) * 2 * multiplier;
    const distortionY = Math.cos(Date.now() * 0.001) * 2 * multiplier;

    return {
      transform: `skew(${distortionX}deg, ${distortionY}deg)`,
      transition: 'transform 0.1s ease-out'
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={getMagneticStyle()}
    >
      {/* Glow effect overlay */}
      {effect === 'glow-follow' && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={getGlowStyle()}
        />
      )}

      {/* Canvas for particle and ripple effects */}
      {(effect === 'particle-trail' || effect === 'ripple') && !reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Content */}
      <div 
        className="relative z-10"
        style={getDistortionStyle()}
      >
        {children}
      </div>
    </div>
  );
}

// Simplified CSS-only interactive background for better performance
export function CSSInteractiveBackground({
  className = '',
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Interactive gradient that follows mouse */}
      <div 
        className="absolute inset-0 opacity-20 transition-all duration-300 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle 300px at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`
        }}
      />
      
      {/* Secondary interactive layer */}
      <div 
        className="absolute inset-0 opacity-10 transition-all duration-500 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle 500px at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}