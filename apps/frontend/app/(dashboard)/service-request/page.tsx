'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceRequestForm from '@/components/customer/ServiceRequestForm';
import { Button } from '@/components/ui/shared';
import { ArrowLeft } from 'lucide-react';

export default function ServiceRequestPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSuccess = () => {
    setIsSubmitted(true);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-green-900 mb-4">
                Service Request Submitted!
              </h1>
              
              <p className="text-green-700 mb-6">
                Thank you for submitting your service request. Our team will review it and assign a qualified technician to provide you with a detailed quote.
              </p>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-green-700 space-y-1 text-left">
                    <li>• We'll review your request within 24 hours</li>
                    <li>• A qualified technician will be assigned</li>
                    <li>• You'll receive a detailed quote via email</li>
                    <li>• Once accepted, we'll schedule the service</li>
                  </ul>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push('/dashboard/service-requests')}>
                    View My Requests
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Request a Service
          </h1>
          <p className="text-gray-600">
            Tell us about the service you need and we'll get you a quote from our qualified technicians.
          </p>
        </div>
        
        <ServiceRequestForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
