"use client";

import React, { useState } from 'react';
import { SettingsOverview } from './SettingsOverview';
import { SystemSettings } from './SystemSettings';
import { SecuritySettings } from './SecuritySettings';
import { IntegrationSettings } from './IntegrationSettings';
import { AdminErrorBoundary } from '../ErrorBoundary';

type SettingsSection = 'overview' | 'general' | 'security' | 'email' | 'payments' | 'database' | 'monitoring' | 'api' | 'users';

export function EnhancedAdminSettings() {
  const [currentSection, setCurrentSection] = useState<SettingsSection>('overview');

  const handleSectionSelect = (sectionId: string) => {
    setCurrentSection(sectionId as SettingsSection);
  };

  const handleBackToOverview = () => {
    setCurrentSection('overview');
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <SettingsOverview 
            onSectionSelect={handleSectionSelect}
            currentSection={currentSection}
          />
        );
      
      case 'general':
        return (
          <SystemSettings onBack={handleBackToOverview} />
        );
      
      case 'security':
        return (
          <SecuritySettings onBack={handleBackToOverview} />
        );
      
      case 'api':
        return (
          <IntegrationSettings onBack={handleBackToOverview} />
        );
      
      // For sections that haven't been implemented yet, show a placeholder
      case 'email':
      case 'payments':
      case 'database':
      case 'monitoring':
      case 'users':
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Settings
              </h3>
              <p className="text-gray-600 mb-4">
                This section is coming soon. Use the legacy settings interface for now.
              </p>
              <button
                onClick={handleBackToOverview}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Back to Settings Overview
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <SettingsOverview 
            onSectionSelect={handleSectionSelect}
            currentSection={currentSection}
          />
        );
    }
  };

  return (
    <AdminErrorBoundary context="EnhancedAdminSettings">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {renderCurrentSection()}
        </div>
      </div>
    </AdminErrorBoundary>
  );
}