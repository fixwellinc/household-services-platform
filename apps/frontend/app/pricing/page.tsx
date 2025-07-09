import PricingSection from '@/components/PricingSection';

export const metadata = {
  title: 'Pricing | Household Services',
  description: 'Compare Basic, Premium, and VIP plans for household services. Transparent pricing and flexible options.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section for Pricing */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            From basic household services to luxury concierge care, we have a plan that fits your lifestyle and budget.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                How do I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                You can cancel anytime from your account settings. Your access will continue until the end of your current billing period.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact our support team for a full refund.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees! You only pay the monthly or yearly subscription fee. No hidden charges or additional costs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 