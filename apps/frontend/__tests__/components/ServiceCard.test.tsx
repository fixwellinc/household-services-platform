import { render, screen } from '@testing-library/react'
import ServiceCard from '@/components/features/ServiceCard'

const mockService = {
  id: '1',
  name: 'Test Service',
  description: 'This is a test service description',
  category: 'CLEANING',
  complexity: 'SIMPLE' as const,
  basePrice: 100,
  estimatedDuration: '2 hours',
  isPopular: true
}

describe('ServiceCard', () => {
  it('renders service information correctly', () => {
    render(
      <ServiceCard
        service={mockService}
        onBook={jest.fn()}
        onViewDetails={jest.fn()}
      />
    )

    expect(screen.getByText('Test Service')).toBeInTheDocument()
    expect(screen.getByText('This is a test service description')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('⭐ Popular')).toBeInTheDocument()
  })

  it('calls onBook when Book Now button is clicked', () => {
    const mockOnBook = jest.fn()
    render(
      <ServiceCard
        service={mockService}
        onBook={mockOnBook}
        onViewDetails={jest.fn()}
      />
    )

    screen.getByText('Book Now').click()
    expect(mockOnBook).toHaveBeenCalledWith('1')
  })

  it('calls onViewDetails when Details button is clicked', () => {
    const mockOnViewDetails = jest.fn()
    render(
      <ServiceCard
        service={mockService}
        onBook={jest.fn()}
        onViewDetails={mockOnViewDetails}
      />
    )

    screen.getByText('Details').click()
    expect(mockOnViewDetails).toHaveBeenCalledWith('1')
  })
})
