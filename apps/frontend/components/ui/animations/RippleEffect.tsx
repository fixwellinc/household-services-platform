'use client';

import { useEffect, useState } from 'react';

interface RippleProps {
  duration?: number;
  color?: string;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function useRipple(duration: number = 600) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prevRipples) => prevRipples.slice(1));
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [ripples, duration]);

  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const rippleContainer = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rippleContainer.width, rippleContainer.height);
    const x = event.clientX - rippleContainer.left - size / 2;
    const y = event.clientY - rippleContainer.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prevRipples) => [...prevRipples, newRipple]);
  };

  return { ripples, addRipple };
}

export function RippleEffect({ duration = 600, color = 'rgba(255, 255, 255, 0.6)' }: RippleProps) {
  const { ripples, addRipple } = useRipple(duration);

  return {
    onClick: addRipple,
    children: (
      <span className="absolute inset-0 overflow-hidden pointer-events-none">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: color,
              animation: `ripple ${duration}ms ease-out`,
            }}
          />
        ))}
      </span>
    ),
  };
}

// Standalone Ripple Component
export function Ripple({ duration = 600, color = 'rgba(255, 255, 255, 0.6)' }: RippleProps) {
  const { ripples, addRipple } = useRipple(duration);

  return {
    addRipple,
    ripples: (
      <span className="absolute inset-0 overflow-hidden pointer-events-none rounded-inherit">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: color,
              transform: 'scale(0)',
              animation: `ripple-effect ${duration}ms ease-out`,
            }}
          />
        ))}
      </span>
    ),
  };
}

export default RippleEffect;
