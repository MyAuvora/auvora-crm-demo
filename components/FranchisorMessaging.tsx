'use client';

import React, { useState } from 'react';
import { Send, Mail, Building2, CheckCircle, Clock } from 'lucide-react';
import { getFranchiseLocations } from '@/lib/dataStore';

interface Message {
  id: string;
  subject: string;
  body: string;
  targetLocations: string[];
  sentDate: string;
  sentBy: string;
  status: 'sent' | 'scheduled';
}

export default function FranchisorMessaging() {
  const franchiseLocations = getFranchiseLocations();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      subject: 'Q4 Performance Review',
      body: 'Please submit your Q4 performance reports by end of month.',
      targetLocations: ['all'],
      sentDate: '2024-12-01',
      sentBy: 'Corporate HQ',
      status: 'sent'
    },
    {
      id: '2',
      subject: 'New Training Materials Available',
      body: 'Updated training materials for new coaches are now available in the portal.',
      targetLocations: ['athletic-club', 'lab-austin', 'lab-miami'],
      sentDate: '2024-11-28',
      sentBy: 'Corporate HQ',
      status: 'sent'
    }
  ]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    targetLocations: ['all'] as string[],
    scheduleDate: ''
  });

  const handleSendMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      subject: formData.subject,
      body: formData.body,
      targetLocations: formData.targetLocations,
      sentDate: formData.scheduleDate || new Date().toISOString().split('T')[0],
      sentBy: 'Corporate HQ',
      status: formData.scheduleDate ? 'scheduled' : 'sent'
    };
    setMessages([newMessage, ...messages]);
    setShowComposeModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      body: '',
      targetLocations: ['all'],
      scheduleDate: ''
    });
  };

  const getLocationDisplay = (targetLocations: string[]) => {
    if (targetLocations.includes('all')) return 'All Locations';
    const locationNames = targetLocations.map(id => {
      const loc = franchiseLocations.find(l => l.id === id);
      return loc ? loc.name : id;
    });
    return locationNames.join(', ');
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Location Messaging</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Send communications to all franchise locations</p>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="bg-auvora-teal text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-auvora-teal-dark flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <Mail size={18} className="sm:w-5 sm:h-5" />
          Compose Message
        </button>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Message History</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {messages.map((message) => (
            <div key={message.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                    {message.status === 'scheduled' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock size={12} />
                        Scheduled
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{message.body}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building2 size={16} />
                      <span>{getLocationDisplay(message.targetLocations)}</span>
                    </div>
                    <span>•</span>
                    <span>{message.sentDate}</span>
                    <span>•</span>
                    <span>By {message.sentBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Compose Message</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="Message subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  rows={8}
                  placeholder="Type your message here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.targetLocations.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetLocations: ['all'] });
                        } else {
                          setFormData({ ...formData, targetLocations: [] });
                        }
                      }}
                      className="rounded text-auvora-teal focus:ring-auvora-teal"
                    />
                    <span className="font-semibold">All Locations ({franchiseLocations.length})</span>
                  </label>
                  {!formData.targetLocations.includes('all') && franchiseLocations.map((location) => (
                    <label key={location.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.targetLocations.includes(location.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, targetLocations: [...formData.targetLocations, location.id] });
                          } else {
                            setFormData({ ...formData, targetLocations: formData.targetLocations.filter(id => id !== location.id) });
                          }
                        }}
                        className="rounded text-auvora-teal focus:ring-auvora-teal"
                      />
                      <span>{location.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Send (Optional)
                </label>
                <input
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowComposeModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!formData.subject || !formData.body || formData.targetLocations.length === 0}
                className="px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                {formData.scheduleDate ? 'Schedule Message' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
