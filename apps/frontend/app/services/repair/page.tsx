import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repair Services - Fixwell',
  description: 'Professional repair services for your home and appliances',
};

export default function RepairPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Repair Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fast, reliable repairs for all your home systems and appliances. 
            Our skilled technicians get the job done right the first time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold mb-2">Electrical Repairs</h3>
            <p className="text-gray-600 mb-4">
              Licensed electricians for all your electrical repair needs.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Outlet and switch repairs</li>
              <li>• Circuit breaker issues</li>
              <li>• Lighting installation</li>
              <li>• Electrical panel upgrades</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🚿</div>
            <h3 className="text-xl font-semibold mb-2">Plumbing Repairs</h3>
            <p className="text-gray-600 mb-4">
              Expert plumbing repairs and installations for your home.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Leaky faucets and pipes</li>
              <li>• Toilet repairs</li>
              <li>• Water heater issues</li>
              <li>• Drain cleaning</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">❄️</div>
            <h3 className="text-xl font-semibold mb-2">HVAC Repairs</h3>
            <p className="text-gray-600 mb-4">
              Heating, ventilation, and air conditioning repair services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• AC unit repairs</li>
              <li>• Furnace maintenance</li>
              <li>• Thermostat installation</li>
              <li>• Ductwork repairs</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Appliance Repairs</h3>
            <p className="text-gray-600 mb-4">
              Repair services for all major fixwell appliances.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Refrigerator repairs</li>
              <li>• Washer and dryer fixes</li>
              <li>• Dishwasher repairs</li>
              <li>• Oven and stove issues</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Security System Repairs</h3>
            <p className="text-gray-600 mb-4">
              Keep your home secure with our security system repair services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Alarm system repairs</li>
              <li>• Camera system fixes</li>
              <li>• Smart lock installation</li>
              <li>• Security panel upgrades</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold mb-2">General Repairs</h3>
            <p className="text-gray-600 mb-4">
              Handyman services for all your general repair needs.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drywall repairs</li>
              <li>• Door and window fixes</li>
              <li>• Cabinet repairs</li>
              <li>• Furniture assembly</li>
            </ul>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Emergency Repairs?
          </h2>
          <p className="text-gray-600 mb-6">
            We offer 24/7 emergency repair services for urgent issues.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Emergency Service
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