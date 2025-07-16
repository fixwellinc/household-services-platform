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
  Smartphone
} from 'lucide-react';

interface Quote {
  id: string;
  email: string;
  message: string;
  status: 'pending' | 'replied';
  createdAt: string;
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
  const [loading, setLoading] = useState(true);

  const { data: userData, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
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
    { name: 'Email Blast', icon: Mail, id: 'email-blast' },
    { name: 'Live Chat', icon: MessageSquare, id: 'live-chat' },
    { name: 'User Management', icon: Users, id: 'users' },
    { name: 'Mobile Notifications', icon: Smartphone, id: 'mobile-notifications' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

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
              {activeTab === 'dashboard' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">1,234</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-900">$12,345</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Bookings</p>
                          <p className="text-2xl font-bold text-yellow-900">456</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Active Sessions</p>
                          <p className="text-2xl font-bold text-purple-900">89</p>
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

              {activeTab !== 'dashboard' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      {navigation.find(item => item.id === activeTab)?.icon && (
                        <div className="h-12 w-12 text-gray-400">
                          {React.createElement(navigation.find(item => item.id === activeTab)!.icon, { className: "h-full w-full" })}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {navigation.find(item => item.id === activeTab)?.name}
                    </h3>
                    <p className="text-gray-500">This feature is coming soon...</p>
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