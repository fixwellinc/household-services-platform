import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Media - Fixwell',
  description: 'Latest news, press releases, and media resources about Fixwell',
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Press & Media
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, press releases, and media resources about Fixwell. 
            We're transforming the household services industry.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest News</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Fixwell Expands to 10 New Cities
                </h3>
                <p className="text-sm text-gray-600 mb-2">December 15, 2024</p>
                <p className="text-gray-600">
                  We're excited to announce our expansion to 10 new cities, bringing our premium household services to more families across the country.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  New Subscription Service Launch
                </h3>
                <p className="text-sm text-gray-600 mb-2">November 28, 2024</p>
                <p className="text-gray-600">
                  Introducing our new subscription service that provides regular maintenance and cleaning at discounted rates for loyal customers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Partnership with Local Communities
                </h3>
                <p className="text-sm text-gray-600 mb-2">November 10, 2024</p>
                <p className="text-gray-600">
                  We're proud to announce partnerships with local community organizations to provide services to families in need.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Press Resources</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Company Overview</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Fixwell is a leading provider of household services, offering cleaning, maintenance, repair, and organization services to families across the country.
                </p>
                <a href="#" className="text-blue-600 text-sm hover:underline">Download PDF</a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Logo & Brand Assets</h3>
                <p className="text-sm text-gray-600 mb-3">
                  High-resolution logos and brand guidelines for media use.
                </p>
                <a href="#" className="text-blue-600 text-sm hover:underline">Download Assets</a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Executive Bios</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Professional biographies and photos of our leadership team.
                </p>
                <a href="#" className="text-blue-600 text-sm hover:underline">View Bios</a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fact Sheet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Key facts and statistics about Fixwell's services and impact.
                </p>
                <a href="#" className="text-blue-600 text-sm hover:underline">Download Fact Sheet</a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Media Inquiries
          </h2>
          <p className="text-gray-600 mb-6">
            For press inquiries, interviews, or additional information, please contact our media relations team.
          </p>
          <div className="space-x-4">
            <a
              href="mailto:press@fixwell.com"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Press Team
            </a>
            <a
              href="/contact"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              General Contact
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Growing Fast</h3>
            <p className="text-gray-600">
              Serving thousands of families across multiple cities with our premium household services.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Award-Winning</h3>
            <p className="text-gray-600">
              Recognized for excellence in customer service and innovation in the household services industry.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Community Focused</h3>
            <p className="text-gray-600">
              Committed to supporting local communities and providing opportunities for service professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 