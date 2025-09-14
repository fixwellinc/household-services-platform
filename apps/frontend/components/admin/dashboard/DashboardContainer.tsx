"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { DashboardLayout, DashboardWidget, WidgetTemplate } from '@/types/dashboard';
import { DashboardGrid } from './DashboardGrid';
import { WidgetLibrary } from './WidgetLibrary';
import { DashboardCustomization } from './DashboardCustomization';
import { AlertConfiguration } from './AlertConfiguration';
import { AlertNotificationSystem } from './AlertNotificationSystem';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { dashboardDataService } from '@/lib/dashboard-data-service';
import { Button } from '@/components/ui/button';
import { 
  Layout, 
  Save, 
  RotateCcw, 
  Settings,
  Download,
  Upload,
  Wifi,
  WifiOff,
  RefreshCw,
  Palette,
  Bell,
  AlertTriangle
} from 'lucide-react';

interface DashboardContainerProps {
  initialLayout?: DashboardLayout;
  onLayoutSave?: (layout: DashboardLayout) => void;
  onLayoutLoad?: () => Promise<DashboardLayout>;
  className?: string;
}

// Default layout for new dashboards
const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Dashboard',
  widgets: [
    {
      id: 'users-metric',
      type: 'metric',
      title: 'Total Users',
      size: { width: 250, height: 150 },
      position: { x: 20, y: 20 },
      config: {
        dataSource: 'users',
        parameters: { metric: 'count' },
        visualization: { colors: ['#3B82F6'] }
      },
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'revenue-metric',
      type: 'metric',
      title: 'Total Revenue',
      size: { width: 250, height: 150 },
      position: { x: 290, y: 20 },
      config: {
        dataSource: 'revenue',
        parameters: { metric: 'total', unit: 'currency' },
        visualization: { colors: ['#10B981'] }
      },
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'bookings-metric',
      type: 'metric',
      title: 'Active Bookings',
      size: { width: 250, height: 150 },
      position: { x: 560, y: 20 },
      config: {
        dataSource: 'bookings',
        parameters: { metric: 'active_count' },
        visualization: { colors: ['#F59E0B'] }
      },
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user-growth-chart',
      type: 'chart',
      title: 'User Growth Trend',
      size: { width: 400, height: 250 },
      position: { x: 20, y: 190 },
      config: {
        dataSource: 'users',
        parameters: { metric: 'growth', period: '30d' },
        visualization: { 
          chartType: 'line',
          colors: ['#3B82F6'],
          showGrid: true,
          showLegend: false,
          animation: true
        }
      },
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'system-alerts',
      type: 'alert',
      title: 'System Alerts',
      size: { width: 350, height: 250 },
      position: { x: 440, y: 190 },
      config: {
        dataSource: 'system_alerts',
        parameters: { severity: 'all', limit: 10 },
        visualization: {},
        alerts: []
      },
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  gridSize: { columns: 12, rows: 8 },
  isDefault: true,
  userId: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
};

export function DashboardContainer({
  initialLayout,
  onLayoutSave,
  onLayoutLoad,
  className
}: DashboardContainerProps) {
  const [layout, setLayout] = useState<DashboardLayout>(initialLayout || DEFAULT_LAYOUT);
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState(false);
  const [isNotificationSystemOpen, setIsNotificationSystemOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Real-time data management
  const {
    widgetData,
    isLoading,
    errors,
    lastUpdated,
    connectionStatus,
    refreshWidgetData,
    refreshAllWidgets,
    updateWidgetDataOptimistically
  } = useDashboardRealtime(layout.widgets);

  const handleLayoutUpdate = useCallback((updatedLayout: DashboardLayout) => {
    setLayout(updatedLayout);
    // Auto-save after a delay
    const timeoutId = setTimeout(() => {
      handleSaveLayout(updatedLayout);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleSaveLayout = async (layoutToSave?: DashboardLayout) => {
    if (!onLayoutSave) return;

    setIsSaving(true);
    try {
      const currentLayout = layoutToSave || layout;
      await onLayoutSave({
        ...currentLayout,
        updatedAt: new Date()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save layout:', error);
      // TODO: Show error notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadLayout = async () => {
    if (!onLayoutLoad) return;

    try {
      const loadedLayout = await onLayoutLoad();
      setLayout(loadedLayout);
    } catch (error) {
      console.error('Failed to load layout:', error);
      // TODO: Show error notification
    }
  };

  const handleResetLayout = () => {
    if (window.confirm('Are you sure you want to reset the dashboard to default layout? This will remove all custom widgets and arrangements.')) {
      setLayout(DEFAULT_LAYOUT);
    }
  };

  const handleWidgetAdd = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `${template.id}-${Date.now()}`,
      type: template.type,
      title: template.name,
      size: template.defaultSize,
      position: { x: 20, y: 20 }, // TODO: Find optimal position
      config: template.defaultConfig,
      permissions: ['admin'],
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget]
    };

    setLayout(updatedLayout);
  };

  const handleWidgetUpdate = (widget: DashboardWidget) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(w => 
        w.id === widget.id ? { ...widget, updatedAt: new Date() } : w
      )
    };
    setLayout(updatedLayout);
  };

  const handleWidgetDelete = (widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    };
    setLayout(updatedLayout);
  };

  const handleWidgetRefresh = (widgetId: string) => {
    refreshWidgetData(widgetId);
  };

  const handleWidgetConfigure = (widget: DashboardWidget) => {
    setSelectedWidget(widget);
    setIsAlertConfigOpen(true);
  };

  const handleOpenCustomization = () => {
    setIsCustomizationOpen(true);
  };

  const handleOpenNotifications = () => {
    setIsNotificationSystemOpen(true);
  };

  // Initial data fetch for widgets
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await dashboardDataService.batchFetchWidgetData(layout.widgets);
        // The real-time hook will handle the data updates
      } catch (error) {
        console.error('Failed to fetch initial widget data:', error);
      }
    };

    if (layout.widgets.length > 0) {
      fetchInitialData();
    }
  }, [layout.widgets]);

  const exportLayout = () => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importLayout = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedLayout = JSON.parse(e.target?.result as string);
            setLayout(importedLayout);
          } catch (error) {
            console.error('Failed to import layout:', error);
            alert('Invalid layout file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Layout className="h-5 w-5 text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-900">{layout.name}</h1>
          </div>
          
          {lastSaved && (
            <div className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {isSaving && (
            <div className="text-sm text-blue-600">Saving...</div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-1 text-sm">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAllWidgets}
            title="Refresh All Widgets"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={exportLayout}
            title="Export Layout"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={importLayout}
            title="Import Layout"
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          {onLayoutLoad && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadLayout}
              title="Load Saved Layout"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetLayout}
            title="Reset to Default"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNotifications}
            title="Alert Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenCustomization}
            title="Customize Dashboard"
          >
            <Palette className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveLayout()}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Dashboard Grid */}
        <div className="flex-1">
          <DashboardGrid
            layout={layout}
            widgetData={widgetData}
            isLoading={isLoading}
            errors={errors}
            onLayoutUpdate={handleLayoutUpdate}
            onWidgetAdd={() => setIsWidgetLibraryOpen(true)}
            onWidgetUpdate={handleWidgetUpdate}
            onWidgetDelete={handleWidgetDelete}
            onWidgetRefresh={handleWidgetRefresh}
            onWidgetConfigure={handleWidgetConfigure}
          />
        </div>

        {/* Customization Panel */}
        {isCustomizationOpen && (
          <DashboardCustomization
            layout={layout}
            selectedWidget={selectedWidget}
            onLayoutUpdate={handleLayoutUpdate}
            onWidgetUpdate={handleWidgetUpdate}
            onClose={() => {
              setIsCustomizationOpen(false);
              setSelectedWidget(null);
            }}
          />
        )}

        {/* Alert Configuration Panel */}
        {isAlertConfigOpen && selectedWidget && (
          <AlertConfiguration
            widget={selectedWidget}
            onUpdate={handleWidgetUpdate}
            onClose={() => {
              setIsAlertConfigOpen(false);
              setSelectedWidget(null);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {/* Widget Library Modal */}
      <WidgetLibrary
        isOpen={isWidgetLibraryOpen}
        onClose={() => setIsWidgetLibraryOpen(false)}
        onWidgetAdd={handleWidgetAdd}
      />

      {/* Notification System Modal */}
      {isNotificationSystemOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Alert Notification System</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsNotificationSystemOpen(false)}>
                ×
              </Button>
            </div>
            <div className="p-4">
              <AlertNotificationSystem />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}