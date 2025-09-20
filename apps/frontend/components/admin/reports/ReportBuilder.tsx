/**
 * Report Builder Component
 * Interactive report creation and customization
 */

import React from 'react';

const ReportBuilder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Builder</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Data Sources</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Users</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Subscriptions</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Payments</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Audit Logs</span>
            </label>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-3 mt-6">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Report Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 min-h-64 bg-gray-50">
            <div className="text-center text-gray-500 mt-20">
              <p>Select data sources and filters to preview your report</p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Save Template
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              Generate Report
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Report builder component - implementation in progress
        </p>
      </div>
    </div>
  );
};

export default ReportBuilder;