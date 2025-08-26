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
  Star,
  Plus,
  DollarSign,
  Users,
  TrendingUp
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
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
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
  }>;
  jobs: Array<{
    id: string;
    status: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    actualHours?: number;
  }>;
}

interface Job {
  id: string;
  status: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  actualHours?: number;
  serviceRequest: {
    id: string;
    category: string;
    description: string;
    customer: {
      name: string;
      address: string;
    };
  };
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

export default function TechnicianDashboard() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsResponse, jobsResponse] = await Promise.all([
        fetch('/api/service-requests/assigned'),
        fetch('/api/jobs')
      ]);

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setServiceRequests(requestsData.serviceRequests);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.jobs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchData(); // Refresh the data
        alert('Status updated successfully!');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleJobStatusUpdate = async (jobId: string, newStatus: string, additionalData?: any) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, ...additionalData })
      });

      if (response.ok) {
        await fetchData(); // Refresh the data
        alert('Job status updated successfully!');
      } else {
        throw new Error('Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
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

  const pendingRequests = serviceRequests.filter(req => req.status === 'PENDING');
  const assignedRequests = serviceRequests.filter(req => req.status === 'ASSIGNED');
  const inProgressJobs = jobs.filter(job => job.status === 'IN_PROGRESS');
  const completedJobs = jobs.filter(job => job.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{assignedRequests.length}</p>
                <p className="text-sm text-gray-600">Assigned Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inProgressJobs.length}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedJobs.length}</p>
                <p className="text-sm text-gray-600">Completed Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Assigned Service Requests
          </CardTitle>
          <CardDescription>
            Manage your assigned service requests and create quotes
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {serviceRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service requests assigned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const urgencyConfig = getUrgencyConfig(request.urgency);
                const StatusIcon = statusConfig.icon;
                const hasQuotes = request.quotes.length > 0;
                const hasActiveJob = request.jobs.some(job => 
                  ['SCHEDULED', 'IN_PROGRESS'].includes(job.status)
                );

                return (
                  <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium">{request.category}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge className={urgencyConfig.color}>
                            {urgencyConfig.label}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{request.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{request.customer.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDate(request.createdAt)}</span>
                          </div>
                          {request.preferredDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Preferred: {formatDate(request.preferredDate)}</span>
                            </div>
                          )}
                        </div>
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
                        
                        {request.status === 'ASSIGNED' && !hasQuotes && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequestForQuote(request);
                              setShowQuoteForm(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Quote
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedRequest?.id === request.id && (
                      <div className="border-t pt-4 space-y-4">
                        {/* Customer Details */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Customer Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                            <div>Name: {request.customer.name}</div>
                            <div>Phone: {request.customer.phone}</div>
                            <div>Email: {request.customer.email}</div>
                            <div>Address: {request.customer.address}</div>
                          </div>
                        </div>

                        {/* Media Files */}
                        {(request.photos.length > 0 || request.videos.length > 0) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
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

                        {/* Status Actions */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Update Status</h4>
                          <div className="flex gap-2 flex-wrap">
                            {request.status === 'ASSIGNED' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(request.id, 'IN_PROGRESS')}
                              >
                                Start Work
                              </Button>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(request.id, 'COMPLETED')}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active Jobs
            </CardTitle>
            <CardDescription>
              Track your current and scheduled jobs
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{job.serviceRequest.category}</h3>
                      <p className="text-sm text-gray-600">{job.serviceRequest.description}</p>
                      <p className="text-sm text-gray-500">Customer: {job.serviceRequest.customer.name}</p>
                    </div>
                    <Badge className={job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                    <div>Scheduled: {formatDate(job.scheduledDate)}</div>
                    {job.startTime && <div>Started: {formatDate(job.startTime)}</div>}
                    {job.endTime && <div>Completed: {formatDate(job.endTime)}</div>}
                    {job.actualHours && <div>Actual Hours: {job.actualHours}</div>}
                  </div>
                  
                  <div className="flex gap-2">
                    {job.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        onClick={() => handleJobStatusUpdate(job.id, 'IN_PROGRESS', { startTime: new Date() })}
                      >
                        Start Job
                      </Button>
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => handleJobStatusUpdate(job.id, 'COMPLETED', { 
                          endTime: new Date(),
                          actualHours: prompt('Enter actual hours worked:') || 0
                        })}
                      >
                        Complete Job
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
