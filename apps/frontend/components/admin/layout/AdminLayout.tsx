"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { useAdminNavigation } from '../../../hooks/use-admin-navigation';
import { useCurrentUser } from '../../../hooks/use-api';
import { PermissionProvider } from '../../../hooks/use-permissions';
import { KeyboardNavigationProvider } from '../../../contexts/KeyboardNavigationContext';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { activeTab, navigationItems, setActiveTab } = useAdminNavigation();
    const { data: userData, isLoading } = useCurrentUser();

    // Load sidebar collapsed state
    useEffect(() => {
        const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed');
        if (savedCollapsed) {
            setSidebarCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    // Sync active tab with current route
    useEffect(() => {
        const currentItem = navigationItems.find(item => item.path === pathname);
        if (currentItem && currentItem.id !== activeTab) {
            setActiveTab(currentItem.id);
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
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!userData?.user || userData.user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <PermissionProvider userId={userData.user?.id}>
            <KeyboardNavigationProvider>
                <div className="min-h-screen bg-gray-50">
                    {/* Mobile sidebar overlay */}
                    <AdminSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        navigationItems={navigationItems}
                        activeTab={activeTab}
                    />

                    {/* Main content */}
                    <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
                        <AdminHeader
                            onMenuClick={() => setSidebarOpen(true)}
                            user={userData.user}
                        />

                        <main className="p-6">
                            <div className="max-w-7xl mx-auto">
                                <AdminBreadcrumb
                                    activeTab={activeTab}
                                    navigationItems={navigationItems}
                                />

                                <div className="bg-white rounded-lg shadow">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </KeyboardNavigationProvider>
        </PermissionProvider>
    );
}