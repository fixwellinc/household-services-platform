"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SalesmanSidebar } from './SalesmanSidebar';
import { SalesmanHeader } from './SalesmanHeader';
import { SalesmanBreadcrumb } from './SalesmanBreadcrumb';
import { useSalesmanNavigation } from '../../../hooks/use-salesman-navigation';
import { useCurrentUser } from '../../../hooks/use-api';
import { KeyboardNavigationProvider } from '../../../contexts/KeyboardNavigationContext';

interface SalesmanLayoutProps {
    children: React.ReactNode;
}

export function SalesmanLayout({ children }: SalesmanLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { activeTab, navigationItems, setActiveTab } = useSalesmanNavigation();
    const { data: userData, isLoading } = useCurrentUser();

    // Load sidebar collapsed state
    useEffect(() => {
        const savedCollapsed = localStorage.getItem('salesman_sidebar_collapsed');
        if (savedCollapsed) {
            setSidebarCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    // Sync active tab with current route
    useEffect(() => {
        if (navigationItems && navigationItems.length > 0) {
            const currentItem = navigationItems.find(item => item.path === pathname);
            if (currentItem && currentItem.id !== activeTab) {
                setActiveTab(currentItem.id);
            }
        }
    }, [pathname, navigationItems, activeTab, setActiveTab]);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-600">Loading salesman dashboard...</p>
                </div>
            </div>
        );
    }

    // Check if user has SALESMAN role
    if (userData?.user?.role !== 'SALESMAN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">You need salesman privileges to access this dashboard.</p>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const toggleSidebarCollapsed = () => {
        const newCollapsed = !sidebarCollapsed;
        setSidebarCollapsed(newCollapsed);
        localStorage.setItem('salesman_sidebar_collapsed', JSON.stringify(newCollapsed));
    };

    return (
        <KeyboardNavigationProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
                    </div>
                )}

                {/* Sidebar */}
                <SalesmanSidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapsed={toggleSidebarCollapsed}
                    navigationItems={navigationItems}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Main content */}
                <div className={`${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-300`}>
                    <SalesmanHeader
                        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                        user={userData?.user}
                        isCollapsed={sidebarCollapsed}
                        onToggleCollapsed={toggleSidebarCollapsed}
                    />

                    <main className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <SalesmanBreadcrumb />
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </KeyboardNavigationProvider>
    );
}