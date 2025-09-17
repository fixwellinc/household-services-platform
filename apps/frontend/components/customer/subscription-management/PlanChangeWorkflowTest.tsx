'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import PlanChangeWorkflow from './PlanChangeWorkflow';

// Test component to demonstrate the plan change workflow
export default function PlanChangeWorkflowTest() {
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Mock subscription data for testing
  const mockSubscription = {
    id: 'sub_test_123',
    tier: 'STARTER',
    status: 'ACTIVE',
    paymentFrequency: 'MONTHLY',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextPaymentAmount: 21.99,
    plan: {
      name: 'Starter Plan',
      monthlyPrice: 21.99,
      yearlyPrice: 237.49,
      features: [
        '1 visit per month (up to 0.5 hour)',
        'Minor repairs & maintenance',
        'Lightbulb replacements',
        'Basic safety checks',
        'Priority scheduling',
        'Free annual inspection'
      ]
    }
  };

  const handlePlanChanged = () => {
    console.log('Plan changed successfully!');
    setShowWorkflow(false);
    // In a real app, you would refresh the subscription data here
  };

  const handleCancel = () => {
    console.log('Plan change cancelled');
    setShowWorkflow(false);
  };

  if (showWorkflow) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <PlanChangeWorkflow
          currentSubscription={mockSubscription}
          onPlanChanged={handlePlanChanged}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Plan Change Workflow Test</h1>
      <p className="text-gray-600 mb-6">
        Click the button below to test the plan change workflow with mock data.
      </p>
      <Button
        onClick={() => setShowWorkflow(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Test Plan Change Workflow
      </Button>
    </div>
  );
}