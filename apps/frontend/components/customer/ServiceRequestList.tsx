'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Wrench,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  category: string;
  description: string;
  urgency: string;
  status: string;
  address?: string;
  preferredDate?: string;
  photos: string[];
  videos: string[];
  createdAt: string;
  assignedTechnician?: {
    id: string;
    name: string;
    phone: string;
  };
  quotes: Array<{
    id: string;
    estimatedHours: number;
    materialsCost: number;
    laborCost: number;
    totalCost: number;
    technicianNotes?: string;
    status: string;
    customerAccepted: boolean;
    technician: {
      id: string;
      name: string;
    };
  }>;
  jobs: Array<{
    id: string;
    status: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    actualHours?: number;
    customerRating?: number;
    customerFeedback?: string;
  }>;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ASSIGNED: { label: 'Assigned', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-orange-100 text-orange-800', icon: Wrench },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const URGENCY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  EMERGENCY: { label: 'Emergency', color: 'bg-red-100 text-red-800' }
};

export default function ServiceRequestList() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests/my-requests');
      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data.serviceRequests);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchServiceRequests(); // Refresh the list
        alert('Quote accepted successfully!');
      } else {
        throw new Error('Failed to accept quote');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Failed to accept quote. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  };

  const getUrgencyConfig = (urgency: string) => {
    return URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.NORMAL;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (serviceRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests</h3>
          <p className="text-gray-500 mb-4">
            You haven't submitted any service requests yet.
          </p>
          <Button>Request a Service</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Service Requests</h2>
        <Button>New Request</Button>
      </div>

      <div className="grid gap-6">
        {serviceRequests.map((request) => {
          const statusConfig = getStatusConfig(request.status);
          const urgencyConfig = getUrgencyConfig(request.urgency);
          const StatusIcon = statusConfig.icon;
          const hasQuotes = request.quotes.length > 0;
          const hasActiveJob = request.jobs.some(job => 
            ['SCHEDULED', 'IN_PROGRESS'].includes(job.status)
          );

          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{request.category}</CardTitle>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge className={urgencyConfig.color}>
                        {urgencyConfig.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {request.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedRequest?.id === request.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatDate(request.createdAt)}</span>
                  </div>
                  
                  {request.preferredDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Preferred: {formatDate(request.preferredDate)}</span>
                    </div>
                  )}
                  
                  {request.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                      <MapPin className="h-4 w-4" />
                      <span>{request.address}</span>
                    </div>
                  )}
                </div>

                {/* Media Files */}
                {(request.photos.length > 0 || request.videos.length > 0) && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                    <div className="flex gap-2 flex-wrap">
                      {request.photos.map((photo, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-xs text-gray-500">Photo</span>
                        </div>
                      ))}
                      {request.videos.map((video, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-xs text-gray-500">Video</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedRequest?.id === request.id && (
                  <div className="border-t pt-4 space-y-4">
                    {/* Assigned Technician */}
                    {request.assignedTechnician && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Assigned Technician</h4>
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Wrench className="h-4 w-4" />
                          <span>{request.assignedTechnician.name}</span>
                          <span>•</span>
                          <span>{request.assignedTechnician.phone}</span>
                        </div>
                      </div>
                    )}

                    {/* Quotes */}
                    {hasQuotes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Quotes Received</h4>
                        <div className="space-y-3">
                          {request.quotes.map((quote) => (
                            <div key={quote.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{quote.technician.name}</span>
                                <Badge className={quote.customerAccepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {quote.customerAccepted ? 'Accepted' : 'Pending'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <div>Est. Hours: {quote.estimatedHours}</div>
                                <div>Materials: ${quote.materialsCost}</div>
                                <div>Labor: ${quote.laborCost}</div>
                                <div className="font-medium text-lg">Total: ${quote.totalCost}</div>
                              </div>
                              
                              {quote.technicianNotes && (
                                <p className="text-sm text-gray-600 mb-3">{quote.technicianNotes}</p>
                              )}
                              
                              {!quote.customerAccepted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptQuote(quote.id)}
                                  className="w-full"
                                >
                                  Accept Quote
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Jobs */}
                    {request.jobs.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Service Jobs</h4>
                        <div className="space-y-3">
                          {request.jobs.map((job) => (
                            <div key={job.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Job #{job.id.slice(-6)}</span>
                                <Badge className={job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                  {job.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                <div>Scheduled: {formatDate(job.scheduledDate)}</div>
                                {job.actualHours && <div>Actual Hours: {job.actualHours}</div>}
                              </div>
                              
                              {job.status === 'COMPLETED' && !job.customerRating && (
                                <div className="bg-yellow-50 p-2 rounded text-sm text-yellow-800">
                                  Please rate this service to help us improve!
                                </div>
                              )}
                              
                              {job.customerRating && (
                                <div className="flex items-center gap-1 text-sm">
                                  <span>Your rating:</span>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= job.customerRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Summary */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                      <div className="text-sm text-gray-600">
                        {request.status === 'PENDING' && 'Your service request is being reviewed by our team.'}
                        {request.status === 'ASSIGNED' && 'A technician has been assigned to your request.'}
                        {request.status === 'IN_PROGRESS' && 'Work is currently in progress on your service request.'}
                        {request.status === 'COMPLETED' && 'Your service request has been completed successfully.'}
                        {request.status === 'CANCELLED' && 'This service request has been cancelled.'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
