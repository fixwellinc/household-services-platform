'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
  Bell,
  Settings,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Heart,
  X,
  Loader2,
  Filter,
  Trash2,
  ExternalLink
} from 'lucide-react';
import NotificationPreferences from './NotificationPreferences';
import PaymentMethodUpdate from './PaymentMethodUpdate';
import PaymentHistory from './PaymentHistory';

interface Notification {
  id: string;
  type: 'PAYMENT_DUE' | 'UPGRADE_SUGGESTION' | 'SUBSCRIPTION_PAUSED' | 'ENGAGEMENT_REMINDER' | 'PAYMENT_FAILED';
  title: string;
  message: string;
  urgency: 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  userId?: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences' | 'payment-methods' | 'payment-history'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Mock data for demonstration
      setNotifications([
        {
          id: '1',
          type: 'PAYMENT_DUE',
          title: 'Payment Due Soon',
          message: 'Your HOMECARE subscription payment is due in 3 days',
          urgency: 'HIGH',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          actionUrl: '/dashboard/subscription/payment-methods'
        },
        {
          id: '2',
          type: 'UPGRADE_SUGGESTION',
          title: 'Upgrade Recommendation',
          message: "You're using 85% of your plan. Consider upgrading for better value.",
          urgency: 'NORMAL',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          actionUrl: '/dashboard/subscription/upgrade'
        },
        {
          id: '3',
          type: 'ENGAGEMENT_REMINDER',
          title: 'We Miss You!',
          message: "It's been 45 days since your last service. Your HOMECARE benefits are waiting!",
          urgency: 'NORMAL',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          actionUrl: '/dashboard/book-service'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real implementation, this would call an API
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // In a real implementation, this would call an API
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'PAYMENT_DUE':
        return <CreditCard className="h-5 w-5 text-orange-500" />;
      case 'UPGRADE_SUGGESTION':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'SUBSCRIPTION_PAUSED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'ENGAGEMENT_REMINDER':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'PAYMENT_FAILED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getUrgencyBadge = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'NORMAL':
        return <Badge variant="secondary">Normal</Badge>;
      default:
        return <Badge variant="secondary">{urgency}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'urgent':
        return notification.urgency === 'URGENT' || notification.urgency === 'HIGH';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'notifications'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'preferences'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payment-methods'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payment-history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payment-history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment History
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'urgent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('urgent')}
              >
                Urgent ({notifications.filter(n => n.urgency === 'URGENT' || n.urgency === 'HIGH').length})
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
              <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading notifications...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'all'
                      ? "You're all caught up! No notifications to show."
                      : `No ${filter} notifications found.`
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${!notification.isRead ? 'text-blue-900' : ''}`}>
                                {notification.title}
                              </span>
                              {getUrgencyBadge(notification.urgency)}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDate(notification.createdAt)}</span>
                              {notification.actionUrl && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                                  <a href={notification.actionUrl}>
                                    Take Action <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete notification"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'preferences' && (
        <NotificationPreferences
          userId={userId}
          onPreferencesUpdate={() => {
            toast.success('Preferences updated successfully');
          }}
        />
      )}

      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your payment methods and update expiring cards to avoid service interruptions.
              </p>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowPaymentMethodModal(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Payment Methods
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'payment-history' && (
        <PaymentHistory
          userId={userId}
          showRetryStatus={true}
        />
      )}

      {/* Payment Method Modal */}
      <PaymentMethodUpdate
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onPaymentMethodUpdated={() => {
          toast.success('Payment method updated successfully');
          loadNotifications(); // Refresh notifications in case payment issues were resolved
        }}
      />
    </div>
  );
}