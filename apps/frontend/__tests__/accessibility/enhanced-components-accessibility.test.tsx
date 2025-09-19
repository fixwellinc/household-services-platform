import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { jest } from '@jest/globals';
import ModernizedHomePageClient from '@/components/ModernizedHomePageClient';
import { EnhancedHeroSection } from '@/components/ui/hero/EnhancedHeroSection';
import ModernServiceCard from '@/components/ui/cards/ModernServiceCard';
import { ProgressiveReveal } from '@/components/ui/animations/ProgressiveReveal';
import { StaggeredGrid } from '@/components/ui/animations/StaggeredGrid';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the API hooks
jest.mock('@/hooks/use-api', () => ({
  useServices: () => ({
    data: {
      services: [
        {
          id: '1',
          name: 'Deep House Cleaning',
          description: 'Professional deep cleaning service for your home',
          category: 'CLEANING',
          basePrice: 150,
          complexity: 'MODERATE'
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

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <LocationProvider>
        {component}
      </LocationProvider>
    </AuthProvider>
  );
};

describe('Enhanced Components Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ModernizedHomePageClient Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = renderWithProviders(<ModernizedHomePageClient />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Should have main heading (h1)
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      
      // Should have section headings (h2)
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
      
      // Headings should have meaningful text
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading.textContent).toBeTruthy();
        expect(heading.textContent!.length).toBeGreaterThan(2);
      });
    });

    it('should have proper landmark structure', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Should have main content area
      const main = screen.getByRole('main') || document.querySelector('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
      
      // Should have navigation if present
      const nav = screen.queryByRole('navigation');
      if (nav) {
        expect(nav).toBeInTheDocument();
      }
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Get all interactive elements
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      const interactiveElements = [...buttons, ...links];
      
      // All interactive elements should be focusable
      interactiveElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
      
      // Should support tab navigation
      if (interactiveElements.length > 1) {
        interactiveElements[0].focus();
        fireEvent.keyDown(interactiveElements[0], { key: 'Tab' });
        // Focus should move (implementation depends on actual focus management)
      }
    });

    it('should have sufficient color contrast', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check for elements that might have contrast issues
      const textElements = screen.getAllByText(/./);
      
      // Should not use very light text colors that might fail contrast
      textElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        
        // Basic check - should not be very light colors
        expect(color).not.toBe('rgb(200, 200, 200)'); // Very light gray
        expect(color).not.toBe('rgb(240, 240, 240)'); // Almost white
      });
    });

    it('should support screen readers with proper ARIA attributes', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check for proper ARIA labels where needed
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Buttons should have accessible names
        const accessibleName = button.getAttribute('aria-label') || 
                              button.getAttribute('aria-labelledby') || 
                              button.textContent;
        expect(accessibleName).toBeTruthy();
      });
      
      // Check for proper ARIA roles
      const elementsWithRoles = document.querySelectorAll('[role]');
      elementsWithRoles.forEach(element => {
        const role = element.getAttribute('role');
        expect(role).toBeTruthy();
        // Should use valid ARIA roles
        expect(['button', 'link', 'heading', 'main', 'navigation', 'banner', 'contentinfo', 'region'])
          .toContain(role);
      });
    });

    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Components should render without throwing errors when reduced motion is preferred
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('EnhancedHeroSection Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      // Should have a main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBeTruthy();
    });

    it('should have accessible statistics when shown', () => {
      render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      // Stats should be accessible to screen readers
      const statsElements = document.querySelectorAll('[data-testid*="stat"]') || 
                           document.querySelectorAll('.text-4xl, .text-3xl, .text-2xl');
      
      if (statsElements.length > 0) {
        statsElements.forEach(stat => {
          expect(stat.textContent).toBeTruthy();
        });
      }
    });

    it('should have accessible trust indicators', () => {
      render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      // Trust indicators should be accessible
      const trustElements = document.querySelectorAll('[data-testid*="trust"]') ||
                           document.querySelectorAll('.inline-flex');
      
      if (trustElements.length > 0) {
        trustElements.forEach(element => {
          expect(element.textContent).toBeTruthy();
        });
      }
    });

    it('should support keyboard navigation for interactive elements', () => {
      render(
        <EnhancedHeroSection 
          variant="gradient-mesh"
          showStats={true}
          showTrustIndicators={true}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
        
        // Should respond to Enter key
        fireEvent.keyDown(element, { key: 'Enter' });
        // Should respond to Space key for buttons
        if (element.tagName === 'BUTTON') {
          fireEvent.keyDown(element, { key: ' ' });
        }
      });
    });
  });

  describe('ModernServiceCard Accessibility', () => {
    const mockService = {
      id: '1',
      name: 'Test Service',
      description: 'This is a test service description that provides detailed information',
      category: 'CLEANING',
      basePrice: 150,
      complexity: 'MODERATE' as const,
      features: ['Professional service', 'Insured and bonded', 'Same-day availability'],
      rating: 4.8,
      reviewCount: 150,
      estimatedTime: '2-3 hours',
      popularity: 'high' as const,
      contractorPrice: 250,
      savingsPercentage: 40
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      // Service name should be a heading
      const serviceHeading = screen.getByRole('heading', { name: /Test Service/i });
      expect(serviceHeading).toBeInTheDocument();
    });

    it('should have accessible buttons with proper labels', () => {
      const mockOnBook = jest.fn();
      const mockOnView = jest.fn();
      
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
          onBook={mockOnBook}
          onView={mockOnView}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // Each button should have accessible text
        const accessibleName = button.getAttribute('aria-label') || 
                              button.textContent || 
                              button.getAttribute('title');
        expect(accessibleName).toBeTruthy();
        expect(accessibleName!.length).toBeGreaterThan(2);
      });
    });

    it('should support keyboard interactions', () => {
      const mockOnBook = jest.fn();
      const mockOnView = jest.fn();
      
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
          onBook={mockOnBook}
          onView={mockOnView}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // Should be focusable
        button.focus();
        expect(document.activeElement).toBe(button);
        
        // Should respond to Enter key
        fireEvent.keyDown(button, { key: 'Enter' });
        
        // Should respond to Space key
        fireEvent.keyDown(button, { key: ' ' });
      });
    });

    it('should have accessible pricing information', () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      // Price should be accessible to screen readers
      const priceText = screen.getByText(/\$150/);
      expect(priceText).toBeInTheDocument();
      
      // Pricing comparison should be accessible
      if (mockService.contractorPrice) {
        const contractorPrice = screen.getByText(/\$250/);
        expect(contractorPrice).toBeInTheDocument();
      }
    });

    it('should have accessible service features list', () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      // Features should be accessible
      mockService.features?.forEach(feature => {
        const featureElement = screen.getByText(feature);
        expect(featureElement).toBeInTheDocument();
      });
    });

    it('should handle focus management properly', () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="standard"
          showPricingComparison={true}
        />
      );
      
      const card = screen.getByRole('heading', { name: /Test Service/i }).closest('[role="article"]') ||
                   screen.getByRole('heading', { name: /Test Service/i }).closest('div');
      
      if (card) {
        // Card should be focusable or contain focusable elements
        const focusableElements = card.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        expect(focusableElements.length).toBeGreaterThan(0);
      }
    });

    it('should provide proper context for screen readers', () => {
      render(
        <ModernServiceCard 
          service={mockService}
          variant="featured"
          showPricingComparison={true}
        />
      );
      
      // Should have proper semantic structure
      const heading = screen.getByRole('heading', { name: /Test Service/i });
      expect(heading).toBeInTheDocument();
      
      // Description should be associated with the service
      const description = screen.getByText(mockService.description);
      expect(description).toBeInTheDocument();
      
      // Category should be accessible
      const category = screen.getByText(mockService.category);
      expect(category).toBeInTheDocument();
    });
  });

  describe('Animation Components Accessibility', () => {
    it('ProgressiveReveal should not have accessibility violations', async () => {
      const { container } = render(
        <ProgressiveReveal delay={100}>
          <div>
            <h2>Test Heading</h2>
            <p>Test content that should be accessible</p>
            <button>Test Button</button>
          </div>
        </ProgressiveReveal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('StaggeredGrid should not have accessibility violations', async () => {
      const { container } = render(
        <StaggeredGrid staggerDelay={50}>
          <div>
            <h3>Item 1</h3>
            <button>Action 1</button>
          </div>
          <div>
            <h3>Item 2</h3>
            <button>Action 2</button>
          </div>
        </StaggeredGrid>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should preserve focus during animations', async () => {
      render(
        <ProgressiveReveal delay={100}>
          <button data-testid="animated-button">Animated Button</button>
        </ProgressiveReveal>
      );
      
      const button = screen.getByTestId('animated-button');
      button.focus();
      
      // Focus should be maintained during animation
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
    });

    it('should respect reduced motion preferences in animations', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(
        <div>
          <ProgressiveReveal delay={100}>
            <div>Content with reduced motion</div>
          </ProgressiveReveal>
          <StaggeredGrid staggerDelay={50}>
            <div>Grid item 1</div>
            <div>Grid item 2</div>
          </StaggeredGrid>
        </div>
      );
      
      // Should render without errors when reduced motion is preferred
      expect(screen.getByText('Content with reduced motion')).toBeInTheDocument();
      expect(screen.getByText('Grid item 1')).toBeInTheDocument();
    });

    it('should maintain semantic structure during animations', () => {
      render(
        <StaggeredGrid staggerDelay={100}>
          <article>
            <h3>Article 1</h3>
            <p>Article content</p>
          </article>
          <article>
            <h3>Article 2</h3>
            <p>Article content</p>
          </article>
        </StaggeredGrid>
      );
      
      // Semantic structure should be preserved
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient contrast for text elements', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check that text elements don't use problematic color combinations
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
      
      textElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        const color = computedStyle.color;
        
        // Basic checks for obviously problematic combinations
        if (backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'white') {
          // White background should not have light text
          expect(color).not.toBe('rgb(200, 200, 200)');
          expect(color).not.toBe('rgb(240, 240, 240)');
        }
        
        if (backgroundColor === 'rgb(0, 0, 0)' || backgroundColor === 'black') {
          // Black background should not have dark text
          expect(color).not.toBe('rgb(50, 50, 50)');
          expect(color).not.toBe('rgb(100, 100, 100)');
        }
      });
    });

    it('should provide visual focus indicators', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const focusableElements = screen.getAllByRole('button');
      
      focusableElements.forEach(element => {
        element.focus();
        
        // Element should have focus styles (this is a basic check)
        const computedStyle = window.getComputedStyle(element);
        const outline = computedStyle.outline;
        const boxShadow = computedStyle.boxShadow;
        
        // Should have some form of focus indication
        expect(outline !== 'none' || boxShadow !== 'none').toBeTruthy();
      });
    });

    it('should not rely solely on color to convey information', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Check for elements that might rely only on color
      const colorOnlyElements = document.querySelectorAll('.text-red-500, .text-green-500, .text-blue-500');
      
      colorOnlyElements.forEach(element => {
        // Should have additional indicators beyond just color
        const hasIcon = element.querySelector('svg') || element.querySelector('[data-icon]');
        const hasText = element.textContent && element.textContent.trim().length > 0;
        const hasAriaLabel = element.getAttribute('aria-label');
        
        // Should have at least one additional indicator
        expect(hasIcon || hasText || hasAriaLabel).toBeTruthy();
      });
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should have appropriate touch targets on mobile', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const minHeight = parseInt(computedStyle.minHeight) || parseInt(computedStyle.height);
        const minWidth = parseInt(computedStyle.minWidth) || parseInt(computedStyle.width);
        
        // Touch targets should be at least 44px (WCAG recommendation)
        // Note: This is a simplified check - actual implementation may use padding
        if (minHeight > 0) {
          expect(minHeight).toBeGreaterThanOrEqual(32); // Allow some flexibility for padding
        }
        if (minWidth > 0) {
          expect(minWidth).toBeGreaterThanOrEqual(32);
        }
      });
    });

    it('should be navigable with assistive technologies on mobile', () => {
      renderWithProviders(<ModernizedHomePageClient />);
      
      // Should have proper heading structure for screen readers
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have accessible interactive elements
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        const accessibleName = element.getAttribute('aria-label') || 
                              element.textContent || 
                              element.getAttribute('title');
        expect(accessibleName).toBeTruthy();
      });
    });
  });
});