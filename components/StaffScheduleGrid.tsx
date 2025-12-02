'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { getAllStaff, getAllStaffShifts, createStaffShift, updateStaffShift, deleteStaffShift } from '@/lib/dataStore';
import { StaffShift } from '@/lib/types';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
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

export default function StaffScheduleGrid() {
  const { location, userRole } = useApp();
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [, setRefreshTrigger] = useState(0);

  const allShifts = getAllStaffShifts();
  const locationShifts = allShifts.filter(s => s.location === location);
  const allStaff = getAllStaff().filter(s => s.location === location);
  
  const frontDeskStaff = allStaff.filter(s => s.role === 'front-desk');

  const canManageSchedule = hasPermission(userRole, 'schedule:manage');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const weekDates = daysOfWeek.map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  const expandShiftsForWeek = (shifts: StaffShift[]) => {
    const expanded: StaffShift[] = [];
    
    shifts.forEach(shift => {
      if (shift.recurrence.type === 'weekly' && shift.recurrence.dayOfWeek !== undefined) {
        const dayIndex = shift.recurrence.dayOfWeek;
        const shiftDate = new Date(weekStart);
        shiftDate.setDate(weekStart.getDate() + (dayIndex === 0 ? 6 : dayIndex - 1));
        
        const dateStr = formatLocalDate(shiftDate);
        if (!shift.recurrence.exDates?.includes(dateStr)) {
          expanded.push({
            ...shift,
            date: dateStr,
            startTime: shift.recurrence.startTime,
            endTime: shift.recurrence.endTime,
          });
        }
      } else if (shift.recurrence.type === 'none' && shift.date) {
        const shiftDate = parseLocalDate(shift.date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (shiftDate >= weekStart && shiftDate <= weekEnd) {
          expanded.push(shift);
        }
      }
    });
    
    return expanded;
  };

  const expandedShifts = expandShiftsForWeek(locationShifts);

  const getShiftsForStaffAndDay = (staffId: string, dayDate: Date): StaffShift[] => {
    const targetDate = formatLocalDate(dayDate);
    return expandedShifts.filter(shift => 
      shift.assignedStaffId === staffId && 
      shift.date === targetDate
    );
  };

  const handleCellClick = (staffId: string, dayDate: Date) => {
    if (!canManageSchedule) return;
    
    setSelectedStaffId(staffId);
    setSelectedDate(formatLocalDate(dayDate));
    setEditingShift(null);
    setShowShiftModal(true);
  };

  const handleShiftClick = (shift: StaffShift, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageSchedule) return;
    
    setEditingShift(shift);
    setSelectedStaffId(shift.assignedStaffId || '');
    setSelectedDate(shift.date || '');
    setShowShiftModal(true);
  };

  const handleDeleteShift = (shiftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageSchedule) return;
    
    if (confirm('Are you sure you want to delete this shift?')) {
      deleteStaffShift(shiftId);
      handleRefresh();
    }
  };

  const formatShiftTime = (shift: StaffShift) => {
    if (!shift.startTime || !shift.endTime) return 'No time';
    
    const start = shift.startTime.replace(':00 ', '').replace(' AM', 'a').replace(' PM', 'p');
    const end = shift.endTime.replace(':00 ', '').replace(' AM', 'a').replace(' PM', 'p');
    
    return `${start}–${end}`;
  };

  return (
    <div className="space-y-4">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Staff Schedule</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Simple grid table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 w-40">
                  Staff
                </th>
                {daysOfWeek.map((day, i) => (
                  <th key={i} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[140px]">
                    <div>{day}</div>
                    <div className="text-xs text-gray-500 font-normal">
                      {weekDates[i].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frontDeskStaff.map(staff => (
                <tr key={staff.id} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-4 py-3 border-r border-gray-200 bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{staff.role.replace('-', ' ')}</div>
                  </td>
                  {weekDates.map((dayDate, dayIndex) => {
                    const dayShifts = getShiftsForStaffAndDay(staff.id, dayDate);
                    
                    return (
                      <td
                        key={dayIndex}
                        onClick={() => handleCellClick(staff.id, dayDate)}
                        className={`px-2 py-2 border-r border-gray-200 last:border-r-0 align-top ${
                          canManageSchedule ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div
                              key={shift.id}
                              onClick={(e) => handleShiftClick(shift, e)}
                              className="flex items-center justify-between gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs hover:bg-blue-100 transition-colors"
                            >
                              <span className="text-blue-900 font-medium">
                                {formatShiftTime(shift)}
                              </span>
                              {canManageSchedule && (
                                <button
                                  onClick={(e) => handleDeleteShift(shift.id, e)}
                                  className="p-0.5 hover:bg-blue-200 rounded"
                                  aria-label="Delete shift"
                                >
                                  <X size={12} className="text-blue-700" />
                                </button>
                              )}
                            </div>
                          ))}
                          {dayShifts.length === 0 && canManageSchedule && (
                            <div className="text-xs text-gray-400 text-center py-2">
                              Click to add
                            </div>
                          )}
                        </div>
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
          defaultStaffId={selectedStaffId}
          defaultDate={selectedDate}
          onClose={() => {
            setShowShiftModal(false);
            setEditingShift(null);
            setSelectedStaffId('');
            setSelectedDate('');
          }}
          onSave={() => {
            setShowShiftModal(false);
            setEditingShift(null);
            setSelectedStaffId('');
            setSelectedDate('');
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

function ShiftModal({ 
  shift, 
  defaultStaffId, 
  defaultDate, 
  onClose, 
  onSave 
}: { 
  shift: StaffShift | null; 
  defaultStaffId?: string; 
  defaultDate?: string; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const { location } = useApp();
  const allStaff = getAllStaff().filter(s => s.location === location);
  const frontDeskStaff = allStaff.filter(s => s.role === 'front-desk');
  
  const [formData, setFormData] = useState({
    assignedStaffId: shift?.assignedStaffId || defaultStaffId || '',
    isRecurring: shift?.recurrence.type === 'weekly',
    dayOfWeek: shift?.recurrence.type === 'weekly' ? shift.recurrence.dayOfWeek?.toString() || '1' : '1',
    date: shift?.date || defaultDate || new Date().toISOString().split('T')[0],
    startTime: shift?.startTime || shift?.recurrence.startTime || '9:00 AM',
    endTime: shift?.endTime || shift?.recurrence.endTime || '5:00 PM',
    notes: shift?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assignedStaffId) {
      alert('Please select a staff member');
      return;
    }
    
    const assignedStaff = frontDeskStaff.find(s => s.id === formData.assignedStaffId);
    
    const shiftData = {
      location,
      assignedStaffId: formData.assignedStaffId,
      assignedStaffName: assignedStaff?.name,
      templateType: 'front-desk' as const,
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

    if (shift?.id) {
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
            {shift?.id ? 'Edit Shift' : 'Add Shift'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member
            </label>
            <select
              value={formData.assignedStaffId}
              onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              required
            >
              <option value="">Select staff member</option>
              {frontDeskStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
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
                required
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
              {shift?.id ? 'Update Shift' : 'Create Shift'}
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
