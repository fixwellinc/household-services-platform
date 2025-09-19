import { renderHook } from '@testing-library/react';
import { useStaggeredAnimation, createStaggeredClasses } from '@/hooks/use-staggered-animation';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useStaggeredAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate correct number of items', () => {
    const { result } = renderHook(() => 
      useStaggeredAnimation({ itemCount: 3 })
    );
    
    expect(result.current.items).toHaveLength(3);
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
  });

  it('should apply correct stagger delays', () => {
    const { result } = renderHook(() => 
      useStaggeredAnimation({ 
        itemCount: 3, 
        staggerDelay: 150,
        baseDelay: 100 
      })
    );
    
    const delays = result.current.items.map(item => item.delay);
    expect(delays).toEqual([100, 250, 400]);
  });

  it('should generate correct animation styles', () => {
    const { result } = renderHook(() => 
      useStaggeredAnimation({ 
        itemCount: 2, 
        staggerDelay: 100,
        duration: 800 
      })
    );
    
    const firstItemStyle = result.current.items[0].style;
    expect(firstItemStyle).toEqual({
      animationDelay: '0ms',
      animationDuration: '800ms',
      animationFillMode: 'both',
    });

    const secondItemStyle = result.current.items[1].style;
    expect(secondItemStyle).toEqual({
      animationDelay: '100ms',
      animationDuration: '800ms',
      animationFillMode: 'both',
    });
  });

  it('should handle reduced motion preference', () => {
    // Mock reduced motion preference
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => 
      useStaggeredAnimation({ 
        itemCount: 2, 
        staggerDelay: 100,
        duration: 600 
      })
    );
    
    const firstItemStyle = result.current.items[0].style;
    expect(firstItemStyle).toEqual({
      transition: 'opacity 600ms ease-out 0ms',
    });
  });

  it('should generate initial opacity-0 classes', () => {
    const { result } = renderHook(() => 
      useStaggeredAnimation({ itemCount: 2 })
    );
    
    result.current.items.forEach(item => {
      expect(item.className).toBe('opacity-0');
      expect(item.isVisible).toBe(false);
    });
  });
});

describe('createStaggeredClasses', () => {
  it('should generate correct CSS classes', () => {
    const classes = createStaggeredClasses(3, 150, 100);
    
    expect(classes).toEqual([
      'animate-reveal-up [animation-delay:100ms]',
      'animate-reveal-up [animation-delay:250ms]',
      'animate-reveal-up [animation-delay:400ms]',
    ]);
  });

  it('should handle default values', () => {
    const classes = createStaggeredClasses(2);
    
    expect(classes).toEqual([
      'animate-reveal-up [animation-delay:0ms]',
      'animate-reveal-up [animation-delay:100ms]',
    ]);
  });
});