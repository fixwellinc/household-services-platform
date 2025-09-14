"use client";

import React, { useState, useRef, useCallback } from 'react';
import { DashboardWidget, DashboardLayout } from '@/types/dashboard';
import { MetricWidget } from './widgets/MetricWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { AlertWidget } from './widgets/AlertWidget';
import { Button } from '@/components/ui/button';
import { 
  Edit3, 
  Save, 
  X, 
  Plus,
  Grid,
  Maximize,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  layout: DashboardLayout;
  widgetData?: Record<string, any>;
  isLoading?: Record<string, boolean>;
  errors?: Record<string, string>;
  onLayoutUpdate?: (layout: DashboardLayout) => void;
  onWidgetAdd?: () => void;
  onWidgetUpdate?: (widget: DashboardWidget) => void;
  onWidgetDelete?: (widgetId: string) => void;
  onWidgetRefresh?: (widgetId: string) => void;
  onWidgetConfigure?: (widget: DashboardWidget) => void;
  className?: string;
}

export function DashboardGrid({
  layout,
  widgetData = {},
  isLoading = {},
  errors = {},
  onLayoutUpdate,
  onWidgetAdd,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetRefresh,
  onWidgetConfigure,
  className
}: DashboardGridProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const gridSize = 20; // Grid snap size in pixels

  const snapToGridPosition = useCallback((x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [snapToGrid]);

  const handleWidgetMove = useCallback((widgetId: string, position: { x: number; y: number }) => {
    if (!onLayoutUpdate) return;

    const snappedPosition = snapToGridPosition(position.x, position.y);
    
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, position: snappedPosition }
          : widget
      )
    };

    onLayoutUpdate(updatedLayout);
  }, [layout, onLayoutUpdate, snapToGridPosition]);

  const handleWidgetResize = useCallback((widgetId: string, size: { width: number; height: number }) => {
    if (!onLayoutUpdate) return;

    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size }
          : widget
      )
    };

    onLayoutUpdate(updatedLayout);
  }, [layout, onLayoutUpdate]);

  const handleWidgetSelect = useCallback((widgetId: string) => {
    setSelectedWidget(selectedWidget === widgetId ? null : widgetId);
  }, [selectedWidget]);

  const handleSaveLayout = () => {
    setIsEditing(false);
    setSelectedWidget(null);
    // Layout is automatically saved through onLayoutUpdate calls
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedWidget(null);
    // TODO: Revert to original layout if needed
  };

  const handleAutoLayout = () => {
    if (!onLayoutUpdate) return;

    // Simple auto-layout algorithm: arrange widgets in a grid
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
  };

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      widget,
      isEditing,
      isSelected: selectedWidget === widget.id,
      onUpdate: onWidgetUpdate,
      onDelete: onWidgetDelete,
      onRefresh: onWidgetRefresh,
      onConfigure: onWidgetConfigure,
      onResize: handleWidgetResize,
      onMove: handleWidgetMove,
      onSelect: handleWidgetSelect,
      data: widgetData[widget.id],
      isLoading: isLoading[widget.id] || false,
      error: errors[widget.id]
    };

    switch (widget.type) {
      case 'metric':
        return <MetricWidget key={widget.id} {...commonProps} />;
      case 'chart':
        return <ChartWidget key={widget.id} {...commonProps} />;
      case 'table':
        return <TableWidget key={widget.id} {...commonProps} />;
      case 'alert':
        return <AlertWidget key={widget.id} {...commonProps} />;
      default:
        return <MetricWidget key={widget.id} {...commonProps} />;
    }
  };

  const gridStyle = snapToGrid ? {
    backgroundImage: `
      linear-gradient(to right, #f0f0f0 1px, transparent 1px),
      linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`
  } : {};

  return (
    <div className={cn("relative h-full", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {!isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="bg-white shadow-sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Layout
            </Button>
            {onWidgetAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={onWidgetAdd}
                className="bg-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={cn(
                "bg-white shadow-sm",
                snapToGrid && "bg-blue-50 text-blue-600"
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoLayout}
              className="bg-white shadow-sm"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="bg-white shadow-sm"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveLayout}
              className="shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </>
        )}
      </div>

      {/* Grid Container */}
      <div
        ref={gridRef}
        className={cn(
          "relative w-full h-full overflow-auto p-4",
          isEditing && "bg-gray-50"
        )}
        style={isEditing ? gridStyle : {}}
      >
        {/* Grid Instructions (only in edit mode) */}
        {isEditing && layout.widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Grid className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Empty Dashboard</h3>
              <p className="text-sm">Add widgets to get started</p>
              {onWidgetAdd && (
                <Button
                  variant="outline"
                  onClick={onWidgetAdd}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Widget
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Widgets */}
        <div className="relative">
          {layout.widgets
            .filter(widget => widget.isVisible)
            .map(renderWidget)}
        </div>

        {/* Selection Indicator */}
        {isEditing && selectedWidget && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
            Widget Selected: {layout.widgets.find(w => w.id === selectedWidget)?.title}
          </div>
        )}
      </div>

      {/* Edit Mode Overlay */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium">
            Edit Mode: Drag widgets to move, resize from corners, click to select
          </div>
        </div>
      )}
    </div>
  );
}