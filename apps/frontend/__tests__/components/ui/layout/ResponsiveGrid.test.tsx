import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ResponsiveGrid,
  ResponsiveContainer,
  ResponsiveSection,
  FlexResponsive,
  GridAreaLayout,
  GridAreaHeader,
  GridAreaMain,
  GridAreaSidebar,
  GridAreaFooter,
  ResponsiveShow,
  HierarchySpacing,
} from '@/components/ui/layout/ResponsiveGrid';

describe('ResponsiveGrid', () => {
  it('renders children correctly', () => {
    render(
      <ResponsiveGrid>
        <div>Test Item 1</div>
        <div>Test Item 2</div>
      </ResponsiveGrid>
    );

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { container } = render(
      <ResponsiveGrid variant="services">
        <div>Test</div>
      </ResponsiveGrid>
    );

    expect(container.firstChild).toHaveClass('grid-services');
  });

  it('applies custom gap classes', () => {
    const { container } = render(
      <ResponsiveGrid gap="lg">
        <div>Test</div>
      </ResponsiveGrid>
    );

    expect(container.firstChild).toHaveClass('gap-fluid-lg');
  });

  it('applies container query class when enabled', () => {
    const { container } = render(
      <ResponsiveGrid containerQuery>
        <div>Test</div>
      </ResponsiveGrid>
    );

    expect(container.firstChild).toHaveClass('container-query');
  });

  it('applies custom min item width for default variant', () => {
    const { container } = render(
      <ResponsiveGrid minItemWidth="400px">
        <div>Test</div>
      </ResponsiveGrid>
    );

    const element = container.firstChild as HTMLElement;
    expect(element.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(400px, 100%), 1fr))');
  });
});

describe('ResponsiveContainer', () => {
  it('renders with correct size class', () => {
    const { container } = render(
      <ResponsiveContainer size="lg">
        <div>Content</div>
      </ResponsiveContainer>
    );

    expect(container.firstChild).toHaveClass('container-lg');
  });

  it('applies fluid class when fluid prop is true', () => {
    const { container } = render(
      <ResponsiveContainer fluid>
        <div>Content</div>
      </ResponsiveContainer>
    );

    expect(container.firstChild).toHaveClass('container-fluid');
  });

  it('renders children correctly', () => {
    render(
      <ResponsiveContainer>
        <div>Container Content</div>
      </ResponsiveContainer>
    );

    expect(screen.getByText('Container Content')).toBeInTheDocument();
  });
});

describe('ResponsiveSection', () => {
  it('applies correct spacing classes', () => {
    const { container } = render(
      <ResponsiveSection spacing="lg">
        <div>Section Content</div>
      </ResponsiveSection>
    );

    expect(container.firstChild).toHaveClass('section-spacing-lg');
  });

  it('applies background classes', () => {
    const { container } = render(
      <ResponsiveSection background="gradient">
        <div>Section Content</div>
      </ResponsiveSection>
    );

    expect(container.firstChild).toHaveClass('bg-gradient-mesh-1');
  });

  it('renders as section element', () => {
    const { container } = render(
      <ResponsiveSection>
        <div>Section Content</div>
      </ResponsiveSection>
    );

    expect(container.firstChild?.tagName).toBe('SECTION');
  });
});

describe('FlexResponsive', () => {
  it('applies correct direction classes', () => {
    const { container } = render(
      <FlexResponsive direction="reverse">
        <div>Item 1</div>
        <div>Item 2</div>
      </FlexResponsive>
    );

    expect(container.firstChild).toHaveClass('flex-responsive-reverse');
  });

  it('applies alignment and justify classes', () => {
    const { container } = render(
      <FlexResponsive align="center" justify="between">
        <div>Item 1</div>
        <div>Item 2</div>
      </FlexResponsive>
    );

    expect(container.firstChild).toHaveClass('items-center', 'justify-between');
  });

  it('applies gap classes', () => {
    const { container } = render(
      <FlexResponsive gap="xl">
        <div>Item 1</div>
        <div>Item 2</div>
      </FlexResponsive>
    );

    expect(container.firstChild).toHaveClass('gap-fluid-xl');
  });
});

