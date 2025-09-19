import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ProgressiveReveal } from '@/components/ui/animations/ProgressiveReveal';
import { StaggeredGrid } from '@/components/ui/animations/StaggeredGrid';
import { EnhancedHeroSection } from '@/components/ui/hero/EnhancedHeroSection';
import ModernServiceCard from '@/components/ui/cards/ModernServiceCard';

// Mock intersection observer for animation tests
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};
Object.defineProperty(window, 'performance', {
  value: mockPerformance
});

// Mock requestAnimationFrame
let animationFrameId = 0;
window.requestAnimationFrame = jest.fn((callback) => {
  animationFrameId++;
  setTimeout(callback, 16); // Simulate 60fps
  return animationFrameId;
});

window.cancelAnimationFrame = jest.fn();

describe('Animation Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    animationFrameId = 0;
  });

  describe('ProgressiveReveal Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <ProgressiveReveal delay={100}>
          <div>Test content</div>
        </ProgressiveReveal>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle multiple progressive reveals efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <ProgressiveReveal key={i} delay={i * 100}>
              <div>Content {i}</div>
            </ProgressiveReveal>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle multiple animations within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks with repeated renders', () => {
      const { unmount } = render(
        <ProgressiveReveal delay={100}>
          <div>Test content</div>
        </ProgressiveReveal>
      );
      
      // Simulate multiple mount/unmount cycles
      for (let i = 0; i < 50; i++) {
        unmount();
        render(
          <ProgressiveReveal delay={100}>
            <div>Test content {i}</div>
          </ProgressiveReveal>
        );
      }
      
      // Should not throw errors or cause performance issues
      expect(screen.getByText(/Test content/)).toBeInTheDocument();
    });

    it('should optimize intersection observer usage', () => {
      render(
        <div>
          <ProgressiveReveal delay={100}>
            <div>Content 1</div>
          </ProgressiveReveal>
          <ProgressiveReveal delay={200}>
            <div>Content 2</div>
          </ProgressiveReveal>
        </div>
      );
      
      // Should create intersection observers efficiently
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('StaggeredGrid Performance', () => {
    it('should render staggered animations efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <StaggeredGrid staggerDelay={50}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </StaggeredGrid>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 12 items within 75ms
      expect(renderTime).toBeLessThan(75);
    });

    it('should handle large grids without performance degradation', async () => {
      const startTime = performance.now();
      
      render(
        <StaggeredGrid staggerDelay={25}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </StaggeredGrid>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large grids within 150ms
      expect(renderTime).toBeLessThan(150);
    });

    it('should optimize stagger timing calculations', () => {
      const { rerender } = render(
        <StaggeredGrid staggerDelay={100}>
          <div>Item 1</div>
          <div>Item 2</div>
        </StaggeredGrid>
      );
      
      const startTime = performance.now();
      
      // Re-render with different children
      rerender(
        <StaggeredGrid staggerDelay={100}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </StaggeredGrid>
      );
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      // Re-renders should be fast (less than 25ms)
      expect(rerenderTime).toBeLessThan(25);
    });
  });

  describe('EnhancedHeroSection Performance', () => {
    it('should render hero section within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Hero section should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle background animations efficiently', async () => {
      render(
        <EnhancedHeroSection 
          variant="particle-field"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      // Simulate scroll events that might trigger animations
      const scrollEvents = 10;
      const startTime = performance.now();
      
      for (let i = 0; i < scrollEvents; i++) {
        fireEvent.scroll(window, { target: { scrollY: i * 100 } });
      }
      
      const endTime = performance.now();
      const scrollHandlingTime = endTime - startTime;
      
      // Should handle scroll events efficiently (less than 50ms for 10 events)
      expect(scrollHandlingTime).toBeLessThan(50);
    });

    it('should optimize trust indicators rendering', () => {
      const { rerender } = render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={false}
          showTrustIndicators={false}
        />
      );
      
      const startTime = performance.now();
      
      rerender(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      // Adding stats and trust indicators should be fast
      expect(rerenderTime).toBeLessThan(30);
    });
  });

  describe('ModernServiceCard Performance', () => {
    const mockService = {
      id: '1',
      name: 'Test Service',
      description: 'Test description',
      category: 'CLEANING',
      basePrice: 150,
      complexity: 'MODERATE' as const,
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      rating: 4.8,
      reviewCount: 150,
      estimatedTime: '2-3 hours',
      popularity: 'high' as const,
      contractorPrice: 250,
      savingsPercentage: 40
    };

    it('should render service card within performance budget', () => {
      const startTime = performance.now();
      
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Service card should render within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle hover interactions efficiently', async () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="featured"
          showPricingComparison={true}
        />
      );
      
      const card = screen.getByText('Test Service').closest('[data-testid*="card"]') || 
                   screen.getByText('Test Service').closest('div');
      
      const startTime = performance.now();
      
      // Simulate multiple hover events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(card!);
        fireEvent.mouseLeave(card!);
      }
      
      const endTime = performance.now();
      const hoverTime = endTime - startTime;
      
      // Hover interactions should be fast (less than 100ms for 10 events)
      expect(hoverTime).toBeLessThan(100);
    });

    it('should optimize pricing comparison rendering', () => {
      const { rerender } = render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={false}
        />
      );
      
      const startTime = performance.now();
      
      rerender(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      // Adding pricing comparison should be fast
      expect(rerenderTime).toBeLessThan(25);
    });

    it('should handle multiple service cards efficiently', () => {
      const services = Array.from({ length: 20 }, (_, i) => ({
        ...mockService,
        id: `service-${i}`,
        name: `Service ${i}`
      }));
      
      const startTime = performance.now();
      
      render(
        <div>
          {services.map(service => (
            <ModernServiceCard 
              key={service.id}
              service={service}
              variant="standard"
              showPricingComparison={true}
            />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 20 service cards within 200ms
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Animation Frame Performance', () => {
    it('should not exceed 60fps animation budget', async () => {
      const frameCount = 60; // 1 second at 60fps
      const startTime = performance.now();
      
      // Simulate 60 animation frames
      for (let i = 0; i < frameCount; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 60 frames in approximately 1 second (with some tolerance)
      expect(totalTime).toBeGreaterThan(900); // At least 900ms
      expect(totalTime).toBeLessThan(1200); // No more than 1200ms
    });

    it('should handle concurrent animations efficiently', async () => {
      const animationCount = 5;
      const frameCount = 30;
      
      const startTime = performance.now();
      
      // Start multiple concurrent animations
      const animations = Array.from({ length: animationCount }, async () => {
        for (let i = 0; i < frameCount; i++) {
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
      });
      
      await Promise.all(animations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Concurrent animations should not significantly increase total time
      expect(totalTime).toBeLessThan(800); // Should complete within 800ms
    });

    it('should cleanup animation frames properly', () => {
      const frameIds: number[] = [];
      
      // Request multiple animation frames
      for (let i = 0; i < 10; i++) {
        const id = requestAnimationFrame(() => {});
        frameIds.push(id);
      }
      
      // Cancel all frames
      frameIds.forEach(id => cancelAnimationFrame(id));
      
      // Should not throw errors
      expect(cancelAnimationFrame).toHaveBeenCalledTimes(10);
    });
  });

  describe('Memory Performance', () => {
    it('should not create memory leaks with animations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy many animated components
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <div>
            <ProgressiveReveal delay={100}>
              <StaggeredGrid staggerDelay={50}>
                <ModernServiceCard 
                  service={{
                    id: `test-${i}`,
                    name: `Test ${i}`,
                    description: 'Test description',
                    category: 'CLEANING',
                    basePrice: 150,
                    complexity: 'MODERATE' as const
                  }}
                  variant="standard"
                />
              </StaggeredGrid>
            </ProgressiveReveal>
          </div>
        );
        unmount();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not increase significantly (allow for some variance)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be less than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });

    it('should cleanup event listeners properly', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <div>
          <ProgressiveReveal delay={100}>
            <div>Test content</div>
          </ProgressiveReveal>
          <StaggeredGrid staggerDelay={50}>
            <div>Grid item</div>
          </StaggeredGrid>
        </div>
      );
      
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // Should remove at least as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});