'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PlansSection from '@/components/PlansSection';

function PricingPageContent() {
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new_user') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <section className="pt-8 pb-4 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                🎉 Welcome to Fixwell!
              </h2>
              <p className="text-lg text-green-100 dark:text-green-200 mb-4">
                Your account has been created successfully. Now choose your subscription plan to unlock all member benefits and start saving on household services.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-white font-medium">✓ Account Created</span>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-white font-medium">✓ Location Verified</span>
                </div>
                <div className="bg-yellow-400 dark:bg-yellow-500 rounded-lg px-4 py-2">
                  <span className="text-gray-900 dark:text-gray-900 font-medium">→ Choose Your Plan</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section for Plans */}
      <section className="pt-16 md:pt-20 pb-8 md:pb-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg md:text-xl text-blue-100 dark:text-blue-200 max-w-3xl mx-auto px-4">
            Get professional household services with transparent pricing. Choose the plan that fits your lifestyle and save up to $1,000+ per year.
          </p>
        </div>
      </section>

      {/* Quality Assurance Banner */}
      <section className="py-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Professional Quality Assurance • Expert Service</span>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <PlansSection />

      {/* Member Discounts Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Exclusive Member Discounts
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              As a Fixwell member, you'll get exclusive access to special discounts and offers from our trusted partner businesses across the Lower Mainland.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Partner Business Discounts
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-3"></span>
                      Up to 10% off at Infinite Optical
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-3"></span>
                      Up to 10% off body scans at Nutrition Well
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-3"></span>
                      And many more exclusive offers
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white p-6 rounded-2xl">
                    <h4 className="text-xl font-bold mb-2">Ready to Unlock Savings?</h4>
                    <p className="text-blue-100 mb-4">
                      Subscribe to any plan and start saving today!
                    </p>
                    <a 
                      href="/members-discount" 
                      className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      View All Discounts
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              All plans include access to our core household services. Starter Plan includes cleaning and maintenance, HomeCare Plan adds repair and organization, and Priority Plan includes all services plus custom packages and concierge service.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 md:p-8 border border-blue-200 dark:border-blue-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Response Times by Plan
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Response times vary by plan: Starter Plan (up to 48 hrs), HomeCare Plan (up to 24 hrs), Priority Plan (up to 12 hrs). Emergency services are available for urgent situations with Priority Plan members getting priority scheduling.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto grid gap-6 md:gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. No fees for plan changes.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                How does your quality assurance work?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We maintain the highest standards through rigorous professional screening, ongoing quality monitoring, and customer satisfaction tracking. Our team of verified experts ensures every service meets our quality benchmarks.
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
                You can cancel anytime from your account settings. Your access will continue until the end of your current billing period.
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
                We accept all major credit cards, debit cards. All payments are processed securely through Stripe. You can pay monthly or yearly with a 10% discount for annual plans.
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

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
} 