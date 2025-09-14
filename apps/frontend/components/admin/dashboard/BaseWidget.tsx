"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DashboardWidget, WidgetData } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  RefreshCw, 
  Settings, 
  Maximize2, 
  Minimize2,
  X,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseWidgetProps {
  widget: DashboardWidget;
  data?: WidgetData;
  isLoading?: boolean;
  error?: string;
  isEditing?: boolean;
  isSelected?: boolean;
  onUpdate?: (widget: DashboardWidget) => void;
  onDelete?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  onConfigure?: (widget: DashboardWidget) => void;
  onResize?: (widgetId: string, size: { width: number; height: number }) => void;
  onMove?: (widgetId: string, position: { x: number; y: number }) => void;
  onSelect?: (widgetId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function BaseWidget({
  widget,
  data,
  isLoading = false,
  error,
  isEditing = false,
  isSelected = false,
  onUpdate,
  onDelete,
  onRefresh,
  onConfigure,
  onResize,
  onMove,
  onSelect,
  children,
  className
}: BaseWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (!widget.refreshInterval || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh(widget.id);
    }, widget.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [widget.refreshInterval, widget.id, onRefresh]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || e.target !== widgetRef.current) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos.current || !onMove) return;
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      onMove(widget.id, {
        x: widget.position.x + deltaX,
        y: widget.position.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartPos.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh(widget.id);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this widget?')) {
      onDelete(widget.id);
    }
  };

  const handleClick = () => {
    if (isEditing && onSelect) {
      onSelect(widget.id);
    }
  };

  const widgetStyle = {
    width: widget.size.width,
    height: widget.size.height,
    transform: `translate(${widget.position.x}px, ${widget.position.y}px)`,
    ...(widget.config.customization && {
      backgroundColor: widget.config.customization.backgroundColor,
      borderColor: widget.config.customization.borderColor,
      borderRadius: widget.config.customization.borderRadius,
      padding: widget.config.customization.padding,
    })
  };

  return (
    <Card
      ref={widgetRef}
      className={cn(
        "relative transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-blue-500",
        isDragging && "opacity-75 z-50",
        isExpanded && "fixed inset-4 z-40",
        error && "border-red-300",
        className
      )}
      style={isExpanded ? {} : widgetStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-sm text-gray-900 truncate">
            {widget.title}
          </h3>
          {isLoading && (
            <RefreshCw className="h-3 w-3 text-gray-400 animate-spin" />
          )}
          {error && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="h-6 w-6 p-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
              
              {showMenu && (
                <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      if (onConfigure) {
                        onConfigure(widget);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Configure Alerts</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                  >
                    <X className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-3 h-full overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Resize Handle (only in edit mode) */}
      {isEditing && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            
            const startSize = { ...widget.size };
            const startPos = { x: e.clientX, y: e.clientY };
            
            const handleMouseMove = (e: MouseEvent) => {
              if (!onResize) return;
              
              const deltaX = e.clientX - startPos.x;
              const deltaY = e.clientY - startPos.y;
              
              onResize(widget.id, {
                width: Math.max(200, startSize.width + deltaX),
                height: Math.max(150, startSize.height + deltaY)
              });
            };

            const handleMouseUp = () => {
              setIsResizing(false);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </Card>
  );
}