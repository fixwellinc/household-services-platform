import { NextRequest, NextResponse } from 'next/server';

interface AlertNotification {
  id: string;
  alertId: string;
  alertName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  channels: Array<{
    type: 'email' | 'sms' | 'push' | 'webhook';
    target: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
  }>;
  metadata?: Record<string, any>;
}

// Mock storage for notifications
// In a real implementation, this would be stored in a database
let notifications: AlertNotification[] = [
  {
    id: 'notif-1',
    alertId: 'alert-1',
    alertName: 'High CPU Usage',
    message: 'CPU usage has exceeded 85% threshold (current: 92%)',
    severity: 'high',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'sent',
    channels: [
      { type: 'email', target: 'admin@example.com', status: 'sent', sentAt: new Date(Date.now() - 4 * 60 * 1000) },
      { type: 'push', target: 'admin_device', status: 'sent', sentAt: new Date(Date.now() - 4 * 60 * 1000) }
    ]
  },
  {
    id: 'notif-2',
    alertId: 'alert-2',
    alertName: 'Low Disk Space',
    message: 'Disk space is below 10% threshold (current: 7%)',
    severity: 'critical',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'sent',
    channels: [
      { type: 'email', target: 'admin@example.com', status: 'sent', sentAt: new Date(Date.now() - 14 * 60 * 1000) },
      { type: 'sms', target: '+1234567890', status: 'sent', sentAt: new Date(Date.now() - 14 * 60 * 1000) },
      { type: 'webhook', target: 'https://api.slack.com/webhook', status: 'failed', error: 'Connection timeout' }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredNotifications = [...notifications];

    // Apply filters
    if (status && status !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.status === status);
    }

    if (severity && severity !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.severity === severity);
    }

    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);

    return NextResponse.json({
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      hasMore: offset + limit < filteredNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();

    // Validate notification data
    if (!notification.alertId || !notification.message || !notification.severity) {
      return NextResponse.json(
        { error: 'Alert ID, message, and severity are required' },
        { status: 400 }
      );
    }

    const newNotification: AlertNotification = {
      id: `notif-${Date.now()}`,
      alertId: notification.alertId,
      alertName: notification.alertName || 'System Alert',
      message: notification.message,
      severity: notification.severity,
      timestamp: new Date(),
      status: 'pending',
      channels: notification.channels || [],
      metadata: notification.metadata
    };

    notifications.unshift(newNotification);

    // Simulate sending notifications
    setTimeout(() => {
      const notificationIndex = notifications.findIndex(n => n.id === newNotification.id);
      if (notificationIndex !== -1) {
        notifications[notificationIndex] = {
          ...notifications[notificationIndex],
          status: 'sent',
          channels: notifications[notificationIndex].channels.map(channel => ({
            ...channel,
            status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success rate
            sentAt: new Date(),
            error: Math.random() > 0.1 ? undefined : 'Delivery failed'
          }))
        };
      }
    }, 2000);

    return NextResponse.json({
      success: true,
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationId, status } = await request.json();

    if (!notificationId || !status) {
      return NextResponse.json(
        { error: 'Notification ID and status are required' },
        { status: 400 }
      );
    }

    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      status
    };

    return NextResponse.json({
      success: true,
      message: 'Notification status updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const initialLength = notifications.length;
    notifications = notifications.filter(n => n.id !== notificationId);

    if (notifications.length === initialLength) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}