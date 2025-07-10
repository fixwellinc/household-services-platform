import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance Services - Fixwell',
  description: 'Professional home maintenance and repair services',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Home Maintenance Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Keep your home in top condition with our comprehensive maintenance services. 
            From preventive care to emergency repairs, we're your trusted maintenance partner.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Preventive Maintenance</h3>
            <p className="text-gray-600 mb-4">
              Regular inspections and maintenance to prevent costly repairs down the road.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• HVAC system checks</li>
              <li>• Plumbing inspections</li>
              <li>• Electrical safety checks</li>
              <li>• Roof and gutter maintenance</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🚨</div>
            <h3 className="text-xl font-semibold mb-2">Emergency Repairs</h3>
            <p className="text-gray-600 mb-4">
              24/7 emergency repair services for urgent home maintenance issues.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Plumbing emergencies</li>
              <li>• Electrical issues</li>
              <li>• HVAC breakdowns</li>
              <li>• Security system repairs</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Seasonal Maintenance</h3>
            <p className="text-gray-600 mb-4">
              Prepare your home for each season with our specialized maintenance services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Spring cleaning and prep</li>
              <li>• Summer AC maintenance</li>
              <li>• Fall weatherization</li>
              <li>• Winter preparation</li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Subscribe to Our Maintenance Plan
          </h2>
          <p className="text-gray-600 mb-6">
            Get priority service, discounted rates, and peace of mind with our maintenance subscription.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Learn More
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