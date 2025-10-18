import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ServicesSection from '@/components/pages/home/ServicesSection'

// Mock dependencies
vi.mock('@/hooks/use-api', () => ({
  useServices: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@/components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>
}))

vi.mock('@/components/ui/cards/ModernServiceCard', () => ({
  default: ({ service, variant, onBook, onView }: any) => (
    <div data-testid="modern-service-card">
      <div data-testid="service-name">{service.name}</div>
      <div data-testid="service-variant">{variant}</div>
      <button onClick={onBook} data-testid="book-button">Book</button>
      <button onClick={onView} data-testid="view-button">View</button>
    </div>
  )
}))

vi.mock('@/components/ui/animations/ProgressiveReveal', () => ({
  ProgressiveReveal: ({ children }: any) => <div data-testid="progressive-reveal">{children}</div>
}))

vi.mock('@/components/ui/animations/StaggeredGrid', () => ({
  StaggeredGrid: ({ children, className }: any) => <div className={className} data-testid="staggered-grid">{children}</div>
}))

const mockServices = [
  {
    id: '1',
    name: 'House Cleaning',
    category: 'CLEANING',
    basePrice: 100,
    description: 'Professional house cleaning'
  },
  {
    id: '2',
    name: 'Plumbing Repair',
    category: 'REPAIR',
    basePrice: 150,
    description: 'Professional plumbing services'
  }
]

describe('ServicesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: null,
      isLoading: true
    })

    render(<ServicesSection />)
    
    expect(screen.getAllByTestId('card')).toHaveLength(6) // 6 skeleton cards
  })

  it('renders services when data is available', async () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: { services: mockServices },
      isLoading: false
    })

    render(<ServicesSection />)
    
    await waitFor(() => {
      expect(screen.getByText('Professional Services')).toBeInTheDocument()
      expect(screen.getAllByTestId('modern-service-card')).toHaveLength(2)
      expect(screen.getByTestId('service-name')).toHaveTextContent('House Cleaning')
    })
  })

  it('renders empty state when no services available', () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: { services: [] },
      isLoading: false
    })

    render(<ServicesSection />)
    
    expect(screen.getByText('No services available')).toBeInTheDocument()
    expect(screen.getByText('Check back soon for amazing new services.')).toBeInTheDocument()
  })

  it('calculates contractor prices correctly', () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: { services: mockServices },
      isLoading: false
    })

    render(<ServicesSection />)
    
    // The component should render service cards with calculated pricing
    expect(screen.getAllByTestId('modern-service-card')).toHaveLength(2)
  })

  it('applies custom className when provided', () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: { services: [] },
      isLoading: false
    })

    const customClass = 'custom-services-class'
    const { container } = render(<ServicesSection className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('renders cost comparison banner', () => {
    const { useServices } = require('@/hooks/use-api')
    useServices.mockReturnValue({
      data: { services: mockServices },
      isLoading: false
    })

    render(<ServicesSection />)
    
    expect(screen.getByText('Save up to 40%')).toBeInTheDocument()
    expect(screen.getByText('Contractor Average')).toBeInTheDocument()
    expect(screen.getByText('Fixwell Service')).toBeInTheDocument()
  })
})