"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-api';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';
import EnhancedAnalytics from '@/components/admin/EnhancedAnalytics';
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
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  subscription?: {
    id: string;
    tier: string;
    status: string;
    currentPeriodEnd: string;
  };
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

interface TopService {
  name: string;
  bookings: number;
}

interface NotificationStats {
  totalSentToday: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  totalBookings: number;
  activeSessions: number;
  userGrowth: number;
  revenueGrowth: number;
  bookingGrowth: number;
  sessionGrowth: number;
  totalQuotes: number;
  totalServices: number;
  totalSubscriptions: number;
  topServices: TopService[];
  notificationStats: NotificationStats;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Subscription Management State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscribedCustomers, setSubscribedCustomers] = useState<any[]>([]);
  const [customersWithPerksUsed, setCustomersWithPerksUsed] = useState<any[]>([]);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<any>({});
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [blockCancellationReason, setBlockCancellationReason] = useState('');
  
  // User Management State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN',
    phone: '',
    address: '',
    postalCode: ''
  });
  
  function ChatMessages({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    useEffect(() => {
      let socket: any;
      (async () => {
        const { io } = await import('socket.io-client');
        socket = io('/', { path: '/socket.io' });
        socket.emit('join-session', chatId);
        socket.on('new-message', (data: any) => {
          if (data.chatSessionId === chatId) {
            setMessages((prev) => [...prev, data]);
          }
        });
      })();
      return () => { if (socket) socket.disconnect(); };
    }, [chatId]);
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const r = await fetch(`/api/chat/${chatId}/messages`);
          if (r.ok) {
            const d = await r.json();
            if (mounted) setMessages(d.messages || []);
          }
        } catch {}
      })();
      return () => { mounted = false };
    }, [chatId]);
    const send = async () => {
      if (!text.trim()) return;
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: text, sender: 'admin', senderType: 'admin' })
      });
      setText('');
      // naive refresh
      const r = await fetch(`/api/chat/${chatId}/messages`);
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
      }
    };
    return (
      <>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === 'admin' ? 'justify-end' : ''}`}>
            <div className={`${m.senderType === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100'} p-3 rounded-lg max-w-xs`}>
              <p className="text-sm break-words">{m.message || (m.fileUrl ? `[File] ${m.fileName}` : '')}</p>
              <p className="text-xs opacity-70 mt-1">{new Date(m.sentAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div className="p-4 border-t mt-4">
          <div className="flex space-x-2">
            <input value={text} onChange={(e) => setText(e.target.value)} type="text" placeholder="Type your message..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button onClick={send}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    )
  }
  
  // Email Blast State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    activeSessions: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
    sessionGrowth: 0,
    totalQuotes: 0,
    totalServices: 0,
    totalSubscriptions: 0,
    topServices: [],
    notificationStats: {
      totalSentToday: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0
    }
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

      // Fetch main analytics data
      const mainAnalyticsResponse = await fetch('/api/admin/analytics');
      if (mainAnalyticsResponse.ok) {
        const mainAnalyticsData = await mainAnalyticsResponse.json();
        setAnalyticsData(mainAnalyticsData);
      }

      // Load email templates
      try {
        const t = await fetch('/api/admin/email-templates');
        if (t.ok) {
          const td = await t.json();
          setTemplates(td.templates || []);
        }
      } catch {}

      // Load chat sessions
      try {
        const s = await fetch('/api/chat/sessions');
        if (s.ok) {
          const sd = await s.json();
          setChatSessions(sd.sessions || []);
        }
      } catch {}
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
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: status === 'active' })
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isActive: status === 'active' }
            : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateUserRole = async (userId: string, role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role }
            : user
        ));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        setDeletingUser(null);
        toast.success('User deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const editUser = async (userId: string, userData: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, ...updatedUser.user }
            : user
        ));
        setEditingUser(null);
        setEditUserForm({
          name: '',
          email: '',
          role: 'CUSTOMER',
          phone: '',
          address: '',
          postalCode: ''
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      postalCode: user.postalCode || ''
    });
  };

  const openViewUser = (user: User) => {
    setViewingUser(user);
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
                <EnhancedAnalytics />
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
                          <option value="all">All Active Users</option>
                          <option value="subscribers">Active Subscribers</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
                        <div className="space-y-3">
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                            <option value="">Select template...</option>
                            {templates.map((t: any) => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={async () => {
                              const name = prompt('Template name?');
                              if (!name) return;
                              await fetch('/api/admin/email-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject: emailSubject, body: emailBody, isHtmlMode: emailBody.includes('<') }) });
                              const r = await fetch('/api/admin/email-templates');
                              if (r.ok) { const d = await r.json(); setTemplates(d.templates || []); setSelectedTemplate(name); }
                            }}>Save as Template</Button>
                            <Button variant="outline" onClick={async () => {
                              if (!selectedTemplate) return;
                              const r = await fetch('/api/admin/email-templates');
                              const d = await r.json();
                              const t = (d.templates || []).find((x: any) => x.name === selectedTemplate);
                              if (t) { setEmailSubject(t.subject || ''); setEmailBody((t.html || t.body) || ''); }
                            }}>Load</Button>
                            <Button variant="destructive" onClick={async () => {
                              if (!selectedTemplate) return;
                              const r = await fetch('/api/admin/email-templates');
                              const d = await r.json();
                              const t = (d.templates || []).find((x: any) => x.name === selectedTemplate);
                              if (t) {
                                await fetch(`/api/admin/email-templates/${t.id}`, { method: 'DELETE' });
                                const rr = await fetch('/api/admin/email-templates');
                                if (rr.ok) { const dd = await rr.json(); setTemplates(dd.templates || []); setSelectedTemplate(''); }
                              }
                            }}>Delete</Button>
                          </div>
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
                        {chatSessions.map((session: any) => (
                          <div key={session.id} className={`p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer ${activeChatId === session.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setActiveChatId(session.id)}>
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">{session.customerName}</div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Unread: {session.unreadCount ?? 0}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 truncate">{session.messages?.[0]?.message || 'No messages yet'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="border rounded-lg h-96 flex flex-col">
                        <div className="p-4 border-b bg-gray-50">
                          <h3 className="font-semibold">{activeChatId ? `Chat ${activeChatId}` : 'No chat selected'}</h3>
                          <p className="text-sm text-gray-600">{activeChatId ? 'Live' : 'Select a conversation'}</p>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto">
                          <div className="space-y-4">
                            {activeChatId ? (
                              <ChatMessages chatId={activeChatId} />
                            ) : (
                              <div className="text-sm text-gray-500">Select a conversation to view messages.</div>
                            )}
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
                    <p className="text-gray-600">Manage all users, their roles, and account status. You can view details, edit information, activate/deactivate accounts, and delete users.</p>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search users by name or email..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Search for users by their name or email address"
                        />
                      </div>
                      <Button variant="outline" title="Filter users by various criteria (coming soon)">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" title="Export user data to CSV (coming soon)">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button title="Add a new user to the system (coming soon)">
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="User's name and email address">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="User's role in the system (Customer, Employee, or Admin)">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="Whether the user account is active or inactive">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="Last time the user logged into the system">Last Login</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="Available actions for this user">Actions</th>
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
                                user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.isActive ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                )}
                                <span className={`text-sm ${
                                  user.isActive ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => openViewUser(user)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="View user details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => openEditUser(user)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="Edit user information"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => updateUserStatus(user.id, user.isActive ? 'inactive' : 'active')}
                                  className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                  title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                >
                                  {user.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <button 
                                  onClick={() => setDeletingUser(user)}
                                  className={`transition-colors ${
                                    user.role === 'ADMIN' 
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-red-600 hover:text-red-900'
                                  }`}
                                  title={
                                    user.role === 'ADMIN' 
                                      ? 'Admin accounts cannot be deleted' 
                                      : 'Delete user'
                                  }
                                  disabled={user.role === 'ADMIN'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <div className="text-gray-500">
                                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No users found</p>
                                <p className="text-gray-600">
                                  {searchTerm ? `No users match "${searchTerm}". Try adjusting your search terms.` : 'No users have been registered yet.'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                              <span className="text-xs text-gray-500">{analyticsData.totalUsers?.toLocaleString() || 0} recipients</span>
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
                            <span className="font-semibold">{analyticsData.notificationStats?.totalSentToday?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Delivery Rate</span>
                            <span className="font-semibold">{analyticsData.notificationStats?.deliveryRate || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Open Rate</span>
                            <span className="font-semibold">{analyticsData.notificationStats?.openRate || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Click Rate</span>
                            <span className="font-semibold">{analyticsData.notificationStats?.clickRate || 0}%</span>
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

      {/* USER VIEW MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setViewingUser(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingUser.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs rounded-full ${
                          viewingUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          viewingUser.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingUser.role}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`mt-1 inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          viewingUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {viewingUser.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingUser.phone}</p>
                        </div>
                      )}
                      {viewingUser.address && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingUser.address}</p>
                        </div>
                      )}
                      {viewingUser.postalCode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingUser.postalCode}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(viewingUser.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                      {viewingUser.subscription && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subscription</label>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-900">Plan: {viewingUser.subscription.tier}</p>
                            <p className="text-sm text-gray-900">Status: {viewingUser.subscription.status}</p>
                            <p className="text-sm text-gray-900">
                              Renews: {new Date(viewingUser.subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setEditingUser(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Edit className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit User</h3>
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      editUser(editingUser.id, editUserForm);
                    }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={editUserForm.name}
                          onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editUserForm.email}
                          onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={editUserForm.role}
                          onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value as 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="EMPLOYEE">Employee</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={editUserForm.phone}
                          onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={editUserForm.address}
                          onChange={(e) => setEditUserForm({...editUserForm, address: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                        <input
                          type="text"
                          value={editUserForm.postalCode}
                          onChange={(e) => setEditUserForm({...editUserForm, postalCode: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button type="submit" className="mr-2">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setDeletingUser(null)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
                    <div className="mt-2">
                      {deletingUser.role === 'ADMIN' ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This is an admin account. Admin accounts are protected and cannot be deleted.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action cannot be undone.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button 
                  variant="outline" 
                  className={`mr-2 ${
                    deletingUser.role === 'ADMIN' 
                      ? 'border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                  onClick={() => deleteUser(deletingUser.id)}
                  disabled={deletingUser.role === 'ADMIN'}
                >
                  Delete User
                </Button>
                <Button variant="outline" onClick={() => setDeletingUser(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 