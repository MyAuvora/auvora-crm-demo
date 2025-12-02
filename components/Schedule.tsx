'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllClasses, getAllStaff, getAllBookings, getAllWaitlist, addClass, updateClass, deleteClass } from '@/lib/dataStore';
import { X, UserPlus, ClipboardList, Plus, Edit2 } from 'lucide-react';
import BookingModal from './BookingModal';
import CheckInModal from './CheckInModal';
import { Class } from '@/lib/types';
import { hasPermission } from '@/lib/permissions';
import PersonStatusBadge from './PersonStatusBadge';

export default function Schedule() {
  const { location, userRole } = useApp();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  const [newClass, setNewClass] = useState({
    name: '',
    dayOfWeek: 'Monday',
    time: '6:00 AM',
    duration: 60,
    capacity: 20,
    coachId: '',
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    dayOfWeek: 'Monday',
    time: '6:00 AM',
    duration: 60,
    capacity: 20,
    coachId: '',
  });

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
    setEditForm({
      name: cls.name,
      dayOfWeek: cls.dayOfWeek,
      time: cls.time,
      duration: cls.duration,
      capacity: cls.capacity,
      coachId: cls.coachId,
    });
    setShowEditClassModal(true);
  };
  
  const handleSaveNewClass = () => {
    if (!newClass.name || !newClass.coachId) {
      alert('Please fill in all required fields');
      return;
    }
    
    addClass({
      name: newClass.name,
      type: location === 'athletic-club' ? 'fitness' : 'dance',
      dayOfWeek: newClass.dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
      time: newClass.time,
      duration: newClass.duration,
      capacity: newClass.capacity,
      coachId: newClass.coachId,
      location,
    });
    
    setNewClass({
      name: '',
      dayOfWeek: 'Monday',
      time: '6:00 AM',
      duration: 60,
      capacity: 20,
      coachId: '',
    });
    setShowAddClassModal(false);
    handleRefresh();
  };
  
  const handleSaveEditClass = () => {
    if (!editingClass || !editForm.name || !editForm.coachId) {
      alert('Please fill in all required fields');
      return;
    }
    
    const currentBookings = getClassBookingCount(editingClass.id);
    if (editForm.capacity < currentBookings) {
      alert(`Cannot reduce capacity below current bookings (${currentBookings})`);
      return;
    }
    
    updateClass(editingClass.id, {
      name: editForm.name,
      dayOfWeek: editForm.dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
      time: editForm.time,
      duration: editForm.duration,
      capacity: editForm.capacity,
      coachId: editForm.coachId,
    });
    
    setShowEditClassModal(false);
    setEditingClass(null);
    handleRefresh();
  };
  
  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class? All bookings and waitlist entries will be removed.')) {
      deleteClass(classId);
      setShowEditClassModal(false);
      setEditingClass(null);
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
      handleRefresh();
    }
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
          {hasPermission(userRole, 'class:add') && (
            <button
              onClick={() => setShowAddClassModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Class
            </button>
          )}
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
                                    {hasPermission(userRole, 'class:edit') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditClass(cls);
                                        }}
                                        className="p-1 hover:bg-red-200 rounded"
                                      >
                                        <Edit2 size={12} className="text-gray-600" />
                                      </button>
                                    )}
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
                              {hasPermission(userRole, 'class:edit') && (
                                <button
                                  onClick={() => handleEditClass(cls)}
                                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                                >
                                  Edit
                                </button>
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
                          <div className="flex items-center gap-2">
                            <PersonStatusBadge personId={booking.memberId} />
                            <span className="text-gray-900">{booking.memberName}</span>
                          </div>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., HIIT Training"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                    <select 
                      value={newClass.dayOfWeek} 
                      onChange={(e) => setNewClass({ ...newClass, dayOfWeek: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <select 
                      value={newClass.time} 
                      onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                    <input
                      type="number"
                      value={newClass.duration}
                      onChange={(e) => setNewClass({ ...newClass, duration: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={newClass.capacity}
                      onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                  <select 
                    value={newClass.coachId} 
                    onChange={(e) => setNewClass({ ...newClass, coachId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select instructor...</option>
                    {locationStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveNewClass}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Create Class
                </button>
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
                    <select 
                      value={editForm.dayOfWeek} 
                      onChange={(e) => setEditForm({ ...editForm, dayOfWeek: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <select 
                      value={editForm.time} 
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                    <input
                      type="number"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={editForm.capacity}
                      onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current bookings: {getClassBookingCount(editingClass.id)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                  <select 
                    value={editForm.coachId} 
                    onChange={(e) => setEditForm({ ...editForm, coachId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {locationStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEditClass}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => handleDeleteClass(editingClass.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
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
