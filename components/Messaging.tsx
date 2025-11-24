'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllClassPackClients, getAllLeads } from '@/lib/dataStore';
import { Send, MessageSquare, Clock, Search } from 'lucide-react';

interface Message {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'member' | 'lead';
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  category: 'welcome' | 'reminder' | 'promotion' | 'follow-up';
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'welcome-member',
    name: 'Welcome New Member',
    message: 'Welcome to The Lab Tampa! We\'re excited to have you join our fitness family. Your first class is scheduled for [DATE] at [TIME]. See you soon!',
    category: 'welcome'
  },
  {
    id: 'class-reminder',
    name: 'Class Reminder',
    message: 'Hi [NAME]! Just a friendly reminder about your class tomorrow at [TIME]. Can\'t wait to see you there!',
    category: 'reminder'
  },
  {
    id: 'missed-class',
    name: 'Missed Class Follow-up',
    message: 'Hey [NAME], we missed you at class today! Everything okay? Let us know if you need to reschedule.',
    category: 'follow-up'
  },
  {
    id: 'promotion',
    name: 'Special Promotion',
    message: 'Special offer for you! Get 20% off your next class pack purchase this week only. Reply YES to claim your discount!',
    category: 'promotion'
  },
  {
    id: 'trial-followup',
    name: 'Trial Class Follow-up',
    message: 'Thanks for trying out The Lab Tampa! How was your experience? We\'d love to have you join us as a member. Reply to learn about our membership options!',
    category: 'follow-up'
  }
];

export default function Messaging() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'members' | 'leads'>('all');
  const [messageHistory] = useState<Message[]>(() => {
    const now = Date.now();
    return [
      {
        id: 'msg-1',
        recipientId: 'member-1',
        recipientName: 'John Smith',
        recipientType: 'member',
        message: 'Welcome to The Lab Tampa! Your first class is tomorrow at 6:00 PM.',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: 'read'
      },
      {
        id: 'msg-2',
        recipientId: 'lead-1',
        recipientName: 'Sarah Johnson',
        recipientType: 'lead',
        message: 'Thanks for your interest! We have a special trial offer this week.',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        status: 'delivered'
      }
    ];
  });

  const locationMembers = getAllMembers().filter(m => m.location === location);
  const locationPackClients = getAllClassPackClients().filter(c => c.location === location);
  const locationLeads = getAllLeads().filter(l => l.location === location);

  const allRecipients = [
    ...locationMembers.map(m => ({ id: m.id, name: m.name, type: 'member' as const, phone: m.phone })),
    ...locationPackClients.map(c => ({ id: c.id, name: c.name, type: 'member' as const, phone: c.phone })),
    ...locationLeads.map(l => ({ id: l.id, name: l.name, type: 'lead' as const, phone: l.phone }))
  ];

  const filteredRecipients = allRecipients.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.phone.includes(searchQuery);
    const matchesType = recipientType === 'all' || 
                       (recipientType === 'members' && r.type === 'member') ||
                       (recipientType === 'leads' && r.type === 'lead');
    return matchesSearch && matchesType;
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || selectedRecipients.length === 0) {
      alert('Please select recipients and enter a message');
      return;
    }

    alert(`Message sent to ${selectedRecipients.length} recipient(s):\n\n"${messageText}"\n\nNote: This is a demo - no actual messages were sent.`);
    setMessageText('');
    setSelectedRecipients([]);
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setMessageText(template.message);
    setActiveTab('compose');
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(filteredRecipients.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedRecipients([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messaging</h1>
        <p className="text-gray-600 mt-1">Send text messages to members and leads</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${
                activeTab === 'compose'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send size={20} />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={20} />
              History
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={20} />
              Templates
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'compose' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Recipients</h3>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as 'all' | 'members' | 'leads')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="all">All</option>
                    <option value="members">Members Only</option>
                    <option value="leads">Leads Only</option>
                  </select>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Select All ({filteredRecipients.length})
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                  {selectedRecipients.length > 0 && (
                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                      {selectedRecipients.length} selected
                    </span>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="w-4 h-4 text-red-600 focus:ring-red-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-sm text-gray-600">{recipient.phone} • {recipient.type === 'member' ? 'Member' : 'Lead'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Message</h3>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {messageText.length} characters • Estimated {Math.ceil(messageText.length / 160)} SMS segment(s)
                </p>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || selectedRecipients.length === 0}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Send Message to {selectedRecipients.length} Recipient{selectedRecipients.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Message History</h3>
              {messageHistory.length > 0 ? (
                <div className="space-y-3">
                  {messageHistory.map((msg) => (
                    <div key={msg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{msg.recipientName}</p>
                          <p className="text-sm text-gray-600">
                            {msg.recipientType === 'member' ? 'Member' : 'Lead'} • {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          msg.status === 'read' ? 'bg-green-100 text-green-700' :
                          msg.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-gray-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No messages sent yet</p>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Message Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messageTemplates.map((template) => (
                  <div key={template.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{template.name}</h4>
                        <span className="text-xs text-gray-600 capitalize">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{template.message}</p>
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
