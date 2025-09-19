import { renderHook, act } from '@testing-library/react';
import {
  useContainerQuery,
  useBreakpoint,
  useResponsiveValue,
  useResponsiveGridColumns,
  useResponsiveAspectRatio,
  useResponsiveSpacing,
  useResponsiveFontSize,
  useContainerQuerySupport,
  useResponsiveImageSize,
  useResponsiveGap,
  useResponsiveDirection,
  useResponsiveVisibility,
} from '@/hooks/use-container-query';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  unobserve() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
}

global.ResizeObserver = MockResizeObserver;

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('useContainerQuery', () => {
  it('returns ref and initial result', () => {
    const { result } = renderHook(() =>
      useContainerQuery({ minWidth: 500 })
    );

    const [ref, queryResult] = result.current;

    expect(ref).toBeDefined();
    expect(queryResult).toEqual({
      matches: false,
      width: 0,
      height: 0,
    });
  });

  it('handles multiple query conditions', () => {
    const { result } = renderHook(() =>
      useContainerQuery({
        minWidth: 300,
        maxWidth: 800,
        minHeight: 200,
        maxHeight: 600,
      })
    );

    const [, queryResult] = result.current;

    expect(queryResult.matches).toBe(false);
  });
});

describe('useBreakpoint', () => {
  beforeEach(() => {
    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('returns correct breakpoint information for large screen', () => {
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toEqual({
      isSm: true,
      isMd: true,
      isLg: true,
      isXl: false,
      is2Xl: false,
      current: 'lg',
      width: 1024,
    });
  });

  it('returns correct breakpoint information for mobile', () => {
    // Mock mobile width
    Object.defineProperty(window, 'innerWidth', {
      value: 480,
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.current).toBe('xs');
    expect(result.current.isSm).toBe(false);
    expect(result.current.isMd).toBe(false);
    expect(result.current.isLg).toBe(false);
  });

  it('handles custom breakpoints', () => {
    const customBreakpoints = {
      sm: 500,
      md: 700,
      lg: 900,
      xl: 1100,
      '2xl': 1400,
    };

    const { result } = renderHook(() => useBreakpoint(customBreakpoints));

    expect(result.current.current).toBe('lg');
  });

  it('responds to window resize', () => {
    const { result } = renderHook(() => useBreakpoint());

    // Simulate window resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.current).toBe('xl');
    expect(result.current.isXl).toBe(true);
  });
});

describe('useResponsiveValue', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
    });
  });

  it('returns correct value for current breakpoint', () => {
    const values = {
      xs: 'mobile',
      sm: 'small',
      md: 'medium',
      lg: 'large',
      xl: 'extra-large',
    };

    const { result } = renderHook(() => useResponsiveValue(values));

    expect(result.current).toBe('large');
  });

  it('falls back to smaller breakpoint when current not defined', () => {
    const values = {
      xs: 'mobile',
      sm: 'small',
      // md and lg not defined
      xl: 'extra-large',
    };

    const { result } = renderHook(() => useResponsiveValue(values));

    expect(result.current).toBe('small');
  });

  it('returns undefined when no values match', () => {
    const values = {
      xl: 'extra-large',
      '2xl': 'extra-extra-large',
    };

    const { result } = renderHook(() => useResponsiveValue(values));

    expect(result.current).toBeUndefined();
  });
});

describe('useResponsiveGridColumns', () => {
  it('returns correct number of columns', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
    });

    const columns = {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    };

    const { result } = renderHook(() => useResponsiveGridColumns(columns));

    expect(result.current).toBe(4);
  });

  it('returns 1 when no columns defined', () => {
    const { result } = renderHook(() => useResponsiveGridColumns({}));

    expect(result.current).toBe(1);
  });
});

