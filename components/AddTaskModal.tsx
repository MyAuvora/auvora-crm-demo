'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { addLeadTask } from '@/lib/dataStore';

interface AddTaskModalProps {
  leadId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTaskModal({ leadId, onClose, onSuccess }: AddTaskModalProps) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdd = () => {
    if (!description.trim() || !dueDate) {
      setMessage({ type: 'error', text: 'Please enter description and due date' });
      return;
    }

    addLeadTask(leadId, description, dueDate);
    setMessage({ type: 'success', text: 'Task added successfully' });
    
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold">Add Task</h2>
          <button onClick={onClose} className="hover:bg-purple-700 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="e.g., Follow up call, Send trial info"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
