import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CTASection from '@/components/pages/home/CTASection'

// Mock dependencies
vi.mock('@/components/ui/shared', () => ({
  Button: ({ children, className, size, variant, ...props }: any) => (
    <button 
      className={className} 
      data-testid="button"
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/animations/ProgressiveReveal', () => ({
  ProgressiveReveal: ({ children }: any) => <div data-testid="progressive-reveal">{children}</div>
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => (
    <a href={href} data-testid="link" data-href={href}>
      {children}
    </a>
  )
}))

describe('CTASection', () => {
  it('renders without crashing', () => {
    render(<CTASection />)
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument()
  })

  it('renders main heading and description', () => {
    render(<CTASection />)
    
    expect(screen.getByText('Get Started Today')).toBeInTheDocument() // Badge text
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument() // Main heading
    expect(screen.getByText(/Join thousands of satisfied Lower Mainland customers/)).toBeInTheDocument()
  })

  it('renders both CTA buttons with correct links', () => {
    render(<CTASection />)
    
    const links = screen.getAllByTestId('link')
    expect(links).toHaveLength(2)
    
    // Check register link
    const registerLink = links.find(link => link.getAttribute('data-href') === '/register')
    expect(registerLink).toBeInTheDocument()
    
    // Check services link
    const servicesLink = links.find(link => link.getAttribute('data-href') === '/services')
    expect(servicesLink).toBeInTheDocument()
  })

  it('renders buttons with correct text and variants', () => {
    render(<CTASection />)
    
    const buttons = screen.getAllByTestId('button')
    expect(buttons).toHaveLength(2)
    
    // Check primary CTA button
    expect(screen.getByText('Let\'s Get You Started')).toBeInTheDocument()
    
    // Check secondary CTA button
    expect(screen.getByText('Browse Services')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-cta-class'
    const { container } = render(<CTASection className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('uses ProgressiveReveal animation', () => {
    render(<CTASection />)
    
    expect(screen.getByTestId('progressive-reveal')).toBeInTheDocument()
  })

  it('renders with proper background gradient classes', () => {
    const { container } = render(<CTASection />)
    
    expect(container.firstChild).toHaveClass(
      'bg-gradient-to-r',
      'from-blue-600',
      'via-purple-600',
      'to-blue-700'
    )
  })

  it('renders decorative background elements', () => {
    const { container } = render(<CTASection />)
    
    // Check for background blur elements
    const blurElements = container.querySelectorAll('.blur-2xl')
    expect(blurElements).toHaveLength(2)
  })
})