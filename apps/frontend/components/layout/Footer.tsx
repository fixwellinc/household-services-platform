import React from 'react'
import Link from 'next/link'
import { 
  Home, 
  Wrench, 
  Info, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Heart
} from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Household</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Connect with verified professionals for all your household needs. 
              From cleaning to repairs, we&apos;ve got you covered with quality service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services/cleaning" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  House Cleaning
                </Link>
              </li>
              <li>
                <Link href="/services/maintenance" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Maintenance
                </Link>
              </li>
              <li>
                <Link href="/services/repair" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Repairs
                </Link>
              </li>
              <li>
                <Link href="/services/organization" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Organization
                </Link>
              </li>
              <li>
                <Link href="/services/shopping" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Shopping Assistance
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5" />
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                  Press
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>hello@household.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>123 Service St, City, State 12345</span>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/contact">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105">
                  Get in Touch
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-2 text-gray-300">
              <span>© 2024 Household Services. Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>for your home.</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 