import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Fixwell',
  description: 'Our privacy policy and data protection practices',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-6">Last updated: December 15, 2024</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                We collect information you provide directly to us, such as when you create an account, 
                book a service, or contact us for support.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, and phone number</li>
                <li>Service address and preferences</li>
                <li>Payment information</li>
                <li>Service history and feedback</li>
                <li>Communication records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and improve our services</li>
                <li>Process payments and send invoices</li>
                <li>Communicate with you about services</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Ensure safety and security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p className="mb-3">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
                <li>Lodge a complaint with supervisory authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to improve your experience on our website, 
                analyze usage patterns, and provide personalized content. You can control cookie 
                settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected 
                such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any 
                material changes by posting the new policy on our website and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our data practices, 
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