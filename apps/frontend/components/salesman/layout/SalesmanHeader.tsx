"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Menu,
    Search,
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    UserCheck,
    BarChart3,
    HelpCircle
} from 'lucide-react';

interface SalesmanHeaderProps {
    onMenuClick: () => void;
    user: any;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
}

export function SalesmanHeader({
    onMenuClick,
    user,
    isCollapsed,
    onToggleCollapsed
}: SalesmanHeaderProps) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    return (
        <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left section */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            onClick={onMenuClick}
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Search bar */}
                        <div className="ml-4 flex-1 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search customers, campaigns..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-4">
                        {/* Quick stats */}
                        <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <UserCheck className="h-4 w-4" />
                                <span>Referrals: 12</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <BarChart3 className="h-4 w-4" />
                                <span>This Month: $2,450</span>
                            </div>
                        </div>

                        {/* Notifications */}
                        <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                        </button>

                        {/* Help */}
                        <Link
                            href="/salesman/help"
                            className="p-2 text-gray-400 hover:text-gray-500"
                            title="Help & Support"
                        >
                            <HelpCircle className="h-6 w-6" />
                        </Link>

                        {/* Profile dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user?.name || 'Salesman'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.email || 'salesman@fixwell.ca'}
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </button>

                            {/* Profile dropdown menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user?.name || 'Salesman'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {user?.email || 'salesman@fixwell.ca'}
                                            </p>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Salesman
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/salesman/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <UserCheck className="h-4 w-4 mr-3" />
                                            Your Profile
                                        </Link>

                                        <Link
                                            href="/salesman/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <Settings className="h-4 w-4 mr-3" />
                                            Settings
                                        </Link>

                                        <Link
                                            href="/salesman/help"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <HelpCircle className="h-4 w-4 mr-3" />
                                            Help & Support
                                        </Link>

                                        <div className="border-t border-gray-100">
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            >
                                                <LogOut className="h-4 w-4 mr-3" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}