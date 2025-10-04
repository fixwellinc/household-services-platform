'use client';

import React from 'react';
import { CurrentPlanCard, BillingInformation, SubscriptionStatus } from './index';

interface Subscription {
  id: string;
  tier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE' | 'PAUSED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentFrequency: 'MONTHLY' | 'YEARLY';
  nextPaymentAmount: number;
  plan: {
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft';
  date: string;
  dueDate?: string;
  downloadUrl?: string;
  hostedInvoiceUrl?: string;
  description: string;
}

interface SubscriptionOverviewProps {
  subscription: Subscription;
  paymentMethods?: PaymentMethod[];
  invoices?: Invoice[];
  accessEndDate?: string;
  cancellationDate?: string;
  pausedUntil?: string;
  paymentFailureReason?: string;
  lastPaymentAttempt?: string;
  nextRetryDate?: string;
  onPlanChange?: () => void;
  onCancelSubscription?: () => void;
  onUpdatePaymentMethod?: () => void;
  onAddPaymentMethod?: () => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onRetryPayment?: () => void;
  onReactivateSubscription?: () => void;
  onContactSupport?: () => void;
  isLoading?: boolean;
}

const SubscriptionOverview = React.memo(function SubscriptionOverview({
  subscription,
  paymentMethods = [],
  invoices = [],
  accessEndDate,
  cancellationDate,
  pausedUntil,
  paymentFailureReason,
  lastPaymentAttempt,
  nextRetryDate,
  onPlanChange,
  onCancelSubscription,
  onUpdatePaymentMethod,
  onAddPaymentMethod,
  onDownloadInvoice,
  onViewInvoice,
  onRetryPayment,
  onReactivateSubscription,
  onContactSupport,
  isLoading = false
}: SubscriptionOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Subscription Status - Show first if there are issues */}
      {subscription.status !== 'ACTIVE' && (
        <SubscriptionStatus
          status={subscription.status}
          accessEndDate={accessEndDate}
          cancellationDate={cancellationDate}
          pausedUntil={pausedUntil}
          paymentFailureReason={paymentFailureReason}
          lastPaymentAttempt={lastPaymentAttempt}
          nextRetryDate={nextRetryDate}
          onRetryPayment={onRetryPayment}
          onUpdatePaymentMethod={onUpdatePaymentMethod}
          onReactivateSubscription={onReactivateSubscription}
          onContactSupport={onContactSupport}
          isProcessing={isLoading}
        />
      )}

      {/* Main subscription details in a responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Current Plan Card */}
        <CurrentPlanCard
          subscription={subscription}
          onPlanChange={onPlanChange}
          onCancelSubscription={onCancelSubscription}
        />

        {/* Billing Information */}
        <BillingInformation
          paymentMethods={paymentMethods}
          invoices={invoices}
          onUpdatePaymentMethod={onUpdatePaymentMethod}
          onAddPaymentMethod={onAddPaymentMethod}
          onDownloadInvoice={onDownloadInvoice}
          onViewInvoice={onViewInvoice}
          isLoading={isLoading}
        />
      </div>

      {/* Show status for active subscriptions at the bottom */}
      {subscription.status === 'ACTIVE' && (
        <SubscriptionStatus
          status={subscription.status}
          onContactSupport={onContactSupport}
          isProcessing={isLoading}
        />
      )}
    </div>
  );
});

export default SubscriptionOverview;