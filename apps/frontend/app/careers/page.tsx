import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers - Fixwell',
  description: 'Join our team and help us provide exceptional household services',
};

export default function CareersPage() {
  return (
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Join Our Team
          </h1>
<p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Be part of a team that's revolutionizing household services. 
            We're looking for passionate professionals who share our commitment to excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
<ul className="space-y-3 text-gray-600 dark:text-gray-300">
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

<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Join Our Growing Team</h2>
            <div className="space-y-6">
<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We're always looking for talented professionals to join our team. While we may not have specific openings posted right now,
                we'd love to hear from you and keep your information on file for future opportunities.
              </p>

<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-gray-900 mb-2">We’d love to hear from you</h3>
<p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  We accept general applications year-round. If you believe you can help us deliver exceptional service,
                  send us your resume and a short note about how you’d like to contribute. We review every application
                  and will reach out when there’s a potential match.
                </p>
              </div>
            </div>
          </div>
        </div>

<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8 text-center mb-12 border border-blue-200 dark:border-blue-700">
<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Submit Your General Application
          </h2>
<p className="text-gray-600 dark:text-gray-300 mb-6">
            Interested in joining our team? We'd love to learn about your skills and experience.
            Submit your information and we'll reach out when opportunities that match your background become available.
          </p>
          <div className="space-x-4">
            <a
              href="/contact"
className="inline-block bg-blue-600 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-300 transition-colors no-underline hover:no-underline visited:no-underline text-white hover:text-white focus:text-white visited:text-white"
            >
              Submit Application
            </a>
            <a
              href="mailto:careers@fixwell.com"
className="inline-block bg-white text-gray-900 border border-gray-200 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-colors no-underline hover:no-underline visited:no-underline dark:bg-gray-100 dark:text-gray-900 dark:border-gray-300 dark:hover:bg-gray-200"
            >
              Email Resume
            </a>
          </div>
<p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            💡 Tip: Include your area of interest and preferred work arrangement in your message
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Diverse Team</h3>
<p className="text-gray-600 dark:text-gray-300">
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