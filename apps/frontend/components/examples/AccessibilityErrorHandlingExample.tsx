'use client';

import React, { useState } from 'react';
import { ErrorBoundary, AnimationErrorBoundary } from '@/components/ui/error-handling/ErrorBoundary';
import { 
  ProgressiveEnhancement, 
  EnhancedComponent, 
  AnimationCapability,
  TouchCapability,
  PerformanceAware 
} from '@/components/ui/error-handling/ProgressiveEnhancement';
import { AccessibilityProvider } from '@/components/ui/accessibility/AccessibilityProvider';
import { SkipLinks } from '@/components/ui/accessibility/SkipLink';
import { AccessibleButton } from '@/components/ui/accessibility/AccessibleButton';
import { AccessibleInput } from '@/components/ui/accessibility/AccessibleInput';
import { LiveRegion } from '@/components/ui/accessibility/LiveRegion';
import { KeyboardNavigation, NavigationMenu } from '@/components/ui/accessibility/KeyboardNavigation';
import { AccessibleAnimation } from '@/components/ui/accessibility/AccessibleAnimation';

// Component that can throw errors for testing
const ErrorProneComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Intentional error for testing');
  }
  return (
    <div className="p-4 bg-green-100 rounded-lg">
      <p>This component loaded successfully!</p>
    </div>
  );
};

// Animation component for testing
const AnimatedComponent = () => (
  <div className="animate-bounce p-4 bg-blue-100 rounded-lg">
    <p>This is an animated component</p>
  </div>
);

// Static fallback for animations
const StaticComponent = () => (
  <div className="p-4 bg-gray-100 rounded-lg">
    <p>This is the static version (no animation)</p>
  </div>
);

