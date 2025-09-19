'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedImage, ResponsiveOptimizedImage, OptimizedImageGallery } from '@/components/ui/performance/OptimizedImage';
import { useProgressiveEnhancement } from '@/lib/progressive-enhancement';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { ImagePerformanceMonitor } from '@/lib/image-optimization';
import { PerformanceOptimizedAnimation } from '@/components/ui/performance/PerformanceOptimizedAnimation';

/**
 * Example component demonstrating asset optimization and rendering performance
 */
export function AssetOptimizationExample() {
  const [showStats, setShowStats] = useState(false);
  const [imageStats, setImageStats] = useState<any>(null);
  
  const { featureSupport, enhancementLevel, isLoading } = useProgressiveEnhancement();
  const { metrics, adaptToPerformance } = usePerformanceMonitor();

  // Get image performance stats
  useEffect(() => {
    const updateStats = () => {
      const stats = ImagePerformanceMonitor.getInstance().getStats();
      setImageStats(stats);
    };

    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const performanceAdaptation = adaptToPerformance();

  // Sample images for demonstration
  const sampleImages = [
    {
      src: '/api/placeholder/400/300?text=WebP+Optimized+1',
      alt: 'WebP optimized image 1',
      width: 400,
      height: 300,
    },
    {
      src: '/api/placeholder/400/300?text=WebP+Optimized+2',
      alt: 'WebP optimized image 2',
      width: 400,
      height: 300,
    },
    {
      src: '/api/placeholder/400/300?text=WebP+Optimized+3',
      alt: 'WebP optimized image 3',
      width: 400,
      height: 300,
    },
    {
      src: '/api/placeholder/400/300?text=WebP+Optimized+4',
      alt: 'WebP optimized image 4',
      width: 400,
      height: 300,
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* Header */}
      <PerformanceOptimizedAnimation animation="fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">
            Asset Optimization & Rendering Performance
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Demonstrating WebP/AVIF support, progressive enhancement, performance monitoring, and adaptive quality
          </p>
        </div>
      </PerformanceOptimizedAnimation>

      {/* Feature Support Status */}
      <PerformanceOptimizedAnimation animation="slide-up" delay={200}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Feature Support & Enhancement Level</h2>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              enhancementLevel?.level === 'premium' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              enhancementLevel?.level === 'enhanced' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            )}>
              {enhancementLevel?.level || 'Loading...'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FeatureCard
              title="WebP Support"
              supported={featureSupport?.webp || false}
              description="Modern image format with better compression"
            />
            <FeatureCard
              title="AVIF Support"
              supported={featureSupport?.avif || false}
              description="Next-gen image format with superior compression"
            />
            <FeatureCard
              title="Intersection Observer"
              supported={featureSupport?.intersectionObserver || false}
              description="Efficient lazy loading implementation"
            />
            <FeatureCard
              title="CSS Grid"
              supported={featureSupport?.css.grid || false}
              description="Modern layout system"
            />
          </div>
        </div>
      </PerformanceOptimizedAnimation>

      {/* Performance Adaptation */}
      <PerformanceOptimizedAnimation animation="slide-up" delay={400}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Performance Adaptation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Current Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Frame Rate:</span>
                  <span className={metrics.frameRate >= 30 ? 'text-green-600' : 'text-red-600'}>
                    {metrics.frameRate} FPS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{metrics.memoryUsage.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Speed:</span>
                  <span className={metrics.networkSpeed === 'fast' ? 'text-green-600' : 'text-yellow-600'}>
                    {metrics.networkSpeed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Device Type:</span>
                  <span>{metrics.deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Adaptive Optimizations</h3>
              <div className="space-y-2 text-sm">
                <AdaptationIndicator
                  label="Reduced Animations"
                  active={performanceAdaptation.shouldReduceAnimations}
                />
                <AdaptationIndicator
                  label="Reduced Image Quality"
                  active={performanceAdaptation.shouldReduceImageQuality}
                />
                <AdaptationIndicator
                  label="Disabled Effects"
                  active={performanceAdaptation.shouldDisableEffects}
                />
                <div className="flex justify-between">
                  <span>Complexity Level:</span>
                  <span className="capitalize font-medium">
                    {performanceAdaptation.recommendedComplexity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PerformanceOptimizedAnimation>

      {/* Optimized Images Examples */}
      <PerformanceOptimizedAnimation animation="scale-in" delay={600}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Optimized Images</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Images automatically use WebP/AVIF when supported, with quality adaptation based on performance
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Standard Optimized Image</h3>
              <OptimizedImage
                src="/api/placeholder/500/300?text=Optimized+Image"
                alt="Optimized image example"
                width={500}
                height={300}
                className="rounded-lg shadow-md"
                quality={performanceAdaptation.shouldReduceImageQuality ? 60 : 80}
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Responsive Optimized Image</h3>
              <ResponsiveOptimizedImage
                src="/api/placeholder/500/300?text=Responsive+Optimized"
                alt="Responsive optimized image example"
                aspectRatio="5/3"
                className="rounded-lg shadow-md"
                quality={performanceAdaptation.shouldReduceImageQuality ? 60 : 80}
              />
            </div>
          </div>
        </div>
      </PerformanceOptimizedAnimation>

      {/* Image Gallery */}
      <PerformanceOptimizedAnimation animation="fade-in" delay={800}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Optimized Image Gallery</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gallery with progressive loading, format optimization, and performance monitoring
          </p>
          
          <OptimizedImageGallery
            images={sampleImages}
            columns={2}
            quality={performanceAdaptation.shouldReduceImageQuality ? 50 : 75}
            priority={2}
            className="mb-6"
          />
        </div>
      </PerformanceOptimizedAnimation>

      {/* Performance Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Image Performance Statistics</h2>
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
        </div>
        
        {showStats && imageStats && (
          <PerformanceOptimizedAnimation
            animation="slide-down"
            immediate={true}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                  Average Load Time
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {imageStats.averageLoadTime.toFixed(0)}ms
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                  Total Images Loaded
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {imageStats.totalImages}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                  Load Errors
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {imageStats.errorCount}
                </p>
              </div>
            </div>
            
            {imageStats.slowImages.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Slow Loading Images
                </h3>
                <div className="space-y-1 text-sm">
                  {imageStats.slowImages.slice(0, 3).map((img: any, index: number) => (
                    <div key={index} className="flex justify-between text-yellow-700 dark:text-yellow-300">
                      <span className="truncate mr-2">{img.src}</span>
                      <span>{img.loadTime.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PerformanceOptimizedAnimation>
        )}
      </div>

      {/* Progressive Enhancement Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Progressive Enhancement Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Enabled Features</h3>
            <div className="space-y-2">
              {enhancementLevel?.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{feature.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Fallbacks Applied</h3>
            <div className="space-y-2">
              {Object.entries(enhancementLevel?.fallbacks || {}).map(([feature, fallback], index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{feature}:</span>
                  <span className="ml-2">{fallback}</span>
                </div>
              ))}
              {Object.keys(enhancementLevel?.fallbacks || {}).length === 0 && (
                <p className="text-sm text-gray-500">No fallbacks needed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function FeatureCard({ 
  title, 
  supported, 
  description 
}: { 
  title: string; 
  supported: boolean; 
  description: string; 
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <div className={cn(
          'w-3 h-3 rounded-full',
          supported ? 'bg-green-500' : 'bg-red-500'
        )} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function AdaptationIndicator({ 
  label, 
  active 
}: { 
  label: string; 
  active: boolean; 
}) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}:</span>
      <div className="flex items-center space-x-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          active ? 'bg-orange-500' : 'bg-green-500'
        )} />
        <span className="text-xs">
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

// Import cn utility
import { cn } from '@/lib/utils';