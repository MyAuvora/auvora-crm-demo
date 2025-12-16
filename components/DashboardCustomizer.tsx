'use client';

import { useState, useEffect } from 'react';
import { X, GripVertical, Eye, EyeOff, RotateCcw, Settings2 } from 'lucide-react';
import { 
  getAvailableWidgets, 
  loadDashboardLayout, 
  saveDashboardLayout, 
  resetDashboardLayout,
  UserDashboardLayout,
  DashboardWidget
} from '@/lib/dashboardConfig';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userId: string;
  onLayoutChange: (layout: UserDashboardLayout) => void;
}

export default function DashboardCustomizer({ 
  isOpen, 
  onClose, 
  userRole, 
  userId,
  onLayoutChange 
}: DashboardCustomizerProps) {
  const [layout, setLayout] = useState<UserDashboardLayout | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [availableWidgets, setAvailableWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    if (isOpen) {
      const loadedLayout = loadDashboardLayout(userId, userRole);
      setLayout(loadedLayout);
      setAvailableWidgets(getAvailableWidgets(userRole));
    }
  }, [isOpen, userId, userRole]);

  if (!isOpen || !layout) return null;

  const handleToggleWidget = (widgetId: string) => {
    const newLayout = { ...layout };
    if (newLayout.hiddenWidgets.includes(widgetId)) {
      newLayout.hiddenWidgets = newLayout.hiddenWidgets.filter(id => id !== widgetId);
      if (!newLayout.widgetOrder.includes(widgetId)) {
        newLayout.widgetOrder.push(widgetId);
      }
    } else {
      newLayout.hiddenWidgets.push(widgetId);
    }
    newLayout.updatedAt = new Date().toISOString();
    setLayout(newLayout);
    saveDashboardLayout(newLayout);
    onLayoutChange(newLayout);
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const newOrder = [...layout.widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetWidgetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedWidget);
      
      const newLayout = { 
        ...layout, 
        widgetOrder: newOrder,
        updatedAt: new Date().toISOString()
      };
      setLayout(newLayout);
    }
  };

  const handleDragEnd = () => {
    if (layout) {
      saveDashboardLayout(layout);
      onLayoutChange(layout);
    }
    setDraggedWidget(null);
  };

  const handleReset = () => {
    const newLayout = resetDashboardLayout(userId, userRole);
    setLayout(newLayout);
    onLayoutChange(newLayout);
  };

  const handleMoveUp = (widgetId: string) => {
    const index = layout.widgetOrder.indexOf(widgetId);
    if (index > 0) {
      const newOrder = [...layout.widgetOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      const newLayout = { ...layout, widgetOrder: newOrder, updatedAt: new Date().toISOString() };
      setLayout(newLayout);
      saveDashboardLayout(newLayout);
      onLayoutChange(newLayout);
    }
  };

  const handleMoveDown = (widgetId: string) => {
    const index = layout.widgetOrder.indexOf(widgetId);
    if (index < layout.widgetOrder.length - 1) {
      const newOrder = [...layout.widgetOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      const newLayout = { ...layout, widgetOrder: newOrder, updatedAt: new Date().toISOString() };
      setLayout(newLayout);
      saveDashboardLayout(newLayout);
      onLayoutChange(newLayout);
    }
  };

  const visibleWidgets = layout.widgetOrder.filter(id => !layout.hiddenWidgets.includes(id));
  const hiddenWidgetsList = availableWidgets.filter(w => layout.hiddenWidgets.includes(w.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-auvora-teal to-auvora-teal-dark">
          <div className="flex items-center gap-3">
            <Settings2 className="text-white" size={24} />
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Customize Dashboard</h3>
              <p className="text-sm text-teal-100">Drag to reorder, click to show/hide widgets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Active Widgets</h4>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-auvora-teal transition-colors"
              >
                <RotateCcw size={16} />
                Reset to Default
              </button>
            </div>
            <div className="space-y-2">
              {visibleWidgets.map((widgetId, index) => {
                const widget = availableWidgets.find(w => w.id === widgetId);
                if (!widget) return null;
                
                return (
                  <div
                    key={widgetId}
                    draggable
                    onDragStart={() => handleDragStart(widgetId)}
                    onDragOver={(e) => handleDragOver(e, widgetId)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors ${
                      draggedWidget === widgetId ? 'opacity-50 border-auvora-teal' : ''
                    }`}
                  >
                    <GripVertical className="text-gray-400 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{widget.name}</p>
                      <p className="text-sm text-gray-500 truncate">{widget.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(widgetId)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(widgetId)}
                        disabled={index === visibleWidgets.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleWidget(widgetId)}
                        className="p-1.5 text-gray-400 hover:text-auvora-teal transition-colors"
                        title="Hide widget"
                      >
                        <EyeOff size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hiddenWidgetsList.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Hidden Widgets</h4>
              <div className="space-y-2">
                {hiddenWidgetsList.map(widget => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-200 opacity-60"
                  >
                    <div className="w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 truncate">{widget.name}</p>
                      <p className="text-sm text-gray-500 truncate">{widget.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggleWidget(widget.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Show widget"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
