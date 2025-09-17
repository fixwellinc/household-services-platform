'use client';

import React from 'react';
import { Notification } from '@fixwell/types';
import { AlertTriangle, CreditCard, CheckCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';

interface BillingNotificationsProps {
  notifications: Notification[];
  onRetryPayment: (subscriptionId: string) => void;
  onUpdatePaymentMethod: () => void;
  onViewInvoice: (invoiceId: string) => void;
  onContactSupport: () => void;
}

const BillingNotifications: React.FC<BillingNotificationsProps> = ({
  notifications,
  onRetryPayment,
  onUpdatePaymentMethod,
  onViewInvoice,
  onContactSupport
}) => {
  const billingNotifications = notifications.filter(n => n.type === 'BILLING');

  const getNotificationIcon = (notification: Notification) => {
    if (notification.message.toLowerCase().includes('payment failed') || 
        notification.message.toLowerCase().includes('payment failure')) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (notification.message.toLowerCase().includes('subscription') && 
        notification.message.toLowerCase().includes('changed')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (notification.message.toLowerCase().includes('invoice') || 
        notification.message.toLowerCase().includes('payment due')) {
      return <CreditCard className="w-5 h-5 text-blue-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getNotificationActions = (notification: Notification) => {
    const actions = [];
    
    // Payment failure notifications
    if (notification.message.toLowerCase().includes('payment failed')) {
      actions.push(
        <button
          key="retry"
          onClick={() => onRetryPayment(notification.id)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry Payment
        </button>
      );
      actions.push(
        <button
          key="update"
          onClick={onUpdatePaymentMethod}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
        >
          <CreditCard className="w-3 h-3" />
          Update Payment Method
        </button>
      );
    }

    // Invoice notifications
    if (notification.message.toLowerCase().includes('invoice')) {
      const invoiceMatch = notification.message.match(/invoice[:\s]+([a-zA-Z0-9-_]+)/i);
      const invoiceId = invoiceMatch ? invoiceMatch[1] : 'latest';
      
      actions.push(
        <button
          key="invoice"
          onClick={() => onViewInvoice(invoiceId)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Invoice
        </button>
      );
    }

    // Subscription change confirmations
    if (notification.message.toLowerCase().includes('subscription') && 
        notification.message.toLowerCase().includes('changed')) {
      actions.push(
        <button
          key="details"
          onClick={() => window.location.href = '/customer-dashboard'}
          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          View Details
        </button>
      );
    }

    // General support action for urgent issues
    if (notification.priority === 'URGENT') {
      actions.push(
        <button
          key="support"
          onClick={onContactSupport}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          Contact Support
        </button>
      );
    }

    return actions;
  };

  const getNotificationStyle = (notification: Notification) => {
    if (notification.message.toLowerCase().includes('payment failed')) {
      return 'border-l-4 border-red-500 bg-red-50';
    }
    if (notification.message.toLowerCase().includes('subscription') && 
        notification.message.toLowerCase().includes('changed')) {
      return 'border-l-4 border-green-500 bg-green-50';
    }
    if (notification.priority === 'URGENT') {
      return 'border-l-4 border-red-500 bg-red-50';
    }
    return 'border-l-4 border-blue-500 bg-blue-50';
  };

  if (billingNotifications.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No billing notifications</p>
        <p className="text-sm">Your billing is up to date!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Notifications</h3>
      
      {billingNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg ${getNotificationStyle(notification)} ${
            !notification.isRead ? 'ring-2 ring-blue-200' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h4>
                {notification.priority === 'URGENT' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    URGENT
                  </span>
                )}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              <p className="text-sm text-gray-700 mb-3">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                
                <div className="flex items-center gap-2">
                  {getNotificationActions(notification)}
                </div>
              </div>
              
              {/* Additional context for payment failures */}
              {notification.message.toLowerCase().includes('payment failed') && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <h5 className="text-sm font-medium text-red-800 mb-1">
                    What happens next?
                  </h5>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Your subscription remains active for 7 days</li>
                    <li>• We'll retry payment automatically in 3 days</li>
                    <li>• Update your payment method to avoid service interruption</li>
                  </ul>
                </div>
              )}
              
              {/* Additional context for subscription changes */}
              {notification.message.toLowerCase().includes('subscription') && 
               notification.message.toLowerCase().includes('changed') && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <h5 className="text-sm font-medium text-green-800 mb-1">
                    Changes take effect immediately
                  </h5>
                  <p className="text-xs text-green-700">
                    Your new plan benefits are now available in your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BillingNotifications;