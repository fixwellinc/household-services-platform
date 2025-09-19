'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Fluid typography scale configuration
const fluidScales = {
  'display': {
    minSize: '2.5rem',    // 40px
    maxSize: '5rem',      // 80px
    minViewport: '20rem', // 320px
    maxViewport: '80rem', // 1280px
    lineHeight: '1.1',
    letterSpacing: '-0.025em',
    fontWeight: '800'
  },
  'hero': {
    minSize: '2rem',      // 32px
    maxSize: '4rem',      // 64px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.15',
    letterSpacing: '-0.025em',
    fontWeight: '700'
  },
  'h1': {
    minSize: '1.75rem',   // 28px
    maxSize: '3rem',      // 48px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    fontWeight: '700'
  },
  'h2': {
    minSize: '1.5rem',    // 24px
    maxSize: '2.25rem',   // 36px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.25',
    letterSpacing: '-0.015em',
    fontWeight: '600'
  },
  'h3': {
    minSize: '1.25rem',   // 20px
    maxSize: '1.875rem',  // 30px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    fontWeight: '600'
  },
  'h4': {
    minSize: '1.125rem',  // 18px
    maxSize: '1.5rem',    // 24px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.35',
    letterSpacing: '0',
    fontWeight: '600'
  },
  'lead': {
    minSize: '1.125rem',  // 18px
    maxSize: '1.375rem',  // 22px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.6',
    letterSpacing: '0',
    fontWeight: '400'
  },
  'body': {
    minSize: '1rem',      // 16px
    maxSize: '1.125rem',  // 18px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.65',
    letterSpacing: '0',
    fontWeight: '400'
  },
  'small': {
    minSize: '0.875rem',  // 14px
    maxSize: '1rem',      // 16px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontWeight: '400'
  },
  'caption': {
    minSize: '0.75rem',   // 12px
    maxSize: '0.875rem',  // 14px
    minViewport: '20rem',
    maxViewport: '80rem',
    lineHeight: '1.4',
    letterSpacing: '0.025em',
    fontWeight: '400'
  }
} as const;

type TypographyScale = keyof typeof fluidScales;

interface FluidTypographyProps extends HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  scale: TypographyScale;
  gradient?: 'primary' | 'secondary' | 'accent' | 'warm' | 'none';
  emphasis?: 'normal' | 'medium' | 'high' | 'critical';
  contrast?: 'auto' | 'high' | 'low';
  className?: string;
  children: React.ReactNode;
}

export const FluidTypography = forwardRef<HTMLElement, FluidTypographyProps>(
  ({ 
    as: Component = 'p', 
    scale, 
    gradient = 'none',
    emphasis = 'normal',
    contrast = 'auto',
    className, 
    children, 
    style,
    ...props 
  }, ref) => {
    const scaleConfig = fluidScales[scale];
    
    // Calculate fluid font size using clamp()
    const fluidFontSize = `clamp(${scaleConfig.minSize}, ${scaleConfig.minSize} + (${scaleConfig.maxSize} - ${scaleConfig.minSize}) * ((100vw - ${scaleConfig.minViewport}) / (${scaleConfig.maxViewport} - ${scaleConfig.minViewport})), ${scaleConfig.maxSize})`;
    
    const getEmphasisStyles = () => {
      switch (emphasis) {
        case 'medium':
          return {
            fontWeight: parseInt(scaleConfig.fontWeight) + 100,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          };
        case 'high':
          return {
            fontWeight: parseInt(scaleConfig.fontWeight) + 200,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
          };
        case 'critical':
          return {
            fontWeight: parseInt(scaleConfig.fontWeight) + 300,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          };
        default:
          return {};
      }
    };

    const getContrastStyles = () => {
      switch (contrast) {
        case 'high':
          return {
            filter: 'contrast(1.2)',
            textShadow: '0 0 1px rgba(0, 0, 0, 0.5)'
          };
        case 'low':
          return {
            opacity: 0.8
          };
        default:
          return {};
      }
    };

    const getGradientClass = () => {
      switch (gradient) {
        case 'primary':
          return 'text-gradient-primary';
        case 'secondary':
          return 'text-gradient-secondary';
        case 'accent':
          return 'text-gradient-accent';
        case 'warm':
          return 'text-gradient-warm';
        default:
          return '';
      }
    };

    const combinedStyle = {
      fontSize: fluidFontSize,
      lineHeight: scaleConfig.lineHeight,
      letterSpacing: scaleConfig.letterSpacing,
      fontWeight: scaleConfig.fontWeight,
      ...getEmphasisStyles(),
      ...getContrastStyles(),
      ...style
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          'font-mono', // Maintain monospace identity
          getGradientClass(),
          className
        )}
        style={combinedStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

FluidTypography.displayName = 'FluidTypography';

// Convenience components for common use cases
export const DisplayText = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h1" scale="display" ref={ref} {...props} />
  )
);
DisplayText.displayName = 'DisplayText';

export const HeroText = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h1" scale="hero" ref={ref} {...props} />
  )
);
HeroText.displayName = 'HeroText';

export const Heading1 = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h1" scale="h1" ref={ref} {...props} />
  )
);
Heading1.displayName = 'Heading1';

export const Heading2 = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h2" scale="h2" ref={ref} {...props} />
  )
);
Heading2.displayName = 'Heading2';

export const Heading3 = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h3" scale="h3" ref={ref} {...props} />
  )
);
Heading3.displayName = 'Heading3';

export const Heading4 = forwardRef<HTMLHeadingElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="h4" scale="h4" ref={ref} {...props} />
  )
);
Heading4.displayName = 'Heading4';

export const LeadText = forwardRef<HTMLParagraphElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="p" scale="lead" ref={ref} {...props} />
  )
);
LeadText.displayName = 'LeadText';

export const BodyText = forwardRef<HTMLParagraphElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="p" scale="body" ref={ref} {...props} />
  )
);
BodyText.displayName = 'BodyText';

export const SmallText = forwardRef<HTMLSpanElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="span" scale="small" ref={ref} {...props} />
  )
);
SmallText.displayName = 'SmallText';

export const CaptionText = forwardRef<HTMLSpanElement, Omit<FluidTypographyProps, 'scale' | 'as'>>(
  (props, ref) => (
    <FluidTypography as="span" scale="caption" ref={ref} {...props} />
  )
);
CaptionText.displayName = 'CaptionText';