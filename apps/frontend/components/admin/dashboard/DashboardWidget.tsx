/**
 * Dashboard Widget Component
 * Reusable widget component for admin dashboard
 */

import React from 'react';

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div>{children}</div>
    </div>
  );
};

export default DashboardWidget;