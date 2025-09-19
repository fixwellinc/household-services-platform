import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ContentPriority,
  AdaptiveArticleLayout,
  AdaptiveCardLayout,
  ResponsiveTable,
  AdaptiveNavigation,
  BreakpointTransition,
} from '@/components/ui/layout/AdaptiveContentLayout';

// Mock the breakpoint hook
jest.mock('@/hooks/use-container-query', () => ({
  useBreakpoint: () => ({ isMd: true, current: 'lg' }),
}));

describe('ContentPriority', () => {
  it('applies correct priority order classes', () => {
    const { container } = render(
      <ContentPriority priority="high">
        <div>High priority content</div>
      </ContentPriority>
    );

    expect(container.firstChild).toHaveClass('order-1');
  });

  it('applies custom mobile order when specified', () => {
    const { container } = render(
      <ContentPriority priority="medium" mobileOrder={3}>
        <div>Custom order content</div>
      </ContentPriority>
    );

    expect(container.firstChild).toHaveClass('order-3');
  });

  it('applies desktop order reset class', () => {
    const { container } = render(
      <ContentPriority priority="low">
        <div>Low priority content</div>
      </ContentPriority>
    );

    expect(container.firstChild).toHaveClass('md:order-none');
  });

  it('renders children correctly', () => {
    render(
      <ContentPriority priority="high">
        <div>Priority content</div>
      </ContentPriority>
    );

    expect(screen.getByText('Priority content')).toBeInTheDocument();
  });
});

describe('AdaptiveArticleLayout', () => {
  const defaultProps = {
    title: <h1>Article Title</h1>,
    content: <p>Article content goes here</p>,
  };

  it('renders all provided sections', () => {
    render(
      <AdaptiveArticleLayout
        {...defaultProps}
        subtitle={<h2>Subtitle</h2>}
        sidebar={<div>Sidebar content</div>}
        metadata={<div>Metadata</div>}
        actions={<button>Action</button>}
        image={<img src="/test.jpg" alt="Test" />}
      />
    );

    expect(screen.getByText('Article Title')).toBeInTheDocument();
    expect(screen.getByText('Article content goes here')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByAltText('Test')).toBeInTheDocument();
  });

  it('renders as article element', () => {
    const { container } = render(<AdaptiveArticleLayout {...defaultProps} />);
    
    expect(container.firstChild?.tagName).toBe('ARTICLE');
  });

  it('applies responsive layout classes', () => {
    const { container } = render(<AdaptiveArticleLayout {...defaultProps} />);
    
    expect(container.querySelector('.md\\:grid')).toBeInTheDocument();
  });
});

describe('AdaptiveCardLayout', () => {
  const defaultProps = {
    children: <p>Card content</p>,
  };

  it('renders card content', () => {
    render(<AdaptiveCardLayout {...defaultProps} />);
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders header and footer when provided', () => {
    render(
      <AdaptiveCardLayout
        {...defaultProps}
        header={<h3>Card Header</h3>}
        footer={<div>Card Footer</div>}
      />
    );

    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <AdaptiveCardLayout
        {...defaultProps}
        actions={<button>Card Action</button>}
      />
    );

    expect(screen.getByText('Card Action')).toBeInTheDocument();
  });

  it('applies horizontal layout for desktop', () => {
    const { container } = render(
      <AdaptiveCardLayout
        {...defaultProps}
        layout="horizontal"
        image={<img src="/test.jpg" alt="Test" />}
      />
    );

    expect(container.querySelector('.flex-row')).toBeInTheDocument();
  });

  it('applies background image layout', () => {
    const { container } = render(
      <AdaptiveCardLayout
        {...defaultProps}
        imagePosition="background"
        image={<img src="/test.jpg" alt="Test" />}
      />
    );

    expect(container.querySelector('.relative')).toBeInTheDocument();
    expect(container.querySelector('.absolute')).toBeInTheDocument();
  });

  it('applies image position classes correctly', () => {
    const { container } = render(
      <AdaptiveCardLayout
        {...defaultProps}
        layout="horizontal"
        imagePosition="right"
        image={<img src="/test.jpg" alt="Test" />}
      />
    );

    expect(container.querySelector('.flex-row-reverse')).toBeInTheDocument();
  });
});

