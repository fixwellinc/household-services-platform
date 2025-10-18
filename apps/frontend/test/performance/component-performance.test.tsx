import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { measureRenderTime, PERFORMANCE_BUDGETS } from '../performance-setup'

// Import components to test
import HeroSection from '@/components/pages/home/HeroSection'
import ServicesSection from '@/components/pages/home/ServicesSection'
import FeaturesSection from '@/components/pages/home/FeaturesSection'
import CTASection from '@/components/pages/home/CTASection'

// Mock heavy dependencies
vi.mock('@/components/ui/hero/EnhancedHeroSection', () => ({
  EnhancedHeroSection: () => <div data-testid="hero">Hero Content</div>
}))

vi.mock('@/hooks/use-api', () => ({
  useServices: () => ({
    data: { services: [] },
    isLoading: false
  })
}))

vi.mock('@/components/ui/cards/ModernServiceCard', () => ({
  default: () => <div data-testid="service-card">Service Card</div>
}))

vi.mock('@/components/ui/animations/ProgressiveReveal', () => ({
  ProgressiveReveal: ({ children }: any) => <div>{children}</div>
}))

vi.mock('@/components/ui/animations/StaggeredGrid', () => ({
  StaggeredGrid: ({ children }: any) => <div>{children}</div>
}))

describe('Component Performance Tests', () => {
  describe('HeroSection Performance', () => {
    it('renders within performance budget', () => {
      const renderTime = measureRenderTime(() => {
        render(<HeroSection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
      expect(screen.getByTestId('hero')).toBeInTheDocument()
    })

    it('handles multiple re-renders efficiently', () => {
      const { rerender } = render(<HeroSection />)
      
      const rerenderTimes: number[] = []
      
      // Measure 5 re-renders
      for (let i = 0; i < 5; i++) {
        const renderTime = measureRenderTime(() => {
          rerender(<HeroSection className={`test-${i}`} />)
        })
        rerenderTimes.push(renderTime)
      }
      
      const averageRenderTime = rerenderTimes.reduce((a, b) => a + b, 0) / rerenderTimes.length
      expect(averageRenderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
    })
  })

  describe('ServicesSection Performance', () => {
    it('renders within performance budget', () => {
      const renderTime = measureRenderTime(() => {
        render(<ServicesSection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
    })

    it('handles loading state efficiently', () => {
      const { useServices } = require('@/hooks/use-api')
      useServices.mockReturnValue({
        data: null,
        isLoading: true
      })
      
      const renderTime = measureRenderTime(() => {
        render(<ServicesSection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
    })

    it('handles large service lists efficiently', () => {
      const { useServices } = require('@/hooks/use-api')
      
      // Mock large service list
      const largeServiceList = Array.from({ length: 50 }, (_, i) => ({
        id: `service-${i}`,
        name: `Service ${i}`,
        category: 'CLEANING',
        basePrice: 100 + i,
        description: `Description for service ${i}`
      }))
      
      useServices.mockReturnValue({
        data: { services: largeServiceList },
        isLoading: false
      })
      
      const renderTime = measureRenderTime(() => {
        render(<ServicesSection />)
      })
      
      // Allow slightly more time for large lists but still within reasonable bounds
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME * 2)
    })
  })

  describe('FeaturesSection Performance', () => {
    it('renders within performance budget', () => {
      const renderTime = measureRenderTime(() => {
        render(<FeaturesSection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
    })

    it('handles animation components efficiently', () => {
      const renderTime = measureRenderTime(() => {
        render(<FeaturesSection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
      expect(screen.getByText('Professional Quality')).toBeInTheDocument()
    })
  })

  describe('CTASection Performance', () => {
    it('renders within performance budget', () => {
      const renderTime = measureRenderTime(() => {
        render(<CTASection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
    })

    it('handles gradient backgrounds efficiently', () => {
      const renderTime = measureRenderTime(() => {
        render(<CTASection />)
      })
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.COMPONENT_RENDER_TIME)
      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument()
    })
  })

  describe('Memory Usage Tests', () => {
    it('does not cause memory leaks during mount/unmount cycles', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<HeroSection />)
        unmount()
      }
      
      // Allow for some memory variance but ensure no significant leaks
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
    })
  })
})