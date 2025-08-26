'use client';

import TechnicianDashboard from '@/components/technician/TechnicianDashboard';

export default function TechnicianDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Technician Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your assigned service requests, create quotes, and track job progress.
          </p>
        </div>
        
        <TechnicianDashboard />
      </div>
    </div>
  );
}
