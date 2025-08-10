import React from 'react';
import { 
  Heart, 
  Shield, 
  Clock, 
  Star, 
  Users, 
  Award, 
  CheckCircle, 
  Home, 
  Wrench, 
  Zap, 
  Sparkle,
  MapPin,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-blue-600">Fixwell</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Connecting homeowners with trusted professionals for all their home service needs. 
              We're revolutionizing how you maintain and improve your living space.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Fixwell was born from a simple observation: finding reliable home service professionals 
                shouldn't be a hassle. In today's busy world, homeowners deserve a seamless way to 
                connect with skilled professionals who can maintain and improve their living spaces.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                What started as a vision to simplify home services has grown into a trusted platform 
                that thousands of homeowners rely on daily. We've built a community where quality, 
                reliability, and customer satisfaction come first.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Today, Fixwell serves as the bridge between homeowners and professional service providers, 
                ensuring every project is completed with excellence and care.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Trusted by Thousands</h3>
                    <p className="text-blue-100">Happy customers across the region</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Verified Professionals</h3>
                    <p className="text-blue-100">Background-checked service providers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Professional Quality</h3>
                    <p className="text-blue-100">Expert service assured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission & Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to making home services accessible, reliable, and stress-free for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer First</h3>
              <p className="text-gray-600 leading-relaxed">
                Every decision we make is guided by what's best for our customers. 
                Your satisfaction and peace of mind are our top priorities.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality & Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                We maintain the highest standards of quality and safety. 
                All our professionals are verified and insured for your protection.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reliability</h3>
              <p className="text-gray-600 leading-relaxed">
                When you book with Fixwell, you can count on us. 
                We're committed to being on time, every time, with transparent communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From routine maintenance to specialized repairs, we offer comprehensive home services 
              to keep your space beautiful and functional.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cleaning</h3>
              <p className="text-gray-600">
                Deep cleaning, regular maintenance, and specialized cleaning services
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Maintenance</h3>
              <p className="text-gray-600">
                HVAC, plumbing, electrical, and general home maintenance
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-red-50">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Repair</h3>
              <p className="text-gray-600">
                Quick fixes, emergency repairs, and complex installations
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Sparkle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Organization</h3>
              <p className="text-gray-600">
                Decluttering, storage solutions, and space optimization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Fixwell?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another service platform. Here's what makes us different.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Professionals</h3>
                  <p className="text-gray-600">
                    Fixwell is your go-to platform for every trade on all home repairs and renovations. Once call, Zero hassles.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Quality Assurance</h3>
                  <p className="text-gray-600">
                    Our team of verified experts ensures exceptional results every time.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Convenient Scheduling</h3>
                  <p className="text-gray-600">
                    Book services at your convenience with flexible scheduling options.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Transparent Communication</h3>
                  <p className="text-gray-600">
                    Stay informed with real-time updates and clear communication throughout.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Star className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
                  <p className="text-gray-600">
                    Read authentic reviews from real customers to make informed decisions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Competitive Pricing</h3>
                  <p className="text-gray-600">
                    Get fair, transparent pricing with no hidden fees or surprises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions or need assistance? We're here to help you with all your home service needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">Speak with our customer service team</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">Send us a message anytime</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600">Find us in your local area</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 