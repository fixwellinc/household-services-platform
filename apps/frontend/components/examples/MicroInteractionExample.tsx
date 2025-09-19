'use client';

import React, { useState } from 'react';
import { 
  EnhancedButton, 
  ButtonPresets, 
  EnhancedInput, 
  InputPresets,
  ProgressIndicator,
  LoadingOverlay,
  SkeletonGrid,
  ProgressiveReveal,
  RevealOnScroll,
  StaggeredGrid
} from '@/components/ui/animations';
import { Card } from '@/components/ui/card';
import { Mail, Phone, Lock, Star, Heart, Download } from 'lucide-react';

/**
 * Comprehensive example showcasing all micro-interaction components
 * This demonstrates the enhanced animation system capabilities
 */
export function MicroInteractionExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(false);

  const handleAsyncAction = async () => {
    setIsLoading(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const toggleSkeletons = () => {
    setShowSkeletons(!showSkeletons);
    if (!showSkeletons) {
      setTimeout(() => setShowSkeletons(false), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      {/* Header */}
      <ProgressiveReveal>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Animation System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive micro-interaction components with smooth animations, 
            real-time validation, and premium visual effects.
          </p>
        </div>
      </ProgressiveReveal>

      {/* Enhanced Buttons Section */}
      <RevealOnScroll.FadeUp delay={200}>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Enhanced Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Premium Variants</h3>
              <ButtonPresets.CTA icon={<Star className="w-4 h-4" />}>
                Call to Action
              </ButtonPresets.CTA>
              <ButtonPresets.Primary icon={<Heart className="w-4 h-4" />}>
                Primary Action
              </ButtonPresets.Primary>
              <ButtonPresets.Glass>
                Glass Effect
              </ButtonPresets.Glass>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Loading States</h3>
              <EnhancedButton 
                variant="default" 
                loading={isLoading}
                loadingText="Processing..."
                onClick={handleAsyncAction}
              >
                Async Action
              </EnhancedButton>
              <EnhancedButton variant="outline" loading>
                Loading Button
              </EnhancedButton>
              <EnhancedButton variant="secondary" disabled>
                Disabled State
              </EnhancedButton>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Animation Variants</h3>
              <EnhancedButton variant="glow" animation="glow">
                Glow Effect
              </EnhancedButton>
              <EnhancedButton variant="premium" animation="shimmer">
                Shimmer Effect
              </EnhancedButton>
              <EnhancedButton variant="outline" animation="bounce">
                Bounce Effect
              </EnhancedButton>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Sizes & Icons</h3>
              <EnhancedButton size="sm" icon={<Download className="w-3 h-3" />}>
                Small
              </EnhancedButton>
              <EnhancedButton size="default" icon={<Download className="w-4 h-4" />}>
                Default
              </EnhancedButton>
              <EnhancedButton 
                size="lg" 
                icon={<Download className="w-5 h-5" />}
                iconPosition="right"
              >
                Large with Right Icon
              </EnhancedButton>
            </div>
          </div>
        </Card>
      </RevealOnScroll.FadeUp>

      {/* Enhanced Inputs Section */}
      <RevealOnScroll.FadeUp delay={400}>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Enhanced Form Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preset Inputs with Validation</h3>
              <InputPresets.Email 
                label="Email Address"
                placeholder="Enter your email"
                helperText="We'll never share your email"
              />
              <InputPresets.Password 
                label="Password"
                placeholder="Create a strong password"
              />
              <InputPresets.Phone 
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Validation States</h3>
              <EnhancedInput
                label="Success State"
                value="Valid input"
                validation={{
                  isValid: true,
                  message: "This looks great!"
                }}
                animation="glow"
              />
              <EnhancedInput
                label="Error State"
                value="Invalid input"
                validation={{
                  isValid: false,
                  message: "Please fix this field"
                }}
                variant="error"
              />
              <EnhancedInput
                label="Loading State"
                value="Checking..."
                validation={{
                  isValidating: true,
                  message: "Validating input..."
                }}
              />
            </div>
          </div>
        </Card>
      </RevealOnScroll.FadeUp>

      {/* Progress Indicators Section */}
      <RevealOnScroll.FadeUp delay={600}>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Progress Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Linear Progress</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Default Progress</label>
                  <ProgressIndicator variant="linear" progress={progress} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Large Progress</label>
                  <ProgressIndicator variant="linear" progress={75} size="lg" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Small Progress</label>
                  <ProgressIndicator variant="linear" progress={45} size="sm" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Other Variants</h3>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <label className="text-sm text-gray-600 block mb-2">Circular</label>
                  <ProgressIndicator variant="circular" progress={progress} />
                </div>
                <div className="text-center">
                  <label className="text-sm text-gray-600 block mb-2">Dots</label>
                  <ProgressIndicator variant="dots" />
                </div>
                <div className="text-center">
                  <label className="text-sm text-gray-600 block mb-2">Pulse</label>
                  <ProgressIndicator variant="pulse" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </RevealOnScroll.FadeUp>

      {/* Loading Overlay Section */}
      <RevealOnScroll.FadeUp delay={800}>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Loading States</h2>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <EnhancedButton onClick={toggleSkeletons}>
                Toggle Skeleton Loading
              </EnhancedButton>
              <EnhancedButton 
                onClick={() => setIsLoading(!isLoading)}
                variant="outline"
              >
                Toggle Overlay Loading
              </EnhancedButton>
            </div>

            <LoadingOverlay 
              isLoading={isLoading}
              loadingText="Processing your request..."
              variant="dots"
            >
              <div className="bg-gray-50 p-8 rounded-lg min-h-[200px] flex items-center justify-center">
                {showSkeletons ? (
                  <SkeletonGrid count={3} variant="card" />
                ) : (
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-medium">Content Area</h3>
                    <p className="text-gray-600">
                      This content will be overlaid with loading states when activated.
                    </p>
                  </div>
                )}
              </div>
            </LoadingOverlay>
          </div>
        </Card>
      </RevealOnScroll.FadeUp>

      {/* Staggered Animation Demo */}
      <RevealOnScroll.FadeUp delay={1000}>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Staggered Animations</h2>
          <StaggeredGrid staggerDelay={150} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4" />
                <h3 className="font-medium">Feature {item}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This card animates in sequence with others
                </p>
              </Card>
            ))}
          </StaggeredGrid>
        </Card>
      </RevealOnScroll.FadeUp>

      {/* Performance Note */}
      <ProgressiveReveal delay={1200}>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Performance Optimized</h3>
              <p className="text-blue-700 text-sm mt-1">
                All animations respect user preferences for reduced motion and are optimized 
                for performance with hardware acceleration and efficient intersection observers.
              </p>
            </div>
          </div>
        </Card>
      </ProgressiveReveal>
    </div>
  );
}