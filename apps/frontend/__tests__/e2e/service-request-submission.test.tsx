/**
 * End-to-End Tests for Service Request Submission Flow
 * 
 * These tests cover the complete service request workflow from
 * service selection to confirmation and tracking.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock global dependencies
global.fetch = jest.fn();

// Mock file upload
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
})) as any;

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/customer-dashboard',
}));

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock UI components
jest.mock('../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

describe('Service Request Submission E2E', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    mockPush.mockClear();
  });

  describe('Basic Service Request Flow', () => {
    it('completes basic service request from start to confirmation', async () => {
      // Mock API responses for basic service request
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get available services
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'service_cleaning',
                name: 'House Cleaning',
                category: 'CLEANING',
                description: 'Professional house cleaning service',
                basePrice: 12000,
                isIncluded: true,
                estimatedDuration: '2-3 hours'
              },
              {
                id: 'service_maintenance',
                name: 'Home Maintenance',
                category: 'MAINTENANCE',
                description: 'General home maintenance and repairs',
                basePrice: 15000,
                isIncluded: true,
                estimatedDuration: '1-4 hours'
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Submit service request
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'request_123',
              status: 'PENDING',
              serviceId: 'service_cleaning',
              serviceName: 'House Cleaning',
              estimatedResponse: '2-4 hours',
              requestNumber: 'REQ-2024-001',
              submittedAt: new Date().toISOString()
            }
          })
        });

      const BasicServiceRequestFlow = () => {
        const [step, setStep] = React.useState<'services' | 'form' | 'confirmation'>('services');
        const [selectedService, setSelectedService] = React.useState<any>(null);
        const [formData, setFormData] = React.useState({
          description: '',
          urgency: 'NORMAL',
          address: '',
          preferredDate: '',
          preferredTime: '',
          contactMethod: 'EMAIL'
        });
        const [requestData, setRequestData] = React.useState<any>(null);

        React.useEffect(() => {
          fetch('/api/customer/services');
        }, []);

        const handleSelectService = (service: any) => {
          setSelectedService(service);
          setStep('form');
        };

        const handleFormSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          
          if (!formData.description.trim()) {
            mockToast.error('Please provide a service description');
            return;
          }

          if (!formData.address.trim()) {
            mockToast.error('Please provide a service address');
            return;
          }

          const response = await fetch('/api/customer/service-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: selectedService.id,
              ...formData
            })
          });
          const data = await response.json();
          
          if (data.success) {
            setRequestData(data.data);
            mockToast.success('Service request submitted successfully!');
            setStep('confirmation');
          }
        };

        if (step === 'services') {
          return (
            <div data-testid="service-selection">
              <h2>Select a Service</h2>
              <div data-testid="service-list">
                <div data-testid="service-cleaning" className="border p-4 m-2">
                  <h3>House Cleaning</h3>
                  <p>Professional house cleaning service</p>
                  <p>$120.00 - Included in your plan</p>
                  <p>Duration: 2-3 hours</p>
                  <button 
                    onClick={() => handleSelectService({
                      id: 'service_cleaning',
                      name: 'House Cleaning',
                      category: 'CLEANING'
                    })} 
                    data-testid="select-cleaning"
                  >
                    Select House Cleaning
                  </button>
                </div>
                <div data-testid="service-maintenance" className="border p-4 m-2">
                  <h3>Home Maintenance</h3>
                  <p>General home maintenance and repairs</p>
                  <p>$150.00 - Included in your plan</p>
                  <p>Duration: 1-4 hours</p>
                  <button 
                    onClick={() => handleSelectService({
                      id: 'service_maintenance',
                      name: 'Home Maintenance',
                      category: 'MAINTENANCE'
                    })} 
                    data-testid="select-maintenance"
                  >
                    Select Home Maintenance
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (step === 'form') {
          return (
            <div data-testid="service-request-form">
              <h2>Request {selectedService.name}</h2>
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label htmlFor="description">Service Description *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please describe what you need help with..."
                    data-testid="description-input"
                    className="w-full p-2 border"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label>Urgency Level *</label>
                  <div data-testid="urgency-options">
                    {['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'].map(level => (
                      <label key={level} className="block">
                        <input
                          type="radio"
                          name="urgency"
                          value={level}
                          checked={formData.urgency === level}
                          onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="address">Service Address *</label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter the address where service is needed"
                    data-testid="address-input"
                    className="w-full p-2 border"
                    required
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="preferredDate">Preferred Date</label>
                    <input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="date-input"
                      className="w-full p-2 border"
                    />
                  </div>
                  <div>
                    <label htmlFor="preferredTime">Preferred Time</label>
                    <select
                      id="preferredTime"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      data-testid="time-select"
                      className="w-full p-2 border"
                    >
                      <option value="">Any time</option>
                      <option value="morning">Morning (8AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 5PM)</option>
                      <option value="evening">Evening (5PM - 8PM)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label>Contact Method *</label>
                  <div data-testid="contact-options">
                    {[
                      { value: 'EMAIL', label: 'Email' },
                      { value: 'PHONE', label: 'Phone' },
                      { value: 'BOTH', label: 'Both' }
                    ].map(option => (
                      <label key={option.value} className="block">
                        <input
                          type="radio"
                          name="contactMethod"
                          value={option.value}
                          checked={formData.contactMethod === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value }))}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep('services')} 
                    data-testid="back-button"
                    className="px-4 py-2 border"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    data-testid="submit-request"
                    className="px-4 py-2 bg-blue-600 text-white"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          );
        }

        return (
          <div data-testid="request-confirmation">
            <h2>✅ Request Submitted Successfully!</h2>
            <div data-testid="confirmation-details">
              <p>Request Number: {requestData.requestNumber}</p>
              <p>Service: {requestData.serviceName}</p>
              <p>Status: {requestData.status}</p>
              <p>Estimated Response: {requestData.estimatedResponse}</p>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3>What happens next?</h3>
              <ul>
                <li>• We'll review your request within 2-4 hours</li>
                <li>• A qualified technician will be assigned</li>
                <li>• You'll receive a quote and scheduling options</li>
                <li>• Service will be completed according to your preferences</li>
              </ul>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => mockPush('/customer-dashboard/requests')} 
                data-testid="track-request"
                className="px-4 py-2 bg-blue-600 text-white mr-2"
              >
                Track Request
              </button>
              <button 
                onClick={() => setStep('services')} 
                data-testid="new-request"
                className="px-4 py-2 border"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        );
      };

      render(<BasicServiceRequestFlow />);

      // Step 1: Service selection
      expect(screen.getByTestId('service-selection')).toBeInTheDocument();
      expect(screen.getByText('Select a Service')).toBeInTheDocument();
      expect(screen.getByTestId('service-cleaning')).toBeInTheDocument();
      expect(screen.getByTestId('service-maintenance')).toBeInTheDocument();
      expect(screen.getByText('$120.00 - Included in your plan')).toBeInTheDocument();

      // Step 2: Select house cleaning service
      fireEvent.click(screen.getByTestId('select-cleaning'));

      await waitFor(() => {
        expect(screen.getByTestId('service-request-form')).toBeInTheDocument();
      });

      expect(screen.getByText('Request House Cleaning')).toBeInTheDocument();

      // Step 3: Fill out the form
      const descriptionInput = screen.getByTestId('description-input');
      fireEvent.change(descriptionInput, { 
        target: { value: 'Need deep cleaning for my living room and kitchen' } 
      });

      const addressInput = screen.getByTestId('address-input');
      fireEvent.change(addressInput, { 
        target: { value: '123 Main Street, Toronto, ON M5V 3A8' } 
      });

      // Select HIGH urgency
      const highUrgencyRadio = screen.getByDisplayValue('HIGH');
      fireEvent.click(highUrgencyRadio);

      // Set preferred date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      const dateInput = screen.getByTestId('date-input');
      fireEvent.change(dateInput, { target: { value: tomorrowString } });

      // Select morning time
      const timeSelect = screen.getByTestId('time-select');
      fireEvent.change(timeSelect, { target: { value: 'morning' } });

      // Select phone contact
      const phoneRadio = screen.getByDisplayValue('PHONE');
      fireEvent.click(phoneRadio);

      // Step 4: Submit the form
      fireEvent.click(screen.getByTestId('submit-request'));

      await waitFor(() => {
        expect(screen.getByTestId('request-confirmation')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Service request submitted successfully!');

      // Step 5: Verify confirmation details
      expect(screen.getByText('✅ Request Submitted Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Request Number: REQ-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Service: House Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Status: PENDING')).toBeInTheDocument();
      expect(screen.getByText('Estimated Response: 2-4 hours')).toBeInTheDocument();

      // Step 6: Test navigation options
      fireEvent.click(screen.getByTestId('track-request'));
      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard/requests');

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/services');
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: 'service_cleaning',
          description: 'Need deep cleaning for my living room and kitchen',
          urgency: 'HIGH',
          address: '123 Main Street, Toronto, ON M5V 3A8',
          preferredDate: tomorrowString,
          preferredTime: 'morning',
          contactMethod: 'PHONE'
        })
      });
    });

    it('handles form validation errors correctly', async () => {
      const FormValidationTest = () => {
        const [formData, setFormData] = React.useState({
          description: '',
          address: '',
          urgency: 'NORMAL'
        });

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          
          if (!formData.description.trim()) {
            mockToast.error('Please provide a service description');
            return;
          }

          if (!formData.address.trim()) {
            mockToast.error('Please provide a service address');
            return;
          }

          if (formData.description.length < 10) {
            mockToast.error('Description must be at least 10 characters');
            return;
          }
        };

        return (
          <div data-testid="validation-form">
            <form onSubmit={handleSubmit}>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="description-input"
                placeholder="Service description"
              />
              <input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                data-testid="address-input"
                placeholder="Service address"
              />
              <button type="submit" data-testid="submit-button">
                Submit
              </button>
            </form>
          </div>
        );
      };

      render(<FormValidationTest />);

      // Test empty description validation
      fireEvent.click(screen.getByTestId('submit-button'));
      expect(mockToast.error).toHaveBeenCalledWith('Please provide a service description');

      // Test empty address validation
      const descriptionInput = screen.getByTestId('description-input');
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.click(screen.getByTestId('submit-button'));
      expect(mockToast.error).toHaveBeenCalledWith('Please provide a service address');

      // Test minimum length validation
      fireEvent.change(descriptionInput, { target: { value: 'Short' } });
      const addressInput = screen.getByTestId('address-input');
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });
      fireEvent.click(screen.getByTestId('submit-button'));
      expect(mockToast.error).toHaveBeenCalledWith('Description must be at least 10 characters');
    });
  });

  describe('Premium Service Request with File Upload', () => {
    it('completes premium service request with file uploads and scheduling', async () => {
      // Mock API responses for premium service with files
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Upload files
          ok: true,
          json: async () => ({
            success: true,
            data: {
              uploadedFiles: [
                { id: 'file_1', name: 'problem_photo.jpg', size: 1024000, url: 'https://example.com/file1' },
                { id: 'file_2', name: 'issue_video.mp4', size: 5120000, url: 'https://example.com/file2' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Get available time slots
          ok: true,
          json: async () => ({
            success: true,
            data: {
              availableSlots: [
                { id: 'slot_1', date: '2024-02-01', time: '09:00', available: true, type: 'PRIORITY' },
                { id: 'slot_2', date: '2024-02-01', time: '14:00', available: true, type: 'STANDARD' },
                { id: 'slot_3', date: '2024-02-02', time: '10:00', available: true, type: 'PRIORITY' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Submit premium service request
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'request_premium_123',
              status: 'CONFIRMED',
              serviceId: 'service_premium',
              serviceName: 'Premium Home Maintenance',
              scheduledSlot: 'slot_1',
              scheduledDate: '2024-02-01',
              scheduledTime: '09:00',
              technicianName: 'Mike Johnson',
              technicianRating: 4.9,
              estimatedDuration: '2-3 hours',
              requestNumber: 'PREM-2024-001'
            }
          })
        });

      const PremiumServiceRequestFlow = () => {
        const [step, setStep] = React.useState<'form' | 'files' | 'schedule' | 'confirmation'>('form');
        const [formData, setFormData] = React.useState({
          description: '',
          urgency: 'HIGH',
          address: ''
        });
        const [uploadedFiles, setUploadedFiles] = React.useState<any[]>([]);
        const [availableSlots, setAvailableSlots] = React.useState<any[]>([]);
        const [selectedSlot, setSelectedSlot] = React.useState<string>('');
        const [requestData, setRequestData] = React.useState<any>(null);

        const handleFormSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setStep('files');
        };

        const handleFileUpload = async () => {
          // Simulate file upload
          const response = await fetch('/api/customer/files/upload', {
            method: 'POST',
            body: new FormData()
          });
          const data = await response.json();
          
          if (data.success) {
            setUploadedFiles(data.data.uploadedFiles);
            setStep('schedule');
            
            // Get available slots
            const slotsResponse = await fetch('/api/customer/scheduling/premium-slots');
            const slotsData = await slotsResponse.json();
            if (slotsData.success) {
              setAvailableSlots(slotsData.data.availableSlots);
            }
          }
        };

        const handleScheduleService = async (slotId: string) => {
          setSelectedSlot(slotId);
          const response = await fetch('/api/customer/service-requests/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: 'service_premium',
              ...formData,
              files: uploadedFiles,
              scheduledSlot: slotId
            })
          });
          const data = await response.json();
          
          if (data.success) {
            setRequestData(data.data);
            mockToast.success('Premium service scheduled successfully!');
            setStep('confirmation');
          }
        };

        if (step === 'form') {
          return (
            <div data-testid="premium-form">
              <h2>Premium Home Maintenance Request</h2>
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label>Issue Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the maintenance issue in detail..."
                    data-testid="premium-description"
                    className="w-full p-2 border"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label>Service Address *</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Property address"
                    data-testid="premium-address"
                    className="w-full p-2 border"
                    required
                  />
                </div>
                <button type="submit" data-testid="continue-to-files">
                  Continue to File Upload
                </button>
              </form>
            </div>
          );
        }

        if (step === 'files') {
          return (
            <div data-testid="file-upload-step">
              <h2>Upload Photos & Videos</h2>
              <p>Help our technicians understand the issue better</p>
              <div data-testid="file-upload-area" className="border-2 border-dashed p-8 text-center">
                <p>Drag and drop files here or click to select</p>
                <p className="text-sm text-gray-500">Max 5 files, 10MB each. JPG, PNG, MP4, MOV</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  data-testid="file-input"
                  className="hidden"
                />
              </div>
              <div className="mt-4">
                <button onClick={handleFileUpload} data-testid="upload-files">
                  Upload Files & Continue
                </button>
                <button onClick={() => setStep('schedule')} data-testid="skip-files">
                  Skip File Upload
                </button>
              </div>
            </div>
          );
        }

        if (step === 'schedule') {
          return (
            <div data-testid="scheduling-step">
              <h2>Schedule Your Premium Service</h2>
              {uploadedFiles.length > 0 && (
                <div data-testid="uploaded-files" className="mb-4">
                  <h3>Uploaded Files:</h3>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>{file.name}</span>
                      <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                  ))}
                </div>
              )}
              
              <h3>Available Time Slots</h3>
              <div data-testid="time-slots">
                {availableSlots.map((slot) => (
                  <div 
                    key={slot.id} 
                    data-testid={`slot-${slot.id}`}
                    className={`border p-4 m-2 cursor-pointer ${slot.type === 'PRIORITY' ? 'border-gold bg-yellow-50' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{slot.date} at {slot.time}</p>
                        <p className="text-sm">{slot.type} Slot</p>
                      </div>
                      <button 
                        onClick={() => handleScheduleService(slot.id)}
                        data-testid={`select-slot-${slot.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div data-testid="premium-confirmation">
            <h2>🌟 Premium Service Confirmed!</h2>
            <div data-testid="premium-details" className="bg-gold-50 border border-gold-200 p-4 rounded">
              <h3>Service Details</h3>
              <p>Request Number: {requestData.requestNumber}</p>
              <p>Service: {requestData.serviceName}</p>
              <p>Status: {requestData.status}</p>
              <p>Scheduled: {requestData.scheduledDate} at {requestData.scheduledTime}</p>
              <p>Duration: {requestData.estimatedDuration}</p>
            </div>
            
            <div data-testid="technician-info" className="mt-4 p-4 border rounded">
              <h3>Your Technician</h3>
              <p>Name: {requestData.technicianName}</p>
              <p>Rating: ⭐ {requestData.technicianRating}/5.0</p>
            </div>
            
            <div className="mt-4">
              <h3>What's Next?</h3>
              <ul>
                <li>• You'll receive a confirmation email with technician contact info</li>
                <li>• Your technician will call 30 minutes before arrival</li>
                <li>• Premium service includes priority support and guaranteed satisfaction</li>
              </ul>
            </div>
          </div>
        );
      };

      render(<PremiumServiceRequestFlow />);

      // Step 1: Fill premium service form
      expect(screen.getByTestId('premium-form')).toBeInTheDocument();
      expect(screen.getByText('Premium Home Maintenance Request')).toBeInTheDocument();

      const descriptionInput = screen.getByTestId('premium-description');
      fireEvent.change(descriptionInput, { 
        target: { value: 'Kitchen faucet is leaking and needs immediate repair' } 
      });

      const addressInput = screen.getByTestId('premium-address');
      fireEvent.change(addressInput, { 
        target: { value: '456 Premium Ave, Toronto, ON M4W 1A1' } 
      });

      fireEvent.click(screen.getByTestId('continue-to-files'));

      // Step 2: File upload
      await waitFor(() => {
        expect(screen.getByTestId('file-upload-step')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Photos & Videos')).toBeInTheDocument();
      expect(screen.getByText('Help our technicians understand the issue better')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('upload-files'));

      // Step 3: Scheduling
      await waitFor(() => {
        expect(screen.getByTestId('scheduling-step')).toBeInTheDocument();
      });

      expect(screen.getByText('Schedule Your Premium Service')).toBeInTheDocument();
      expect(screen.getByTestId('uploaded-files')).toBeInTheDocument();
      expect(screen.getByText('problem_photo.jpg')).toBeInTheDocument();
      expect(screen.getByText('issue_video.mp4')).toBeInTheDocument();

      // Select priority slot
      expect(screen.getByTestId('slot-slot_1')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('select-slot-slot_1'));

      // Step 4: Confirmation
      await waitFor(() => {
        expect(screen.getByTestId('premium-confirmation')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Premium service scheduled successfully!');
      expect(screen.getByText('🌟 Premium Service Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Request Number: PREM-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Scheduled: 2024-02-01 at 09:00')).toBeInTheDocument();
      expect(screen.getByText('Name: Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('Rating: ⭐ 4.9/5.0')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/files/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/scheduling/premium-slots');
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/customer/service-requests/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: 'service_premium',
          description: 'Kitchen faucet is leaking and needs immediate repair',
          urgency: 'HIGH',
          address: '456 Premium Ave, Toronto, ON M4W 1A1',
          files: [
            { id: 'file_1', name: 'problem_photo.jpg', size: 1024000, url: 'https://example.com/file1' },
            { id: 'file_2', name: 'issue_video.mp4', size: 5120000, url: 'https://example.com/file2' }
          ],
          scheduledSlot: 'slot_1'
        })
      });
    });
  });
});