'use client';

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/shared'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import { useRouter } from 'next/navigation'
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Wrench, 
  Info, 
  MessageCircle,
  ChevronDown,
  Settings,
  LayoutDashboard,
  DollarSign
} from 'lucide-react'


const Header: React.FC = () => {
  const { user, isLoading, logout, isHydrated } = useAuth();
  const { userLocation, isInBC, isLoading: locationLoading } = useLocation();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };



  const toggleMobileMenu = () => {
    console.log('Mobile menu toggle clicked, current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close user menu when mobile menu opens
    if (isUserMenuOpen) {
      setIsUserMenuOpen(false);
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    // Close mobile menu when user menu opens
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Show loading skeleton during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/98 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-12 h-12 animate-pulse bg-gray-200 rounded-lg shadow-md mr-3"></div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                Fixwell
              </span>
            </div>

            {/* Loading skeleton for user actions */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full md:hidden"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/98 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <Image 
                  src="/fixwelltop.png" 
                  alt="Fixwell Logo" 
                  width={48} 
                  height={48}
                  className="rounded-lg"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                Fixwell
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link 
              href="/services" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <Wrench className="h-4 w-4" />
              Services
            </Link>
            <Link 
              href="/pricing" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <DollarSign className="h-4 w-4" />
              Plans
            </Link>

            <Link 
              href="/about" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link 
              href="/contact" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Dashboard for all users */}
                    <Link 
                      href={user.role === 'ADMIN' ? '/admin' : '/dashboard/customer'}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {user.role === 'ADMIN' ? (
                      <Link 
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    ) : (
                      <Link 
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    )}
                    <Link 
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
                         ) : (
               <div className="hidden sm:flex items-center space-x-3">
                 <Link href="/login">
                   <Button 
                     className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 font-medium transform hover:scale-105 border-2 border-green-400 hover:border-green-500 shadow-green-500/50 ring-2 ring-green-300 ring-opacity-50"
                   >
                     <span className="flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                       </svg>
                       Sign In
                     </span>
                   </Button>
                 </Link>
                 <Link href="/register">
                   <Button 
                     className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 font-medium transform hover:scale-105"
                   >
                     Create Account
                   </Button>
                 </Link>
               </div>
             )}

            {/* Mobile Menu Button - Improved touch target */}
            <button
              onClick={toggleMobileMenu}
              className="mobile-menu-button md:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Improved positioning and z-index */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-container md:hidden border-t border-gray-200 py-4 bg-white relative z-50 shadow-lg">
            <div className="px-4 mb-2">
              <span className="text-sm text-gray-500 font-medium">Navigation Menu</span>
            </div>
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                Home
              </Link>
              <Link 
                href="/services" 
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Wrench className="h-5 w-5" />
                Services
              </Link>
              <Link 
                href="/pricing" 
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <DollarSign className="h-5 w-5" />
                Plans
              </Link>

              <Link 
                href="/about" 
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info className="h-5 w-5" />
                About
              </Link>
              <Link 
                href="/contact" 
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="h-5 w-5" />
                Contact
              </Link>
              
              {/* User-specific mobile menu items */}
              {user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link 
                    href={user.role === 'ADMIN' ? '/admin' : '/dashboard/customer'}
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    {user.role === 'ADMIN' ? 'Admin Panel' : 'Profile'}
                  </Link>
                  <Link 
                    href="/settings"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left font-medium rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    {isLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              )}
              
              {!user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 border-2 border-green-400 hover:border-green-500 ring-2 ring-green-300 ring-opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                      </span>
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                    >
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu - Improved z-index */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      
    </header>
  )
}

export default Header 