import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - Fixwell',
  description: 'How we use cookies and similar technologies on our website',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
          <p className="text-gray-600 mb-6">Last updated: December 15, 2024</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                analyzing how you use our site, and personalizing content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Cookies</h2>
              <p className="mb-3">We use cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">These cookies are necessary for the website to function properly.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Authentication and security</li>
                    <li>• Shopping cart functionality</li>
                    <li>• Basic site navigation</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Performance Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">These cookies help us understand how visitors use our website.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Page load times</li>
                    <li>• User journey analysis</li>
                    <li>• Error tracking</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">These cookies remember your preferences and settings.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Language preferences</li>
                    <li>• Service preferences</li>
                    <li>• User interface customization</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                  <p className="text-sm text-gray-600 mb-2">These cookies are used to deliver relevant advertisements.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Targeted advertising</li>
                    <li>• Social media integration</li>
                    <li>• Campaign tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Cookies</h2>
              <p className="mb-3">
                We may also use third-party cookies from trusted partners for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Analytics services (Google Analytics)</li>
                <li>Payment processing (Stripe)</li>
                <li>Social media platforms</li>
                <li>Advertising networks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Managing Your Cookie Preferences</h2>
              <p className="mb-3">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
                <li><strong>Cookie Consent:</strong> Use our cookie consent banner to manage preferences</li>
                <li><strong>Opt-Out Links:</strong> Use opt-out links provided by third-party services</li>
                <li><strong>Contact Us:</strong> Reach out to us for assistance with cookie management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Browser-Specific Instructions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Chrome</h3>
                  <p className="text-sm text-gray-600">
                    Settings → Privacy and security → Cookies and other site data
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Firefox</h3>
                  <p className="text-sm text-gray-600">
                    Options → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Safari</h3>
                  <p className="text-sm text-gray-600">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Edge</h3>
                  <p className="text-sm text-gray-600">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Impact of Disabling Cookies</h2>
              <p className="mb-3">
                Please note that disabling certain cookies may affect the functionality of our website:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Some features may not work properly</li>
                <li>You may need to re-enter information</li>
                <li>Personalization features may be limited</li>
                <li>Analytics data may be incomplete</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Updates to This Policy</h2>
              <p>
                We may update this cookie policy from time to time to reflect changes in our practices 
                or for other operational, legal, or regulatory reasons. We will notify you of any 
                material changes by posting the updated policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or this cookie policy, 
                please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <p className="font-semibold">Fixwell Inc.</p>
                <p>Email: privacy@fixwell.com</p>
                <p>Phone: (555) 123-4567</p>
                <p>Address: 123 Service Street, City, State 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 