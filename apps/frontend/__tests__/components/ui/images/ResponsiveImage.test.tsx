import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ResponsiveImage,
  ResponsiveImageGrid,
  ResponsiveHeroImage,
  AdaptiveImage,
} from '@/components/ui/images/ResponsiveImage';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        data-testid="next-image"
        {...props}
      />
    );
  };
});

// Mock intersection observer hook
jest.mock('@/hooks/use-intersection-observer', () => ({
  useIntersectionObserver: () => ({ isIntersecting: true }),
}));

// Mock responsive hooks
jest.mock('@/hooks/use-container-query', () => ({
  useResponsiveImageSize: () => ({ width: 400, height: 300 }),
  useResponsiveAspectRatio: () => '16 / 9',
}));

describe('ResponsiveImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
  };

  it('renders image with correct props', async () => {
    render(<ResponsiveImage {...defaultProps} />);
    
    await waitFor(() => {
      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });
  });

  it('shows loading placeholder initially', () => {
    render(<ResponsiveImage {...defaultProps} loading="lazy" />);
    
    const loadingElement = screen.getByRole('generic');
    expect(loadingElement).toBeInTheDocument();
  });

  it('applies custom aspect ratio', () => {
    const { container } = render(
      <ResponsiveImage {...defaultProps} aspectRatio="1 / 1" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('1 / 1');
  });

  it('handles priority loading', async () => {
    render(<ResponsiveImage {...defaultProps} priority />);
    
    await waitFor(() => {
      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
    });
  });

  it('shows error state when image fails to load', async () => {
    render(<ResponsiveImage {...defaultProps} />);
    
    const image = screen.getByTestId('next-image');
    
    // Simulate image error
    image.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });
  });

  it('uses fallback image on error', async () => {
    render(
      <ResponsiveImage
        {...defaultProps}
        fallbackSrc="/fallback.jpg"
      />
    );
    
    const image = screen.getByTestId('next-image');
    
    // Simulate image error
    image.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(image).toHaveAttribute('src', '/fallback.jpg');
    });
  });

  it('applies responsive dimensions', () => {
    render(<ResponsiveImage {...defaultProps} />);
    
    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('width', '400');
    expect(image).toHaveAttribute('height', '300');
  });

  it('handles fill mode correctly', async () => {
    render(<ResponsiveImage {...defaultProps} fill />);
    
    await waitFor(() => {
      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('fill');
    });
  });
});

describe('ResponsiveImageGrid', () => {
  const mockImages = [
    { src: '/image1.jpg', alt: 'Image 1', caption: 'Caption 1' },
    { src: '/image2.jpg', alt: 'Image 2', caption: 'Caption 2' },
    { src: '/image3.jpg', alt: 'Image 3' },
  ];

  it('renders all images', () => {
    render(<ResponsiveImageGrid images={mockImages} />);
    
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Image 3')).toBeInTheDocument();
  });

  it('displays captions when provided', () => {
    render(<ResponsiveImageGrid images={mockImages} />);
    
    expect(screen.getByText('Caption 1')).toBeInTheDocument();
    expect(screen.getByText('Caption 2')).toBeInTheDocument();
  });

  it('applies correct grid classes', () => {
    const { container } = render(
      <ResponsiveImageGrid images={mockImages} gap="lg" />
    );
    
    expect(container.firstChild).toHaveClass('grid', 'gap-6');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <ResponsiveImageGrid images={mockImages} onImageClick={handleClick} />
    );
    
    const firstImage = screen.getByAltText('Image 1').closest('div');
    firstImage?.click();
    
    expect(handleClick).toHaveBeenCalledWith(0);
  });
});

describe('ResponsiveHeroImage', () => {
  const defaultProps = {
    src: '/hero-image.jpg',
    alt: 'Hero image',
  };

  it('renders hero image with overlay', () => {
    render(
      <ResponsiveHeroImage {...defaultProps} overlay>
        <h1>Hero Title</h1>
      </ResponsiveHeroImage>
    );
    
    expect(screen.getByAltText('Hero image')).toBeInTheDocument();
    expect(screen.getByText('Hero Title')).toBeInTheDocument();
  });

  it('applies custom overlay color and opacity', () => {
    const { container } = render(
      <ResponsiveHeroImage
        {...defaultProps}
        overlay
        overlayColor="blue"
        overlayOpacity={0.6}
      />
    );
    
    const overlay = container.querySelector('[style*="backgroundColor"]');
    expect(overlay).toHaveStyle({
      backgroundColor: 'blue',
      opacity: '0.6',
    });
  });

  it('renders without overlay when not specified', () => {
    render(
      <ResponsiveHeroImage {...defaultProps}>
        <h1>Hero Title</h1>
      </ResponsiveHeroImage>
    );
    
    expect(screen.getByText('Hero Title')).toBeInTheDocument();
    expect(screen.queryByRole('generic')).not.toHaveStyle({
      backgroundColor: expect.any(String),
    });
  });
});

describe('AdaptiveImage', () => {
  const defaultProps = {
    src: '/default-image.jpg',
    alt: 'Adaptive image',
  };

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders with default source', () => {
    render(<AdaptiveImage {...defaultProps} />);
    
    expect(screen.getByAltText('Adaptive image')).toBeInTheDocument();
  });

  it('uses breakpoint-specific sources', () => {
    const breakpointSources = {
      lg: '/large-image.jpg',
      md: '/medium-image.jpg',
      sm: '/small-image.jpg',
    };

    render(
      <AdaptiveImage
        {...defaultProps}
        breakpointSources={breakpointSources}
      />
    );
    
    // Should use lg source for 1024px width
    expect(screen.getByTestId('next-image')).toHaveAttribute('src', '/large-image.jpg');
  });

  it('applies custom aspect ratio', () => {
    const { container } = render(
      <AdaptiveImage {...defaultProps} aspectRatio="4 / 3" />
    );
    
    const wrapper = container.querySelector('[style*="aspectRatio"]');
    expect(wrapper).toHaveStyle({ aspectRatio: '4 / 3' });
  });
});

describe('Accessibility', () => {
  it('provides proper alt text for screen readers', () => {
    render(
      <ResponsiveImage
        src="/test.jpg"
        alt="Descriptive alt text for screen readers"
      />
    );
    
    expect(screen.getByAltText('Descriptive alt text for screen readers')).toBeInTheDocument();
  });

  it('maintains focus management in image grid', () => {
    const images = [
      { src: '/image1.jpg', alt: 'Image 1' },
      { src: '/image2.jpg', alt: 'Image 2' },
    ];

    render(<ResponsiveImageGrid images={images} onImageClick={() => {}} />);
    
    const imageContainers = screen.getAllByRole('generic');
    imageContainers.forEach(container => {
      expect(container).toHaveClass('cursor-pointer');
    });
  });

  it('provides loading states for screen readers', () => {
    render(<ResponsiveImage src="/test.jpg" alt="Test image" loading="lazy" />);
    
    // Loading placeholder should be present initially
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('implements lazy loading by default', () => {
    render(<ResponsiveImage src="/test.jpg" alt="Test image" />);
    
    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('uses intersection observer for lazy loading', () => {
    // This is mocked, but in real implementation it would prevent loading
    // until the image is near the viewport
    render(<ResponsiveImage src="/test.jpg" alt="Test image" loading="lazy" />);
    
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
  });

  it('generates appropriate responsive sizes', () => {
    render(
      <ResponsiveImage
        src="/test.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );
    
    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('sizes');
  });
});