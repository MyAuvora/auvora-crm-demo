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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden ${mode === 'kiosk' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="bg-auvora-teal text-white p-3 sm:p-4 flex justify-between items-center">
          <h2 className={`font-bold ${mode === 'kiosk' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
            {mode === 'kiosk' ? 'Class Check-In' : 'Book Class'}
          </h2>
          <button onClick={onClose} className="hover:bg-auvora-teal-dark p-2 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={mode === 'kiosk' ? 32 : 24} />
          </button>
        </div>

        <div className={`overflow-y-auto ${mode === 'kiosk' ? 'p-4 sm:p-8 max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)]' : 'p-4 sm:p-6 max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-80px)]'}`}>
          <div className="mb-4 sm:mb-6">
            <h3 className={`font-bold text-gray-900 ${mode === 'kiosk' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>{classData.name}</h3>
            <p className={`text-gray-600 ${mode === 'kiosk' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>{classData.dayOfWeek} at {classData.time}</p>
            <p className={`text-gray-600 ${mode === 'kiosk' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>Duration: {classData.duration} minutes</p>
            <p className={`font-medium mt-2 ${availableSpots > 0 ? 'text-green-600' : 'text-auvora-teal'} ${mode === 'kiosk' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
              {availableSpots > 0 ? `${availableSpots} spots available` : 'Class is full - will add to waitlist'}
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-auvora-teal-dark'} ${mode === 'kiosk' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
              {message.text}
            </div>
          )}

          {/* Attendees Section */}
          {bookings.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h4 className={`font-bold text-gray-900 mb-3 ${mode === 'kiosk' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
                Attendees ({bookings.length}/{classData.capacity})
              </h4>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {bookings.map(booking => (
                  <div key={booking.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 ${mode === 'kiosk' ? 'p-3 sm:p-4' : 'p-2 sm:p-3'} hover:bg-gray-50`}>
                    <button
                      onClick={() => handleNameClick(booking.memberId)}
                      className="flex items-center gap-2 sm:gap-3 flex-1 text-left hover:text-auvora-teal transition-colors min-h-[44px]"
                    >
                      <PersonStatusBadge personId={booking.memberId} />
                      <div>
                        <p className={`font-semibold text-gray-900 ${mode === 'kiosk' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
                          {booking.memberName}
                        </p>
                        {booking.status === 'checked-in' && booking.checkedInAt && (
                          <p className={`text-green-600 ${mode === 'kiosk' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                            ✓ Checked in at {new Date(booking.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </button>
                    {booking.status === 'booked' && (
                      <button
                        onClick={() => handleCheckIn(booking.id)}
                        disabled={checkingIn === booking.id}
                        className={`flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] ${mode === 'kiosk' ? 'px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg' : 'px-3 sm:px-4 py-2 text-sm'}`}
                      >
                        <UserCheck size={mode === 'kiosk' ? 24 : 16} />
                        <span className="hidden sm:inline">{checkingIn === booking.id ? 'Checking In...' : 'Check In'}</span>
                        <span className="sm:hidden">{checkingIn === booking.id ? 'Checking...' : 'Check In'}</span>
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Search Member to Book
                </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold text-sm sm:text-base min-h-[44px]"
              />
            </div>
          </div>

          <div className="mb-4 sm:mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm sm:text-base">No members found</div>
            ) : (
              filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 min-h-[44px] active:bg-gray-100 ${
                    selectedMember?.id === member.id ? 'bg-teal-50 border-l-4 border-l-auvora-teal' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{member.name}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{member.details}</div>
                </div>
              ))
            )}
          </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px] text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  disabled={!selectedMember}
                  className="flex-1 px-4 py-2.5 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
                >
                  {availableSpots > 0 ? 'Book Class' : 'Add to Waitlist'}
                </button>
              </div>
            </>
          )}

          {/* Kiosk Mode Close Button */}
          {mode === 'kiosk' && (
            <div className="mt-4 sm:mt-6">
              <button
                onClick={onClose}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-h-[44px]"
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
