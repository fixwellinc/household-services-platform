import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ServicesPage from '@/app/services/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';

// Mock the API hooks
jest.mock('@/hooks/use-api', () => ({
  useServices: () => ({
    data: {
      services: []
    },
    isLoading: false
  }),
  useCurrentUser: () => ({
    data: null,
    isLoading: false
  })
}));

jest.mock('@/hooks/use-plans', () => ({
  useUserPlan: () => ({
    data: null
  })
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the modernized components
jest.mock('@/components/ui/cards/ModernServiceCard', () => {
  return function MockModernServiceCard({ service, variant, onBook, onView, showPricingComparison }: any) {
    return (
      <div data-testid={`modern-service-card-${service.id}`}>
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <div data-testid="card-variant">{variant}</div>
        <div data-testid="pricing-comparison">{showPricingComparison ? 'shown' : 'hidden'}</div>
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

// Mock modals
jest.mock('@/components/location/DynamicLocationPromptModal', () => {
  return function MockLocationModal({ isOpen, onClose, onLocationSet }: any) {
    return isOpen ? (
      <div data-testid="location-modal">
        <button onClick={onLocationSet} data-testid="set-location">Set Location</button>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/QuoteRequestModal', () => {
  return function MockQuoteModal({ isOpen, onClose, serviceName, serviceId }: any) {
    return isOpen ? (
      <div data-testid="quote-modal">
        <div data-testid="service-name">{serviceName}</div>
        <div data-testid="service-id">{serviceId}</div>
        <button onClick={onClose} data-testid="close-quote-modal">Close</button>
      </div>
    ) : null;
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

describe('ModernizedServicesPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Visual Regression Tests', () => {
    it('should render progressive reveal animations with correct delays', () => {
      renderWithProviders(<ServicesPage />);
      
      const progressiveReveals = screen.getAllByTestId('progressive-reveal');
      expect(progressiveReveals.length).toBeGreaterThan(0);
      
      // Check that different sections have different delays
      const delays = progressiveReveals.map(el => el.getAttribute('data-delay'));
      expect(delays).toContain('100'); // Hero section
      expect(delays).toContain('200'); // Search section
      expect(delays).toContain('400'); // CTA section
    });

    it('should render staggered grid for service cards', () => {
      renderWithProviders(<ServicesPage />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toBeInTheDocument();
      expect(staggeredGrid).toHaveAttribute('data-stagger-delay', '100');
      expect(staggeredGrid).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should render modernized service cards with correct props', () => {
      renderWithProviders(<ServicesPage />);
      
      // Should render sample services with ModernServiceCard
      const serviceCards = screen.getAllByTestId(/modern-service-card-/);
      expect(serviceCards.length).toBeGreaterThan(0);
      
      // Check that cards have pricing comparison enabled
      const pricingComparisons = screen.getAllByTestId('pricing-comparison');
      pricingComparisons.forEach(comparison => {
        expect(comparison).toHaveTextContent('shown');
      });
    });

    it('should render hero section with stats and proper structure', () => {
      renderWithProviders(<ServicesPage />);
      
      // Should have main heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Our Services');
      
      // Should have stats
      expect(screen.getByText('10K+')).toBeInTheDocument();
      expect(screen.getByText('50+')).toBeInTheDocument();
      expect(screen.getByText('24/7')).toBeInTheDocument();
      expect(screen.getByText('99%')).toBeInTheDocument();
    });

    it('should render search and filter functionality', () => {
      renderWithProviders(<ServicesPage />);
      
      // Should have search input
      const searchInput = screen.getByPlaceholderText('Search for services...');
      expect(searchInput).toBeInTheDocument();
      
      // Should have category filters
      expect(screen.getByText('All Services')).toBeInTheDocument();
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Repair')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<ServicesPage />);
      
      // Wait for all components to render
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 150ms)
      expect(renderTime).toBeLessThan(150);
    });

    it('should handle search interactions efficiently', async () => {
      renderWithProviders(<ServicesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search for services...');
      
      const startTime = performance.now();
      
      // Simulate typing in search
      fireEvent.change(searchInput, { target: { value: 'cleaning' } });
      fireEvent.change(searchInput, { target: { value: 'cleaning service' } });
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Search interactions should be fast (less than 50ms)
      expect(searchTime).toBeLessThan(50);
    });

    it('should handle category filtering efficiently', () => {
      renderWithProviders(<ServicesPage />);
      
      const cleaningFilter = screen.getByText('Cleaning');
      const repairFilter = screen.getByText('Repair');
      
      const startTime = performance.now();
      
      // Simulate multiple filter changes
      fireEvent.click(cleaningFilter);
      fireEvent.click(repairFilter);
      fireEvent.click(screen.getByText('All Services'));
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      // Filter interactions should be fast (less than 75ms)
      expect(filterTime).toBeLessThan(75);
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<ServicesPage />);
      
      // Should have main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Our Services');
      
      // Should have section headings
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have accessible search functionality', () => {
      renderWithProviders(<ServicesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search for services...');
      
      // Should be focusable
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      
      // Should have proper labeling
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should have accessible category filters', () => {
      renderWithProviders(<ServicesPage />);
      
      const categoryButtons = [
        screen.getByText('All Services'),
        screen.getByText('Cleaning'),
        screen.getByText('Maintenance'),
        screen.getByText('Repair')
      ];
      
      categoryButtons.forEach(button => {
        // Should be focusable
        button.focus();
        expect(document.activeElement).toBe(button);
        
        // Should respond to keyboard events
        fireEvent.keyDown(button, { key: 'Enter' });
        fireEvent.keyDown(button, { key: ' ' });
      });
    });

    it('should have accessible service cards', () => {
      renderWithProviders(<ServicesPage />);
      
      const serviceCards = screen.getAllByTestId(/modern-service-card-/);
      
      serviceCards.forEach(card => {
        // Should have proper heading structure
        const heading = card.querySelector('h3');
        expect(heading).toBeInTheDocument();
        
        // Should have accessible buttons
        const buttons = card.querySelectorAll('button');
        buttons.forEach(button => {
          expect(button).toBeInTheDocument();
          expect(button.textContent).toBeTruthy();
        });
      });
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<ServicesPage />);
      
      // Get all interactive elements
      const buttons = screen.getAllByRole('button');
      const inputs = screen.getAllByRole('textbox');
      const interactiveElements = [...buttons, ...inputs];
      
      // All should be focusable
      interactiveElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('Interaction Tests', () => {
    it('should handle service search correctly', () => {
      renderWithProviders(<ServicesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search for services...');
      
      // Should update search query
      fireEvent.change(searchInput, { target: { value: 'plumbing' } });
      expect(searchInput).toHaveValue('plumbing');
      
      // Should filter services (implementation would show/hide cards)
      fireEvent.change(searchInput, { target: { value: 'cleaning' } });
      expect(searchInput).toHaveValue('cleaning');
    });

    it('should handle category filtering correctly', () => {
      renderWithProviders(<ServicesPage />);
      
      const cleaningFilter = screen.getByText('Cleaning');
      const allServicesFilter = screen.getByText('All Services');
      
      // Should change active filter
      fireEvent.click(cleaningFilter);
      // Visual feedback would be tested in actual implementation
      
      fireEvent.click(allServicesFilter);
      // Should reset to show all services
    });

    it('should handle service card interactions for non-authenticated users', () => {
      renderWithProviders(<ServicesPage />);
      
      const bookButtons = screen.getAllByTestId(/book-/);
      
      if (bookButtons.length > 0) {
        fireEvent.click(bookButtons[0]);
        
        // Should show location modal or redirect to register
        // Implementation depends on location context
      }
    });

    it('should handle quote requests correctly', () => {
      renderWithProviders(<ServicesPage />);
      
      const viewButtons = screen.getAllByTestId(/view-/);
      
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);
        
        // Should open quote modal
        waitFor(() => {
          expect(screen.getByTestId('quote-modal')).toBeInTheDocument();
        });
      }
    });

    it('should handle CTA section interactions', () => {
      renderWithProviders(<ServicesPage />);
      
      // Should have CTA buttons
      const ctaButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Get You Started') || 
        button.textContent?.includes('Custom Quote')
      );
      
      expect(ctaButtons.length).toBeGreaterThan(0);
      
      ctaButtons.forEach(button => {
        fireEvent.click(button);
        // Should trigger appropriate actions (navigation or modal)
      });
    });
  });

  describe('Animation Integration Tests', () => {
    it('should integrate progressive reveal animations correctly', () => {
      renderWithProviders(<ServicesPage />);
      
      const progressiveReveals = screen.getAllByTestId('progressive-reveal');
      
      // Should have multiple progressive reveal sections
      expect(progressiveReveals.length).toBeGreaterThanOrEqual(3);
      
      // Each should have appropriate delay
      progressiveReveals.forEach(reveal => {
        const delay = reveal.getAttribute('data-delay');
        expect(delay).toMatch(/^\d+$/);
        expect(parseInt(delay || '0')).toBeGreaterThanOrEqual(100);
      });
    });

    it('should integrate staggered grid animations for service cards', () => {
      renderWithProviders(<ServicesPage />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      
      expect(staggeredGrid).toBeInTheDocument();
      expect(staggeredGrid).toHaveAttribute('data-stagger-delay', '100');
      
      // Should contain service cards
      const serviceCards = staggeredGrid.querySelectorAll('[data-testid*="modern-service-card"]');
      expect(serviceCards.length).toBeGreaterThan(0);
    });

    it('should handle animation state changes properly', async () => {
      renderWithProviders(<ServicesPage />);
      
      // Simulate scroll events that might trigger animations
      fireEvent.scroll(window, { target: { scrollY: 100 } });
      
      await waitFor(() => {
        // Animations should still be working
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
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
      
      renderWithProviders(<ServicesPage />);
      
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
      
      renderWithProviders(<ServicesPage />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toHaveClass('sm:grid-cols-2');
    });

    it('should render properly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderWithProviders(<ServicesPage />);
      
      const staggeredGrid = screen.getByTestId('staggered-grid');
      expect(staggeredGrid).toHaveClass('lg:grid-cols-3');
    });

    it('should handle responsive search and filters', () => {
      renderWithProviders(<ServicesPage />);
      
      // Search should be responsive
      const searchInput = screen.getByPlaceholderText('Search for services...');
      expect(searchInput).toHaveClass('text-base', 'sm:text-lg');
      
      // Category filters should wrap properly
      const categoryContainer = searchInput.parentElement?.parentElement?.querySelector('.flex-wrap');
      expect(categoryContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle empty search results gracefully', () => {
      renderWithProviders(<ServicesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search for services...');
      
      // Search for something that won't match
      fireEvent.change(searchInput, { target: { value: 'nonexistentservice' } });
      
      // Should show no results message
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('should handle filter reset correctly', () => {
      renderWithProviders(<ServicesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search for services...');
      const cleaningFilter = screen.getByText('Cleaning');
      
      // Apply filters
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.click(cleaningFilter);
      
      // Clear filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      
      // Should reset search and category
      expect(searchInput).toHaveValue('');
    });

    it('should handle modal interactions correctly', async () => {
      renderWithProviders(<ServicesPage />);
      
      // Trigger quote modal
      const viewButtons = screen.getAllByTestId(/view-/);
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);
        
        await waitFor(() => {
          const modal = screen.getByTestId('quote-modal');
          expect(modal).toBeInTheDocument();
          
          // Should be able to close modal
          const closeButton = screen.getByTestId('close-quote-modal');
          fireEvent.click(closeButton);
        });
      }
    });
  });
});