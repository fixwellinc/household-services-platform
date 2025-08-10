'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import {
  Home,
  Clock,
  Shield,
  CheckCircle,
  Star,
  Users,
  MapPin,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Zap,
  Wrench,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuoteRequestModal from '@/components/QuoteRequestModal';

export const dynamic = 'force-dynamic';


export default function DeepHouseCleaningPage() {
  const router = useRouter();
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const handleBookNow = () => {
    // Navigate to book service page
    router.push('/dashboard/customer/book-service');
  };

  const handleRequestQuote = () => {
    setShowQuoteModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Services
              </Link>
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Home className="h-4 w-4" />
                Cleaning Services
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Deep House Cleaning
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Transform your home with our comprehensive cleaning service. Professional attention to every detail, from kitchen to bedrooms.
              </p>

              {/* Service Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full text-sm font-medium mb-8">
                <Star className="h-4 w-4" />
                Popular Service
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Duration</h3>
                    <p className="text-sm text-gray-600">3-4 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Complexity</h3>
                    <p className="text-sm text-gray-600">Moderate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Service Area</h3>
                    <p className="text-sm text-gray-600">Lower Mainland</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Service Information */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Service Details</h2>

                <div className="space-y-8">
                  {/* What's Included */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      What's Included
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Complete kitchen deep cleaning (appliances, cabinets, countertops)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Bathroom sanitization and deep cleaning</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Bedroom and living area cleaning</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Floor mopping and vacuuming</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Window and mirror cleaning</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Dusting of all surfaces and fixtures</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      Key Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Eco-friendly Products</h4>
                        <p className="text-sm text-blue-700">Safe for your family and pets</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Professional Results</h4>
                        <p className="text-sm text-green-700">We're not done until you're happy</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Flexible Scheduling</h4>
                        <p className="text-sm text-purple-700">Book at your convenience</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">Professional Team</h4>
                        <p className="text-sm text-orange-700">Trained and insured cleaners</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Quote Request & Booking */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Your Custom Quote</h3>

                  {/* Quote Information */}
                  <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Personalized Pricing</h4>
                      <p className="text-gray-600 text-sm">Every home is unique. Get a custom quote based on your specific needs and home size.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">Free consultation and assessment</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700">Transparent pricing breakdown</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-700">No hidden fees or surprises</span>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">Healthier living environment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">More time for family</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">Professional results</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
                        onClick={handleBookNow}
                      >
                        <BookOpen className="h-5 w-5 mr-2" />
                        Book Now
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 py-4 text-lg font-semibold"
                        onClick={handleRequestQuote}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Request Quote
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-700">Contact us</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How long does a deep house cleaning take?</h3>
                <p className="text-gray-600">A typical deep house cleaning takes 3-4 hours depending on the size of your home and the level of detail required.</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Do I need to be home during the cleaning?</h3>
                <p className="text-gray-600">While you don't need to be home, many customers prefer to be present to answer questions and provide access to specific areas.</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What cleaning products do you use?</h3>
                <p className="text-gray-600">We use eco-friendly, non-toxic cleaning products that are safe for your family and pets while being effective at removing dirt and grime.</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What quality standards do you maintain?</h3>
                <p className="text-gray-600">We maintain the highest quality standards through rigorous professional screening and ongoing quality monitoring. Our team of verified experts ensures exceptional results every time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        serviceName="Deep House Cleaning"
        serviceId="deep-house-cleaning"
      />
    </div>
  );
} 