describe('useResponsiveAspectRatio', () => {
  it('returns correct aspect ratio', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
    });

    const ratios = {
      xs: '1 / 1',
      sm: '4 / 3',
      md: '16 / 9',
      lg: '21 / 9',
    };

    const { result } = renderHook(() => useResponsiveAspectRatio(ratios));

    expect(result.current).toBe('16 / 9');
  });

  it('returns default ratio when none defined', () => {
    const { result } = renderHook(() => useResponsiveAspectRatio({}));

    expect(result.current).toBe('1 / 1');
  });
});

describe('useResponsiveSpacing', () => {
  it('returns correct spacing value', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 640,
    });

    const spacing = {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    };

    const { result } = renderHook(() => useResponsiveSpacing(spacing));

    expect(result.current).toBe('1rem');
  });

  it('returns default spacing when none defined', () => {
    const { result } = renderHook(() => useResponsiveSpacing({}));

    expect(result.current).toBe('1rem');
  });
});

describe('useResponsiveFontSize', () => {
  it('returns correct font size', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1280,
    });

    const sizes = {
      xs: '0.875rem',
      sm: '1rem',
      md: '1.125rem',
      lg: '1.25rem',
      xl: '1.5rem',
    };

    const { result } = renderHook(() => useResponsiveFontSize(sizes));

    expect(result.current).toBe('1.5rem');
  });
});

describe('useContainerQuerySupport', () => {
  it('detects container query support', () => {
    // Mock container support
    Object.defineProperty(document.documentElement.style, 'container', {
      value: '',
      configurable: true,
    });

    const { result } = renderHook(() => useContainerQuerySupport());

    expect(result.current).toBe(true);
  });

  it('detects lack of container query support', () => {
    // Remove container support
    delete (document.documentElement.style as any).container;

    const { result } = renderHook(() => useContainerQuerySupport());

    expect(result.current).toBe(false);
  });
});

describe('useResponsiveImageSize', () => {
  it('returns correct image dimensions', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
    });

    const sizes = {
      xs: { width: 200, height: 150 },
      sm: { width: 300, height: 200 },
      md: { width: 400, height: 300 },
      lg: { width: 500, height: 400 },
    };

    const { result } = renderHook(() => useResponsiveImageSize(sizes));

    expect(result.current).toEqual({ width: 400, height: 300 });
  });

  it('returns default size when none defined', () => {
    const { result } = renderHook(() => useResponsiveImageSize({}));

    expect(result.current).toEqual({ width: 300, height: 200 });
  });
});

describe('useResponsiveGap', () => {
  it('returns correct gap value', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
    });

    const gaps = {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    };

    const { result } = renderHook(() => useResponsiveGap(gaps));

    expect(result.current).toBe('1.5rem');
  });
});

describe('useResponsiveDirection', () => {
  it('returns correct flex direction', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 640,
    });

    const directions = {
      xs: 'column' as const,
      sm: 'row' as const,
      md: 'row' as const,
      lg: 'row' as const,
    };

    const { result } = renderHook(() => useResponsiveDirection(directions));

    expect(result.current).toBe('row');
  });

  it('returns default direction when none defined', () => {
    const { result } = renderHook(() => useResponsiveDirection({}));

    expect(result.current).toBe('column');
  });
});

describe('useResponsiveVisibility', () => {
  it('returns correct visibility state', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
    });

    const visibility = {
      xs: false,
      sm: false,
      md: true,
      lg: true,
      xl: true,
    };

    const { result } = renderHook(() => useResponsiveVisibility(visibility));

    expect(result.current).toBe(true);
  });

  it('returns true by default when none defined', () => {
    const { result } = renderHook(() => useResponsiveVisibility({}));

    expect(result.current).toBe(true);
  });

  it('handles undefined visibility correctly', () => {
    const visibility = {
      xs: true,
      sm: undefined,
      md: false,
    };

    Object.defineProperty(window, 'innerWidth', {
      value: 640,
    });

    const { result } = renderHook(() => useResponsiveVisibility(visibility));

    expect(result.current).toBe(true);
  });
});