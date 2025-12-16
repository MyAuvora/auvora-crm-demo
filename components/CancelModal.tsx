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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-auvora-teal text-white p-3 sm:p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold">Cancel Membership</h2>
          <button onClick={onClose} className="hover:bg-auvora-teal-dark p-2 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-700 mb-4">Cancel membership for <strong>{memberName}</strong></p>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">This action will mark the membership as cancelled.</p>

          {message && (
            <div className={`mb-4 p-3 rounded text-sm sm:text-base ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold text-sm sm:text-base min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold text-sm sm:text-base"
                placeholder="e.g., Moving away, financial reasons, etc."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] text-sm sm:text-base"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark min-h-[44px] text-sm sm:text-base"
            >
              Cancel Membership
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
