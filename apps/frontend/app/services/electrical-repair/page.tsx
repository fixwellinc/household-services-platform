import { Metadata } from 'next';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Zap, 
  Clock, 
  Shield, 
  CheckCircle, 
  Star, 
  Users, 
  MapPin,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Electrical Repair - Fixwell',
  description: 'Safe and reliable electrical repair services with licensed electricians and safety certification',
};

export default function ElectricalRepairPage() {
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
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Repair Services
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Electrical Repair
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Safe and reliable electrical services for your home. From troubleshooting to installations, we ensure your safety with licensed electricians.
              </p>

              {/* Safety Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-medium mb-8">
                <AlertTriangle className="h-4 w-4" />
                Safety Certified
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
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Complexity</h3>
                    <p className="text-sm text-gray-600">Complex</p>
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
                          <span className="text-gray-700">Electrical troubleshooting and diagnostics</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Outlet and switch repairs</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Circuit breaker and panel work</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Lighting fixture installation</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Electrical safety inspections</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">Code compliance verification</span>
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
                        <h4 className="font-semibold text-blue-900 mb-2">Licensed Electricians</h4>
                        <p className="text-sm text-blue-700">Certified and insured professionals</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">Safety Certified</h4>
                        <p className="text-sm text-red-700">All work meets safety standards</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Code Compliant</h4>
                        <p className="text-sm text-green-700">All work meets local codes</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Modern Upgrades</h4>
                        <p className="text-sm text-purple-700">Latest technology and materials</p>
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
                      <p className="text-gray-600 text-sm">Every electrical issue is unique. Get a custom quote based on your specific problem and requirements.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">Free diagnostic assessment</span>
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
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">Enhanced safety</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Reliable power</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">Modern upgrades</span>
                    </div>
                  </div>

                  {/* Quote Request Button */}
                  <div className="space-y-4">
                    <Button 
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
                    >
                      <BookOpen className="h-5 w-5 mr-2" />
                      Request Custom Quote
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Emergency? <Link href="/contact" className="text-red-600 hover:text-red-700 font-semibold">Call us immediately</Link>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Are your electricians licensed and insured?</h3>
                <p className="text-gray-600">Yes, all our electricians are fully licensed, bonded, and insured. We maintain the highest standards of safety and professionalism.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you handle emergency electrical issues?</h3>
                <p className="text-gray-600">Yes, we offer emergency electrical services for urgent issues like power outages, electrical fires, and safety hazards.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What warranty do you provide on electrical work?</h3>
                <p className="text-gray-600">We provide a comprehensive warranty on all our electrical work. Parts and labor are covered, and we stand behind our professional quality assurance.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you perform electrical safety inspections?</h3>
                <p className="text-gray-600">Yes, we offer comprehensive electrical safety inspections to identify potential hazards and ensure your electrical system is up to code.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 