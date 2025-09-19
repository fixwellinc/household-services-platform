'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FluidTypography } from './FluidTypography';

// Visual emphasis techniques
interface EmphasisProps extends HTMLAttributes<HTMLElement> {
  technique?: 'color' | 'weight' | 'spacing' | 'background' | 'border' | 'shadow' | 'gradient';
  intensity?: 'subtle' | 'moderate' | 'strong' | 'dramatic';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  children: React.ReactNode;
}

export const VisualEmphasis = forwardRef<HTMLElement, EmphasisProps>(
  ({ 
    technique = 'color',
    intensity = 'moderate',
    color = 'primary',
    className,
    children,
    style,
    ...props 
  }, ref) => {
    const getEmphasisStyles = () => {
      const intensityMultiplier = {
        subtle: 0.5,
        moderate: 1,
        strong: 1.5,
        dramatic: 2
      }[intensity];

      const colorMap = {
        primary: { 
          light: 'rgba(59, 130, 246, 0.1)', 
          medium: 'rgba(59, 130, 246, 0.2)', 
          strong: 'rgba(59, 130, 246, 0.3)',
          text: '#3b82f6'
        },
        secondary: { 
          light: 'rgba(139, 92, 246, 0.1)', 
          medium: 'rgba(139, 92, 246, 0.2)', 
          strong: 'rgba(139, 92, 246, 0.3)',
          text: '#8b5cf6'
        },
        accent: { 
          light: 'rgba(16, 185, 129, 0.1)', 
          medium: 'rgba(16, 185, 129, 0.2)', 
          strong: 'rgba(16, 185, 129, 0.3)',
          text: '#10b981'
        },
        success: { 
          light: 'rgba(34, 197, 94, 0.1)', 
          medium: 'rgba(34, 197, 94, 0.2)', 
          strong: 'rgba(34, 197, 94, 0.3)',
          text: '#22c55e'
        },
        warning: { 
          light: 'rgba(245, 158, 11, 0.1)', 
          medium: 'rgba(245, 158, 11, 0.2)', 
          strong: 'rgba(245, 158, 11, 0.3)',
          text: '#f59e0b'
        },
        error: { 
          light: 'rgba(239, 68, 68, 0.1)', 
          medium: 'rgba(239, 68, 68, 0.2)', 
          strong: 'rgba(239, 68, 68, 0.3)',
          text: '#ef4444'
        },
        neutral: { 
          light: 'rgba(107, 114, 128, 0.1)', 
          medium: 'rgba(107, 114, 128, 0.2)', 
          strong: 'rgba(107, 114, 128, 0.3)',
          text: '#6b7280'
        }
      };

      const currentColor = colorMap[color];

      switch (technique) {
        case 'color':
          return {
            color: currentColor.text,
            filter: `saturate(${1 + intensityMultiplier * 0.5})`
          };

        case 'weight':
          return {
            fontWeight: Math.min(900, 400 + intensityMultiplier * 200),
            textShadow: intensity === 'dramatic' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
          };

        case 'spacing':
          return {
            letterSpacing: `${intensityMultiplier * 0.05}em`,
            wordSpacing: `${intensityMultiplier * 0.1}em`
          };

        case 'background':
          return {
            background: intensity === 'subtle' ? currentColor.light : 
                       intensity === 'moderate' ? currentColor.medium : 
                       currentColor.strong,
            padding: `${0.25 * intensityMultiplier}rem ${0.5 * intensityMultiplier}rem`,
            borderRadius: `${0.25 * intensityMultiplier}rem`,
            backdropFilter: 'blur(10px)'
          };

        case 'border':
          return {
            borderLeft: `${2 * intensityMultiplier}px solid ${currentColor.text}`,
            paddingLeft: `${0.75 * intensityMultiplier}rem`,
            borderRadius: '0 0.25rem 0.25rem 0'
          };

        case 'shadow':
          return {
            textShadow: `0 ${2 * intensityMultiplier}px ${4 * intensityMultiplier}px ${currentColor.medium}`,
            filter: `drop-shadow(0 ${intensityMultiplier}px ${2 * intensityMultiplier}px ${currentColor.light})`
          };

        case 'gradient':
          return {
            background: `linear-gradient(135deg, ${currentColor.text} 0%, ${colorMap.secondary.text} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `saturate(${1 + intensityMultiplier * 0.3})`
          };

        default:
          return {};
      }
    };

    return (
      <span
        ref={ref as any}
        className={cn('inline-block', className)}
        style={{ ...getEmphasisStyles(), ...style }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisualEmphasis.displayName = 'VisualEmphasis';

// Content hierarchy components
interface ContentSectionProps extends HTMLAttributes<HTMLElement> {
  level?: 1 | 2 | 3 | 4;
  spacing?: 'tight' | 'normal' | 'relaxed' | 'loose';
  alignment?: 'left' | 'center' | 'right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

export const ContentSection = forwardRef<HTMLElement, ContentSectionProps>(
  ({ 
    level = 1,
    spacing = 'normal',
    alignment = 'left',
    maxWidth = 'full',
    className,
    children,
    ...props 
  }, ref) => {
    const getSpacingClass = () => {
      const spacingMap = {
        tight: 'space-y-2',
        normal: 'space-y-4',
        relaxed: 'space-y-6',
        loose: 'space-y-8'
      };
      return spacingMap[spacing];
    };

    const getAlignmentClass = () => {
      const alignmentMap = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      };
      return alignmentMap[alignment];
    };

    const getMaxWidthClass = () => {
      const maxWidthMap = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full'
      };
      return maxWidthMap[maxWidth];
    };

    const getPaddingClass = () => {
      const paddingMap = {
        1: 'py-8 md:py-12',
        2: 'py-6 md:py-10',
        3: 'py-4 md:py-8',
        4: 'py-3 md:py-6'
      };
      return paddingMap[level];
    };

    return (
      <section
        ref={ref as any}
        className={cn(
          getSpacingClass(),
          getAlignmentClass(),
          getMaxWidthClass(),
          getPaddingClass(),
          alignment === 'center' && 'mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </section>
    );
  }
);

ContentSection.displayName = 'ContentSection';

// Reading flow optimization
interface ReadingFlowProps extends HTMLAttributes<HTMLDivElement> {
  measure?: 'narrow' | 'normal' | 'wide';
  leading?: 'tight' | 'normal' | 'relaxed' | 'loose';
  className?: string;
  children: React.ReactNode;
}

export const ReadingFlow = forwardRef<HTMLDivElement, ReadingFlowProps>(
  ({ 
    measure = 'normal',
    leading = 'normal',
    className,
    children,
    ...props 
  }, ref) => {
    const getMeasureClass = () => {
      // Optimal line length for readability (45-75 characters)
      const measureMap = {
        narrow: 'max-w-prose-narrow', // ~45ch
        normal: 'max-w-prose',        // ~65ch
        wide: 'max-w-prose-wide'      // ~75ch
      };
      return measureMap[measure];
    };

    const getLeadingClass = () => {
      const leadingMap = {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed',
        loose: 'leading-loose'
      };
      return leadingMap[leading];
    };

    return (
      <div
        ref={ref}
        className={cn(
          getMeasureClass(),
          getLeadingClass(),
          'text-balance', // CSS text-wrap: balance for better line breaks
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ReadingFlow.displayName = 'ReadingFlow';

// Accessibility-enhanced contrast
interface AccessibleTextProps extends HTMLAttributes<HTMLElement> {
  contrastLevel?: 'aa' | 'aaa';
  size?: 'small' | 'normal' | 'large';
  background?: 'light' | 'dark' | 'auto';
  className?: string;
  children: React.ReactNode;
}

export const AccessibleText = forwardRef<HTMLElement, AccessibleTextProps>(
  ({ 
    contrastLevel = 'aa',
    size = 'normal',
    background = 'auto',
    className,
    children,
    style,
    ...props 
  }, ref) => {
    const getContrastStyles = () => {
      // WCAG contrast ratios: AA = 4.5:1 (normal), 3:1 (large), AAA = 7:1 (normal), 4.5:1 (large)
      const isLargeText = size === 'large';
      
      if (background === 'light') {
        return {
          color: contrastLevel === 'aaa' ? 
            (isLargeText ? '#333333' : '#1a1a1a') : 
            (isLargeText ? '#4a4a4a' : '#333333')
        };
      } else if (background === 'dark') {
        return {
          color: contrastLevel === 'aaa' ? 
            (isLargeText ? '#f0f0f0' : '#ffffff') : 
            (isLargeText ? '#e0e0e0' : '#f0f0f0')
        };
      }
      
      return {}; // Auto mode relies on CSS custom properties
    };

    return (
      <span
        ref={ref as any}
        className={cn(
          'contrast-enhanced',
          contrastLevel === 'aaa' && 'contrast-aaa',
          className
        )}
        style={{ ...getContrastStyles(), ...style }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

AccessibleText.displayName = 'AccessibleText';