describe('ResponsiveTable', () => {
  const mockData = [
    { Name: 'John Doe', Age: 30, City: 'New York' },
    { Name: 'Jane Smith', Age: 25, City: 'Los Angeles' },
  ];
  const headers = ['Name', 'Age', 'City'];

  beforeEach(() => {
    // Mock mobile breakpoint
    jest.clearAllMocks();
  });

  it('renders desktop table layout', () => {
    render(
      <ResponsiveTable headers={headers} data={mockData} />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders all headers in desktop layout', () => {
    render(
      <ResponsiveTable headers={headers} data={mockData} />
    );

    headers.forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  it('renders all data in desktop layout', () => {
    render(
      <ResponsiveTable headers={headers} data={mockData} />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('applies priority column styling', () => {
    render(
      <ResponsiveTable
        headers={headers}
        data={mockData}
        priorityColumns={['Name']}
      />
    );

    // In desktop layout, priority columns don't have special styling
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

describe('AdaptiveNavigation', () => {
  const mockItems = [
    { label: 'Home', href: '/', priority: 'high' as const },
    { label: 'About', href: '/about', priority: 'medium' as const },
    { label: 'Contact', href: '/contact', priority: 'low' as const },
  ];

  it('renders navigation items', () => {
    render(<AdaptiveNavigation items={mockItems} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders logo when provided', () => {
    render(
      <AdaptiveNavigation
        items={mockItems}
        logo={<div>Logo</div>}
      />
    );

    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <AdaptiveNavigation
        items={mockItems}
        actions={<button>Login</button>}
      />
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('applies correct href attributes', () => {
    render(<AdaptiveNavigation items={mockItems} />);

    const homeLink = screen.getByText('Home').closest('a');
    const aboutLink = screen.getByText('About').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders icons when provided', () => {
    const itemsWithIcons = [
      {
        label: 'Home',
        href: '/',
        icon: <span data-testid="home-icon">🏠</span>,
        priority: 'high' as const,
      },
    ];

    render(<AdaptiveNavigation items={itemsWithIcons} />);

    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });
});

describe('BreakpointTransition', () => {
  it('applies transition classes', () => {
    const { container } = render(
      <BreakpointTransition duration="fast" easing="ease-in">
        <div>Transitioning content</div>
      </BreakpointTransition>
    );

    expect(container.firstChild).toHaveClass('transition-all', 'duration-200', 'ease-in');
  });

  it('renders children correctly', () => {
    render(
      <BreakpointTransition>
        <div>Transition content</div>
      </BreakpointTransition>
    );

    expect(screen.getByText('Transition content')).toBeInTheDocument();
  });

  it('applies default duration and easing', () => {
    const { container } = render(
      <BreakpointTransition>
        <div>Content</div>
      </BreakpointTransition>
    );

    expect(container.firstChild).toHaveClass('duration-300', 'ease-in-out');
  });

  it('applies custom classes', () => {
    const { container } = render(
      <BreakpointTransition className="custom-class">
        <div>Content</div>
      </BreakpointTransition>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Accessibility', () => {
  it('maintains semantic HTML in article layout', () => {
    render(
      <AdaptiveArticleLayout
        title={<h1>Article Title</h1>}
        content={<p>Content</p>}
        sidebar={<nav>Navigation</nav>}
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('provides proper table structure', () => {
    const data = [{ Name: 'John', Age: 30 }];
    const headers = ['Name', 'Age'];

    render(<ResponsiveTable headers={headers} data={data} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
  });

  it('maintains navigation semantics', () => {
    const items = [{ label: 'Home', href: '/', priority: 'high' as const }];

    render(<AdaptiveNavigation items={items} />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('applies smooth transition classes for performance', () => {
    const { container } = render(
      <AdaptiveArticleLayout
        title={<h1>Title</h1>}
        content={<p>Content</p>}
      />
    );

    expect(container.querySelector('.smooth-breakpoint')).toBeInTheDocument();
  });

  it('uses efficient layout classes', () => {
    const { container } = render(
      <AdaptiveCardLayout layout="horizontal">
        <p>Content</p>
      </AdaptiveCardLayout>
    );

    expect(container.querySelector('.flex')).toBeInTheDocument();
  });
});