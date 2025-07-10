import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Fixwell',
  description: 'Terms and conditions for using Fixwell services',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-6">Last updated: December 15, 2024</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Fixwell's services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="mb-3">
                Fixwell provides fixwell services including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cleaning services</li>
                <li>Maintenance and repair services</li>
                <li>Organization services</li>
                <li>Shopping and errand services</li>
                <li>Subscription maintenance plans</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="mb-3">
                To access certain features of our service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintaining the confidentiality of your account information</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Service Bookings and Cancellations</h2>
              <p className="mb-3">
                When booking services through our platform:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>All bookings are subject to availability</li>
                <li>Cancellations must be made at least 24 hours in advance</li>
                <li>Late cancellations may incur charges</li>
                <li>We reserve the right to reschedule due to circumstances beyond our control</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payment Terms</h2>
              <p className="mb-3">
                Payment for services is due at the time of booking or as specified in your subscription plan:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>We accept major credit cards and digital payment methods</li>
                <li>Prices are subject to change with notice</li>
                <li>Subscription fees are billed in advance</li>
                <li>Refunds are processed according to our refund policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Service Quality and Satisfaction</h2>
              <p className="mb-3">
                We strive to provide high-quality services and customer satisfaction:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Our service providers are trained and background-checked</li>
                <li>We offer satisfaction guarantees for our services</li>
                <li>Issues should be reported within 24 hours of service completion</li>
                <li>We will work to resolve any concerns promptly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Prohibited Uses</h2>
              <p className="mb-3">You may not use our services to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Transmit harmful or malicious content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p>
                Fixwell shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including but not limited to loss of profits, data, or use, 
                incurred by you or any third party, whether in an action in contract or tort.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Fixwell, its officers, directors, employees, 
                and agents from any claims, damages, or expenses arising from your use of our services 
                or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p className="mb-3">
                We may terminate or suspend your account and access to our services at any time, 
                with or without cause, with or without notice. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your right to use the service will cease immediately</li>
                <li>You must cancel any active subscriptions</li>
                <li>We may delete your account and data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which Fixwell operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                any material changes by posting the new terms on our website and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
              <p>
                If you have any questions about these terms of service, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <p className="font-semibold">Fixwell Inc.</p>
                <p>Email: legal@fixwell.com</p>
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