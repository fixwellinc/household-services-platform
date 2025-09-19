import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressiveReveal, RevealOnScroll } from '@/components/ui/animations/ProgressiveReveal';

// Mock the scroll animation hook
jest.mock('@/hooks/use-scroll-animation', () => ({
  useScrollAnimation: jest.fn(() => ({
    ref: { current: null },
    className: 'opacity-0',
    style: {},
  })),
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('ProgressiveReveal', () => {
  it('should render children correctly', () => {
    render(
      <ProgressiveReveal>
        <div>Test content</div>
      </ProgressiveReveal>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ProgressiveReveal className="custom-class">
        <div>Test content</div>
      </ProgressiveReveal>
    );
    
    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should render as different HTML elements', () => {
    render(
      <ProgressiveReveal as="section" data-testid="section">
        <div>Test content</div>
      </ProgressiveReveal>
    );
    
    const container = screen.getByTestId('section');
    expect(container.tagName).toBe('SECTION');
  });

  it('should pass animation props to hook', () => {
    const { useScrollAnimation } = require('@/hooks/use-scroll-animation');
    
    render(
      <ProgressiveReveal 
        animation="bounce-in"
        delay={200}
        duration={800}
        threshold={0.5}
      >
        <div>Test content</div>
      </ProgressiveReveal>
    );
    
    expect(useScrollAnimation).toHaveBeenCalledWith({
      animation: 'bounce-in',
      delay: 200,
      duration: 800,
      threshold: 0.5,
      rootMargin: '0px',
      triggerOnce: true,
    });
  });
});

describe('RevealOnScroll presets', () => {
  it('should render FadeUp preset correctly', () => {
    render(
      <RevealOnScroll.FadeUp>
        <div>Fade up content</div>
      </RevealOnScroll.FadeUp>
    );
    
    expect(screen.getByText('Fade up content')).toBeInTheDocument();
  });

  it('should render FadeLeft preset correctly', () => {
    render(
      <RevealOnScroll.FadeLeft>
        <div>Fade left content</div>
      </RevealOnScroll.FadeLeft>
    );
    
    expect(screen.getByText('Fade left content')).toBeInTheDocument();
  });

  it('should render BounceIn preset correctly', () => {
    render(
      <RevealOnScroll.BounceIn>
        <div>Bounce in content</div>
      </RevealOnScroll.BounceIn>
    );
    
    expect(screen.getByText('Bounce in content')).toBeInTheDocument();
  });

  it('should render RevealUp preset correctly', () => {
    render(
      <RevealOnScroll.RevealUp>
        <div>Reveal up content</div>
      </RevealOnScroll.RevealUp>
    );
    
    expect(screen.getByText('Reveal up content')).toBeInTheDocument();
  });
});