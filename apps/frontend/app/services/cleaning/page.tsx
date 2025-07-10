import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cleaning Services - Fixwell',
  description: 'Professional cleaning services for your home or office',
};

export default function CleaningPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Cleaning Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Keep your home spotless with our comprehensive cleaning services. 
            From regular maintenance to deep cleaning, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Regular House Cleaning</h3>
            <p className="text-gray-600 mb-4">
              Weekly or bi-weekly cleaning to maintain a clean and healthy home environment.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dusting and vacuuming</li>
              <li>• Kitchen and bathroom cleaning</li>
              <li>• Floor mopping and sweeping</li>
              <li>• Trash removal</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Deep Cleaning</h3>
            <p className="text-gray-600 mb-4">
              Thorough cleaning for move-ins, move-outs, or seasonal deep cleaning.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Inside appliances</li>
              <li>• Window cleaning</li>
              <li>• Baseboards and corners</li>
              <li>• Cabinet and drawer cleaning</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2">Office Cleaning</h3>
            <p className="text-gray-600 mb-4">
              Professional cleaning services for commercial spaces and offices.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Daily or weekly cleaning</li>
              <li>• Sanitization services</li>
              <li>• Break room maintenance</li>
              <li>• Restroom cleaning</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact us today for a free quote and customized cleaning plan.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Free Quote
            </a>
            <a
              href="/services"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              View All Services
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 