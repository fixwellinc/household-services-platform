import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organization Services - Fixwell',
  description: 'Professional home organization and decluttering services',
};

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Home Organization Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your space with our professional organization services. 
            From decluttering to custom storage solutions, we'll help you create a more functional home.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🧹</div>
            <h3 className="text-xl font-semibold mb-2">Decluttering Services</h3>
            <p className="text-gray-600 mb-4">
              Professional decluttering to help you let go of unnecessary items and create space.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Room-by-room decluttering</li>
              <li>• Sentimental item sorting</li>
              <li>• Donation coordination</li>
              <li>• Junk removal</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Storage Solutions</h3>
            <p className="text-gray-600 mb-4">
              Custom storage solutions to maximize your space and keep everything organized.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Closet organization systems</li>
              <li>• Garage storage solutions</li>
              <li>• Kitchen cabinet organization</li>
              <li>• Home office setup</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Room Organization</h3>
            <p className="text-gray-600 mb-4">
              Complete room organization services for every area of your home.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Kitchen organization</li>
              <li>• Bathroom storage</li>
              <li>• Living room arrangement</li>
              <li>• Bedroom organization</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Digital Organization</h3>
            <p className="text-gray-600 mb-4">
              Organize your digital life with our technology organization services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Computer file organization</li>
              <li>• Digital photo organization</li>
              <li>• Email management</li>
              <li>• Smart home setup</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Habit Formation</h3>
            <p className="text-gray-600 mb-4">
              Build lasting organizational habits to maintain your organized space.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Daily routines setup</li>
              <li>• Maintenance schedules</li>
              <li>• Family organization systems</li>
              <li>• Follow-up support</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Move Organization</h3>
            <p className="text-gray-600 mb-4">
              Specialized organization services for moving and relocating.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pre-move decluttering</li>
              <li>• Packing organization</li>
              <li>• Unpacking services</li>
              <li>• New home setup</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Space?
          </h2>
          <p className="text-gray-600 mb-6">
            Get a free consultation and personalized organization plan for your home.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Free Consultation
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