describe('GridAreaLayout', () => {
  it('renders with correct grid layout class', () => {
    const { container } = render(
      <GridAreaLayout>
        <div>Layout Content</div>
      </GridAreaLayout>
    );

    expect(container.firstChild).toHaveClass('grid-layout-main');
  });

  it('renders children correctly', () => {
    render(
      <GridAreaLayout>
        <div>Layout Content</div>
      </GridAreaLayout>
    );

    expect(screen.getByText('Layout Content')).toBeInTheDocument();
  });
});

describe('Grid Area Components', () => {
  it('GridAreaHeader renders as header with correct class', () => {
    const { container } = render(
      <GridAreaHeader>
        <div>Header Content</div>
      </GridAreaHeader>
    );

    expect(container.firstChild?.tagName).toBe('HEADER');
    expect(container.firstChild).toHaveClass('grid-area-header');
  });

  it('GridAreaMain renders as main with correct class', () => {
    const { container } = render(
      <GridAreaMain>
        <div>Main Content</div>
      </GridAreaMain>
    );

    expect(container.firstChild?.tagName).toBe('MAIN');
    expect(container.firstChild).toHaveClass('grid-area-main');
  });

  it('GridAreaSidebar renders as aside with correct class', () => {
    const { container } = render(
      <GridAreaSidebar>
        <div>Sidebar Content</div>
      </GridAreaSidebar>
    );

    expect(container.firstChild?.tagName).toBe('ASIDE');
    expect(container.firstChild).toHaveClass('grid-area-sidebar');
  });

  it('GridAreaFooter renders as footer with correct class', () => {
    const { container } = render(
      <GridAreaFooter>
        <div>Footer Content</div>
      </GridAreaFooter>
    );

    expect(container.firstChild?.tagName).toBe('FOOTER');
    expect(container.firstChild).toHaveClass('grid-area-footer');
  });
});

describe('ResponsiveShow', () => {
  it('applies correct show class for mobile', () => {
    const { container } = render(
      <ResponsiveShow on="mobile">
        <div>Mobile Content</div>
      </ResponsiveShow>
    );

    expect(container.firstChild).toHaveClass('responsive-show-mobile');
  });

  it('applies correct show class for tablet', () => {
    const { container } = render(
      <ResponsiveShow on="tablet">
        <div>Tablet Content</div>
      </ResponsiveShow>
    );

    expect(container.firstChild).toHaveClass('responsive-show-tablet');
  });

  it('applies correct show class for desktop', () => {
    const { container } = render(
      <ResponsiveShow on="desktop">
        <div>Desktop Content</div>
      </ResponsiveShow>
    );

    expect(container.firstChild).toHaveClass('responsive-show-desktop');
  });
});

describe('HierarchySpacing', () => {
  it('applies correct spacing class', () => {
    const { container } = render(
      <HierarchySpacing size="lg">
        <div>Content 1</div>
        <div>Content 2</div>
      </HierarchySpacing>
    );

    expect(container.firstChild).toHaveClass('hierarchy-spacing-lg');
  });

  it('renders children correctly', () => {
    render(
      <HierarchySpacing>
        <div>Spaced Content 1</div>
        <div>Spaced Content 2</div>
      </HierarchySpacing>
    );

    expect(screen.getByText('Spaced Content 1')).toBeInTheDocument();
    expect(screen.getByText('Spaced Content 2')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('maintains semantic HTML structure', () => {
    const { container } = render(
      <GridAreaLayout>
        <GridAreaHeader>
          <h1>Site Title</h1>
        </GridAreaHeader>
        <GridAreaMain>
          <p>Main content</p>
        </GridAreaMain>
        <GridAreaSidebar>
          <nav>Navigation</nav>
        </GridAreaSidebar>
        <GridAreaFooter>
          <p>Footer content</p>
        </GridAreaFooter>
      </GridAreaLayout>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('aside')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('preserves heading hierarchy', () => {
    render(
      <ResponsiveGrid>
        <div>
          <h1>Main Title</h1>
          <h2>Subtitle</h2>
        </div>
      </ResponsiveGrid>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('applies smooth transition classes', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Content</div>
      </ResponsiveGrid>
    );

    expect(container.firstChild).toHaveClass('smooth-breakpoint');
  });

  it('uses efficient CSS Grid properties', () => {
    const { container } = render(
      <ResponsiveGrid variant="adaptive">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    expect(container.firstChild).toHaveClass('grid-adaptive');
  });
});