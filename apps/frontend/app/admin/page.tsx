"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-api';
import { Button } from '@/components/ui/shared';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Calendar,
  Home,
  LogOut,
  Menu,
  X,
  Mail,
  DollarSign,
  Activity,
  Smartphone,
  Send,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Bell,
  Save,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Quote {
  id: string;
  email: string;
  message: string;
  status: 'pending' | 'replied';
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'PROVIDER';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  status: 'unread' | 'read';
}

interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  external?: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Subscription Management State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscribedCustomers, setSubscribedCustomers] = useState<any[]>([]);
  const [customersWithPerksUsed, setCustomersWithPerksUsed] = useState<any[]>([]);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<any>({});
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [blockCancellationReason, setBlockCancellationReason] = useState('');
  
  // Email Blast State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 1234,
    totalRevenue: 45678,
    totalBookings: 567,
    activeSessions: 89,
    userGrowth: 12.5,
    revenueGrowth: 8.3,
    bookingGrowth: -2.1,
    sessionGrowth: 15.7
  });
  
  // Settings State
  const [settings, setSettings] = useState({
    siteName: 'Household Services',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    maxFileSize: 5,
    allowedFileTypes: 'jpg,png,pdf,doc'
  });

  const { data: userData, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch quotes
      const quotesResponse = await fetch('/api/quotes');
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        setQuotes(quotesData.quotes || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch subscriptions
      const subscriptionsResponse = await fetch('/api/admin/subscriptions');
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData.subscriptions || []);
      }

      // Fetch subscribed customers
      const subscribedCustomersResponse = await fetch('/api/admin/customers/subscribed');
      if (subscribedCustomersResponse.ok) {
        const subscribedCustomersData = await subscribedCustomersResponse.json();
        setSubscribedCustomers(subscribedCustomersData.customers || []);
      }

      // Fetch customers who have used perks
      const perksUsedResponse = await fetch('/api/admin/customers/perks-used');
      if (perksUsedResponse.ok) {
        const perksUsedData = await perksUsedResponse.json();
        setCustomersWithPerksUsed(perksUsedData.customers || []);
      }

      // Fetch subscription analytics
      const analyticsResponse = await fetch('/api/admin/subscriptions/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setSubscriptionAnalytics(analyticsData);
      }

      // Mock chat messages (would come from real API)
      setChatMessages([
        { id: '1', userId: 'u1', userName: 'John Doe', message: 'Need help with booking', timestamp: '2024-01-15T10:30:00Z', status: 'unread' },
        { id: '2', userId: 'u2', userName: 'Jane Smith', message: 'Payment issue', timestamp: '2024-01-15T10:25:00Z', status: 'read' },
        { id: '3', userId: 'u3', userName: 'Bob Wilson', message: 'Service inquiry', timestamp: '2024-01-15T10:20:00Z', status: 'unread' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const sendEmailBlast = async () => {
    try {
      const response = await fetch('/api/admin/email-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          recipientFilter,
          template: selectedTemplate
        })
      });
      
      if (response.ok) {
        alert('Email blast sent successfully!');
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (error) {
      console.error('Error sending email blast:', error);
    }
  };

  const sendNotification = async (title: string, message: string, target: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, target })
      });
      
      if (response.ok) {
        alert('Notification sent successfully!');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const blockSubscriptionCancellation = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/block-cancellation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockCancellationReason || 'Perks have been used' })
      });
      
      if (response.ok) {
        alert('Subscription cancellation blocked successfully!');
        setBlockCancellationReason('');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error blocking subscription cancellation:', error);
    }
  };

  const allowSubscriptionCancellation = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/allow-cancellation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('Subscription cancellation allowed successfully!');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error allowing subscription cancellation:', error);
    }
  };

  const viewSubscriptionDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!userData || !userData.user || userData.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', icon: Home, id: 'dashboard' },
    { name: 'Analytics', icon: BarChart3, id: 'analytics' },
    { name: 'Subscriptions', icon: DollarSign, id: 'subscriptions' },
    { name: 'Email Blast', icon: Mail, id: 'email-blast' },
    { name: 'Live Chat', icon: MessageSquare, id: 'live-chat' },
    { name: 'User Management', icon: Users, id: 'users' },
    { name: 'Mobile Notifications', icon: Smartphone, id: 'mobile-notifications' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64 flex-col bg-white h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center px-6 py-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-600">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>
              <p className="text-gray-600">Manage your application from here.</p>
            </div>
            
            {/* Tab content */}
            <div className="bg-white rounded-lg shadow">
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{analyticsData.totalUsers.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-900">${analyticsData.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Bookings</p>
                          <p className="text-2xl font-bold text-yellow-900">{analyticsData.totalBookings}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Active Sessions</p>
                          <p className="text-2xl font-bold text-purple-900">{analyticsData.activeSessions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quotes</h3>
                      {loading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : quotes.length > 0 ? (
                        <div className="space-y-3">
                          {quotes.slice(0, 5).map((quote) => (
                            <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-gray-900">{quote.email}</p>
                                <p className="text-sm text-gray-600 truncate max-w-xs">{quote.message}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                quote.status === 'replied' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {quote.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No quotes found</p>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setActiveTab('email-blast')}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email Blast
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('users')}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Manage Users
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('analytics')}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">User Growth</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.userGrowth}%</p>
                        </div>
                        <div className={`p-2 rounded-full ${analyticsData.userGrowth > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {analyticsData.userGrowth > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.revenueGrowth}%</p>
                        </div>
                        <div className={`p-2 rounded-full ${analyticsData.revenueGrowth > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {analyticsData.revenueGrowth > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Booking Growth</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.bookingGrowth}%</p>
                        </div>
                        <div className={`p-2 rounded-full ${analyticsData.bookingGrowth > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {analyticsData.bookingGrowth > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Session Growth</p>
                          <p className="text-2xl font-bold text-gray-900">{analyticsData.sessionGrowth}%</p>
                        </div>
                        <div className={`p-2 rounded-full ${analyticsData.sessionGrowth > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {analyticsData.sessionGrowth > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Page Views</span>
                          <span className="font-semibold">125,430</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Unique Visitors</span>
                          <span className="font-semibold">45,230</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bounce Rate</span>
                          <span className="font-semibold">32.4%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg. Session Duration</span>
                          <span className="font-semibold">4m 32s</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">House Cleaning</span>
                          <span className="font-semibold">245 bookings</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Lawn Care</span>
                          <span className="font-semibold">189 bookings</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Home Repair</span>
                          <span className="font-semibold">156 bookings</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Pet Care</span>
                          <span className="font-semibold">98 bookings</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                    <Button onClick={() => fetchData()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
              )}

              {/* SUBSCRIPTIONS TAB */}
              {activeTab === 'subscriptions' && (
                <div className="p-6">
                  {/* Subscription Analytics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Subscriptions</p>
                          <p className="text-2xl font-bold text-blue-900">{subscriptionAnalytics.totalSubscriptions || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-red-600">Blocked Cancellations</p>
                          <p className="text-2xl font-bold text-red-900">{subscriptionAnalytics.blockedCancellations || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Perks Used</p>
                          <p className="text-2xl font-bold text-green-900">{subscriptionAnalytics.perksUsedCount || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Subscribed Customers</p>
                          <p className="text-2xl font-bold text-purple-900">{subscribedCustomers.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Management Tabs */}
                  <div className="mb-6">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
                          All Subscriptions
                        </button>
                        <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                          Perks Used
                        </button>
                        <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                          Blocked Cancellations
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Subscriptions Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perks Used</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Can Cancel</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subscriptions.map((subscription) => (
                          <tr key={subscription.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subscription.user?.name || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{subscription.user?.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                subscription.tier === 'PRIORITY' ? 'bg-purple-100 text-purple-800' :
                                subscription.tier === 'HOMECARE' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {subscription.tier}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                subscription.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {subscription.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {subscription.user?.subscriptionUsage ? (
                                  <div className="space-y-1">
                                    {subscription.user.subscriptionUsage.priorityBookingUsed && (
                                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Priority Booking</div>
                                    )}
                                    {subscription.user.subscriptionUsage.discountUsed && (
                                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Discount Used</div>
                                    )}
                                    {subscription.user.subscriptionUsage.freeServiceUsed && (
                                      <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Free Service</div>
                                    )}
                                    {subscription.user.subscriptionUsage.emergencyServiceUsed && (
                                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Emergency Service</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No perks used</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {subscription.canCancel ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                )}
                                <span className={`text-sm ${
                                  subscription.canCancel ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {subscription.canCancel ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => viewSubscriptionDetails(subscription)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {subscription.canCancel ? (
                                  <button 
                                    onClick={() => blockSubscriptionCancellation(subscription.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Block Cancellation"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => allowSubscriptionCancellation(subscription.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Allow Cancellation"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Block Cancellation Modal */}
                  {selectedSubscription && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Block Subscription Cancellation</h3>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                            <textarea
                              value={blockCancellationReason}
                              onChange={(e) => setBlockCancellationReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter reason for blocking cancellation..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setSelectedSubscription(null)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                blockSubscriptionCancellation(selectedSubscription.id);
                                setSelectedSubscription(null);
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                              Block Cancellation
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptions.length === 0 && (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                      <p className="mt-1 text-sm text-gray-500">No active subscriptions in the system.</p>
                    </div>
                  )}
                </div>
              )}

              {/* EMAIL BLAST TAB */}
              {activeTab === 'email-blast' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter email subject..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                        <textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Write your email content here..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                        <select
                          value={recipientFilter}
                          onChange={(e) => setRecipientFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Users</option>
                          <option value="customers">Customers Only</option>
                          <option value="providers">Providers Only</option>
                          <option value="inactive">Inactive Users</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setEmailSubject('Welcome to Our Platform!');
                              setEmailBody('Dear valued customer,\n\nWelcome to our household services platform! We are excited to have you join our community...');
                              setSelectedTemplate('welcome');
                            }}
                            className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            <div className="font-medium">Welcome Email</div>
                            <div className="text-sm text-gray-600">New user onboarding</div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setEmailSubject('Special Promotion - 20% Off!');
                              setEmailBody('Dear customer,\n\nDont miss out on our special promotion! Get 20% off all services this month...');
                              setSelectedTemplate('promotion');
                            }}
                            className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            <div className="font-medium">Promotion Email</div>
                            <div className="text-sm text-gray-600">Marketing campaigns</div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setEmailSubject('Service Reminder');
                              setEmailBody('Dear customer,\n\nThis is a friendly reminder about your upcoming service appointment...');
                              setSelectedTemplate('reminder');
                            }}
                            className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            <div className="font-medium">Reminder Email</div>
                            <div className="text-sm text-gray-600">Appointment reminders</div>
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
                        <div className="bg-gray-50 p-4 rounded border">
                          <div className="text-sm font-medium border-b pb-2 mb-2">
                            Subject: {emailSubject || 'No subject'}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {emailBody || 'No content'}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={sendEmailBlast}
                        disabled={!emailSubject || !emailBody}
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Email Blast
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE CHAT TAB */}
              {activeTab === 'live-chat' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Conversations</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">{message.userName}</div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                                {message.status === 'unread' && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 truncate">{message.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="border rounded-lg h-96 flex flex-col">
                        <div className="p-4 border-b bg-gray-50">
                          <h3 className="font-semibold">Chat with John Doe</h3>
                          <p className="text-sm text-gray-600">Last seen: 2 minutes ago</p>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto">
                          <div className="space-y-4">
                            <div className="flex">
                              <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Hi, I need help with my booking. The service provider hasn&apos;t shown up yet.</p>
                                <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">I&apos;m sorry to hear that. Let me check the status of your booking right away.</p>
                                <p className="text-xs text-blue-200 mt-1">10:32 AM</p>
                              </div>
                            </div>
                            
                            <div className="flex">
                              <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Thank you! The booking reference is #BK123456</p>
                                <p className="text-xs text-gray-500 mt-1">10:33 AM</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border-t">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Type your message..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200">
                            Escalate to Manager
                          </button>
                          <button className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200">
                            Send Booking Details
                          </button>
                          <button className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200">
                            Process Refund
                          </button>
                          <button className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full hover:bg-yellow-200">
                            Schedule Callback
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* USER MANAGEMENT TAB */}
              {activeTab === 'users' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search users..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'PROVIDER' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.status === 'active' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                )}
                                <span className={`text-sm ${
                                  user.status === 'active' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-900">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  {user.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE NOTIFICATIONS TAB */}
              {activeTab === 'mobile-notifications' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Push Notification</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
                            <input
                              type="text"
                              placeholder="Enter notification title..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea
                              rows={4}
                              placeholder="Enter notification message..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="all">All Users</option>
                              <option value="customers">Customers Only</option>
                              <option value="providers">Providers Only</option>
                              <option value="ios">iOS Users</option>
                              <option value="android">Android Users</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input type="radio" name="schedule" value="now" className="mr-2" defaultChecked />
                                Send Now
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name="schedule" value="later" className="mr-2" />
                                Schedule for Later
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => sendNotification('Test Title', 'Test Message', 'all')}
                          className="w-full mt-6"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          Send Notification
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">Service Reminder</h4>
                              <span className="text-xs text-gray-500">2 hours ago</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Your cleaning service is scheduled for tomorrow at 10 AM</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Delivered</span>
                              <span className="text-xs text-gray-500">1,234 recipients</span>
                            </div>
                          </div>
                          
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">Weekly Promotion</h4>
                              <span className="text-xs text-gray-500">1 day ago</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Get 20% off all home cleaning services this week!</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Delivered</span>
                              <span className="text-xs text-gray-500">2,567 recipients</span>
                            </div>
                          </div>
                          
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">System Maintenance</h4>
                              <span className="text-xs text-gray-500">3 days ago</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Scheduled maintenance tonight from 12 AM to 2 AM</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Scheduled</span>
                              <span className="text-xs text-gray-500">All users</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Notification Statistics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Sent Today</span>
                            <span className="font-semibold">3,421</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Delivery Rate</span>
                            <span className="font-semibold">98.5%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Open Rate</span>
                            <span className="font-semibold">67.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Click Rate</span>
                            <span className="font-semibold">23.8%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <div className="max-w-4xl space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                          <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                          <input
                            type="number"
                            value={settings.maxFileSize}
                            onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
                          <input
                            type="text"
                            value={settings.allowedFileTypes}
                            onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                            placeholder="jpg,png,pdf,doc"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">Maintenance Mode</div>
                            <div className="text-sm text-gray-600">Enable to put the site in maintenance mode</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.allowRegistration}
                            onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">Allow User Registration</div>
                            <div className="text-sm text-gray-600">Allow new users to register for accounts</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-gray-600">Send email notifications to users</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.smsNotifications}
                            onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">SMS Notifications</div>
                            <div className="text-sm text-gray-600">Send SMS notifications to users</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">Danger Zone</h4>
                          <p className="text-sm text-gray-600">Irreversible and destructive actions</p>
                        </div>
                        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Reset All Settings
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline">
                        Cancel
                      </Button>
                      <Button onClick={saveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 