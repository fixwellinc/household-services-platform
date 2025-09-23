"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    UserCheck,
    Building2
} from 'lucide-react';
import type { SalesmanNavigationItem } from '../../../hooks/use-salesman-navigation';

interface SalesmanSidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
    navigationItems: SalesmanNavigationItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function SalesmanSidebar({
    isOpen,
    isCollapsed,
    onToggleCollapsed,
    navigationItems,
    activeTab,
    onTabChange
}: SalesmanSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:block transition-all duration-300`}>
                <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                        {!isCollapsed && (
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-lg font-semibold text-gray-900">Salesman</span>
                            </div>
                        )}

                        {/* Collapse/Expand button - only on desktop */}
                        <button
                            onClick={onToggleCollapsed}
                            className="hidden lg:flex p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.path || activeTab === item.id;
                            const IconComponent = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.path}
                                    onClick={() => onTabChange(item.id)}
                                    className={`
                                        group relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }
                                    `}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <IconComponent
                                        className={`
                                            ${isCollapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0
                                            ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                                        `}
                                    />

                                    {!isCollapsed && (
                                        <>
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {item.isNew && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    New
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && (
                                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                                            {item.label}
                                            {item.description && (
                                                <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="flex-shrink-0 px-3 py-4 border-t border-gray-200">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        FixWell Services
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        Salesman Portal
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}