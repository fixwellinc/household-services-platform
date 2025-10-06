import { Metadata } from 'next';
import StripePaymentTester from '@/components/features/payment/StripePaymentTester';

export const metadata: Metadata = {
  title: 'Stripe Payment Tester',
  description: 'Test Stripe payments using test card numbers',
};

export default function StripeTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <StripePaymentTester />
    </div>
  );
}
