"use client";

import React, { useState } from 'react';
import { DashboardWidget, DashboardLayout, CustomizationConfig } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Palette, 
  Layout, 
  Save, 
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Move,
  Maximize2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCustomizationProps {
  layout: DashboardLayout;
  selectedWidget?: DashboardWidget | null;
  onLayoutUpdate: (layout: DashboardLayout) => void;
  onWidgetUpdate: (widget: DashboardWidget) => void;
  onClose: () => void;
  className?: string;
}

interface CustomizationTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CUSTOMIZATION_TABS: CustomizationTab[] = [
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'widgets', label: 'Widgets', icon: Settings }
];

const PRESET_THEMES = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      accentColor: '#3b82f6'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
      borderColor: '#374151',
      accentColor: '#60a5fa'
    }
  },
  {
    id: 'blue',
    name: 'Blue Theme',
    colors: {
      backgroundColor: '#eff6ff',
      textColor: '#1e40af',
      borderColor: '#3b82f6',
      accentColor: '#2563eb'
    }
  },
  {
    id: 'green',
    name: 'Green Theme',
    colors: {
      backgroundColor: '#f0fdf4',
      textColor: '#166534',
      borderColor: '#22c55e',
      accentColor: '#16a34a'
    }
  }
];

export function DashboardCustomization({
  layout,
  selectedWidget,
  onLayoutUpdate,
  onWidgetUpdate,
  onClose,
  className
}: DashboardCustomizationProps) {
  const [activeTab, setActiveTab] = useState<string>('layout');
  const [customColors, setCustomColors] = useState({
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    accentColor: '#3b82f6'
  });

  const handleLayoutSettingsUpdate = (settings: Partial<DashboardLayout>) => {
    const updatedLayout = {
      ...layout,
      ...settings,
      updatedAt: new Date()
    };
    onLayoutUpdate(updatedLayout);
  };

  const handleWidgetVisibilityToggle = (widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      ),
      updatedAt: new Date()
    };
    onLayoutUpdate(updatedLayout);
  };

  const handleWidgetDelete = (widgetId: string) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      const updatedLayout = {
        ...layout,
        widgets: layout.widgets.filter(widget => widget.id !== widgetId),
        updatedAt: new Date()
      };
      onLayoutUpdate(updatedLayout);
    }
  };

  const handleWidgetDuplicate = (widget: DashboardWidget) => {
    const duplicatedWidget: DashboardWidget = {
      ...widget,
      id: `${widget.id}-copy-${Date.now()}`,
      title: `${widget.title} (Copy)`,
      position: {
        x: widget.position.x + 20,
        y: widget.position.y + 20
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, duplicatedWidget],
      updatedAt: new Date()
    };
    onLayoutUpdate(updatedLayout);
  };

  const handleWidgetCustomizationUpdate = (customization: Partial<CustomizationConfig>) => {
    if (!selectedWidget) return;

    const updatedWidget: DashboardWidget = {
      ...selectedWidget,
      config: {
        ...selectedWidget.config,
        customization: {
          ...selectedWidget.config.customization,
          ...customization
        }
      },
      updatedAt: new Date()
    };

    onWidgetUpdate(updatedWidget);
  };

  const applyThemeToWidget = (theme: typeof PRESET_THEMES[0]) => {
    if (!selectedWidget) return;

    handleWidgetCustomizationUpdate({
      backgroundColor: theme.colors.backgroundColor,
      textColor: theme.colors.textColor,
      borderColor: theme.colors.borderColor
    });
  };

  const applyThemeToAllWidgets = (theme: typeof PRESET_THEMES[0]) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget => ({
        ...widget,
        config: {
          ...widget.config,
          customization: {
            ...widget.config.customization,
            backgroundColor: theme.colors.backgroundColor,
            textColor: theme.colors.textColor,
            borderColor: theme.colors.borderColor
          }
        },
        updatedAt: new Date()
      })),
      updatedAt: new Date()
    };
    onLayoutUpdate(updatedLayout);
  };

  const renderLayoutTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Grid Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Columns
            </label>
            <input
              type="number"
              min="6"
              max="24"
              value={layout.gridSize.columns}
              onChange={(e) => handleLayoutSettingsUpdate({
                gridSize: {
                  ...layout.gridSize,
                  columns: parseInt(e.target.value)
                }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rows
            </label>
            <input
              type="number"
              min="4"
              max="16"
              value={layout.gridSize.rows}
              onChange={(e) => handleLayoutSettingsUpdate({
                gridSize: {
                  ...layout.gridSize,
                  rows: parseInt(e.target.value)
                }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Dashboard Name</h3>
        <input
          type="text"
          value={layout.name}
          onChange={(e) => handleLayoutSettingsUpdate({ name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter dashboard name"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Auto-arrange widgets in a grid
              const columns = Math.ceil(Math.sqrt(layout.widgets.length));
              const widgetWidth = 300;
              const widgetHeight = 200;
              const padding = 20;

              const updatedLayout = {
                ...layout,
                widgets: layout.widgets.map((widget, index) => {
                  const row = Math.floor(index / columns);
                  const col = index % columns;
                  
                  return {
                    ...widget,
                    position: {
                      x: col * (widgetWidth + padding),
                      y: row * (widgetHeight + padding)
                    },
                    size: {
                      width: widgetWidth,
                      height: widgetHeight
                    }
                  };
                })
              };
              onLayoutUpdate(updatedLayout);
            }}
            className="w-full justify-start"
          >
            <Layout className="h-4 w-4 mr-2" />
            Auto-arrange Widgets
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset all widgets to default size
              const updatedLayout = {
                ...layout,
                widgets: layout.widgets.map(widget => ({
                  ...widget,
                  size: { width: 300, height: 200 }
                }))
              };
              onLayoutUpdate(updatedLayout);
            }}
            className="w-full justify-start"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Reset Widget Sizes
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Preset Themes</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_THEMES.map((theme) => (
            <div
              key={theme.id}
              className="p-3 border border-gray-200 rounded cursor-pointer hover:border-blue-300 transition-colors"
              style={{
                backgroundColor: theme.colors.backgroundColor,
                borderColor: theme.colors.borderColor
              }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: theme.colors.textColor }}>
                {theme.name}
              </div>
              <div className="flex space-x-1 mb-2">
                {Object.values(theme.colors).map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedWidget && applyThemeToWidget(theme)}
                  disabled={!selectedWidget}
                  className="text-xs h-6 px-2"
                >
                  Widget
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyThemeToAllWidgets(theme)}
                  className="text-xs h-6 px-2"
                >
                  All
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWidget && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Widget Customization: {selectedWidget.title}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={selectedWidget.config.customization?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    backgroundColor: e.target.value
                  })}
                  className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedWidget.config.customization?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    backgroundColor: e.target.value
                  })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={selectedWidget.config.customization?.textColor || '#1f2937'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    textColor: e.target.value
                  })}
                  className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedWidget.config.customization?.textColor || '#1f2937'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    textColor: e.target.value
                  })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Border Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={selectedWidget.config.customization?.borderColor || '#e5e7eb'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    borderColor: e.target.value
                  })}
                  className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedWidget.config.customization?.borderColor || '#e5e7eb'}
                  onChange={(e) => handleWidgetCustomizationUpdate({
                    borderColor: e.target.value
                  })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Border Radius
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={selectedWidget.config.customization?.borderRadius || 8}
                onChange={(e) => handleWidgetCustomizationUpdate({
                  borderRadius: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {selectedWidget.config.customization?.borderRadius || 8}px
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Padding
              </label>
              <input
                type="range"
                min="0"
                max="32"
                value={selectedWidget.config.customization?.padding || 12}
                onChange={(e) => handleWidgetCustomizationUpdate({
                  padding: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {selectedWidget.config.customization?.padding || 12}px
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderWidgetsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Widgets ({layout.widgets.length})
        </h3>
        <div className="text-xs text-gray-500">
          {layout.widgets.filter(w => w.isVisible).length} visible
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {layout.widgets.map((widget) => (
          <Card key={widget.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWidgetVisibilityToggle(widget.id)}
                  className="h-6 w-6 p-0"
                >
                  {widget.isVisible ? (
                    <Eye className="h-3 w-3 text-green-600" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-gray-400" />
                  )}
                </Button>
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {widget.title}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {widget.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {widget.size.width} × {widget.size.height}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWidgetDuplicate(widget)}
                  className="h-6 w-6 p-0"
                  title="Duplicate widget"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWidgetDelete(widget.id)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  title="Delete widget"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {widget.refreshInterval && (
              <div className="mt-2 text-xs text-gray-500">
                Auto-refresh: {widget.refreshInterval}s
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white border-l border-gray-200 w-80 flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Customize Dashboard</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {CUSTOMIZATION_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'layout' && renderLayoutTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'widgets' && renderWidgetsTab()}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset to default customization
              if (window.confirm('Reset all customizations to default?')) {
                const updatedLayout = {
                  ...layout,
                  widgets: layout.widgets.map(widget => ({
                    ...widget,
                    config: {
                      ...widget.config,
                      customization: undefined
                    }
                  }))
                };
                onLayoutUpdate(updatedLayout);
              }
            }}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}