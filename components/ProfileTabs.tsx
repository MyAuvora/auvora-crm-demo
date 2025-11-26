'use client';

import { useState } from 'react';
import { X, CreditCard, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { getPersonById, getPersonTransactions, getPersonBookings, getPersonCommunications, getPersonTimeline, getAllClasses } from '@/lib/dataStore';
import { Member, ClassPackClient, DropInClient } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'account' | 'billing' | 'attendance' | 'messages' | 'timeline';

interface ProfileTabsProps {
  personId: string;
  onClose: () => void;
  onSendText: () => void;
}

export default function ProfileTabs({ personId, onClose, onSendText }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  
  const personData = getPersonById(personId);
  if (!personData) return null;
  
  const { person, type } = personData;
  const transactions = getPersonTransactions(personId);
  const bookings = getPersonBookings(personId);
  const communications = getPersonCommunications(personId);
  const timeline = getPersonTimeline(personId);
  
  const last30DaysVisits = bookings
    .filter(b => {
      const bookingDate = new Date(b.checkedInAt || b.bookedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo && b.status === 'checked-in';
    })
    .reduce((acc, b) => {
      const date = format(new Date(b.checkedInAt!), 'MMM d');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const chartData = Object.entries(last30DaysVisits).map(([date, visits]) => ({
    date,
    visits
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{person.name}</h2>
            <p className="text-sm text-gray-600">{person.email} • {person.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-3 font-medium ${
                activeTab === 'account'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-3 font-medium ${
                activeTab === 'billing'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Billing
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-3 font-medium ${
                activeTab === 'attendance'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-3 font-medium ${
                activeTab === 'messages'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 font-medium ${
                activeTab === 'timeline'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{person.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{person.phone}</p>
                </div>
                {type === 'member' && 'membershipType' in person && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Membership Type</label>
                      <p className="text-gray-900">{(person as Member).membershipType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="text-gray-900 capitalize">{(person as Member).status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Join Date</label>
                      <p className="text-gray-900">{(person as Member).joinDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Zip Code</label>
                      <p className="text-gray-900">{(person as Member).zipCode}</p>
                    </div>
                  </>
                )}
                {type === 'class-pack' && 'packType' in person && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pack Type</label>
                      <p className="text-gray-900">{(person as ClassPackClient).packType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Classes Remaining</label>
                      <p className="text-gray-900">{(person as ClassPackClient).remainingClasses} / {(person as ClassPackClient).totalClasses}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                      <p className="text-gray-900">{(person as ClassPackClient).purchaseDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Zip Code</label>
                      <p className="text-gray-900">{(person as ClassPackClient).zipCode}</p>
                    </div>
                  </>
                )}
                {type === 'drop-in' && 'totalVisits' in person && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Visits</label>
                      <p className="text-gray-900">{(person as DropInClient).totalVisits}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">First Visit</label>
                      <p className="text-gray-900">{(person as DropInClient).firstVisit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Visit</label>
                      <p className="text-gray-900">{(person as DropInClient).lastVisit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Zip Code</label>
                      <p className="text-gray-900">{(person as DropInClient).zipCode}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={onSendText}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Send Text
                </button>
                <button
                  onClick={() => alert('Book class feature coming soon')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Calendar size={16} />
                  Book Class
                </button>
                <button
                  onClick={() => alert('Charge feature coming soon')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Charge
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <button
                  onClick={() => alert('Charge feature coming soon')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Charge
                </button>
              </div>
              
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions found</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{format(new Date(t.timestamp), 'MMM d, yyyy')}</span>
                        <span className="font-bold">${t.total.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                      {t.promoCode && (
                        <div className="text-sm text-green-600 mt-1">
                          Promo: {t.promoCode} (-${t.discount.toFixed(2)})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Visits This Month</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => {
                      const bookingDate = new Date(b.checkedInAt || b.bookedAt);
                      const now = new Date();
                      return bookingDate.getMonth() === now.getMonth() && b.status === 'checked-in';
                    }).length}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Last 30 Days</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(last30DaysVisits).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Visits</div>
                  <div className="text-2xl font-bold text-purple-600">{bookings.filter(b => b.status === 'checked-in').length}</div>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Visit Trend (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="visits" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Visits</h3>
                {bookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No visits found</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 10).map(b => {
                      const cls = getAllClasses().find(c => c.id === b.classId);
                      return (
                        <div key={b.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-medium">{cls?.name || 'Class'}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(b.checkedInAt || b.bookedAt), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            b.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                            b.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Communication History</h3>
                <button
                  onClick={onSendText}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Send Message
                </button>
              </div>
              
              {communications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages found</p>
              ) : (
                <div className="space-y-3">
                  {communications.map(c => (
                    <div key={c.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-gray-400" />
                          <span className="font-medium">{c.type === 'sms' ? 'Text Message' : 'Email'}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(c.sentAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Template: {c.template}
                      </div>
                      <div className="text-sm text-gray-900">{c.message}</div>
                      <div className={`text-xs mt-2 ${
                        c.status === 'sent' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {c.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
              
              {timeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity found</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{event.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
