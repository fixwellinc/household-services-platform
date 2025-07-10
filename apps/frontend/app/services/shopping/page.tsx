import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Services - Fixwell',
  description: 'Professional shopping and errand services for busy households',
};

export default function ShoppingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shopping & Errand Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Save time and energy with our professional shopping and errand services. 
            Let us handle your shopping while you focus on what matters most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Grocery Shopping</h3>
            <p className="text-gray-600 mb-4">
              Fresh groceries delivered to your door with careful attention to quality and preferences.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Weekly grocery shopping</li>
              <li>• Fresh produce selection</li>
              <li>• Dietary restriction awareness</li>
              <li>• Delivery and unpacking</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold mb-2">Retail Shopping</h3>
            <p className="text-gray-600 mb-4">
              Personal shopping assistance for clothing, gifts, and household items.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Clothing and accessories</li>
              <li>• Gift shopping</li>
              <li>• Home decor items</li>
              <li>• Electronics and gadgets</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">💊</div>
            <h3 className="text-xl font-semibold mb-2">Pharmacy Pickup</h3>
            <p className="text-gray-600 mb-4">
              Convenient prescription pickup and delivery services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Prescription pickup</li>
              <li>• Over-the-counter medications</li>
              <li>• Health and wellness products</li>
              <li>• Secure delivery</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Package Pickup</h3>
            <p className="text-gray-600 mb-4">
              Hassle-free package pickup and delivery from various locations.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Post office pickup</li>
              <li>• Package delivery</li>
              <li>• Return shipping</li>
              <li>• Signature required items</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Home Supplies</h3>
            <p className="text-gray-600 mb-4">
              Essential home supplies and maintenance items delivered to your door.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cleaning supplies</li>
              <li>• Hardware store items</li>
              <li>• Garden supplies</li>
              <li>• Pet supplies</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold mb-2">Special Occasions</h3>
            <p className="text-gray-600 mb-4">
              Special shopping services for holidays, birthdays, and celebrations.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Holiday shopping</li>
              <li>• Birthday gifts</li>
              <li>• Party supplies</li>
              <li>• Decoration shopping</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Save Time with Our Shopping Services
          </h2>
          <p className="text-gray-600 mb-6">
            Get started with a free consultation and personalized shopping plan.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
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