'use client';

import { useRouter } from 'next/navigation';
import ServiceRequestList from '@/components/customer/ServiceRequestList';
import { Button } from '@/components/ui/shared';
import { ArrowLeft, Plus } from 'lucide-react';

export default function ServiceRequestsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Service Requests
              </h1>
              <p className="text-gray-600">
                Track the status of your service requests and manage quotes.
              </p>
            </div>
            
            <Button onClick={() => router.push('/dashboard/service-request')}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>
        
        <ServiceRequestList />
      </div>
    </div>
  );
}
