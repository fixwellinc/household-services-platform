import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, AnimationErrorBoundary } from '@/components/ui/error-handling/ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock window.location
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: '',
  },
  writable: true,
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. This has been reported to our team.')).toBeInTheDocument();
  });

  it('displays error ID when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorIdElement = screen.getByText(/Error ID:/);
    expect(errorIdElement).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('handles retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(retryButton);

    // Re-render with no error to simulate retry
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('handles go home button click', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByRole('button', { name: 'Go to homepage' });
    fireEvent.click(homeButton);

    expect(window.location.href).toBe('/');
  });

  it('resets error boundary when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys to trigger reset
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsElement = screen.getByText('Show error details (development only)');
    expect(detailsElement).toBeInTheDocument();

    fireEvent.click(detailsElement);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText(/Stack:/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Show error details (development only)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('AnimationErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <AnimationErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AnimationErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders fallback when animation component errors', () => {
    render(
      <AnimationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnimationErrorBoundary>
    );

    const fallbackElement = screen.getByRole('img', { name: 'Content loaded without animation' });
    expect(fallbackElement).toBeInTheDocument();
    expect(fallbackElement).toHaveClass('opacity-100', 'transform-none', 'transition-none');
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Animation failed, showing static content</div>;
    
    render(
      <AnimationErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </AnimationErrorBoundary>
    );

    expect(screen.getByText('Animation failed, showing static content')).toBeInTheDocument();
  });

  it('logs animation-specific warning when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    
    render(
      <AnimationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AnimationErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith('Animation component error:', 'Test error');
  });
});