'use client';

import { useState } from 'react';
import { PremiumBackground, PremiumBackgroundPresets, usePremiumBackgroundSettings } from '@/components/ui/backgrounds/PremiumBackground';
import { GeometricPatternOverlay } from '@/components/ui/backgrounds/GeometricPatternOverlay';
import { TextureOverlay } from '@/components/ui/backgrounds/TextureOverlay';
import { InteractiveBackground } from '@/components/ui/backgrounds/InteractiveBackground';

export function PremiumBackgroundExample() {
  const [selectedVariant, setSelectedVariant] = useState<'luxury' | 'modern' | 'minimal' | 'dynamic'>('modern');
  const [selectedPerformance, setSelectedPerformance] = useState<'high' | 'balanced' | 'optimized'>('balanced');
  const [interactiveEnabled, setInteractiveEnabled] = useState(true);
  const optimalSettings = usePremiumBackgroundSettings();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Controls */}
      <div className="relative z-20 p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Premium Background System
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Variant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="luxury">Luxury</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="dynamic">Dynamic</option>
              </select>
            </div>

            {/* Performance Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance Mode
              </label>
              <select
                value={selectedPerformance}
                onChange={(e) => setSelectedPerformance(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="high">High Quality</option>
                <option value="balanced">Balanced</option>
                <option value="optimized">Optimized</option>
              </select>
            </div>

            {/* Interactive Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interactive Effects
              </label>
              <button
                onClick={() => setInteractiveEnabled(!interactiveEnabled)}
                className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                  interactiveEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {interactiveEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Optimal Settings Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Recommended Settings for Your Device:
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Variant: {optimalSettings.recommendedVariant} | 
              Performance: {optimalSettings.recommendedPerformance} | 
              Interactive: {optimalSettings.shouldUseInteractive ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Background Demo */}
      <PremiumBackground
        variant={selectedVariant}
        performance={selectedPerformance}
        interactive={interactiveEnabled}
        className="min-h-screen"
      >
        <div className="relative z-10 px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Premium Visual Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience our advanced background system with geometric patterns, 
              texture overlays, and interactive elements that respond to your movements.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <FeatureCard
                title="Geometric Patterns"
                description="SVG-based geometric overlays with smooth animations"
                icon="◆"
              />
              <FeatureCard
                title="Texture Overlays"
                description="Subtle textures that add depth without impacting performance"
                icon="▦"
              />
              <FeatureCard
                title="Interactive Effects"
                description="Dynamic elements that respond to mouse movement and clicks"
                icon="✦"
              />
            </div>
          </div>
        </div>
      </PremiumBackground>

      {/* Individual Component Demos */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Individual Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Geometric Pattern Demo */}
            <ComponentDemo title="Geometric Patterns">
              <GeometricPatternOverlay
                pattern="mixed"
                density="medium"
                interactive={true}
                className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg"
              />
            </ComponentDemo>

            {/* Texture Overlay Demo */}
            <ComponentDemo title="Texture Overlays">
              <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden">
                <TextureOverlay
                  texture="fabric"
                  intensity="medium"
                  animated={true}
                />
              </div>
            </ComponentDemo>

            {/* Interactive Background Demo */}
            <ComponentDemo title="Interactive Effects">
              <InteractiveBackground
                effect="glow-follow"
                intensity="moderate"
                className="h-48 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Move your mouse here
                  </div>
                </div>
              </InteractiveBackground>
            </ComponentDemo>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: string; 
}) {
  return (
    <div className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 dark:border-gray-700/20">
      <div className="text-3xl mb-4 text-center">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
        {description}
      </p>
    </div>
  );
}

function ComponentDemo({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}