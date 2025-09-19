'use client';

import React from 'react';

/**
 * Example component demonstrating the enhanced design system features
 * This showcases the new fluid typography, enhanced animations, and modern styling
 */
export default function EnhancedDesignSystemExample() {
  return (
    <div className="min-h-screen bg-gradient-mesh-1 p-fluid-md">
      <div className="container-fluid max-w-6xl">
        {/* Hero Section with Enhanced Typography */}
        <section className="py-fluid-3xl text-center">
          <h1 className="heading-display text-gradient-primary animate-reveal-up mb-fluid-lg">
            Enhanced Design System
          </h1>
          <p className="text-lead text-gray-600 dark:text-gray-300 animate-reveal-up-delay-1 mb-fluid-xl max-w-3xl mx-auto">
            Experience our modernized design system with fluid typography, enhanced animations, 
            and premium visual elements that adapt seamlessly across all devices.
          </p>
          
          {/* Enhanced Buttons */}
          <div className="flex flex-wrap gap-4 justify-center animate-reveal-up-delay-2">
            <button className="btn-enhanced btn-primary-enhanced px-8 py-3">
              Primary Action
            </button>
            <button className="btn-enhanced btn-secondary-enhanced px-8 py-3">
              Secondary Action
            </button>
            <button className="btn-enhanced btn-ghost-enhanced px-8 py-3">
              Ghost Button
            </button>
          </div>
        </section>

        {/* Enhanced Cards Grid */}
        <section className="py-fluid-2xl">
          <h2 className="heading-section text-center mb-fluid-xl animate-reveal-up">
            Enhanced Card Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-lg">
            {/* Standard Enhanced Card */}
            <div className="card-enhanced p-fluid-lg animate-stagger-1 hover-lift-subtle">
              <div className="mb-fluid-md">
                <div className="w-12 h-12 bg-gradient-blue-purple rounded-xl mb-4 animate-float"></div>
                <h3 className="heading-subsection mb-2">Standard Card</h3>
                <p className="text-body text-gray-600 dark:text-gray-300">
                  Enhanced card with glassmorphism effects and smooth hover animations.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="badge-enhanced badge-primary-enhanced">New</span>
                <span className="badge-enhanced badge-success-enhanced">Popular</span>
              </div>
            </div>

            {/* Featured Card */}
            <div className="card-enhanced card-featured p-fluid-lg animate-stagger-2 hover-lift-strong">
              <div className="mb-fluid-md">
                <div className="w-12 h-12 bg-gradient-purple-pink rounded-xl mb-4 animate-glow"></div>
                <h3 className="heading-subsection mb-2 text-gradient-secondary">Featured Card</h3>
                <p className="text-body text-gray-600 dark:text-gray-300">
                  Special featured card with enhanced styling and glow effects.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="badge-enhanced badge-warning-enhanced">Featured</span>
              </div>
            </div>

            {/* Interactive Card */}
            <div className="card-enhanced p-fluid-lg animate-stagger-3 hover-glow-emerald">
              <div className="mb-fluid-md">
                <div className="w-12 h-12 bg-gradient-emerald-teal rounded-xl mb-4 animate-shimmer"></div>
                <h3 className="heading-subsection mb-2">Interactive Card</h3>
                <p className="text-body text-gray-600 dark:text-gray-300">
                  Card with interactive hover effects and enhanced visual feedback.
                </p>
              </div>
              <button className="btn-enhanced btn-ghost-enhanced w-full mt-4">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Typography Showcase */}
        <section className="py-fluid-2xl">
          <h2 className="heading-section text-center mb-fluid-xl animate-reveal-up">
            Fluid Typography System
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-fluid-xl">
            <div className="animate-reveal-left">
              <h3 className="heading-subsection mb-fluid-md">Responsive Headings</h3>
              <div className="space-y-4">
                <h1 className="text-fluid-6xl font-bold text-gradient-primary">Display Heading</h1>
                <h2 className="text-fluid-4xl font-semibold">Section Heading</h2>
                <h3 className="text-fluid-2xl font-medium">Subsection Heading</h3>
                <p className="text-fluid-lg">Lead paragraph text that scales beautifully</p>
                <p className="text-fluid-base">Regular body text with optimal readability</p>
              </div>
            </div>
            
            <div className="animate-reveal-right">
              <h3 className="heading-subsection mb-fluid-md">Enhanced Form Elements</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Enhanced input field"
                  className="input-enhanced w-full"
                />
                <input 
                  type="email" 
                  placeholder="Email with validation"
                  className="input-enhanced w-full"
                />
                <textarea 
                  placeholder="Enhanced textarea"
                  className="input-enhanced w-full h-24 resize-none"
                />
                <button className="btn-enhanced btn-primary-enhanced w-full">
                  Submit Form
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Showcase */}
        <section className="py-fluid-2xl">
          <h2 className="heading-section text-center mb-fluid-xl animate-reveal-up">
            Enhanced Animations
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-fluid-md">
            <div className="text-center animate-stagger-1">
              <div className="w-16 h-16 bg-gradient-blue-purple rounded-2xl mx-auto mb-4 animate-float"></div>
              <p className="text-caption">Float Animation</p>
            </div>
            
            <div className="text-center animate-stagger-2">
              <div className="w-16 h-16 bg-gradient-purple-pink rounded-2xl mx-auto mb-4 animate-glow"></div>
              <p className="text-caption">Glow Pulse</p>
            </div>
            
            <div className="text-center animate-stagger-3">
              <div className="w-16 h-16 bg-gradient-emerald-teal rounded-2xl mx-auto mb-4 animate-shimmer"></div>
              <p className="text-caption">Shimmer Effect</p>
            </div>
            
            <div className="text-center animate-stagger-4">
              <div className="w-16 h-16 bg-gradient-orange-red rounded-2xl mx-auto mb-4 animate-rotate-slow"></div>
              <p className="text-caption">Slow Rotation</p>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="py-fluid-2xl">
          <h2 className="heading-section text-center mb-fluid-xl animate-reveal-up">
            Enhanced Loading States
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-lg">
            <div className="card-enhanced p-fluid-lg">
              <h3 className="heading-subsection mb-4">Skeleton Loading</h3>
              <div className="space-y-3">
                <div className="skeleton-enhanced h-4 w-3/4"></div>
                <div className="skeleton-enhanced h-4 w-1/2"></div>
                <div className="skeleton-enhanced h-4 w-2/3"></div>
              </div>
            </div>
            
            <div className="card-enhanced p-fluid-lg">
              <h3 className="heading-subsection mb-4">Loading Dots</h3>
              <div className="flex items-center justify-center h-20">
                <div className="loading-dots text-blue-500">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            
            <div className="card-enhanced p-fluid-lg">
              <h3 className="heading-subsection mb-4">Button Loading</h3>
              <button className="btn-enhanced btn-primary-enhanced w-full" disabled>
                <div className="loading-dots text-white mr-2">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Loading...
              </button>
            </div>
          </div>
        </section>

        {/* Gradient Text Examples */}
        <section className="py-fluid-2xl text-center">
          <h2 className="heading-section mb-fluid-xl animate-reveal-up">
            Gradient Text Effects
          </h2>
          
          <div className="space-y-4">
            <h3 className="text-fluid-4xl text-gradient-primary animate-reveal-up-delay-1">
              Primary Gradient Text
            </h3>
            <h3 className="text-fluid-4xl text-gradient-secondary animate-reveal-up-delay-2">
              Secondary Gradient Text
            </h3>
            <h3 className="text-fluid-4xl text-gradient-accent animate-reveal-up-delay-3">
              Accent Gradient Text
            </h3>
          </div>
        </section>
      </div>
    </div>
  );
}