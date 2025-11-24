'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllClasses, getAllStaff, getAllBookings, getAllWaitlist } from '@/lib/dataStore';
import { X, UserPlus, ClipboardList } from 'lucide-react';
import BookingModal from './BookingModal';
import CheckInModal from './CheckInModal';
import { Class } from '@/lib/types';

export default function Schedule() {
  const { location } = useApp();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [, setRefreshTrigger] = useState(0);

  const locationClasses = getAllClasses().filter(c => c.location === location);
  const locationStaff = getAllStaff().filter(s => s.location === location);
  const bookings = getAllBookings();
  const waitlist = getAllWaitlist();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getStaffName = (coachId: string) => {
    const staffMember = locationStaff.find(s => s.id === coachId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  const getClassBookingCount = (classId: string) => {
    return bookings.filter(b => b.classId === classId && b.status !== 'cancelled').length;
  };

  const getClassWaitlistCount = (classId: string) => {
    return waitlist.filter(w => w.classId === classId).length;
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule & Classes</h1>
        <p className="text-gray-600 mt-1">View and manage class schedules</p>
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Instructor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {daysOfWeek.map(day => {
                  const dayClasses = locationClasses.filter(c => c.dayOfWeek === day);
                  if (dayClasses.length === 0) return null;
                  
                  return dayClasses.map((cls) => (
                    <tr
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{day}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{cls.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{cls.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cls.duration} min</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getStaffName(cls.coachId)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            getClassBookingCount(cls.id) >= cls.capacity * 0.9 ? 'text-red-600' :
                            getClassBookingCount(cls.id) >= cls.capacity * 0.7 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {getClassBookingCount(cls.id)} / {cls.capacity}
                          </span>
                          {getClassWaitlistCount(cls.id) > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              +{getClassWaitlistCount(cls.id)} waitlist
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
          >
            <X size={20} />
            <span>Back to schedule</span>
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h2>
              <p className="text-gray-600 mt-1">{selectedClass.dayOfWeek} at {selectedClass.time}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">{selectedClass.duration} minutes</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Instructor</p>
                <p className="text-xl font-bold text-gray-900">{getStaffName(selectedClass.coachId)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-xl font-bold text-gray-900">{getClassBookingCount(selectedClass.id)} / {selectedClass.capacity}</p>
                {getClassWaitlistCount(selectedClass.id) > 0 && (
                  <p className="text-sm text-orange-600 mt-1">+{getClassWaitlistCount(selectedClass.id)} on waitlist</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <UserPlus size={20} />
                Book Member
              </button>
              <button
                onClick={() => setShowCheckInModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ClipboardList size={20} />
                Check-In Roster
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Booked Members</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {bookings.filter(b => b.classId === selectedClass.id && b.status !== 'cancelled').length === 0 ? (
                  <p className="text-gray-600">No bookings yet for this class.</p>
                ) : (
                  <div className="space-y-2">
                    {bookings
                      .filter(b => b.classId === selectedClass.id && b.status !== 'cancelled')
                      .map(booking => (
                        <div key={booking.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <span className="text-gray-900">{booking.memberName}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            booking.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.status === 'checked-in' ? 'Checked In' : 'Booked'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {getClassWaitlistCount(selectedClass.id) > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Waitlist</h3>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {waitlist
                      .filter(w => w.classId === selectedClass.id)
                      .map(entry => (
                        <div key={entry.id} className="flex justify-between items-center py-2 border-b border-orange-200 last:border-0">
                          <span className="text-gray-900">{entry.memberName}</span>
                          <span className="text-sm text-orange-600">
                            Added {new Date(entry.addedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showBookingModal && selectedClass && (
        <BookingModal
          classData={selectedClass}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showCheckInModal && selectedClass && (
        <CheckInModal
          classData={selectedClass}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
