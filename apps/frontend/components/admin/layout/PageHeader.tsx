"use client";

import React from 'react';
import { ChevronRight, Home, TrendingUp, TrendingDown } from 'lucide-react';
import { BreadcrumbItem, StatItem } from './AdminPageLayout';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: StatItem[];
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  stats
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500 overflow-x-auto">
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </div>
          
          {/* Mobile: Show only last 2 breadcrumbs */}
          <div className="flex items-center space-x-2 sm:hidden">
            {breadcrumbs.length > 2 && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <span className="text-gray-400">...</span>
              </>
            )}
            {breadcrumbs.slice(-2).map((item, index, array) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <div className="flex items-center space-x-1 min-w-0">
                  {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                  {item.href ? (
                    <a 
                      href={item.href} 
                      className="hover:text-gray-700 transition-colors truncate"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className={`truncate ${index === array.length - 1 ? 'font-medium text-gray-900' : ''}`}>
                      {item.name}
                    </span>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Desktop: Show all breadcrumbs */}
          <div className="hidden sm:flex items-center space-x-2">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <div className="flex items-center space-x-1 min-w-0">
                  {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                  {item.href ? (
                    <a 
                      href={item.href} 
                      className="hover:text-gray-700 transition-colors truncate"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className={`truncate ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}>
                      {item.name}
                    </span>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {description && (
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center space-x-2 sm:space-x-3 sm:ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                  {stat.change && (
                    <div className={`flex items-center mt-1 text-xs sm:text-sm ${
                      stat.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change.type === 'increase' ? (
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate">{Math.abs(stat.change.value)}%</span>
                    </div>
                  )}
                </div>
                {stat.icon && (
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0 ml-2">
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}