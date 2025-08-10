'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Input } from '@/components/ui/shared';
import { Textarea } from '@/components/ui/shared';
import { X, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  serviceId: string;
}

export default function QuoteRequestModal({ isOpen, onClose, serviceName, serviceId }: QuoteRequestModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    serviceDetails: '',
    preferredDate: '',
    preferredTime: '',
    urgency: 'standard',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/quotes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userId: user?.id,
          serviceId: serviceId,
          message: `Quote Request for ${serviceName}

Contact Information:
- Name: ${formData.name}
- Email: ${formData.email}
- Phone: ${formData.phone}

Service Details:
${formData.serviceDetails}

Preferred Schedule:
- Date: ${formData.preferredDate}
- Time: ${formData.preferredTime}
- Urgency: ${formData.urgency}

Additional Notes:
${formData.additionalNotes}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote request');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          serviceDetails: '',
          preferredDate: '',
          preferredTime: '',
          urgency: 'standard',
          additionalNotes: ''
        });
      }, 2000);
    } catch (err) {
      setError('Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quote Request Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your quote request. Our team will review your requirements and get back to you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Request Custom Quote
            </h2>
            <p className="text-gray-600 mt-2">
              Get a personalized quote for {serviceName}. Tell us about your specific needs and we'll provide you with a detailed estimate.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">Standard (1-2 weeks)</option>
                <option value="urgent">Urgent (3-5 days)</option>
                <option value="emergency">Emergency (24-48 hours)</option>
              </select>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <label htmlFor="serviceDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Service Details *
            </label>
            <Textarea
              id="serviceDetails"
              name="serviceDetails"
              required
              value={formData.serviceDetails}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe your specific service needs, requirements, and any special considerations..."
            />
          </div>

          {/* Preferred Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date
              </label>
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time
              </label>
              <select
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select preferred time</option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 8 PM)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any additional information, special requests, or questions..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quote Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
