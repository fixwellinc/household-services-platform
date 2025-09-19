'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

export function AnimatedCleaningIcon({ className, animated = true, size = 'md' }: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      className={cn(sizeClasses[size], 'transition-all duration-300', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* House outline */}
      <path
        d="M8 32L32 8L56 32V56H8V32Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && 'stroke-blue-500'
        )}
      />
      
      {/* Roof */}
      <path
        d="M8 32L32 8L56 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Door */}
      <rect
        x="28"
        y="40"
        width="8"
        height="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Windows */}
      <rect
        x="16"
        y="36"
        width="8"
        height="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="40"
        y="36"
        width="8"
        height="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Sparkles for cleaning effect */}
      {animated && (
        <>
          <circle
            cx="20"
            cy="24"
            r="2"
            fill="currentColor"
            className={cn(
              'transition-all duration-700',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '100ms' }}
          />
          <circle
            cx="44"
            cy="28"
            r="1.5"
            fill="currentColor"
            className={cn(
              'transition-all duration-700',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '200ms' }}
          />
          <circle
            cx="32"
            cy="20"
            r="1"
            fill="currentColor"
            className={cn(
              'transition-all duration-700',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '300ms' }}
          />
        </>
      )}
    </svg>
  );
}

export function AnimatedMaintenanceIcon({ className, animated = true, size = 'md' }: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      className={cn(sizeClasses[size], 'transition-all duration-300', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wrench */}
      <path
        d="M20 44L44 20C46 18 50 18 52 20C54 22 54 26 52 28L48 32L52 36C54 38 54 42 52 44C50 46 46 46 44 44L40 40L36 44C34 46 30 46 28 44C26 42 26 38 28 36L32 32L20 44Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && 'stroke-orange-500 rotate-12'
        )}
        style={{ transformOrigin: '36px 32px' }}
      />
      
      {/* Screwdriver */}
      <path
        d="M12 52L32 32L36 36L16 56C14 58 10 58 8 56C6 54 6 50 8 48L12 52Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && 'stroke-blue-500 -rotate-12'
        )}
        style={{ transformOrigin: '22px 44px' }}
      />
      
      {/* Gear */}
      <circle
        cx="48"
        cy="16"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-1000',
          animated && isHovered && 'rotate-180'
        )}
        style={{ transformOrigin: '48px 16px' }}
      />
      
      {/* Gear teeth */}
      <path
        d="M48 10V22M42 16H54M45 13L51 19M51 13L45 19"
        stroke="currentColor"
        strokeWidth="1"
        className={cn(
          'transition-all duration-1000',
          animated && isHovered && 'rotate-180'
        )}
        style={{ transformOrigin: '48px 16px' }}
      />
    </svg>
  );
}

export function AnimatedRepairIcon({ className, animated = true, size = 'md' }: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      className={cn(sizeClasses[size], 'transition-all duration-300', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Lightning bolt */}
      <path
        d="M32 8L20 32H28L24 56L44 24H36L32 8Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        className={cn(
          'transition-all duration-300',
          animated && isHovered && 'fill-yellow-400 stroke-yellow-500'
        )}
      />
      
      {/* Electric sparks */}
      {animated && (
        <>
          <circle
            cx="16"
            cy="28"
            r="1"
            fill="currentColor"
            className={cn(
              'transition-all duration-500',
              isHovered ? 'opacity-100 scale-150 fill-yellow-400' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '100ms' }}
          />
          <circle
            cx="48"
            cy="36"
            r="1"
            fill="currentColor"
            className={cn(
              'transition-all duration-500',
              isHovered ? 'opacity-100 scale-150 fill-yellow-400' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '200ms' }}
          />
          <circle
            cx="40"
            cy="16"
            r="0.5"
            fill="currentColor"
            className={cn(
              'transition-all duration-500',
              isHovered ? 'opacity-100 scale-200 fill-yellow-400' : 'opacity-0 scale-0'
            )}
            style={{ transitionDelay: '150ms' }}
          />
        </>
      )}
    </svg>
  );
}

export function AnimatedOrganizationIcon({ className, animated = true, size = 'md' }: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <svg
      className={cn(sizeClasses[size], 'transition-all duration-300', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Boxes/containers */}
      <rect
        x="8"
        y="16"
        width="16"
        height="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && 'translate-x-1 -translate-y-1'
        )}
      />
      <rect
        x="28"
        y="16"
        width="16"
        height="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && '-translate-y-2'
        )}
        style={{ transitionDelay: '100ms' }}
      />
      <rect
        x="48"
        y="16"
        width="8"
        height="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && '-translate-x-1 -translate-y-1'
        )}
        style={{ transitionDelay: '200ms' }}
      />
      
      {/* Bottom row */}
      <rect
        x="8"
        y="36"
        width="24"
        height="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && 'translate-x-2'
        )}
        style={{ transitionDelay: '150ms' }}
      />
      <rect
        x="36"
        y="36"
        width="20"
        height="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className={cn(
          'transition-all duration-500',
          animated && isHovered && '-translate-x-2'
        )}
        style={{ transitionDelay: '250ms' }}
      />
      
      {/* Organization lines */}
      <path
        d="M16 8L16 16M36 8L36 16M52 8L52 16"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2,2"
        className={cn(
          'transition-all duration-700',
          animated && isHovered && 'stroke-blue-500'
        )}
      />
    </svg>
  );
}