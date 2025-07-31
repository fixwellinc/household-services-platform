import PlansSection from '@/components/PlansSection';

export const metadata = {
  title: 'Pricing Plans - Fixwell Services',
  description: 'Choose your perfect plan: Starter Plan, HomeCare Plan, or Priority Plan. Get professional household services with transparent pricing and flexible options.',
  keywords: 'pricing, plans, subscription, household services, maintenance, cleaning, repair',
  openGraph: {
    title: 'Pricing Plans - Fixwell Services',
    description: 'Choose your perfect plan: Starter Plan, HomeCare Plan, or Priority Plan. Get professional household services with transparent pricing and flexible options.',
    type: 'website',
  },
};

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section for Plans */}
      <section className="pt-16 md:pt-20 pb-8 md:pb-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto px-4">
            Get professional household services with transparent pricing. Choose the plan that fits your lifestyle and save $1,000+ per year.
          </p>
        </div>
      </section>

      {/* Money-back Guarantee Banner */}
      <section className="py-4 bg-gradient-to-r from-green-500 to-green-600">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">30-Day Money-Back Guarantee • No Questions Asked</span>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <PlansSection />

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              All plans include access to our core household services. Starter Plan includes cleaning and maintenance, HomeCare Plan adds repair and organization, and Priority Plan includes all services plus custom packages and concierge service.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="bg-blue-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Response Times by Plan
              </h2>
              <p className="text-lg text-gray-600">
                Response times vary by plan: Starter Plan (up to 48 hrs), HomeCare Plan (up to 24 hrs), Priority Plan (up to 12 hrs). Emergency services are available for urgent situations with Priority Plan members getting priority scheduling.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto grid gap-6 md:gap-8">
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. No fees for plan changes.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                How does the money-back guarantee work?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not completely satisfied with our service, contact us within 30 days and we'll refund your entire subscription fee, no questions asked.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                What areas do you serve?
              </h3>
              <p className="text-gray-600">
                We currently serve the Lower Mainland area within 50km of Surrey, including Vancouver, Burnaby, Richmond, Coquitlam, New Westminster, and surrounding communities.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                How do I cancel my plan?
              </h3>
              <p className="text-gray-600">
                You can cancel anytime from your account settings. Your access will continue until the end of your current billing period. No cancellation fees or penalties.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                What services are included in each plan?
              </h3>
              <p className="text-gray-600">
                All plans include access to our core household services. Starter includes cleaning and maintenance, Home Care adds repair and organization, and Priority includes all services plus custom packages and concierge service.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                How quickly can I get service?
              </h3>
              <p className="text-gray-600">
                Response times vary by plan: Starter (up to 48 hrs), Home Care (up to 24 hrs), Priority (up to 12 hrs). Emergency services are available for urgent situations with Priority members getting priority scheduling.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe. You can pay monthly or yearly with a 10% discount for annual plans.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees! You only pay the monthly or yearly plan fee. No hidden charges, activation fees, or additional costs. Start saving immediately.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Are your service providers insured and verified?
              </h3>
              <p className="text-gray-600">
                Yes! All our service providers are thoroughly vetted, insured, and bonded. We conduct background checks and verify credentials to ensure your safety and satisfaction.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Can I use multiple services in one month?
              </h3>
              <p className="text-gray-600">
                Absolutely! Your plan gives you access to book multiple services throughout the month. There are no limits on the number of services you can book, only on the booking advance time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 