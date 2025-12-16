'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllShiftTemplates, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate } from '@/lib/dataStore';
import { ShiftTemplate } from '@/lib/types';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function ShiftTemplatesManager() {
  const { location } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [, setRefreshTrigger] = useState(0);

  const allTemplates = getAllShiftTemplates();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this shift template?')) {
      deleteShiftTemplate(templateId);
      handleRefresh();
    }
  };

  const getTemplateColor = (type: string) => {
    switch (type) {
      case 'front-desk':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'meeting':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shift Templates</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Create reusable shift templates for quick scheduling</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowModal(true);
          }}
          className="px-3 sm:px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <Plus size={16} />
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {allTemplates.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No shift templates yet. Create one to get started!</p>
          </div>
        ) : (
          allTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded border ${getTemplateColor(template.type)}`}>
                    {template.type.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 text-gray-600 hover:text-auvora-teal"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1 text-gray-600 hover:text-auvora-teal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>Default duration: {template.defaultDuration} minutes</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingTemplate(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

function TemplateModal({ template, onClose, onSave }: { 
  template: ShiftTemplate | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'front-desk' as 'front-desk' | 'event' | 'meeting' | 'other',
    defaultDuration: template?.defaultDuration || 480,
    color: template?.color || '#3B82F6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (template) {
      updateShiftTemplate(template.id, formData);
    } else {
      createShiftTemplate(formData);
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
              placeholder="e.g., Morning Front Desk"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'front-desk' | 'event' | 'meeting' | 'other' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
            >
              <option value="front-desk">Front Desk</option>
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.defaultDuration}
              onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
              min="15"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark"
            >
              {template ? 'Update' : 'Create'} Template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
