"use client";

import React, { useState } from 'react';
import { Settings, Star, Clock, Trash2, RotateCcw, Download, Keyboard } from 'lucide-react';
import { useAdminNavigation } from '@/hooks/use-admin-navigation';
import { useKeyboardNavigation } from '@/contexts/KeyboardNavigationContext';

interface NavigationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationPreferences({ isOpen, onClose }: NavigationPreferencesProps) {
  const {
    preferences,
    updatePreferences,
    getFavoriteItems,
    getRecentItems,
    getNavigationStats,
    clearFavorites,
    clearRecentItems,
    reorderFavorites
  } = useAdminNavigation();

  const { getShortcuts } = useKeyboardNavigation();
  const [activeTab, setActiveTab] = useState<'general' | 'favorites' | 'shortcuts' | 'analytics'>('general');

  const favoriteItems = getFavoriteItems();
  const recentItems = getRecentItems();
  const stats = getNavigationStats();
  const shortcuts = getShortcuts();

  if (!isOpen) return null;

  const exportNavigationData = () => {
    const data = {
      preferences,
      favorites: favoriteItems.map(item => ({ id: item.id, name: item.name })),
      recent: recentItems.map(item => ({ id: item.id, name: item.name })),
      stats,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-navigation-preferences-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAllPreferences = () => {
    if (confirm('Are you sure you want to reset all navigation preferences? This action cannot be undone.')) {
      updatePreferences({
        theme: 'light',
        sidebarCollapsed: false,
        defaultFilters: {},
        notificationSettings: {
          email: true,
          push: true,
          sms: false,
          desktop: true,
          frequency: 'immediate'
        }
      });
      clearFavorites();
      clearRecentItems();
      localStorage.removeItem('admin_navigation_analytics');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Navigation Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <nav className="p-4 space-y-2">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'favorites', label: 'Favorites', icon: Star },
                { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
                { id: 'analytics', label: 'Usage Analytics', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  
                  {/* Theme */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>

                  {/* Sidebar Collapsed */}
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.sidebarCollapsed}
                        onChange={(e) => updatePreferences({ sidebarCollapsed: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Start with sidebar collapsed</span>
                    </label>
                  </div>

                  {/* Notification Settings */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notification Preferences</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'email', label: 'Email notifications' },
                        { key: 'push', label: 'Push notifications' },
                        { key: 'desktop', label: 'Desktop notifications' },
                        { key: 'sms', label: 'SMS notifications' }
                      ].map((setting) => (
                        <label key={setting.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={Boolean(preferences.notificationSettings?.[setting.key as keyof typeof preferences.notificationSettings])}
                            onChange={(e) => updatePreferences({
                              notificationSettings: {
                                ...preferences.notificationSettings!,
                                [setting.key]: e.target.checked
                              }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{setting.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                      <select
                        value={preferences.notificationSettings?.frequency || 'immediate'}
                        onChange={(e) => updatePreferences({
                          notificationSettings: {
                            ...preferences.notificationSettings!,
                            frequency: e.target.value as any
                          }
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly digest</option>
                        <option value="daily">Daily digest</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t">
                  <div className="flex space-x-3">
                    <button
                      onClick={exportNavigationData}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Settings
                    </button>
                    <button
                      onClick={resetAllPreferences}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Favorite Items</h3>
                  <button
                    onClick={clearFavorites}
                    disabled={favoriteItems.length === 0}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </button>
                </div>

                {favoriteItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No favorite items yet</p>
                    <p className="text-sm">Click the star icon next to navigation items to add them to favorites</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favoriteItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => reorderFavorites(index, Math.max(0, index - 1))}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => reorderFavorites(index, Math.min(favoriteItems.length - 1, index + 1))}
                            disabled={index === favoriteItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Keyboard Shortcuts</h3>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalNavigations}</div>
                    <div className="text-sm text-blue-800">Total Navigations (7 days)</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.favoriteCount}</div>
                    <div className="text-sm text-yellow-800">Favorite Items</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.recentCount}</div>
                    <div className="text-sm text-green-800">Recent Items</div>
                  </div>
                </div>

                {stats.mostUsed.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Most Used Items</h4>
                    <div className="space-y-2">
                      {stats.mostUsed.map((item, index) => {
                        const IconComponent = item.item!.icon;
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-3">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                              <span className="font-medium text-gray-900">{item.item!.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{String(item.count)} visits</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}