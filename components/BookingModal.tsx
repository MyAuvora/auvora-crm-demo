'use client';

import { useState } from 'react';
import { X, Search, UserCheck } from 'lucide-react';
import { Class } from '@/lib/types';
import { getAllMembers, getAllClassPackClients, getAllDropInClients, bookClass, addToWaitlist, getAllBookings, checkInMember, getPersonById } from '@/lib/dataStore';
import { useApp } from '@/lib/context';
import PersonStatusBadge from './PersonStatusBadge';

interface BookingModalProps {
  classData: Class;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'frontdesk' | 'kiosk';
}

export default function BookingModal({ classData, onClose, onSuccess, mode = 'frontdesk' }: BookingModalProps) {
  const { navigateToMember, navigateToLead } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const members = getAllMembers().filter(m => m.location === classData.location);
  const packClients = getAllClassPackClients().filter(c => c.location === classData.location);
  const dropInClients = getAllDropInClients().filter(d => d.location === classData.location);
  const allMembers = [
    ...members.map(m => ({ id: m.id, name: m.name, type: 'member' as const, details: `Membership: ${m.membershipType}` })),
    ...packClients.map(c => ({ id: c.id, name: c.name, type: 'pack' as const, details: `${c.remainingClasses}/${c.totalClasses} classes left` })),
    ...dropInClients.map(d => ({ id: d.id, name: d.name, type: 'drop-in' as const, details: `Drop-In ($20/class)` }))
  ];

  const filteredMembers = allMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bookings = getAllBookings().filter(b => b.classId === classData.id && b.status !== 'cancelled');
  const availableSpots = classData.capacity - bookings.length;

  const handleCheckIn = (bookingId: string) => {
    setCheckingIn(bookingId);
    const result = checkInMember(bookingId);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setRefreshKey(prev => prev + 1);
      setTimeout(() => {
        setMessage(null);
        onSuccess();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
      setTimeout(() => setMessage(null), 3000);
    }
    setCheckingIn(null);
  };

  const handleNameClick = (personId: string) => {
    const personData = getPersonById(personId);
    if (!personData) return;
    
    if (personData.type === 'member' || personData.type === 'class-pack' || personData.type === 'drop-in') {
      navigateToMember(personId);
    } else if (personData.type === 'lead') {
      navigateToLead(personId);
    }
    onClose();
  };

  const handleBook = () => {
    if (!selectedMember) {
      setMessage({ type: 'error', text: 'Please select a member' });
      return;
    }

    const result = bookClass(classData.id, selectedMember.id, selectedMember.name);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } else {
      if (availableSpots <= 0) {
        const waitlistResult = addToWaitlist(classData.id, selectedMember.id, selectedMember.name);
        setMessage({ type: waitlistResult.success ? 'success' : 'error', text: waitlistResult.message });
        if (waitlistResult.success) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden ${mode === 'kiosk' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <h2 className={`font-bold ${mode === 'kiosk' ? 'text-2xl' : 'text-xl'}`}>
            {mode === 'kiosk' ? 'Class Check-In' : 'Book Class'}
          </h2>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X size={mode === 'kiosk' ? 32 : 24} />
          </button>
        </div>

        <div className={`overflow-y-auto ${mode === 'kiosk' ? 'p-8 max-h-[calc(90vh-80px)]' : 'p-6 max-h-[calc(90vh-80px)]'}`}>
          <div className="mb-6">
            <h3 className={`font-bold text-gray-900 ${mode === 'kiosk' ? 'text-2xl' : 'text-lg'}`}>{classData.name}</h3>
            <p className={`text-gray-600 ${mode === 'kiosk' ? 'text-xl' : 'text-base'}`}>{classData.dayOfWeek} at {classData.time}</p>
            <p className={`text-gray-600 ${mode === 'kiosk' ? 'text-xl' : 'text-base'}`}>Duration: {classData.duration} minutes</p>
            <p className={`font-medium mt-2 ${availableSpots > 0 ? 'text-green-600' : 'text-red-600'} ${mode === 'kiosk' ? 'text-xl' : 'text-base'}`}>
              {availableSpots > 0 ? `${availableSpots} spots available` : 'Class is full - will add to waitlist'}
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${mode === 'kiosk' ? 'text-xl' : 'text-base'}`}>
              {message.text}
            </div>
          )}

          {/* Attendees Section */}
          {bookings.length > 0 && (
            <div className="mb-6">
              <h4 className={`font-bold text-gray-900 mb-3 ${mode === 'kiosk' ? 'text-2xl' : 'text-lg'}`}>
                Attendees ({bookings.length}/{classData.capacity})
              </h4>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {bookings.map(booking => (
                  <div key={booking.id} className={`flex items-center justify-between ${mode === 'kiosk' ? 'p-4' : 'p-3'} hover:bg-gray-50`}>
                    <button
                      onClick={() => handleNameClick(booking.memberId)}
                      className="flex items-center gap-3 flex-1 text-left hover:text-red-600 transition-colors"
                    >
                      <PersonStatusBadge personId={booking.memberId} />
                      <div>
                        <p className={`font-semibold text-gray-900 ${mode === 'kiosk' ? 'text-xl' : 'text-base'}`}>
                          {booking.memberName}
                        </p>
                        {booking.status === 'checked-in' && booking.checkedInAt && (
                          <p className={`text-green-600 ${mode === 'kiosk' ? 'text-base' : 'text-sm'}`}>
                            ✓ Checked in at {new Date(booking.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </button>
                    {booking.status === 'booked' && (
                      <button
                        onClick={() => handleCheckIn(booking.id)}
                        disabled={checkingIn === booking.id}
                        className={`flex items-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${mode === 'kiosk' ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-sm'}`}
                      >
                        <UserCheck size={mode === 'kiosk' ? 24 : 16} />
                        {checkingIn === booking.id ? 'Checking In...' : 'Check In'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Section - Hidden in Kiosk Mode */}
          {mode === 'frontdesk' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Member to Book
                </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No members found</div>
            ) : (
              filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                    selectedMember?.id === member.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.details}</div>
                </div>
              ))
            )}
          </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  disabled={!selectedMember}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {availableSpots > 0 ? 'Book Class' : 'Add to Waitlist'}
                </button>
              </div>
            </>
          )}

          {/* Kiosk Mode Close Button */}
          {mode === 'kiosk' && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
