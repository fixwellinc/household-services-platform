'use client';

import React from 'react';
import { useSubscriptionStatus } from '../../hooks/use-subscription-status';
import { Loader2, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

/**
 * Example component demonstrating how to use the useSubscriptionStatus hook
 * This shows all the different subscription states and loading/error handling
 */
export const SubscriptionStatusExample: React.FC = () => {
  const {
    isLoading,
    error,
    hasSubscriptionHistory,
    currentStatus,
    shouldShowCustomerDashboard,
    shouldShowPromotion,
    canAccessPremiumFeatures,
    subscription,
    plan,
    refetch,
  } = useSubscriptionStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading subscription status...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="font-medium text-red-800">Error Loading Subscription</h3>
        </div>
        <p className="text-red-700 mb-3">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Status icon based on current status
  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PAST_DUE':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'INCOMPLETE':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Status color based on current status
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'ACTIVE':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'PAST_DUE':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'INCOMPLETE':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        
        {/* Current Status */}
        <div className={`border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
          <div className="flex items-center mb-2">
            {getStatusIcon()}
            <span className="ml-2 font-medium">Status: {currentStatus}</span>
          </div>
          
          {subscription && (
            <div className="text-sm space-y-1">
              <p><strong>Tier:</strong> {subscription.tier}</p>
              {subscription.currentPeriodEnd && (
                <p><strong>Period End:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>

        {/* Plan Information */}
        {plan && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">{plan.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
            <p className="text-lg font-semibold text-green-600">
              ${plan.monthlyPrice}/month
            </p>
            {plan.features && plan.features.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Routing Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-1">Customer Dashboard</h4>
            <p className="text-sm text-blue-700">
              {shouldShowCustomerDashboard ? '✓ Show' : '✗ Hide'}
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h4 className="font-medium text-purple-800 mb-1">Promotion</h4>
            <p className="text-sm text-purple-700">
              {shouldShowPromotion ? '✓ Show' : '✗ Hide'}
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-800 mb-1">Premium Features</h4>
            <p className="text-sm text-green-700">
              {canAccessPremiumFeatures ? '✓ Enabled' : '✗ Disabled'}
            </p>
          </div>
        </div>

        {/* Subscription History */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-1">Subscription History</h4>
          <p className="text-sm text-gray-700">
            {hasSubscriptionHistory ? 'Has previous subscriptions' : 'No subscription history'}
          </p>
        </div>

        {/* Action Buttons Based on Status */}
        <div className="mt-4 flex gap-2">
          {currentStatus === 'NONE' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Subscribe Now
            </button>
          )}
          
          {currentStatus === 'PAST_DUE' && (
            <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
              Update Payment
            </button>
          )}
          
          {currentStatus === 'CANCELLED' && (
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              Reactivate Subscription
            </button>
          )}
          
          {currentStatus === 'INCOMPLETE' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Complete Payment
            </button>
          )}
          
          {currentStatus === 'ACTIVE' && (
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              Manage Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};