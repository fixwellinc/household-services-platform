import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FeaturesSection from '@/components/pages/home/FeaturesSection'

// Mock dependencies
vi.mock('@/components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>
}))

vi.mock('@/components/ui/animations/ProgressiveReveal', () => ({
  ProgressiveReveal: ({ children }: any) => <div data-testid="progressive-reveal">{children}</div>
}))

vi.mock('@/components/ui/animations/StaggeredGrid', () => ({
  StaggeredGrid: ({ children, className }: any) => <div className={className} data-testid="staggered-grid">{children}</div>
}))

describe('FeaturesSection', () => {
  it('renders without crashing', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('Why Choose Us?')).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText('Professional Quality')).toBeInTheDocument()
    expect(screen.getByText('Quality Assured')).toBeInTheDocument()
    expect(screen.getByText('Instant Booking')).toBeInTheDocument()
    expect(screen.getByText('Save Up to 40%')).toBeInTheDocument()
    
    // Should have 4 feature cards
    expect(screen.getAllByTestId('card')).toHaveLength(4)
  })

  it('renders feature descriptions correctly', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText(/All our services are professionally managed/)).toBeInTheDocument()
    expect(screen.getByText(/We stand behind every service/)).toBeInTheDocument()
    expect(screen.getByText(/Book services in minutes/)).toBeInTheDocument()
    expect(screen.getByText(/Get professional quality at contractor rates/)).toBeInTheDocument()
  })

  it('renders section header with correct content', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText('Why Choose Us')).toBeInTheDocument() // Badge text
    expect(screen.getByText('Why Choose Us?')).toBeInTheDocument() // Main heading
    expect(screen.getByText(/While other platforms focus on contracts/)).toBeInTheDocument()
    expect(screen.getByText(/We make household services simple/)).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-features-class'
    const { container } = render(<FeaturesSection className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('uses ProgressiveReveal and StaggeredGrid animations', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByTestId('progressive-reveal')).toBeInTheDocument()
    expect(screen.getByTestId('staggered-grid')).toBeInTheDocument()
  })

  it('renders with proper grid layout classes', () => {
    render(<FeaturesSection />)
    
    const staggeredGrid = screen.getByTestId('staggered-grid')
    expect(staggeredGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-8')
  })
})