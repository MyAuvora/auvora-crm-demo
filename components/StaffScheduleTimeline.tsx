'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { getAllStaff, getAllStaffShifts, createStaffShift, updateStaffShift, deleteStaffShift } from '@/lib/dataStore';
import { StaffShift } from '@/lib/types';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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

const minutesToTime = (minutes: number): string => {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(mins).padStart(2, '0')} ${period}`;
};

const DAY_START = timeToMinutes('6:00 AM'); // 360 minutes
const DAY_END = timeToMinutes('10:00 PM'); // 1320 minutes
const PX_PER_HOUR = 60;
const PX_PER_MINUTE = PX_PER_HOUR / 60;
const TIMELINE_HEIGHT = (DAY_END - DAY_START) * PX_PER_MINUTE;
const SNAP_MINUTES = 60; // Snap to hour increments

const topFromMinutes = (minutes: number) => {
  return (minutes - DAY_START) * PX_PER_MINUTE;
};

const heightFromRange = (startMinutes: number, endMinutes: number) => {
  return (endMinutes - startMinutes) * PX_PER_MINUTE;
};

const minutesFromMouse = (clientY: number, dayCellRect: DOMRect) => {
  const relativeY = clientY - dayCellRect.top;
  const minutes = DAY_START + Math.round((relativeY / PX_PER_MINUTE) / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.max(DAY_START, Math.min(DAY_END - SNAP_MINUTES, minutes));
};

interface StaffScheduleTimelineProps {
  onShiftClick?: (shift: StaffShift) => void;
}

export default function StaffScheduleTimeline({ onShiftClick }: StaffScheduleTimelineProps) {
  const { location, userRole, selectedStaffId, setSelectedStaffId } = useApp();
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
  const [dragState, setDragState] = useState<{
    staffId: string;
    dayIndex: number;
    startMinutes: number;
    endMinutes: number;
  } | null>(null);
  const [, setRefreshTrigger] = useState(0);
  
  const dayCellRefs = useRef<Map<string, DOMRect>>(new Map());

  const allShifts = getAllStaffShifts();
  const locationShifts = allShifts.filter(s => s.location === location);
  const locationStaff = getAllStaff().filter(s => s.location === location);
  
  const filteredStaff = selectedStaffId 
    ? locationStaff.filter(s => s.id === selectedStaffId)
    : locationStaff;

  const canManageSchedule = hasPermission(userRole, 'schedule:manage');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
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

  const getShiftsForStaffAndDay = (staffId: string, dayIndex: number): StaffShift[] => {
    const targetDate = formatLocalDate(weekDates[dayIndex]);
    return expandedShifts.filter(shift => 
      shift.assignedStaffId === staffId && 
      shift.date === targetDate
    );
  };

  const handleDayMouseDown = (e: React.MouseEvent, staffId: string, dayIndex: number) => {
    if (!canManageSchedule) return;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dayCellRefs.current.set(`${staffId}-${dayIndex}`, rect);
    
    const startMinutes = minutesFromMouse(e.clientY, rect);
    setDragState({
      staffId,
      dayIndex,
      startMinutes,
      endMinutes: startMinutes + SNAP_MINUTES,
    });
  };

  const handleDayMouseMove = (e: React.MouseEvent, staffId: string, dayIndex: number) => {
    if (!dragState || dragState.staffId !== staffId || dragState.dayIndex !== dayIndex) return;
    
    const rect = dayCellRefs.current.get(`${staffId}-${dayIndex}`);
    if (!rect) return;
    
    const currentMinutes = minutesFromMouse(e.clientY, rect);
    setDragState({
      ...dragState,
      endMinutes: currentMinutes + SNAP_MINUTES,
    });
  };

  const handleDayMouseUp = () => {
    if (!dragState) return;
    
    const { staffId, dayIndex, startMinutes, endMinutes } = dragState;
    const actualStart = Math.min(startMinutes, endMinutes);
    const actualEnd = Math.max(startMinutes, endMinutes);
    
    if (actualEnd - actualStart >= SNAP_MINUTES) {
      const shiftDate = weekDates[dayIndex];
      const staff = locationStaff.find(s => s.id === staffId);
      
      setEditingShift({
        id: '',
        location,
        assignedStaffId: staffId,
        assignedStaffName: staff?.name,
        templateType: 'front-desk',
        recurrence: { type: 'none' },
        date: formatLocalDate(shiftDate),
        startTime: minutesToTime(actualStart),
        endTime: minutesToTime(actualEnd),
        status: 'scheduled',
        createdBy: 'system',
      } as StaffShift);
      setShowShiftModal(true);
    }
    
    setDragState(null);
  };

  useEffect(() => {
    if (dragState) {
      const onUp = () => handleDayMouseUp();
      window.addEventListener('mouseup', onUp);
      return () => window.removeEventListener('mouseup', onUp);
    }
  }, [dragState]);

  const getShiftColor = (templateType: string) => {
    switch (templateType) {
      case 'front-desk': return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'event': return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'meeting': return 'bg-green-100 border-green-300 text-green-900';
      case 'other': return 'bg-gray-100 border-gray-300 text-gray-900';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header with week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Schedule</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {(userRole === 'owner' || userRole === 'manager') && (
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Viewing:</label>
              <select
                value={selectedStaffId || 'all'}
                onChange={(e) => setSelectedStaffId(e.target.value === 'all' ? null : e.target.value)}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
              >
                <option value="all">All Staff</option>
                {locationStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                ))}
              </select>
            </div>
          )}
          {canManageSchedule && (
            <button
              onClick={() => {
                setEditingShift(null);
                setShowShiftModal(true);
              }}
              className="px-3 sm:px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <Plus size={16} />
              Add Shift
            </button>
          )}
        </div>
      </div>

      {/* Timeline calendar */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full">
            {/* Header row */}
            <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
              <div className="w-40 flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-gray-50">
                Staff
              </div>
              {daysOfWeek.map((day, i) => (
                <div key={i} className="w-48 flex-shrink-0 px-2 py-3 text-center border-r border-gray-200 last:border-r-0">
                  <div className="text-xs font-medium text-gray-700">{day}</div>
                  <div className="text-xs text-gray-500">{weekDates[i].getDate()}</div>
                </div>
              ))}
            </div>

            {/* Staff rows */}
            {filteredStaff.map(staff => (
              <div key={staff.id} className="flex border-b border-gray-200 last:border-b-0">
                {/* Staff name column */}
                <div className="w-40 flex-shrink-0 px-4 py-3 border-r border-gray-200 bg-gray-50 flex items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{staff.role}</div>
                  </div>
                </div>

                {/* Day columns */}
                {daysOfWeek.map((_, dayIndex) => {
                  const dayShifts = getShiftsForStaffAndDay(staff.id, dayIndex);
                  const isDraggingThisCell = dragState?.staffId === staff.id && dragState?.dayIndex === dayIndex;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-48 flex-shrink-0 border-r border-gray-200 last:border-r-0 relative ${canManageSchedule ? 'cursor-crosshair' : ''}`}
                      style={{ 
                        height: `${TIMELINE_HEIGHT}px`,
                        background: `repeating-linear-gradient(to bottom, transparent 0, transparent ${PX_PER_HOUR - 1}px, rgba(0,0,0,0.04) ${PX_PER_HOUR - 1}px, rgba(0,0,0,0.04) ${PX_PER_HOUR}px)`
                      }}
                      onMouseDown={(e) => handleDayMouseDown(e, staff.id, dayIndex)}
                      onMouseMove={(e) => handleDayMouseMove(e, staff.id, dayIndex)}
                    >
                      {/* Hour labels */}
                      {[6, 9, 12, 15, 18, 21].map(hour => (
                        <div
                          key={hour}
                          className="absolute left-1 text-[10px] text-gray-400 pointer-events-none"
                          style={{ top: `${topFromMinutes(hour * 60)}px` }}
                        >
                          {hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`}
                        </div>
                      ))}

                      {/* Shift blocks */}
                      <div className={isDraggingThisCell ? 'pointer-events-none' : ''}>
                        {dayShifts.map(shift => {
                          if (!shift.startTime || !shift.endTime) return null;
                          const startMinutes = timeToMinutes(shift.startTime);
                          const endMinutes = timeToMinutes(shift.endTime);
                          const top = topFromMinutes(startMinutes);
                          const height = heightFromRange(startMinutes, endMinutes);
                          
                          return (
                            <div
                              key={shift.id}
                              className={`absolute left-0 right-0 mx-1 px-2 py-1 border rounded cursor-pointer transition-colors ${getShiftColor(shift.templateType)} hover:shadow-md`}
                              style={{ top: `${top}px`, height: `${height}px` }}
                              onClick={() => onShiftClick?.(shift)}
                            >
                              <div className="text-[10px] font-semibold truncate capitalize">
                                {shift.templateType.replace('-', ' ')}
                              </div>
                              <div className="text-[10px] truncate">
                                {shift.startTime} - {shift.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Drag selection overlay */}
                      {isDraggingThisCell && dragState && (
                        <div
                          className="absolute left-0 right-0 mx-1 bg-blue-200 border-2 border-blue-400 rounded opacity-50 pointer-events-none"
                          style={{
                            top: `${topFromMinutes(Math.min(dragState.startMinutes, dragState.endMinutes))}px`,
                            height: `${Math.abs(dragState.endMinutes - dragState.startMinutes) * PX_PER_MINUTE}px`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showShiftModal && (
        <ShiftModal
          shift={editingShift}
          defaultStaffId={editingShift?.assignedStaffId}
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
              Shift Type
            </label>
            <select
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value as 'front-desk' | 'event' | 'meeting' | 'other' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
                className="rounded border-gray-300 text-auvora-teal focus:ring-auvora-teal"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-auvora-teal focus:border-transparent"
              placeholder="Add any notes about this shift..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark"
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
