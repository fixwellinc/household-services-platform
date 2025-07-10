import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers - Fixwell',
  description: 'Join our team and help us provide exceptional household services',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Be part of a team that's revolutionizing household services. 
            We're looking for passionate professionals who share our commitment to excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Competitive pay and benefits
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Flexible scheduling options
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Professional development opportunities
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Supportive team environment
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Latest tools and technology
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Growth and advancement opportunities
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Openings</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900">Service Technicians</h3>
                <p className="text-sm text-gray-600">Full-time and part-time positions available</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">Customer Service Representatives</h3>
                <p className="text-sm text-gray-600">Help us deliver exceptional customer experiences</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900">Operations Coordinators</h3>
                <p className="text-sm text-gray-600">Manage and optimize our service operations</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-900">Marketing Specialists</h3>
                <p className="text-sm text-gray-600">Help grow our brand and reach more customers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Apply?
          </h2>
          <p className="text-gray-600 mb-6">
            Send us your resume and cover letter, or fill out our application form.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </a>
            <a
              href="mailto:careers@fixwell.com"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Send Resume
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Diverse Team</h3>
            <p className="text-gray-600">
              We value diversity and create an inclusive environment where everyone can thrive.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Purpose-Driven</h3>
            <p className="text-gray-600">
              Make a real difference in people's lives by helping them maintain their homes.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Growth Opportunities</h3>
            <p className="text-gray-600">
              Advance your career with ongoing training and development programs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 