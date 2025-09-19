import { renderHook, act } from '@testing-library/react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

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

describe('useScrollAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.isVisible).toBe(false);
    expect(result.current.className).toBe('opacity-0');
    expect(result.current.style).toEqual({});
  });

  it('should apply custom animation type', () => {
    const { result } = renderHook(() => 
      useScrollAnimation({ animation: 'bounce-in' })
    );
    
    expect(result.current.className).toBe('opacity-0');
  });

  it('should apply custom delay and duration', () => {
    const { result } = renderHook(() => 
      useScrollAnimation({ delay: 200, duration: 800 })
    );
    
    expect(result.current.style).toEqual({
      animationDelay: '200ms',
      animationDuration: '800ms',
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
      useScrollAnimation({ respectReducedMotion: true })
    );
    
    expect(result.current.style).toEqual({
      transition: 'opacity 600ms ease-out 0ms',
    });
  });

  it('should not respect reduced motion when disabled', () => {
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
      useScrollAnimation({ respectReducedMotion: false })
    );
    
    expect(result.current.style).toEqual({});
  });

  it('should pass through intersection observer options', () => {
    renderHook(() => 
      useScrollAnimation({ 
        threshold: 0.5, 
        rootMargin: '100px',
        triggerOnce: false 
      })
    );
    
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });
});