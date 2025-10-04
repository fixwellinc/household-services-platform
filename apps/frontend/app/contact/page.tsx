import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're here to help with all your household service needs. Reach out to us and we'll get back to you promptly.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Email Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Email Us</h3>
                  <p className="text-gray-600 dark:text-gray-300">For general inquiries and support</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Send us an email and we'll respond within 24 hours during business days.
              </p>
              <a 
                href="mailto:support@fixwell.ca?subject=Inquiry from Fixwell Website"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Mail className="h-4 w-4" />
                Email support@fixwell.ca
              </a>
            </div>

            {/* Phone Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Call Us</h3>
                  <p className="text-gray-600 dark:text-gray-300">For urgent matters and immediate assistance</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Call us directly for immediate support and urgent service requests.
              </p>
              <a 
                href="tel:+17788882347"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Phone className="h-4 w-4" />
                Call +1 (778) 888-2347
              </a>
            </div>
          </div>

          {/* Service Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Service Area</h3>
                <p className="text-gray-600 dark:text-gray-300">Lower Mainland, British Columbia</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We currently serve the Lower Mainland area within 50km of Surrey, including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Vancouver</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Burnaby</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Richmond</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Coquitlam</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• New Westminster</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Surrey</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Delta</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Langley</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Maple Ridge</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Pitt Meadows</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Port Coquitlam</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• Port Moody</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• White Rock</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• North Vancouver</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">• West Vancouver</div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Business Hours</h3>
                <p className="text-gray-600">When we're available to help</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Customer Support</h4>
                <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                <p className="text-gray-600">Sunday: Closed</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Emergency Services</h4>
<p className="text-gray-600">Available 24/7</p>
                <p className="text-gray-600">Standard response times apply for other plans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 