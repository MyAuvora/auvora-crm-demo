'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { addLeadNote } from '@/lib/dataStore';

interface AddNoteModalProps {
  leadId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddNoteModal({ leadId, onClose, onSuccess }: AddNoteModalProps) {
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdd = () => {
    if (!note.trim()) {
      setMessage({ type: 'error', text: 'Please enter a note' });
      return;
    }

    addLeadNote(leadId, note);
    setMessage({ type: 'success', text: 'Note added successfully' });
    
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-blue-600 text-white p-3 sm:p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold">Add Note</h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {message && (
            <div className={`mb-4 p-3 rounded text-sm sm:text-base ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
              placeholder="Enter your note here..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] text-sm sm:text-base"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
