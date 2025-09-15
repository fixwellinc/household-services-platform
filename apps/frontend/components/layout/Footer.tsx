'use client';

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocation } from '@/contexts/LocationContext'
import { 
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
  Heart,
  Gift
} from 'lucide-react'
import DynamicLocationPromptModal from '@/components/location/DynamicLocationPromptModal'

const Footer: React.FC = () => {
  const router = useRouter();
  const { userLocation, isInBC, isLoading: locationLoading } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleGetInTouch = () => {
    // If location is still loading, wait
    if (locationLoading) {
      return;
    }
    
    // If no location is set or not in BC, show location modal
    if (!userLocation || !isInBC) {
      setShowLocationModal(true);
      return;
    }
    
    // If location is valid, redirect to contact page
    router.push('/contact');
  };
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-md">
                <Image 
                  src="/fixwelltop.png" 
                  alt="Fixwell Logo" 
                  width={48} 
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Fixwell
              </span>
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
          
          {/* Members Discount */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Members Discount
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/members-discount" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                  View Discounts
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                  Become a Member
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
                <span>support@fixwell.ca</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>+1 (778) 888-2347</span>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={handleGetInTouch}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-300 text-center sm:text-left">
              <span>© 2024 Fixwell Services.</span>
              <div className="flex items-center gap-1">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-400" />
                <span>for your home.</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
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

      {/* Location Prompt Modal */}
      <DynamicLocationPromptModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
        }}
        onLocationSet={() => {
          // After location is set, redirect to contact page
          router.push('/contact');
          setShowLocationModal(false);
        }}
        planName="contact"
      />
    </footer>
  )
}

export default Footer 