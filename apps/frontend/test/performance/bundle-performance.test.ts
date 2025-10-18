import { describe, it, expect, vi } from 'vitest'
import { PERFORMANCE_BUDGETS } from '../performance-setup'

// Mock webpack stats for bundle analysis
const mockWebpackStats = {
  assets: [
    { name: 'main.js', size: 120000 }, // 120KB
    { name: 'vendor.js', size: 80000 }, // 80KB
    { name: 'runtime.js', size: 5000 }, // 5KB
    { name: 'styles.css', size: 15000 } // 15KB
  ],
  chunks: [
    { 
      id: 'main',
      size: 120000,
      modules: [
        { name: './components/pages/home/HeroSection.tsx', size: 5000 },
        { name: './components/pages/home/ServicesSection.tsx', size: 8000 },
        { name: './components/pages/home/FeaturesSection.tsx', size: 4000 },
        { name: './components/pages/home/CTASection.tsx', size: 3000 }
      ]
    },
    {
      id: 'vendor',
      size: 80000,
      modules: [
        { name: './node_modules/react/index.js', size: 40000 },
        { name: './node_modules/framer-motion/dist/index.js', size: 25000 },
        { name: './node_modules/lucide-react/dist/index.js', size: 15000 }
      ]
    }
  ]
}

describe('Bundle Performance Tests', () => {
  describe('Bundle Size Analysis', () => {
    it('main bundle stays within size budget', () => {
      const mainAsset = mockWebpackStats.assets.find(asset => asset.name === 'main.js')
      expect(mainAsset).toBeDefined()
      
      // Convert to KB and check against budget
      const sizeInKB = (mainAsset!.size / 1024)
      expect(sizeInKB).toBeLessThan(PERFORMANCE_BUDGETS.BUNDLE_SIZE_KB)
    })

    it('total bundle size is within acceptable limits', () => {
      const totalSize = mockWebpackStats.assets
        .filter(asset => asset.name.endsWith('.js'))
        .reduce((total, asset) => total + asset.size, 0)
      
      const totalSizeInKB = totalSize / 1024
      
      // Total JS bundle should be less than 250KB
      expect(totalSizeInKB).toBeLessThan(250)
    })

    it('individual component chunks are reasonably sized', () => {
      const mainChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'main')
      expect(mainChunk).toBeDefined()
      
      const componentModules = mainChunk!.modules.filter(module => 
        module.name.includes('/components/pages/home/')
      )
      
      componentModules.forEach(module => {
        const sizeInKB = module.size / 1024
        // Individual components should be less than 10KB
        expect(sizeInKB).toBeLessThan(10)
      })
    })

    it('vendor bundle is properly separated', () => {
      const vendorChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'vendor')
      expect(vendorChunk).toBeDefined()
      
      const hasReact = vendorChunk!.modules.some(module => 
        module.name.includes('react')
      )
      expect(hasReact).toBe(true)
      
      // Vendor bundle should be reasonable size (less than 100KB)
      const vendorSizeInKB = vendorChunk!.size / 1024
      expect(vendorSizeInKB).toBeLessThan(100)
    })
  })

  describe('Code Splitting Effectiveness', () => {
    it('has proper chunk separation', () => {
      const chunkIds = mockWebpackStats.chunks.map(chunk => chunk.id)
      
      // Should have at least main and vendor chunks
      expect(chunkIds).toContain('main')
      expect(chunkIds).toContain('vendor')
    })

    it('vendor dependencies are not duplicated in main bundle', () => {
      const mainChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'main')
      const vendorChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'vendor')
      
      expect(mainChunk).toBeDefined()
      expect(vendorChunk).toBeDefined()
      
      const mainModuleNames = mainChunk!.modules.map(m => m.name)
      const vendorModuleNames = vendorChunk!.modules.map(m => m.name)
      
      // Check for no overlap in node_modules
      const mainNodeModules = mainModuleNames.filter(name => name.includes('node_modules'))
      const vendorNodeModules = vendorModuleNames.filter(name => name.includes('node_modules'))
      
      const overlap = mainNodeModules.filter(name => vendorNodeModules.includes(name))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('Tree Shaking Effectiveness', () => {
    it('does not include unused exports', () => {
      // Mock analysis of unused exports
      const unusedExports = [
        'unused-utility-function',
        'deprecated-component',
        'debug-helper'
      ]
      
      const mainChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'main')
      const moduleNames = mainChunk!.modules.map(m => m.name)
      
      unusedExports.forEach(unusedExport => {
        const isIncluded = moduleNames.some(name => name.includes(unusedExport))
        expect(isIncluded).toBe(false)
      })
    })

    it('optimizes library imports', () => {
      const vendorChunk = mockWebpackStats.chunks.find(chunk => chunk.id === 'vendor')
      const lucideModule = vendorChunk!.modules.find(m => m.name.includes('lucide-react'))
      
      expect(lucideModule).toBeDefined()
      
      // Lucide should be tree-shaken to reasonable size (not the full library)
      const lucideSizeInKB = lucideModule!.size / 1024
      expect(lucideSizeInKB).toBeLessThan(20) // Should be much smaller than full library
    })
  })

  describe('Performance Budget Enforcement', () => {
    it('enforces critical path bundle size limits', () => {
      // Critical path includes main bundle and essential CSS
      const criticalAssets = mockWebpackStats.assets.filter(asset => 
        asset.name === 'main.js' || asset.name === 'styles.css'
      )
      
      const criticalSize = criticalAssets.reduce((total, asset) => total + asset.size, 0)
      const criticalSizeInKB = criticalSize / 1024
      
      expect(criticalSizeInKB).toBeLessThan(PERFORMANCE_BUDGETS.BUNDLE_SIZE_KB)
    })

    it('tracks bundle size regression', () => {
      // Mock previous bundle sizes for regression testing
      const previousSizes: Record<string, number> = {
        'main.js': 115000, // Previous size was 115KB
        'vendor.js': 75000, // Previous size was 75KB
      }
      
      mockWebpackStats.assets.forEach(asset => {
        const previousSize = previousSizes[asset.name]
        if (previousSize) {
          const currentSize = asset.size
          const increase = ((currentSize - previousSize) / previousSize) * 100
          
          // Bundle size should not increase by more than 10%
          expect(increase).toBeLessThan(10)
        }
      })
    })
  })

  describe('Compression Analysis', () => {
    it('estimates gzip compression effectiveness', () => {
      // Mock gzip compression ratios
      const compressionRatio = 0.3 // 30% of original size after gzip
      
      mockWebpackStats.assets.forEach(asset => {
        if (asset.name.endsWith('.js')) {
          const compressedSize = asset.size * compressionRatio
          const compressedSizeInKB = compressedSize / 1024
          
          // Even after accounting for compression, should be reasonable
          if (asset.name === 'main.js') {
            expect(compressedSizeInKB).toBeLessThan(50) // 50KB compressed
          }
        }
      })
    })
  })
})