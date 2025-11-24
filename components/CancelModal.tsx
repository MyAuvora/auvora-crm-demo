'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cancelMembership } from '@/lib/dataStore';

interface CancelModalProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelModal({ memberId, memberName, onClose, onSuccess }: CancelModalProps) {
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancel = () => {
    if (!effectiveDate) {
      setMessage({ type: 'error', text: 'Please select an effective date' });
      return;
    }

    const cancellationDate = new Date().toISOString().split('T')[0];
    const result = cancelMembership(memberId, cancellationDate, effectiveDate, reason);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold">Cancel Membership</h2>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">Cancel membership for <strong>{memberName}</strong></p>
          <p className="text-sm text-gray-600 mb-4">This action will mark the membership as cancelled.</p>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="e.g., Moving away, financial reasons, etc."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel Membership
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
