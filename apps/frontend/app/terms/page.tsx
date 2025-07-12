import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Household Services',
  description: 'Terms and conditions for using Household Services in the Lower Mainland',
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
                By accessing and using Household Services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Area</h2>
              <p className="mb-3">
                Our services are currently available only to residents of the Lower Mainland within 50km of Surrey, British Columbia, Canada. By using our services, you confirm that:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You are a resident of the Lower Mainland</li>
                <li>You have provided a valid BC postal code</li>
                <li>You understand that services are not available outside of the Lower Mainland</li>
                <li>You agree to comply with all applicable BC laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Description of Service</h2>
              <p className="mb-3">
                Household Services provides household services including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cleaning services</li>
                <li>Maintenance and repair services</li>
                <li>Organization services</li>
                <li>Shopping and errand services</li>
                <li>Subscription maintenance plans</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                All services are provided in accordance with British Columbia regulations and standards within the Lower Mainland service area.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
              <p className="mb-3">
                To access certain features of our service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintaining the confidentiality of your account information</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information, including your Lower Mainland address</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your location information remains current and accurate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Service Bookings and Cancellations</h2>
              <p className="mb-3">
                When booking services through our platform:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>All bookings are subject to availability in your Lower Mainland service area</li>
                <li>Cancellations must be made at least 24 hours in advance</li>
                <li>Late cancellations may incur charges</li>
                <li>We reserve the right to reschedule due to circumstances beyond our control</li>
                <li>Services may be limited based on your specific BC location</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Payment Terms</h2>
              <p className="mb-3">
                Payment for services is due at the time of booking or as specified in your subscription plan:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>We accept major credit cards and digital payment methods</li>
                <li>Prices are subject to change with notice</li>
                <li>Subscription fees are billed in advance</li>
                <li>Refunds are processed according to our refund policy</li>
                <li>All prices are in Canadian Dollars (CAD)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Service Quality and Satisfaction</h2>
              <p className="mb-3">
                We strive to provide high-quality services and customer satisfaction:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Our service providers are trained and background-checked according to BC standards</li>
                <li>We offer satisfaction guarantees for our services</li>
                <li>Issues should be reported within 24 hours of service completion</li>
                <li>We will work to resolve any concerns promptly</li>
                <li>All services comply with BC health and safety regulations within the Lower Mainland</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Prohibited Uses</h2>
              <p className="mb-3">You may not use our services to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violate any applicable BC laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Transmit harmful or malicious content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of our services</li>
                <li>Book services for locations outside of the Lower Mainland service area</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                Household Services shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including but not limited to loss of profits, data, or use, 
                incurred by you or any third party, whether in an action in contract or tort.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Household Services, its officers, directors, employees, 
                and agents from any claims, damages, or expenses arising from your use of our services 
                or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the 
                Province of British Columbia and the laws of Canada applicable therein, without regard to its conflict of law provisions.
                Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts of British Columbia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of 
                any material changes by posting the new terms on our website and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
              <p>
                If you have any questions about these terms of service, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <p className="font-semibold">Household Services Inc.</p>
                <p>Email: legal@householdservices.com</p>
                <p>Phone: (555) 123-4567</p>
                <p>Address: 123 Service Street, Vancouver, BC V6B 2Z9</p>
                <p className="text-sm text-gray-600 mt-2">
                  Serving Lower Mainland residents only (within 50km of Surrey)
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 