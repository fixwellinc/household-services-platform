'use client';

import { useCurrentUser } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomerBookingsPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const user = userData?.user;

  // Fetch real booking data
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data;
    },
    enabled: !!user,
  });

  if (isLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your bookings...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Fixwell</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to view your bookings.
          </p>
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Use real booking data
  const bookings = bookingsData?.bookings || [];
  const upcomingBookings = bookings.filter(booking => 
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status) && 
    new Date(booking.scheduledDate) > new Date()
  );
  const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/customer">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-2">
                View and manage your service appointments
              </p>
            </div>
            <Link href="/dashboard/customer/book-service">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Book New Service
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">$355</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming bookings</h3>
                <p className="text-gray-600 mb-6">
                  You don't have any scheduled services. Book your first service to get started!
                </p>
                <Link href="/dashboard/customer/book-service">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Book a Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                                                 <div>
                           <h3 className="font-semibold text-gray-900">{booking.service?.name || 'Service'}</h3>
                           <p className="text-sm text-gray-600">
                             {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                           <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                             <User className="h-3 w-3" />
                             Fixwell Team
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-semibold text-gray-900">${booking.finalAmount || booking.totalAmount}</p>
                         <Badge className="bg-blue-100 text-blue-800 mt-1">
                           {booking.status.toLowerCase()}
                         </Badge>
                       </div>
                     </div>
                     <div className="mt-4 pt-4 border-t">
                       <p className="text-sm text-gray-600 flex items-center gap-1">
                         <MapPin className="h-3 w-3" />
                         Service Address
                       </p>
                     </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Bookings</h2>
          {completedBookings.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed bookings</h3>
                <p className="text-gray-600">
                  Your completed services will appear here once you've had your first service.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                                                 <div>
                           <h3 className="font-semibold text-gray-900">{booking.service?.name || 'Service'}</h3>
                           <p className="text-sm text-gray-600">
                             {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                           <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                             <User className="h-3 w-3" />
                             Fixwell Team
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-semibold text-gray-900">${booking.finalAmount || booking.totalAmount}</p>
                         <Badge className="bg-green-100 text-green-800 mt-1">
                           {booking.status.toLowerCase()}
                         </Badge>
                       </div>
                     </div>
                     <div className="mt-4 pt-4 border-t">
                       <p className="text-sm text-gray-600 flex items-center gap-1">
                         <MapPin className="h-3 w-3" />
                         Service Address
                       </p>
                     </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        Book Again
                      </Button>
                      <Button variant="outline" size="sm">
                        Leave Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 