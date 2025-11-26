'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllClasses, getAllStaff, getAllBookings, getAllWaitlist } from '@/lib/dataStore';
import { X, UserPlus, ClipboardList, Plus, Edit2 } from 'lucide-react';
import BookingModal from './BookingModal';
import CheckInModal from './CheckInModal';
import { Class } from '@/lib/types';

export default function Schedule() {
  const { location } = useApp();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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

  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setShowEditClassModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule & Classes</h1>
          <p className="text-gray-600 mt-1">View and manage class schedules</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddClassModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Class
          </button>
        </div>
      </div>

      {!selectedClass ? (
        <>
          {viewMode === 'calendar' ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 border-r border-gray-200 w-24">Time</th>
                      {daysOfWeek.map(day => (
                        <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time} className="border-t border-gray-200">
                        <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50 font-medium">
                          {time}
                        </td>
                        {daysOfWeek.map(day => {
                          const dayClasses = locationClasses.filter(c => c.dayOfWeek === day && c.time === time);
                          return (
                            <td key={day} className="px-1 py-1 border-r border-gray-200 last:border-r-0 align-top">
                              {dayClasses.map(cls => (
                                <div
                                  key={cls.id}
                                  onClick={() => setSelectedClass(cls)}
                                  className="mb-1 p-2 bg-red-50 border border-red-200 rounded cursor-pointer hover:bg-red-100 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-900 truncate">{cls.name}</div>
                                      <div className="text-xs text-gray-600">{getStaffName(cls.coachId)}</div>
                                      <div className="text-xs text-gray-500">{cls.duration}min</div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClass(cls);
                                      }}
                                      className="p-1 hover:bg-red-200 rounded"
                                    >
                                      <Edit2 size={12} className="text-gray-600" />
                                    </button>
                                  </div>
                                  <div className={`text-xs font-medium mt-1 ${
                                    getClassBookingCount(cls.id) >= cls.capacity * 0.9 ? 'text-red-600' :
                                    getClassBookingCount(cls.id) >= cls.capacity * 0.7 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {getClassBookingCount(cls.id)}/{cls.capacity}
                                    {getClassWaitlistCount(cls.id) > 0 && ` +${getClassWaitlistCount(cls.id)}W`}
                                  </div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {daysOfWeek.map(day => {
                      const dayClasses = locationClasses.filter(c => c.dayOfWeek === day);
                      if (dayClasses.length === 0) return null;
                      
                      return dayClasses.map((cls) => (
                        <tr
                          key={cls.id}
                          className="hover:bg-gray-50"
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
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedClass(cls)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditClass(cls)}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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

      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Class</h2>
              <button onClick={() => setShowAddClassModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Add class functionality coming soon. This will allow you to create new recurring classes with instructor, time, capacity, and other details.</p>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditClassModal && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Class</h2>
              <button onClick={() => { setShowEditClassModal(false); setEditingClass(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    defaultValue={editingClass.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                    <select defaultValue={editingClass.dayOfWeek} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select defaultValue={editingClass.time} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      defaultValue={editingClass.duration}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      defaultValue={editingClass.capacity}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <select defaultValue={editingClass.coachId} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {locationStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    alert('Class updated! (Full save functionality coming soon)');
                    setShowEditClassModal(false);
                    setEditingClass(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setShowEditClassModal(false); setEditingClass(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
