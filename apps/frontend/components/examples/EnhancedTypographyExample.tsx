'use client';

import { useState } from 'react';
import { 
  FluidTypography, 
  DisplayText, 
  HeroText, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4, 
  LeadText, 
  BodyText, 
  SmallText, 
  CaptionText 
} from '@/components/ui/typography/FluidTypography';
import { 
  VisualEmphasis, 
  ContentSection, 
  ReadingFlow, 
  AccessibleText 
} from '@/components/ui/typography/VisualHierarchy';

export function EnhancedTypographyExample() {
  const [selectedGradient, setSelectedGradient] = useState<'primary' | 'secondary' | 'accent' | 'warm' | 'none'>('primary');
  const [selectedEmphasis, setSelectedEmphasis] = useState<'normal' | 'medium' | 'high' | 'critical'>('normal');
  const [selectedContrast, setSelectedContrast] = useState<'aa' | 'aaa'>('aa');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Controls */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-6xl mx-auto">
          <Heading2 className="mb-6">Enhanced Typography System</Heading2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gradient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Gradient
              </label>
              <select
                value={selectedGradient}
                onChange={(e) => setSelectedGradient(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="primary">Primary (Blue-Purple)</option>
                <option value="secondary">Secondary (Purple-Pink)</option>
                <option value="accent">Accent (Emerald-Teal)</option>
                <option value="warm">Warm (Orange-Red)</option>
              </select>
            </div>

            {/* Emphasis Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Emphasis
              </label>
              <select
                value={selectedEmphasis}
                onChange={(e) => setSelectedEmphasis(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Contrast Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accessibility Level
              </label>
              <select
                value={selectedContrast}
                onChange={(e) => setSelectedContrast(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="aa">WCAG AA</option>
                <option value="aaa">WCAG AAA</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Scale Demo */}
      <ContentSection level={1} spacing="relaxed" alignment="center" maxWidth="2xl">
        <DisplayText 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-6"
        >
          Display Text
        </DisplayText>
        
        <HeroText 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-6"
        >
          Hero Text
        </HeroText>
        
        <Heading1 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-4"
        >
          Heading 1
        </Heading1>
        
        <Heading2 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-4"
        >
          Heading 2
        </Heading2>
        
        <Heading3 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-4"
        >
          Heading 3
        </Heading3>
        
        <Heading4 
          gradient={selectedGradient} 
          emphasis={selectedEmphasis}
          className="mb-6"
        >
          Heading 4
        </Heading4>
        
        <LeadText className="mb-4 text-gray-600 dark:text-gray-300">
          This is lead text that introduces the main content. It's larger than body text 
          and helps establish hierarchy and draw attention to key information.
        </LeadText>
        
        <ReadingFlow measure="normal" leading="relaxed">
          <BodyText className="mb-4 text-gray-700 dark:text-gray-200">
            This is body text with optimal reading flow. The line length is set to approximately 
            65 characters for optimal readability, and the line height is adjusted for comfortable 
            reading. This text demonstrates how proper typography enhances the user experience.
          </BodyText>
        </ReadingFlow>
        
        <SmallText className="mb-2 text-gray-600 dark:text-gray-400">
          This is small text for secondary information
        </SmallText>
        
        <CaptionText className="text-gray-500 dark:text-gray-500">
          This is caption text for image captions and fine print
        </CaptionText>
      </ContentSection>

      {/* Visual Emphasis Techniques */}
      <ContentSection level={2} spacing="relaxed" className="bg-white/50 dark:bg-gray-800/50">
        <Heading2 className="text-center mb-12">Visual Emphasis Techniques</Heading2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Color Emphasis */}
          <EmphasisDemo title="Color Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="color" intensity="moderate" color="primary">
                color emphasis
              </VisualEmphasis>{' '}
              to highlight important information.
            </BodyText>
          </EmphasisDemo>

          {/* Weight Emphasis */}
          <EmphasisDemo title="Weight Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="weight" intensity="strong">
                weight emphasis
              </VisualEmphasis>{' '}
              for strong importance.
            </BodyText>
          </EmphasisDemo>

          {/* Spacing Emphasis */}
          <EmphasisDemo title="Spacing Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="spacing" intensity="moderate">
                spacing emphasis
              </VisualEmphasis>{' '}
              for subtle distinction.
            </BodyText>
          </EmphasisDemo>

          {/* Background Emphasis */}
          <EmphasisDemo title="Background Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="background" intensity="moderate" color="primary">
                background emphasis
              </VisualEmphasis>{' '}
              for highlighting.
            </BodyText>
          </EmphasisDemo>

          {/* Border Emphasis */}
          <EmphasisDemo title="Border Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="border" intensity="moderate" color="accent">
                border emphasis
              </VisualEmphasis>{' '}
              for callouts.
            </BodyText>
          </EmphasisDemo>

          {/* Gradient Emphasis */}
          <EmphasisDemo title="Gradient Emphasis">
            <BodyText className="mb-4">
              Regular text with{' '}
              <VisualEmphasis technique="gradient" intensity="strong" color="secondary">
                gradient emphasis
              </VisualEmphasis>{' '}
              for premium feel.
            </BodyText>
          </EmphasisDemo>
        </div>
      </ContentSection>

      {/* Accessibility Features */}
      <ContentSection level={2} spacing="relaxed">
        <Heading2 className="text-center mb-12">Accessibility Features</Heading2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contrast Levels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Heading3 className="mb-4">Contrast Levels</Heading3>
            <div className="space-y-4">
              <div>
                <SmallText className="text-gray-600 dark:text-gray-400 mb-2">
                  WCAG AA Compliance
                </SmallText>
                <AccessibleText contrastLevel="aa" size="normal">
                  This text meets WCAG AA contrast requirements for normal text (4.5:1 ratio)
                </AccessibleText>
              </div>
              <div>
                <SmallText className="text-gray-600 dark:text-gray-400 mb-2">
                  WCAG AAA Compliance
                </SmallText>
                <AccessibleText contrastLevel="aaa" size="normal">
                  This text meets WCAG AAA contrast requirements for normal text (7:1 ratio)
                </AccessibleText>
              </div>
            </div>
          </div>

          {/* Reading Flow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Heading3 className="mb-4">Reading Flow Optimization</Heading3>
            <ReadingFlow measure="normal" leading="relaxed">
              <BodyText className="text-gray-700 dark:text-gray-200">
                This text is optimized for reading flow with proper line length (measure) 
                and line height (leading) to reduce eye strain and improve comprehension. 
                The optimal line length is between 45-75 characters per line.
              </BodyText>
            </ReadingFlow>
          </div>
        </div>
      </ContentSection>

      {/* Responsive Typography */}
      <ContentSection level={2} spacing="relaxed" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <Heading2 className="text-center mb-12">Responsive Typography</Heading2>
        
        <div className="text-center space-y-6">
          <div>
            <CaptionText className="text-gray-600 dark:text-gray-400 mb-2 block">
              Fluid Display Text (scales from 2.5rem to 5rem)
            </CaptionText>
            <FluidTypography as="h1" scale="display" className="text-gray-900 dark:text-white">
              Responsive Design
            </FluidTypography>
          </div>
          
          <div>
            <CaptionText className="text-gray-600 dark:text-gray-400 mb-2 block">
              Fluid Hero Text (scales from 2rem to 4rem)
            </CaptionText>
            <FluidTypography as="h2" scale="hero" className="text-gray-800 dark:text-gray-100">
              Scales Beautifully
            </FluidTypography>
          </div>
          
          <div>
            <CaptionText className="text-gray-600 dark:text-gray-400 mb-2 block">
              Fluid Body Text (scales from 1rem to 1.125rem)
            </CaptionText>
            <FluidTypography as="p" scale="body" className="text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">
              This body text scales smoothly across all device sizes, maintaining optimal 
              readability from mobile phones to large desktop screens. The fluid scaling 
              ensures consistent visual hierarchy at every breakpoint.
            </FluidTypography>
          </div>
        </div>
      </ContentSection>

      {/* CSS Gradient Text Examples */}
      <ContentSection level={2} spacing="relaxed">
        <Heading2 className="text-center mb-12">CSS Gradient Text Effects</Heading2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          <GradientDemo className="text-gradient-primary" title="Primary Gradient">
            Beautiful Gradients
          </GradientDemo>
          
          <GradientDemo className="text-gradient-secondary" title="Secondary Gradient">
            Stunning Effects
          </GradientDemo>
          
          <GradientDemo className="text-gradient-accent" title="Accent Gradient">
            Modern Design
          </GradientDemo>
          
          <GradientDemo className="text-gradient-warm" title="Warm Gradient">
            Vibrant Colors
          </GradientDemo>
          
          <GradientDemo className="text-gradient-cool" title="Cool Gradient">
            Fresh Aesthetics
          </GradientDemo>
          
          <GradientDemo className="text-gradient-rainbow" title="Rainbow Gradient">
            Creative Expression
          </GradientDemo>
        </div>
      </ContentSection>
    </div>
  );
}

function EmphasisDemo({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <Heading4 className="mb-4">{title}</Heading4>
      {children}
    </div>
  );
}

function GradientDemo({ 
  className, 
  title, 
  children 
}: { 
  className: string; 
  title: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <CaptionText className="text-gray-600 dark:text-gray-400 mb-4 block">
        {title}
      </CaptionText>
      <Heading3 className={className}>
        {children}
      </Heading3>
    </div>
  );
}