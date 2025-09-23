'use client';

import { useState, useEffect } from 'react';
import {
    ChartBar,
    Users,
    UserCheck,
    DollarSign,
    Share2,
    Settings,
    Home,
    TrendingUp
} from 'lucide-react';

export interface SalesmanNavigationItem {
    id: string;
    label: string;
    path: string;
    icon: React.ComponentType<any>;
    description?: string;
    badge?: string | number;
    isNew?: boolean;
}

export function useSalesmanNavigation() {
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    const navigationItems: SalesmanNavigationItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/salesman',
            icon: Home,
            description: 'Overview of your performance'
        },
        {
            id: 'customers',
            label: 'My Customers',
            path: '/salesman/customers',
            icon: Users,
            description: 'Customers you referred'
        },
        {
            id: 'referrals',
            label: 'Referral Links',
            path: '/salesman/referrals',
            icon: Share2,
            description: 'Generate and manage referral links'
        },
        {
            id: 'performance',
            label: 'Performance',
            path: '/salesman/performance',
            icon: TrendingUp,
            description: 'Detailed performance metrics'
        },
        {
            id: 'commission',
            label: 'Commission',
            path: '/salesman/commission',
            icon: DollarSign,
            description: 'View commission earnings'
        },
        {
            id: 'profile',
            label: 'Profile',
            path: '/salesman/profile',
            icon: UserCheck,
            description: 'Manage your salesman profile'
        }
    ];

    // Set initial active tab based on current path
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const currentItem = navigationItems.find(item => item.path === currentPath);
            if (currentItem) {
                setActiveTab(currentItem.id);
            }
        }
    }, []);

    return {
        activeTab,
        setActiveTab,
        navigationItems,
    };
}