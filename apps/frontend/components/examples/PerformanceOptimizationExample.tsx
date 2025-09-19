'use client';

import React, { useState } from 'react';
import { LazyImage, ResponsiveLazyImage } from '@/components/ui/performance/LazyImage';
import { LazyContent, LazySection, LazyImageGallery } from '@/components/ui/performance/LazyContent';
import { 
  PerformanceOptimizedAnimation, 
  FadeIn, 
  SlideUp, 
  ScaleIn 
} from '@/components/ui/performance/PerformanceOptimizedAnimation';
import { useHardwareAcceleration } from '@/hooks/use-hardware-acceleration';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Example component demonstrating performance optimization features
 */
export function PerformanceOptimizationExample() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { 
    isSupported: hwSupported, 
    complexityLevel, 
    performance 
  } = useHardwareAcceleration();
  
  const { 
    prefersReducedMotion, 
    shouldReduceMotion 
  } = useReducedMotion();

  // Sample images for demonstration
  const sampleImages = [
    {
      src: '/api/placeholder/300/200?text=Image+1',
      webpSrc: '/api/placeholder/300/200?text=Image+1&format=webp',
      alt: 'Sample image 1',
    },
    {
      src: '/api/placeholder/300/200?text=Image+2',
      webpSrc: '/api/placeholder/300/200?text=Image+2&format=webp',
      alt: 'Sample image 2',
    },
    {
      src: '/api/placeholder/300/200?text=Image+3',
      webpSrc: '/api/placeholder/300/200?text=Image+3&format=webp',
      alt: 'Sample image 3',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* Header */}
      <FadeIn>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            Performance Optimization Examples
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Demonstrating lazy loading, hardware-accelerated animations, and reduced motion support
          </p>
        </div>
      </FadeIn>

      {/* Performance Status */}
      <SlideUp delay={200}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Performance Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                Hardware Acceleration
              </h3>
              <p className={`text-lg font-semibold ${hwSupported ? 'text-green-600' : 'text-yellow-600'}`}>
                {hwSupported ? 'Supported' : 'Not Available'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                Animation Complexity
              </h3>
              <p className="text-lg font-semibold text-blue-600 capitalize">
                {complexityLevel}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                Frame Rate
              </h3>
              <p className={`text-lg font-semibold ${performance.frameRate >= 30 ? 'text-green-600' : 'text-red-600'}`}>
                {performance.frameRate} FPS
              </p>
            </div>
          </div>
          
          {shouldReduceMotion && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                ℹ️ Reduced motion is enabled - animations are simplified for accessibility
              </p>
            </div>
          )}
        </div>
      </SlideUp>

      {/* Lazy Loading Images */}
      <ScaleIn delay={400}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Lazy Loading Images</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Images load only when they enter the viewport, with WebP support and fallbacks
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Standard Lazy Image</h3>
              <LazyImage
                src="/api/placeholder/400/300?text=Lazy+Loaded"
                webpSrc="/api/placeholder/400/300?text=Lazy+Loaded&format=webp"
                alt="Lazy loaded image example"
                className="rounded-lg shadow-md"
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Responsive Lazy Image</h3>
              <ResponsiveLazyImage
                src="/api/placeholder/400/300?text=Responsive"
                webpSrc="/api/placeholder/400/300?text=Responsive&format=webp"
                alt="Responsive lazy image example"
                aspectRatio="4/3"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </ScaleIn>

      {/* Hardware-Accelerated Animations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Hardware-Accelerated Animations</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Animations use transform and opacity for optimal performance
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PerformanceOptimizedAnimation
            animation="fade-in"
            duration={600}
            delay={0}
            className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-center"
          >
            <h3 className="font-semibold">Fade In</h3>
            <p className="text-sm opacity-90">Hardware accelerated</p>
          </PerformanceOptimizedAnimation>
          
          <PerformanceOptimizedAnimation
            animation="slide-up"
            duration={600}
            delay={200}
            className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg text-center"
          >
            <h3 className="font-semibold">Slide Up</h3>
            <p className="text-sm opacity-90">Transform optimized</p>
          </PerformanceOptimizedAnimation>
          
          <PerformanceOptimizedAnimation
            animation="scale-in"
            duration={600}
            delay={400}
            className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-center"
          >
            <h3 className="font-semibold">Scale In</h3>
            <p className="text-sm opacity-90">GPU accelerated</p>
          </PerformanceOptimizedAnimation>
        </div>
      </div>

      {/* Lazy Content Sections */}
      <LazySection
        title="Lazy Content Section"
        minHeight="300px"
        animation="slide-up"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Lazy Loaded Content</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This content only loads when it enters the viewport, reducing initial page load time.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Performance Benefits</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Faster initial page load</li>
                <li>• Reduced bandwidth usage</li>
                <li>• Better Core Web Vitals scores</li>
                <li>• Improved user experience</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Accessibility Features</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Respects reduced motion preferences</li>
                <li>• Proper ARIA labels and roles</li>
                <li>• Keyboard navigation support</li>
                <li>• Screen reader compatibility</li>
              </ul>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Image Gallery */}
      <LazySection
        title="Lazy Image Gallery"
        minHeight="400px"
        animation="fade-in"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Lazy Image Gallery</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Images load progressively as they enter the viewport
          </p>
          
          <LazyImageGallery
            images={sampleImages}
            columns={3}
            imageClassName="aspect-video"
          />
        </div>
      </LazySection>

      {/* Advanced Features Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Advanced Features</h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
        
        {showAdvanced && (
          <PerformanceOptimizedAnimation
            animation="slide-down"
            immediate={true}
            className="space-y-4"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Performance Monitoring</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Real-time performance metrics and adaptive complexity
              </p>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                Frame Rate: {performance.frameRate} FPS<br />
                Hardware Acceleration: {hwSupported ? 'Yes' : 'No'}<br />
                Complexity Level: {complexityLevel}<br />
                Reduced Motion: {shouldReduceMotion ? 'Yes' : 'No'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Optimization Techniques</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Intersection Observer for lazy loading</li>
                <li>• Hardware-accelerated CSS transforms</li>
                <li>• WebP image format with fallbacks</li>
                <li>• Reduced motion preference detection</li>
                <li>• Progressive enhancement</li>
                <li>• Performance monitoring and adaptation</li>
              </ul>
            </div>
          </PerformanceOptimizedAnimation>
        )}
      </div>

      {/* CSS Animation Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">CSS Animation Classes</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Hardware-accelerated CSS animations with reduced motion support
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg animate-fade-in-hw">
            <div className="w-8 h-8 bg-blue-600 rounded mx-auto mb-2"></div>
            <p className="text-xs text-center">fade-in-hw</p>
          </div>
          
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg animate-slide-up-hw">
            <div className="w-8 h-8 bg-green-600 rounded mx-auto mb-2"></div>
            <p className="text-xs text-center">slide-up-hw</p>
          </div>
          
          <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg animate-scale-in-hw">
            <div className="w-8 h-8 bg-purple-600 rounded mx-auto mb-2"></div>
            <p className="text-xs text-center">scale-in-hw</p>
          </div>
          
          <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg animate-bounce-in-hw">
            <div className="w-8 h-8 bg-orange-600 rounded mx-auto mb-2"></div>
            <p className="text-xs text-center">bounce-in-hw</p>
          </div>
        </div>
      </div>
    </div>
  );
}