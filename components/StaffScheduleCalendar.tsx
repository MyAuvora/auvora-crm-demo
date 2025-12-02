'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllStaff, getAllStaffShifts, createStaffShift, updateStaffShift, deleteStaffShift } from '@/lib/dataStore';
import { StaffShift, Location } from '@/lib/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

const parseLocalDate = (dateStr: string) => {
  return new Date(dateStr + 'T12:00:00');
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const timeToMinutes = (time: string) => {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

interface StaffScheduleCalendarProps {
  onShiftClick?: (shift: StaffShift) => void;
}

export default function StaffScheduleCalendar({ onShiftClick }: StaffScheduleCalendarProps) {
  const { location, userRole, selectedStaffId, setSelectedStaffId } = useApp();
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [, setRefreshTrigger] = useState(0);
  const [dragStart, setDragStart] = useState<{ day: string; time: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: string; time: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const allShifts = getAllStaffShifts();
  const locationShifts = allShifts.filter(s => s.location === location);
  const locationStaff = getAllStaff().filter(s => s.location === location);
  
  const filteredShifts = selectedStaffId 
    ? locationShifts.filter(s => s.assignedStaffId === selectedStaffId)
    : locationShifts;
  
  const frontDeskStaff = locationStaff.filter(s => s.role === 'front-desk');
  const allLocationStaff = locationStaff; // All staff for scheduling

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', 
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMouseDown = (day: string, time: string) => {
    if (!canManageSchedule) return;
    setIsDragging(true);
    setDragStart({ day, time });
    setDragEnd({ day, time });
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging || !dragStart) return;
    if (day === dragStart.day) {
      setDragEnd({ day, time });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startTimeIndex = timeSlots.indexOf(dragStart.time);
    const endTimeIndex = timeSlots.indexOf(dragEnd.time);
    
    if (startTimeIndex !== -1 && endTimeIndex !== -1 && dragStart.day === dragEnd.day) {
      const minIndex = Math.min(startTimeIndex, endTimeIndex);
      const maxIndex = Math.max(startTimeIndex, endTimeIndex);
      
      const startTime = timeSlots[minIndex];
      const endTime = timeSlots[maxIndex + 1] || timeSlots[maxIndex];
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      
      const dayIndex = daysOfWeek.indexOf(dragStart.day);
      const shiftDate = new Date(startOfWeek);
      shiftDate.setDate(startOfWeek.getDate() + dayIndex);
      
      setEditingShift({
        id: '',
        location,
        assignedStaffId: selectedStaffId || undefined,
        assignedStaffName: selectedStaffId ? locationStaff.find(s => s.id === selectedStaffId)?.name : undefined,
        templateType: 'front-desk',
        recurrence: { 
          type: 'none',
          startTime,
          endTime
        },
        date: formatLocalDate(shiftDate),
        startTime,
        endTime,
        status: 'scheduled',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      } as StaffShift);
      setShowShiftModal(true);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isCellSelected = (day: string, time: string) => {
    if (!isDragging || !dragStart || !dragEnd || day !== dragStart.day) return false;
    
    const startTimeIndex = timeSlots.indexOf(dragStart.time);
    const endTimeIndex = timeSlots.indexOf(dragEnd.time);
    const currentTimeIndex = timeSlots.indexOf(time);
    
    const minIndex = Math.min(startTimeIndex, endTimeIndex);
    const maxIndex = Math.max(startTimeIndex, endTimeIndex);
    
    return currentTimeIndex >= minIndex && currentTimeIndex <= maxIndex;
  };

  const handleEditShift = (shift: StaffShift, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShift(shift);
    setShowShiftModal(true);
  };

  const handleDeleteShift = (shiftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this shift?')) {
      deleteStaffShift(shiftId);
      handleRefresh();
    }
  };

  const getShiftColor = (templateType: string) => {
    switch (templateType) {
      case 'front-desk':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'event':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'meeting':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'other':
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const canManageSchedule = hasPermission(userRole, 'schedule:manage') || 
                            userRole === 'owner' || 
                            userRole === 'manager';

  const expandShiftsForWeek = () => {
    const expanded: Array<StaffShift & { displayDate?: string }> = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    filteredShifts.forEach(shift => {
      if (shift.recurrence.type === 'weekly' && shift.recurrence.dayOfWeek !== undefined) {
        const dayIndex = shift.recurrence.dayOfWeek;
        const shiftDate = new Date(startOfWeek);
        shiftDate.setDate(startOfWeek.getDate() + (dayIndex === 0 ? 6 : dayIndex - 1));
        
        const dateStr = formatLocalDate(shiftDate);
        if (!shift.recurrence.exDates?.includes(dateStr)) {
          expanded.push({
            ...shift,
            displayDate: dateStr,
            startTime: shift.recurrence.startTime,
            endTime: shift.recurrence.endTime,
          });
        }
      } else if (shift.recurrence.type === 'none' && shift.date) {
        const shiftDate = parseLocalDate(shift.date);
        const weekStart = new Date(startOfWeek);
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (shiftDate >= weekStart && shiftDate <= weekEnd) {
          expanded.push(shift);
        }
      }
    });

    return expanded;
  };

  const detectConflicts = (shifts: Array<StaffShift & { displayDate?: string }>) => {
    const conflicts: string[] = [];
    const shiftsByStaff: { [staffId: string]: Array<StaffShift & { displayDate?: string }> } = {};

    shifts.forEach(shift => {
      if (shift.assignedStaffId) {
        if (!shiftsByStaff[shift.assignedStaffId]) {
          shiftsByStaff[shift.assignedStaffId] = [];
        }
        shiftsByStaff[shift.assignedStaffId].push(shift);
      }
    });

    Object.entries(shiftsByStaff).forEach(([staffId, staffShifts]) => {
      for (let i = 0; i < staffShifts.length; i++) {
        for (let j = i + 1; j < staffShifts.length; j++) {
          const shift1 = staffShifts[i];
          const shift2 = staffShifts[j];
          
          const date1 = shift1.displayDate || shift1.date;
          const date2 = shift2.displayDate || shift2.date;
          
          if (date1 === date2) {
            const start1 = shift1.startTime || shift1.recurrence.startTime;
            const end1 = shift1.endTime || shift1.recurrence.endTime;
            const start2 = shift2.startTime || shift2.recurrence.startTime;
            const end2 = shift2.endTime || shift2.recurrence.endTime;
            
            if (start1 && end1 && start2 && end2) {
              if ((start1 < end2 && end1 > start2)) {
                conflicts.push(`${shift1.assignedStaffName} has overlapping shifts on ${date1}`);
              }
            }
          }
        }
      }
    });

    return conflicts;
  };

  const expandedShifts = expandShiftsForWeek();
  const conflicts = detectConflicts(expandedShifts);


  const getShiftsForDayAndTime = (day: string, time: string) => {
    const dayIndex = daysOfWeek.indexOf(day);
    const currentTimeMinutes = timeToMinutes(time);
    
    return expandedShifts.filter(shift => {
      if (shift.recurrence.type === 'weekly') {
        const shiftDayIndex = shift.recurrence.dayOfWeek;
        const isDayMatch = shiftDayIndex === (dayIndex === 6 ? 0 : dayIndex + 1);
        if (!isDayMatch) return false;
        
        if (!shift.recurrence.startTime || !shift.recurrence.endTime) return false;
        const startMinutes = timeToMinutes(shift.recurrence.startTime);
        const endMinutes = timeToMinutes(shift.recurrence.endTime);
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      } else if (shift.date) {
        const shiftDate = parseLocalDate(shift.date);
        const shiftDay = daysOfWeek[shiftDate.getDay() === 0 ? 6 : shiftDate.getDay() - 1];
        if (shiftDay !== day) return false;
        
        if (!shift.startTime || !shift.endTime) return false;
        const startMinutes = timeToMinutes(shift.startTime);
        const endMinutes = timeToMinutes(shift.endTime);
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }
      return false;
    });
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Staff Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">Weekly staff shift schedule</p>
          </div>
          {allLocationStaff.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Viewing:</label>
              <select
                value={selectedStaffId || 'all'}
                onChange={(e) => setSelectedStaffId(e.target.value === 'all' ? null : e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              >
                <option value="all">All Staff</option>
                {allLocationStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {canManageSchedule && (
          <button
            onClick={() => {
              setEditingShift(null);
              setShowShiftModal(true);
            }}
            className="px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)] flex items-center gap-2"
          >
            <Plus size={16} />
            Add Shift
          </button>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Scheduling Conflicts Detected</h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {conflicts.map((conflict, idx) => (
                  <li key={idx}>{conflict}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
                    const dayShifts = getShiftsForDayAndTime(day, time);
                    const isSelected = isCellSelected(day, time);
                    return (
                      <td 
                        key={day} 
                        className={`px-1 py-1 border-r border-gray-200 last:border-r-0 align-top cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
                        }`}
                        onMouseDown={() => handleMouseDown(day, time)}
                        onMouseEnter={() => handleMouseEnter(day, time)}
                        onMouseUp={handleMouseUp}
                      >
                        {dayShifts.map(shift => (
                          <div
                            key={shift.id}
                            onClick={() => onShiftClick?.(shift)}
                            className={`mb-1 p-2 border rounded cursor-pointer transition-colors ${getShiftColor(shift.templateType)}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate capitalize">
                                  {shift.templateType.replace('-', ' ')}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {shift.assignedStaffName || 'Unassigned'}
                                </div>
                                {shift.startTime && shift.endTime && (
                                  <div className="text-xs text-gray-500">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                )}
                              </div>
                              {canManageSchedule && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => handleEditShift(shift, e)}
                                    className="p-1 hover:bg-white rounded"
                                  >
                                    <Edit2 size={12} className="text-gray-600" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteShift(shift.id, e)}
                                    className="p-1 hover:bg-white rounded"
                                  >
                                    <Trash2 size={12} className="text-red-600" />
                                  </button>
                                </div>
                              )}
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

      {showShiftModal && (
        <ShiftModal
          shift={editingShift}
          defaultStaffId={selectedStaffId || undefined}
          onClose={() => {
            setShowShiftModal(false);
            setEditingShift(null);
          }}
          onSave={() => {
            setShowShiftModal(false);
            setEditingShift(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

function ShiftModal({ shift, defaultStaffId, onClose, onSave }: { shift: StaffShift | null; defaultStaffId?: string; onClose: () => void; onSave: () => void }) {
  const { location } = useApp();
  const locationStaff = getAllStaff().filter(s => s.location === location);
  
  const [formData, setFormData] = useState({
    templateType: shift?.templateType || 'front-desk',
    assignedStaffId: shift?.assignedStaffId || defaultStaffId || '',
    isRecurring: shift?.recurrence.type === 'weekly',
    dayOfWeek: shift?.recurrence.type === 'weekly' ? shift.recurrence.dayOfWeek?.toString() || '1' : '1',
    date: shift?.date || new Date().toISOString().split('T')[0],
    startTime: shift?.startTime || shift?.recurrence.startTime || '9:00 AM',
    endTime: shift?.endTime || shift?.recurrence.endTime || '5:00 PM',
    notes: shift?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedStaff = locationStaff.find(s => s.id === formData.assignedStaffId);
    
    const shiftData = {
      location,
      assignedStaffId: formData.assignedStaffId || undefined,
      assignedStaffName: assignedStaff?.name || undefined,
      templateType: formData.templateType as 'front-desk' | 'event' | 'meeting' | 'other',
      notes: formData.notes || undefined,
      recurrence: formData.isRecurring ? {
        type: 'weekly' as const,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
      } : {
        type: 'none' as const,
      },
      date: formData.isRecurring ? undefined : formData.date,
      startTime: formData.isRecurring ? undefined : formData.startTime,
      endTime: formData.isRecurring ? undefined : formData.endTime,
      status: 'scheduled' as const,
      createdBy: 'system',
    };

    if (shift) {
      updateStaffShift(shift.id, shiftData);
    } else {
      createStaffShift(shiftData);
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {shift ? 'Edit Shift' : 'Add Shift'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Type
            </label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value as 'front-desk' | 'event' | 'meeting' | 'other' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
            >
              <option value="front-desk">Front Desk</option>
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Staff
            </label>
            <select
              value={formData.assignedStaffId}
              onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {locationStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded border-gray-300 text-[rgb(172,19,5)] focus:ring-[rgb(172,19,5)]"
              />
              <span className="text-sm font-medium text-gray-700">Recurring Weekly</span>
            </label>
          </div>

          {formData.isRecurring ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              >
                {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              >
                {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              placeholder="Add any notes about this shift..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              {shift ? 'Update Shift' : 'Create Shift'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
