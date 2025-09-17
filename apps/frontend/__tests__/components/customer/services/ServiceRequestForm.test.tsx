import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceRequestForm from '@/components/customer/services/ServiceRequestForm';

// Mock the UI components
jest.mock('@/components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Button: ({ children, onClick, disabled, type, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} className={className} {...props}>
      {children}
    </button>
  ),
}));

const mockService = {
  id: 'service_123',
  name: 'House Cleaning',
  description: 'Professional house cleaning service',
  category: 'CLEANING',
  basePrice: 12000
};

const mockFormData = {
  serviceId: 'service_123',
  category: 'CLEANING',
  description: 'Need deep cleaning for my living room',
  urgency: 'NORMAL' as const,
  address: '123 Main St, Toronto, ON',
  preferredDate: '2024-02-15',
  preferredTime: 'morning',
  photos: [],
  videos: [],
  contactMethod: 'EMAIL' as const,
  additionalNotes: 'Please bring eco-friendly products'
};

describe('ServiceRequestForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with service information', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Request House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Fill out the form below to request House Cleaning service')).toBeInTheDocument();
    expect(screen.getByText('CLEANING')).toBeInTheDocument();
  });

  it('renders form without service (general request)', () => {
    render(
      <ServiceRequestForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Request Service')).toBeInTheDocument();
    expect(screen.getByText('Service Category *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates description minimum length', async () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const descriptionInput = screen.getByPlaceholderText('Please describe what you need help with in detail...');
    fireEvent.change(descriptionInput, { target: { value: 'Short' } });
    
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('validates preferred date is not in the past', async () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: yesterdayString } });
    
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Preferred date cannot be in the past')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Fill in required fields
    const descriptionInput = screen.getByPlaceholderText('Please describe what you need help with in detail...');
    fireEvent.change(descriptionInput, { target: { value: mockFormData.description } });
    
    const addressInput = screen.getByPlaceholderText('Enter the address where service is needed');
    fireEvent.change(addressInput, { target: { value: mockFormData.address } });
    
    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        serviceId: mockService.id,
        category: mockService.category,
        description: mockFormData.description,
        address: mockFormData.address,
        urgency: 'NORMAL',
        contactMethod: 'EMAIL'
      }));
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('updates urgency level when selected', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const highPriorityRadio = screen.getByDisplayValue('HIGH');
    fireEvent.click(highPriorityRadio);
    
    expect(highPriorityRadio).toBeChecked();
  });

  it('updates contact method when selected', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const phoneRadio = screen.getByDisplayValue('PHONE');
    fireEvent.click(phoneRadio);
    
    expect(phoneRadio).toBeChecked();
  });

  it('shows character count for description', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const descriptionInput = screen.getByPlaceholderText('Please describe what you need help with in detail...');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    expect(screen.getByText('16/500 characters')).toBeInTheDocument();
  });

  it('handles file upload for photos', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const photoInput = screen.getByAccept('image/jpeg,image/png,image/webp');
    
    Object.defineProperty(photoInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(photoInput);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('validates file size limits', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const photoInput = screen.getByAccept('image/jpeg,image/png,image/webp');
    
    Object.defineProperty(photoInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(photoInput);
    
    expect(screen.getByText(/File too large: large.jpg/)).toBeInTheDocument();
  });

  it('validates file types', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const photoInput = screen.getByAccept('image/jpeg,image/png,image/webp');
    
    Object.defineProperty(photoInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(photoInput);
    
    expect(screen.getByText(/Invalid file type: test.txt/)).toBeInTheDocument();
  });

  it('removes uploaded files when remove button is clicked', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const photoInput = screen.getByAccept('image/jpeg,image/png,image/webp');
    
    Object.defineProperty(photoInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(photoInput);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    
    const removeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    const submitButton = screen.getByText('Submitting...');
    expect(submitButton).toBeDisabled();
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('handles drag and drop file upload', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const dropZone = screen.getByText('Drag and drop files here, or click to select').parentElement;
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });
    
    fireEvent(dropZone!, dropEvent);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('shows emergency urgency warning', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const emergencyRadio = screen.getByDisplayValue('EMERGENCY');
    fireEvent.click(emergencyRadio);
    
    // Should show warning icon for emergency
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });

  it('displays service category options when no service provided', () => {
    render(
      <ServiceRequestForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const categorySelect = screen.getByDisplayValue('OTHER');
    expect(categorySelect).toBeInTheDocument();
    
    fireEvent.change(categorySelect, { target: { value: 'CLEANING' } });
    expect(categorySelect).toHaveValue('CLEANING');
  });

  it('formats file sizes correctly', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const file = new File(['x'.repeat(1024)], 'test.jpg', { type: 'image/jpeg' });
    const photoInput = screen.getByAccept('image/jpeg,image/png,image/webp');
    
    Object.defineProperty(photoInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(photoInput);
    
    expect(screen.getByText('(1 KB)')).toBeInTheDocument();
  });

  it('shows what happens next information', () => {
    render(
      <ServiceRequestForm 
        service={mockService}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('What happens next?')).toBeInTheDocument();
    expect(screen.getByText("We'll review your request within 2-4 hours")).toBeInTheDocument();
    expect(screen.getByText('A qualified technician will be assigned to your case')).toBeInTheDocument();
  });
});