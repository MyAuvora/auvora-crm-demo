'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface SendTextModalProps {
  recipientName: string;
  recipientPhone: string;
  onClose: () => void;
}

export default function SendTextModal({ recipientName, recipientPhone, onClose }: SendTextModalProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    alert(`Text message sent to ${recipientName} (${recipientPhone}):\n\n"${message}"\n\nNote: This is a demo - no actual message was sent.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Send Text Message</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600">To:</p>
            <p className="text-gray-900 font-medium">{recipientName}</p>
            <p className="text-sm text-gray-600">{recipientPhone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
            <p className="text-sm text-gray-600 mt-2">
              {message.length} characters • Estimated {Math.ceil(message.length / 160)} SMS segment(s)
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
