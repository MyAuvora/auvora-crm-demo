'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllClassPackClients, getAllLeads, getAllDropInClients, logCommunication } from '@/lib/dataStore';
import { Send, MessageSquare, Clock, Search, Inbox, User } from 'lucide-react';

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
    message: 'Welcome to The Lab Tampa, {{name}}! We\'re excited to have you join our fitness family. Your {{membership}} membership is now active. See you soon!',
    category: 'welcome'
  },
  {
    id: 'class-reminder',
    name: 'Class Reminder',
    message: 'Hi {{name}}! Just a friendly reminder about your class tomorrow at {{time}}. Can\'t wait to see you there!',
    category: 'reminder'
  },
  {
    id: 'missed-class',
    name: 'Missed Class Follow-up',
    message: 'Hey {{name}}, we missed you at class today! Everything okay? Let us know if you need to reschedule.',
    category: 'follow-up'
  },
  {
    id: 'promotion',
    name: 'Special Promotion',
    message: 'Hi {{name}}! Special offer for you! Get 20% off your next class pack purchase this week only. Reply YES to claim your discount!',
    category: 'promotion'
  },
  {
    id: 'trial-followup',
    name: 'Trial Class Follow-up',
    message: 'Thanks for trying out The Lab Tampa, {{name}}! How was your experience? We\'d love to have you join us as a member. Reply to learn about our membership options!',
    category: 'follow-up'
  },
  {
    id: 'pack-refill',
    name: 'Class Pack Refill Reminder',
    message: 'Hi {{name}}! You have {{remaining}} classes left in your pack. Time to refill? Reply YES and we\'ll help you out!',
    category: 'reminder'
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    message: 'Hi {{name}}, your payment of ${{amount}} is due on {{date}}. Please update your payment method to avoid any interruption to your membership.',
    category: 'reminder'
  }
];

export default function Messaging() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates' | 'inbox'>('inbox');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'members' | 'leads'>('all');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
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
  const locationDropIns = getAllDropInClients().filter(d => d.location === location);
  const locationLeads = getAllLeads().filter(l => l.location === location);

  const allRecipients = [
    ...locationMembers.map(m => ({ id: m.id, name: m.name, type: 'member' as const, phone: m.phone, email: m.email })),
    ...locationPackClients.map(c => ({ id: c.id, name: c.name, type: 'member' as const, phone: c.phone, email: c.email })),
    ...locationDropIns.map(d => ({ id: d.id, name: d.name, type: 'member' as const, phone: d.phone, email: d.email })),
    ...locationLeads.map(l => ({ id: l.id, name: l.name, type: 'lead' as const, phone: l.phone, email: l.email }))
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

    selectedRecipients.forEach(recipientId => {
      const recipient = allRecipients.find(r => r.id === recipientId);
      if (recipient) {
        logCommunication({
          recipientId: recipient.id,
          recipientName: recipient.name,
          type: 'sms',
          recipientType: recipient.type === 'lead' ? 'lead' : 'member',
          template: 'Custom Message',
          message: messageText,
          status: 'sent',
        });
      }
    });

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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messaging</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Send text messages to members and leads</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'inbox'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Inbox size={18} />
              Inbox
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'compose'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send size={18} />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={18} />
              History
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'templates'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={18} />
              Templates
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'inbox' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">2-Way SMS Inbox</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 h-[500px] sm:h-[600px]">
                {/* Contact List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 sm:p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="overflow-y-auto h-[calc(100%-50px)] sm:h-[calc(100%-60px)]">
                    {allRecipients.slice(0, 20).map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact.id)}
                        className={`w-full p-2 sm:p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          selectedContact === contact.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-600 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{contact.name}</p>
                            <p className="text-xs text-gray-600 truncate">{contact.phone}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                  {selectedContact ? (
                    <>
                      <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-600 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              {allRecipients.find(r => r.id === selectedContact)?.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {allRecipients.find(r => r.id === selectedContact)?.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 space-y-2 sm:space-y-3">
                        {/* Sample messages */}
                        <div className="flex justify-start">
                          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm max-w-[80%] sm:max-w-[70%] border border-gray-200">
                            <p className="text-xs sm:text-sm text-gray-900">Hi! What are your hours today?</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">10:30 AM</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-red-600 text-white p-2 sm:p-3 rounded-lg shadow-sm max-w-[80%] sm:max-w-[70%]">
                            <p className="text-xs sm:text-sm">We&apos;re open 6 AM - 9 PM today! See you soon!</p>
                            <p className="text-[10px] sm:text-xs text-red-100 mt-1">10:32 AM • Sent</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm max-w-[80%] sm:max-w-[70%] border border-gray-200">
                            <p className="text-xs sm:text-sm text-gray-900">Perfect, thanks!</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">10:33 AM</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                          <button className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm min-h-[44px]">
                            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                          Note: This is a demo inbox. Real 2-way SMS requires Twilio/SMS gateway integration.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center p-4">
                        <MessageSquare size={36} className="mx-auto mb-3 text-gray-400 sm:w-12 sm:h-12" />
                        <p className="text-sm sm:text-base">Select a contact to view conversation</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Select Recipients</h3>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as 'all' | 'members' | 'leads')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="all">All</option>
                    <option value="members">Members Only</option>
                    <option value="leads">Leads Only</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <button
                    onClick={selectAll}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm min-h-[44px]"
                  >
                    Select All ({filteredRecipients.length})
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm min-h-[44px]"
                  >
                    Clear Selection
                  </button>
                  {selectedRecipients.length > 0 && (
                    <span className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm">
                      {selectedRecipients.length} selected
                    </span>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="w-4 h-4 text-red-600 focus:ring-red-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{recipient.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{recipient.phone} • {recipient.type === 'member' ? 'Member' : 'Lead'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Message</h3>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                />
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  {messageText.length} characters • Estimated {Math.ceil(messageText.length / 160)} SMS segment(s)
                </p>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || selectedRecipients.length === 0}
                className="w-full bg-red-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
              >
                <Send size={18} />
                Send Message to {selectedRecipients.length} Recipient{selectedRecipients.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Message History</h3>
              {messageHistory.length > 0 ? (
                <div className="space-y-3">
                  {messageHistory.map((msg) => (
                    <div key={msg.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{msg.recipientName}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
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
                      <p className="text-gray-700 text-sm sm:text-base">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">No messages sent yet</p>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Message Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {messageTemplates.map((template) => (
                  <div key={template.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">{template.name}</h4>
                        <span className="text-xs text-gray-600 capitalize">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mb-3">{template.message}</p>
                    <div className="text-[10px] sm:text-xs text-gray-500 mb-3">
                      <p className="font-medium">Available tokens:</p>
                      <p>{'{{name}}, {{membership}}, {{time}}, {{remaining}}, {{amount}}, {{date}}'}</p>
                    </div>
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px]"
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
