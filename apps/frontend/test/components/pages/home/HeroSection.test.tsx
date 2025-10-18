import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HeroSection from '@/components/pages/home/HeroSection'

// Mock the EnhancedHeroSection component
vi.mock('@/components/ui/hero/EnhancedHeroSection', () => ({
  EnhancedHeroSection: ({ variant, showStats, showTrustIndicators }: any) => (
    <div data-testid="enhanced-hero-section">
      <div data-testid="variant">{variant}</div>
      <div data-testid="show-stats">{showStats.toString()}</div>
      <div data-testid="show-trust-indicators">{showTrustIndicators.toString()}</div>
    </div>
  )
}))

describe('HeroSection', () => {
  it('renders without crashing', () => {
    render(<HeroSection />)
    expect(screen.getByTestId('enhanced-hero-section')).toBeInTheDocument()
  })

  it('passes correct props to EnhancedHeroSection', () => {
    render(<HeroSection />)
    
    expect(screen.getByTestId('variant')).toHaveTextContent('gradient-mesh')
    expect(screen.getByTestId('show-stats')).toHaveTextContent('true')
    expect(screen.getByTestId('show-trust-indicators')).toHaveTextContent('true')
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-hero-class'
    const { container } = render(<HeroSection className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('renders without className when not provided', () => {
    const { container } = render(<HeroSection />)
    
    expect(container.firstChild).not.toHaveClass('undefined')
  })
})