"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function SalesmanBreadcrumb() {
    const pathname = usePathname();

    // Generate breadcrumb items based on the current path
    const generateBreadcrumbs = () => {
        const pathSegments = pathname.split('/').filter(segment => segment !== '');
        const breadcrumbs = [
            { label: 'Dashboard', href: '/salesman', icon: Home }
        ];

        // If we're not on the main dashboard, add more breadcrumbs
        if (pathSegments.length > 1) {
            for (let i = 1; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const href = '/' + pathSegments.slice(0, i + 1).join('/');

                // Convert segment to readable label
                const label = segment
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                breadcrumbs.push({ label, href });
            }
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    // Don't show breadcrumbs if we're on the main dashboard
    if (pathname === '/salesman') {
        return null;
    }

    return (
        <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    const IconComponent = breadcrumb.icon;

                    return (
                        <li key={breadcrumb.href} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                            )}

                            {isLast ? (
                                <span className="flex items-center text-sm font-medium text-gray-500">
                                    {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
                                    {breadcrumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={breadcrumb.href}
                                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                                >
                                    {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
                                    {breadcrumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}