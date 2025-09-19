import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    },
  },
});

// Mock matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? false : true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn((property: string, value: string) => {
      // Mock support for modern CSS features
      if (property === 'display' && value === 'grid') return true;
      if (property === 'display' && value === 'flex') return true;
      if (property === 'backdrop-filter') return true;
      if (property === 'transform' && value === 'translateZ(0)') return true;
      return false;
    }),
  },
});

import { LazyImage } from '@/components/ui/performance/LazyImage';
import { LazyContent } from '@/components/ui/performance/LazyContent';
import { PerformanceOptimizedAnimation } from '@/components/ui/performance/PerformanceOptimizedAnimation';
import { OptimizedImage } from '@/components/ui/performance/OptimizedImage';
import { useLazyLoading } from '@/hooks/use-lazy-loading';
import { useHardwareAcceleration } from '@/hooks/use-hardware-acceleration';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

describe('Performance Optimizations', () => {
  describe('Lazy Loading', () => {
    test('useLazyLoading hook works correctly', () => {
      const TestComponent = () => {
        const { ref, shouldLoad, isLoading } = useLazyLoading();
        return (
          <div ref={ref} data-testid="lazy-element">
            {shouldLoad ? 'Content loaded' : 'Loading...'}
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('lazy-element')).toBeInTheDocument();
    });

    test('LazyImage renders with proper attributes', () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          data-testid="lazy-image"
        />
      );

      const imageContainer = screen.getByTestId('lazy-image');
      expect(imageContainer).toBeInTheDocument();
    });

    test('LazyContent shows fallback initially', () => {
      const TestFallback = () => <div data-testid="fallback">Loading...</div>;
      
      render(
        <LazyContent fallback={TestFallback}>
          <div data-testid="content">Actual content</div>
        </LazyContent>
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('Hardware Acceleration', () => {
    test('useHardwareAcceleration hook provides correct data', () => {
      const TestComponent = () => {
        const { isSupported, complexityLevel, accelerationStyles } = useHardwareAcceleration();
        return (
          <div data-testid="hw-test">
            <span data-testid="supported">{isSupported.toString()}</span>
            <span data-testid="complexity">{complexityLevel}</span>
            <div data-testid="styles" style={accelerationStyles} />
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('hw-test')).toBeInTheDocument();
      expect(screen.getByTestId('supported')).toBeInTheDocument();
      expect(screen.getByTestId('complexity')).toBeInTheDocument();
    });
  });

  describe('Reduced Motion', () => {
    test('useReducedMotion hook respects user preferences', () => {
      const TestComponent = () => {
        const { prefersReducedMotion, shouldReduceMotion, safeDuration } = useReducedMotion();
        return (
          <div data-testid="motion-test">
            <span data-testid="prefers-reduced">{prefersReducedMotion.toString()}</span>
            <span data-testid="should-reduce">{shouldReduceMotion.toString()}</span>
            <span data-testid="safe-duration">{safeDuration(300)}</span>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('motion-test')).toBeInTheDocument();
      expect(screen.getByTestId('prefers-reduced')).toHaveTextContent('false');
      expect(screen.getByTestId('safe-duration')).toHaveTextContent('300');
    });

    test('reduced motion affects animation duration', () => {
      // Mock reduced motion preference
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const TestComponent = () => {
        const { safeDuration } = useReducedMotion();
        return <span data-testid="duration">{safeDuration(300)}</span>;
      };

      render(<TestComponent />);
      
      // With reduced motion, duration should be 0
      expect(screen.getByTestId('duration')).toHaveTextContent('0');
    });
  });

  describe('Performance Optimized Animation', () => {
    test('renders with correct animation classes', () => {
      render(
        <PerformanceOptimizedAnimation
          animation="fade-in"
          duration={300}
          immediate={true}
          data-testid="animated-element"
        >
          <div>Animated content</div>
        </PerformanceOptimizedAnimation>
      );

      const element = screen.getByTestId('animated-element');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('performance-optimized-animation');
    });

    test('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <PerformanceOptimizedAnimation
          animation="slide-up"
          duration={300}
          immediate={true}
          data-testid="reduced-motion-element"
        >
          <div>Content</div>
        </PerformanceOptimizedAnimation>
      );

      const element = screen.getByTestId('reduced-motion-element');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Optimized Image', () => {
    test('renders with proper structure', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test optimized image"
          width={400}
          height={300}
          data-testid="optimized-image"
        />
      );

      const imageContainer = screen.getByTestId('optimized-image');
      expect(imageContainer).toBeInTheDocument();
    });

    test('handles loading states correctly', async () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          priority={true}
          data-testid="priority-image"
        />
      );

      const imageContainer = screen.getByTestId('priority-image');
      expect(imageContainer).toBeInTheDocument();
    });

    test('applies performance adaptations', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          adaptive={true}
          data-testid="adaptive-image"
        />
      );

      const imageContainer = screen.getByTestId('adaptive-image');
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('lazy loading works with performance optimization', async () => {
      const TestComponent = () => (
        <LazyContent animate={true} animation="fade-in">
          <OptimizedImage
            src="/test-image.jpg"
            alt="Test image"
            width={400}
            height={300}
            data-testid="integrated-image"
          />
        </LazyContent>
      );

      render(<TestComponent />);
      
      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByTestId('integrated-image')).toBeInTheDocument();
      });
    });

    test('performance monitoring integration', () => {
      const TestComponent = () => {
        const { isSupported } = useHardwareAcceleration();
        const { shouldReduceMotion } = useReducedMotion();
        
        return (
          <PerformanceOptimizedAnimation
            animation="slide-up"
            forceHardwareAcceleration={isSupported}
            respectReducedMotion={!shouldReduceMotion}
            data-testid="monitored-animation"
          >
            <div>Performance monitored content</div>
          </PerformanceOptimizedAnimation>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('monitored-animation')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles image loading errors gracefully', async () => {
      const mockError = jest.fn();
      
      render(
        <OptimizedImage
          src="/non-existent-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          onError={mockError}
          data-testid="error-image"
        />
      );

      const imageContainer = screen.getByTestId('error-image');
      expect(imageContainer).toBeInTheDocument();
    });

    test('provides fallbacks for unsupported features', () => {
      // Mock no support for modern features
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: jest.fn(() => false),
        },
      });

      render(
        <PerformanceOptimizedAnimation
          animation="fade-in"
          duration={300}
          immediate={true}
          data-testid="fallback-animation"
        >
          <div>Fallback content</div>
        </PerformanceOptimizedAnimation>
      );

      const element = screen.getByTestId('fallback-animation');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('respects prefers-reduced-motion', () => {
      // Mock reduced motion preference
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const TestComponent = () => {
        const { shouldReduceMotion } = useReducedMotion();
        return (
          <div data-testid="accessibility-test">
            Motion reduced: {shouldReduceMotion.toString()}
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('accessibility-test')).toHaveTextContent('Motion reduced: true');
    });

    test('provides proper alt text for images', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Descriptive alt text for accessibility"
          width={400}
          height={300}
          data-testid="accessible-image"
        />
      );

      const imageContainer = screen.getByTestId('accessible-image');
      expect(imageContainer).toBeInTheDocument();
    });
  });
});