export function AccessibilityErrorHandlingExample() {
  const [shouldError, setShouldError] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setAnnouncement('Form submitted successfully!');
      setFormData({ name: '', email: '', message: '' });
    } else {
      setAnnouncement('Please fix the form errors and try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AccessibilityProvider>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <SkipLinks />
        
        <header>
          <h1 className="text-3xl font-bold mb-4">
            Accessibility & Error Handling Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates comprehensive accessibility features and robust error handling.
          </p>
        </header>

        <main id="main-content">
          {/* Error Boundary Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Error Boundary Demo</h2>
            
            <div className="flex gap-4 mb-4">
              <AccessibleButton
                onClick={() => setShouldError(!shouldError)}
                variant="secondary"
              >
                {shouldError ? 'Fix Component' : 'Break Component'}
              </AccessibleButton>
            </div>

            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.log('Error caught by boundary:', error.message);
              }}
            >
              <ErrorProneComponent shouldError={shouldError} />
            </ErrorBoundary>
          </section>

          {/* Progressive Enhancement Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Progressive Enhancement</h2>
            
            <ProgressiveEnhancement
              requiredFeatures={['cssAnimations', 'cssTransitions']}
              fallback={<StaticComponent />}
            >
              <AnimatedComponent />
            </ProgressiveEnhancement>

            <EnhancedComponent
              enhancedVersion={
                <div className="p-4 bg-purple-100 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <p>Enhanced version with shadows and transitions</p>
                </div>
              }
              basicVersion={
                <div className="p-4 bg-purple-100 rounded-lg border">
                  <p>Basic version with simple border</p>
                </div>
              }
            />
          </section>

          {/* Animation Capability Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Animation Capability Detection</h2>
            
            <AnimationCapability
              staticFallback={<StaticComponent />}
              reducedMotionFallback={
                <div className="p-4 bg-yellow-100 rounded-lg">
                  <p>Reduced motion version - respects user preferences</p>
                </div>
              }
            >
              <AnimationErrorBoundary>
                <AccessibleAnimation
                  animationName="slide in animation"
                  announceStart="Content is animating in"
                  announceEnd="Animation complete"
                >
                  <div className="animate-slide-up p-4 bg-green-100 rounded-lg">
                    <p>This content slides up when visible</p>
                  </div>
                </AccessibleAnimation>
              </AnimationErrorBoundary>
            </AnimationCapability>
          </section>

          {/* Touch vs Mouse Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Touch vs Mouse Interface</h2>
            
            <TouchCapability
              touchVersion={
                <div className="p-6 bg-blue-100 rounded-lg">
                  <p className="text-lg">Touch interface detected - larger touch targets</p>
                  <AccessibleButton size="lg" className="mt-4">
                    Large Touch Button
                  </AccessibleButton>
                </div>
              }
              mouseVersion={
                <div className="p-4 bg-blue-100 rounded-lg">
                  <p>Mouse interface detected - compact layout</p>
                  <AccessibleButton size="sm" className="mt-2">
                    Compact Button
                  </AccessibleButton>
                </div>
              }
            >
              <div className="p-4 bg-blue-100 rounded-lg">
                <p>Universal interface</p>
                <AccessibleButton className="mt-2">
                  Standard Button
                </AccessibleButton>
              </div>
            </TouchCapability>
          </section>

          {/* Performance Aware Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Performance-Aware Components</h2>
            
            <PerformanceAware
              lowPerformanceVersion={
                <div className="p-4 bg-orange-100 rounded-lg">
                  <p>Low performance mode - simplified interface</p>
                </div>
              }
            >
              <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg shadow-xl">
                <p className="text-white">High performance mode - full effects</p>
              </div>
            </PerformanceAware>
          </section>

          {/* Accessible Form Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Accessible Form</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md">
              <AccessibleInput
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={formErrors.name}
                required
                id="name-input"
              />
              
              <AccessibleInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={formErrors.email}
                helperText="We'll never share your email"
                required
                id="email-input"
              />
              
              <div className="space-y-1">
                <label htmlFor="message-input" className="block text-sm font-medium text-gray-700">
                  Message *
                </label>
                <textarea
                  id="message-input"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={`
                    w-full px-3 py-2 border rounded-md transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${formErrors.message ? 'border-red-500' : 'border-gray-300'}
                  `}
                  rows={4}
                  aria-invalid={formErrors.message ? 'true' : 'false'}
                  aria-describedby={formErrors.message ? 'message-error' : undefined}
                />
                {formErrors.message && (
                  <p id="message-error" className="text-sm text-red-600" role="alert">
                    {formErrors.message}
                  </p>
                )}
              </div>
              
              <AccessibleButton
                type="submit"
                variant="primary"
                id="submit-button"
              >
                Submit Form
              </AccessibleButton>
            </form>
          </section>

          {/* Keyboard Navigation Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Keyboard Navigation</h2>
            
            <KeyboardNavigation trapFocus className="p-4 border rounded-lg">
              <p className="mb-4">Use Tab to navigate, Escape to exit focus trap:</p>
              <NavigationMenu orientation="horizontal" className="flex gap-2">
                <AccessibleButton variant="ghost" role="menuitem">
                  Menu Item 1
                </AccessibleButton>
                <AccessibleButton variant="ghost" role="menuitem">
                  Menu Item 2
                </AccessibleButton>
                <AccessibleButton variant="ghost" role="menuitem">
                  Menu Item 3
                </AccessibleButton>
              </NavigationMenu>
            </KeyboardNavigation>
          </section>

          {/* Live Region Demo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Screen Reader Announcements</h2>
            
            <div className="space-y-2">
              <AccessibleButton
                onClick={() => setAnnouncement('This is a polite announcement')}
                variant="secondary"
              >
                Make Polite Announcement
              </AccessibleButton>
              
              <AccessibleButton
                onClick={() => setAnnouncement('This is an urgent announcement!')}
                variant="primary"
              >
                Make Urgent Announcement
              </AccessibleButton>
            </div>
            
            <LiveRegion message={announcement} priority="assertive" />
          </section>
        </main>

        <footer id="footer" className="mt-12 pt-8 border-t">
          <p className="text-gray-600 text-center">
            This demo showcases accessibility features and error handling patterns.
          </p>
        </footer>
      </div>
    </AccessibilityProvider>
  );
}