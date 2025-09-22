'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  scheduledDate: string;
  duration: number;
  serviceType: string;
  propertyAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

interface AppointmentsListProps {
  onAppointmentUpdate?: (appointment: Appointment) => void;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_ICONS = {
  PENDING: AlertCircle,
  CONFIRMED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
};

export default function AppointmentsList({ onAppointmentUpdate }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  
  const { toast } = useToast();

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: 'scheduledDate',
        sortOrder: 'asc'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (serviceTypeFilter !== 'all') params.append('serviceType', serviceTypeFilter);
      
      // Add date filters
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            params.append('startDate', startDate.toISOString().split('T')[0]);
            params.append('endDate', startDate.toISOString().split('T')[0]);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            params.append('startDate', startDate.toISOString().split('T')[0]);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            params.append('startDate', startDate.toISOString().split('T')[0]);
            break;
          case 'upcoming':
            params.append('startDate', now.toISOString().split('T')[0]);
            break;
        }
      }
      
      const response = await fetch(`/api/admin/availability/appointments?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load appointments');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments);
        setStats(data.summary);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, action: string, data?: any) => {
    try {
      setActionLoading(appointmentId);
      
      let url = `/api/admin/availability/appointments/${appointmentId}`;
      let method = 'POST';
      let body: any = {};
      
      switch (action) {
        case 'confirm':
          url += '/confirm';
          break;
        case 'cancel':
          url += '/cancel';
          body = { reason: data?.reason || 'Cancelled by admin' };
          break;
        case 'complete':
          url += '/complete';
          body = { notes: data?.notes };
          break;
        case 'update':
          method = 'PUT';
          body = data;
          break;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} appointment`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the appointment in the list
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, ...result.appointment }
              : apt
          )
        );
        
        onAppointmentUpdate?.(result.appointment);
        
        toast({
          title: 'Success',
          description: result.message,
        });
        
        // Refresh the list to get updated stats
        loadAppointments();
      }
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${action} appointment`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  // Get unique service types for filter
  const getServiceTypes = () => {
    const types = [...new Set(appointments.map(apt => apt.serviceType))];
    return types.filter(Boolean);
  };

  useEffect(() => {
    loadAppointments();
  }, [currentPage, searchTerm, statusFilter, serviceTypeFilter, dateFilter]);

  if (loading && appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading appointments...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="service-filter">Service Type</Label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {getServiceTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Appointments List */}
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments found</p>
              </div>
            ) : (
              appointments.map((appointment) => {
                const StatusIcon = STATUS_ICONS[appointment.status];
                
                return (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{appointment.customerName}</span>
                            </div>
                            <Badge className={STATUS_COLORS[appointment.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.scheduledDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {appointment.duration} minutes
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {appointment.customerEmail}
                            </div>
                            {appointment.customerPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {appointment.customerPhone}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <span className="text-gray-600">{appointment.propertyAddress}</span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Service:</span> {appointment.serviceType}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {appointment.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirm')}
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Confirm'
                              )}
                            </Button>
                          )}
                          
                          {appointment.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(appointment.id, 'complete')}
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Complete'
                              )}
                            </Button>
                          )}
                          
                          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancel')}
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Cancel'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} appointments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <p className="font-medium">{selectedAppointment.customerName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={STATUS_COLORS[selectedAppointment.status]}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p>{selectedAppointment.customerEmail}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p>{selectedAppointment.customerPhone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Date</Label>
                  <p>{formatDate(selectedAppointment.scheduledDate)}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p>{selectedAppointment.duration} minutes</p>
                </div>
              </div>
              
              <div>
                <Label>Service Type</Label>
                <p>{selectedAppointment.serviceType}</p>
              </div>
              
              <div>
                <Label>Property Address</Label>
                <p>{selectedAppointment.propertyAddress}</p>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label>Created</Label>
                  <p>{formatDate(selectedAppointment.createdAt)}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{formatDate(selectedAppointment.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}