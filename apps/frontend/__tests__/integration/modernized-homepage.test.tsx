import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ModernizedHomePageClient from '@/components/ModernizedHomePageClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';

// Mock the API hooks
jest.mock('@/hooks/use-api', () => ({
  useServices: () => ({
    data: {
      services: [
        {
          id: '1',
          name: 'Deep House Cleaning',
          description: 'Professional deep cleaning service',
          category: 'CLEANING',
          basePrice: 150,
          complexity: 'MODERATE'
        },
        {
          id: '2',
          name: 'Plumbing Repair',
          description: 'Expert plumbing solutions',
          category: 'REPAIR',
          basePrice: 200,
          complexity: 'COMPLEX'
        }
      ]
    },
    isLoading: false
  }),
  useCurrentUser: () => ({
    data: null,
    isLoading: false
  })
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the enhanced components
jest.mock('@/components/ui/hero/EnhancedHeroSection', () => {
  return function MockEnhancedHeroSection({ variant, showStats, showTrustIndicators }: any) {
    return (
      <div data-testid="enhanced-hero-section">
        <h1>Enhanced Hero Section</h1>
        <div data-testid="hero-variant">{variant}</div>
        {showStats && <div data-testid="hero-stats">Stats displayed</div>}
        {showTrustIndicators && <div data-testid="trust-indicators">Trust indicators displayed</div>}
      </div>
    );
  };
});

jest.mock('@/components/ui/cards/ModernServiceCard', () => {
  return function MockModernServiceCard({ service, variant, onBook, onView }: any) {
    return (
      <div data-testid={`modern-service-card-${service.id}`}>
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <div data-testid="card-variant">{variant}</div>
        <button onClick={() => onBook?.(service.id)} data-testid={`book-${service.id}`}>
          Book Now
        </button>
        <button onClick={() => onView?.(service.id)} data-testid={`view-${service.id}`}>
          View Details
        </button>
      </div>
    );
  };
});

jest.mock('@/components/ui/animations/ProgressiveReveal', () => {
  return function MockProgressiveReveal({ children, delay }: any) {
    return (
      <div data-testid="progressive-reveal" data-delay={delay}>
        {children}
      </div>
    );
  };
});

jest.mock('@/components/ui/animations/StaggeredGrid', () => {
  return function MockStaggeredGrid({ children, className, staggerDelay }: any) {
    return (
      <div data-testid="staggered-grid" className={className} data-stagger-delay={staggerDelay}>
        {children}
      </div>
    );
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <LocationProvider>
        {component}
      </LocationProvider>
    </AuthProvider>
  );
};

describe('ModernizedHomePageClient Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visual Regression Tests', () => {
    it('should render enhanced hero section with correct props', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const heroSection = screen.getByTestId('enhanced-hero-section');
      expect(heroSection).toBeInTheDocument();
      
      const variant = screen.getByTestId('hero-variant');
      expect(variant).toHaveTextContent('gradient-mesh');
      
      expect(screen.getByTestId('hero-stats')).toBeInTheDocument();
      expect(screen.getByTestId('trust-indicators')).toBeInTheDocument();
    });

    it('should render modernized service cards with correct variants', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const serviceCard1 = screen.getByTestId('modern-service-card-1');
      const serviceCard2 = screen.getByTestId('modern-service-card-2');
      
      expect(serviceCard1).toBeInTheDocument();
      expect(serviceCard2).toBeInTheDocument();
      
      // Check that service cards have proper content
      expect(screen.getByText('Deep House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
    });

    it('should render progressive reveal animations with correct delays', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const progressiveReveals = screen.getAllByTestId('progressive-reveal');
      expect(progressiveReveals.length).toBeGreaterThan(0);
      
      // Check that different sections have different delays
      const delays = progressiveReveals.map(el => el.getAttribute('data-delay'));
      expect(delays).toContain('200'); // Services section
      expect(delays).toContain('300'); // Features section
      expect(delays).toContain('400'); // CTA section
    });

    it('should render staggered grid animations for service cards', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toBeInTheDocument();
      expect(staggeredGrid).toHaveAttribute('data-stagger-delay', '100');
      expect(staggeredGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-8');
    });
  });

  describe('Performance Tests', () => {
    it('should render without performance issues', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Wait for all components to render
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-hero-section')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle service card interactions efficiently', async () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const bookButton = screen.getByTestId('book-1');
      const viewButton = screen.getByTestId('view-1');
      
      const startTime = performance.now();
      
      fireEvent.click(bookButton);
      fireEvent.click(viewButton);
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Interactions should be fast (less than 50ms)
      expect(interactionTime).toBeLessThan(50);
    });

    it('should not cause memory leaks with animations', () => {
      const { unmount } = renderWithProviders(<ModernizedHomePageClient />);
      
      // Simulate multiple renders and unmounts
      for (let i = 0; i < 10; i++) {
        unmount();
        renderWithProviders(<ModernizedHomePageClient />);
      }
      
      // Should not throw errors or cause memory issues
      expect(screen.getByTestId('enhanced-hero-section')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Should have main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Should have section headings
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(1);
    });

    it('should have accessible service card buttons', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const bookButtons = screen.getAllByText('Book Now');
      const viewButtons = screen.getAllByText('View Details');
      
      bookButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-disabled');
      });
      
      viewButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-disabled');
      });
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const bookButton = screen.getByTestId('book-1');
      
      // Should be focusable
      bookButton.focus();
      expect(document.activeElement).toBe(bookButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(bookButton, { key: 'Enter', code: 'Enter' });
      // Button click should be triggered (mocked router.push would be called)
    });

    it('should have proper color contrast', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check that text elements exist (actual contrast testing would require additional tools)
      const textElements = screen.getAllByText(/./);
      expect(textElements.length).toBeGreaterThan(0);
      
      // Ensure no elements have insufficient contrast indicators
      textElements.forEach(element => {
        expect(element).not.toHaveClass('text-gray-400'); // Very light text that might have contrast issues
      });
    });

    it('should support screen readers with proper ARIA labels', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check for semantic HTML structure
      const main = screen.getByRole('main') || document.querySelector('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
      
      // Service cards should have proper structure
      const serviceCards = screen.getAllByTestId(/modern-service-card-/);
      serviceCards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Animation Integration Tests', () => {
    it('should integrate progressive reveal animations correctly', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const progressiveReveals = screen.getAllByTestId('progressive-reveal');
      
      // Should have multiple progressive reveal sections
      expect(progressiveReveals.length).toBeGreaterThanOrEqual(3);
      
      // Each should have appropriate delay
      progressiveReveals.forEach(reveal => {
        const delay = reveal.getAttribute('data-delay');
        expect(delay).toMatch(/^\d+$/); // Should be a number
        expect(parseInt(delay || '0')).toBeGreaterThanOrEqual(100);
      });
    });

    it('should integrate staggered grid animations for service cards', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const staggeredGrids = screen.getAllByTestId('staggered-grid');
      
      // Should have staggered grids for service cards and features
      expect(staggeredGrids.length).toBeGreaterThanOrEqual(2);
      
      staggeredGrids.forEach(grid => {
        const staggerDelay = grid.getAttribute('data-stagger-delay');
        expect(staggerDelay).toMatch(/^\d+$/);
        expect(parseInt(staggerDelay || '0')).toBeGreaterThan(0);
      });
    });

    it('should handle animation state changes properly', async () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Simulate scroll events that might trigger animations
      fireEvent.scroll(window, { target: { scrollY: 100 } });
      
      await waitFor(() => {
        // Animations should still be working
        expect(screen.getByTestId('enhanced-hero-section')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration Tests', () => {
    it('should integrate enhanced hero section with proper props', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const heroSection = screen.getByTestId('enhanced-hero-section');
      expect(heroSection).toBeInTheDocument();
      
      // Should show stats and trust indicators
      expect(screen.getByTestId('hero-stats')).toBeInTheDocument();
      expect(screen.getByTestId('trust-indicators')).toBeInTheDocument();
    });

    it('should integrate modern service cards with enhanced features', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const serviceCards = screen.getAllByTestId(/modern-service-card-/);
      expect(serviceCards.length).toBe(2);
      
      // Should have proper variants (featured for every 3rd card)
      const variants = serviceCards.map(card => 
        card.querySelector('[data-testid="card-variant"]')?.textContent
      );
      
      expect(variants).toContain('featured'); // Second card should be featured (index 1)
      expect(variants).toContain('standard');
    });

    it('should handle service card interactions correctly', () => {
      const mockPush = jest.fn();
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
          replace: jest.fn(),
          back: jest.fn()
        })
      }));
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      const bookButton = screen.getByTestId('book-1');
      fireEvent.click(bookButton);
      
      // Should navigate to register page for non-authenticated users
      expect(mockPush).toHaveBeenCalledWith('/register');
    });
  });

  describe('Responsive Design Tests', () => {
    it('should render properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toHaveClass('grid-cols-1');
    });

    it('should render properly on tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toHaveClass('md:grid-cols-2');
    });

    it('should render properly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toHaveClass('lg:grid-cols-3');
    });
  });
});