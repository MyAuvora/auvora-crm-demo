'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllStaff, getAllStaffShifts, createStaffTimeOffRequest, createShiftSwapRequest } from '@/lib/dataStore';
import { StaffShift } from '@/lib/types';
import { Calendar, Clock, Users } from 'lucide-react';

interface StaffScheduleViewProps {
  staffId: string;
  staffName: string;
}

export default function StaffScheduleView({ staffId, staffName }: StaffScheduleViewProps) {
  const { location } = useApp();
  const [viewMode, setViewMode] = useState<'my-schedule' | 'team-schedule'>('my-schedule');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);

  const allShifts = getAllStaffShifts();
  const locationShifts = allShifts.filter(s => s.location === location);
  const locationStaff = getAllStaff().filter(s => s.location === location);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', 
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  const expandShiftsForWeek = () => {
    const expanded: Array<StaffShift & { displayDate?: string }> = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    const shiftsToShow = viewMode === 'my-schedule' 
      ? locationShifts.filter(s => s.assignedStaffId === staffId)
      : locationShifts;

    shiftsToShow.forEach(shift => {
      if (shift.recurrence.type === 'weekly' && shift.recurrence.dayOfWeek !== undefined) {
        const dayIndex = shift.recurrence.dayOfWeek;
        const shiftDate = new Date(startOfWeek);
        shiftDate.setDate(startOfWeek.getDate() + (dayIndex === 0 ? 6 : dayIndex - 1));
        
        const dateStr = shiftDate.toISOString().split('T')[0];
        if (!shift.recurrence.exDates?.includes(dateStr)) {
          expanded.push({
            ...shift,
            displayDate: dateStr,
            startTime: shift.recurrence.startTime,
            endTime: shift.recurrence.endTime,
          });
        }
      } else if (shift.recurrence.type === 'none' && shift.date) {
        const shiftDate = new Date(shift.date);
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

  const expandedShifts = expandShiftsForWeek();

  const getShiftsForDayAndTime = (day: string, time: string) => {
    const dayIndex = daysOfWeek.indexOf(day);
    return expandedShifts.filter(shift => {
      if (shift.recurrence.type === 'weekly') {
        const shiftDayIndex = shift.recurrence.dayOfWeek;
        return shiftDayIndex === (dayIndex === 6 ? 0 : dayIndex + 1) && 
               shift.recurrence.startTime === time;
      } else if (shift.date) {
        const shiftDate = new Date(shift.date);
        const shiftDay = daysOfWeek[shiftDate.getDay() === 0 ? 6 : shiftDate.getDay() - 1];
        return shiftDay === day && shift.startTime === time;
      }
      return false;
    });
  };

  const getShiftColor = (templateType: string) => {
    switch (templateType) {
      case 'front-desk':
        return 'bg-blue-50 border-blue-200';
      case 'event':
        return 'bg-purple-50 border-purple-200';
      case 'meeting':
        return 'bg-green-50 border-green-200';
      case 'other':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleRequestTimeOff = () => {
    setShowTimeOffModal(true);
  };

  const handleRequestSwap = (shift: StaffShift) => {
    setSelectedShift(shift);
    setShowSwapModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
          <p className="text-sm text-gray-600 mt-1">View your shifts and request changes</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('my-schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'my-schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                My Schedule
              </div>
            </button>
            <button
              onClick={() => setViewMode('team-schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'team-schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                Team Schedule
              </div>
            </button>
          </div>
          <button
            onClick={handleRequestTimeOff}
            className="px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)] flex items-center gap-2"
          >
            <Clock size={16} />
            Request Time Off
          </button>
        </div>
      </div>

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
                    return (
                      <td key={day} className="px-1 py-1 border-r border-gray-200 last:border-r-0 align-top">
                        {dayShifts.map(shift => (
                          <div
                            key={shift.id}
                            className={`mb-1 p-2 border rounded ${getShiftColor(shift.templateType)}`}
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
                              {viewMode === 'my-schedule' && shift.assignedStaffId === staffId && (
                                <button
                                  onClick={() => handleRequestSwap(shift)}
                                  className="text-xs text-[rgb(172,19,5)] hover:underline"
                                >
                                  Swap
                                </button>
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

      {showTimeOffModal && (
        <TimeOffRequestModal
          staffId={staffId}
          staffName={staffName}
          onClose={() => setShowTimeOffModal(false)}
          onSave={() => {
            setShowTimeOffModal(false);
          }}
        />
      )}

      {showSwapModal && selectedShift && (
        <ShiftSwapRequestModal
          shift={selectedShift}
          staffId={staffId}
          staffName={staffName}
          onClose={() => {
            setShowSwapModal(false);
            setSelectedShift(null);
          }}
          onSave={() => {
            setShowSwapModal(false);
            setSelectedShift(null);
          }}
        />
      )}
    </div>
  );
}

function TimeOffRequestModal({ staffId, staffName, onClose, onSave }: { 
  staffId: string; 
  staffName: string; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const { location } = useApp();
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allShifts = getAllStaffShifts();
    const affectedShifts = allShifts.filter(shift => {
      if (shift.assignedStaffId !== staffId) return false;
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (shift.recurrence.type === 'weekly') {
        return true;
      } else if (shift.date) {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startDate && shiftDate <= endDate;
      }
      return false;
    });

    createStaffTimeOffRequest({
      staffId,
      staffName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      affectedShiftIds: affectedShifts.map(s => s.id),
      location,
    });
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Request Time Off</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              placeholder="Please provide a reason for your time off request..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              Submit Request
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

function ShiftSwapRequestModal({ shift, staffId, staffName, onClose, onSave }: { 
  shift: StaffShift;
  staffId: string; 
  staffName: string; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const { location } = useApp();
  const locationStaff = getAllStaff().filter(s => s.location === location && s.id !== staffId);
  
  const [formData, setFormData] = useState({
    kind: 'open' as 'open' | 'direct',
    targetStaffId: '',
    reason: '',
    shiftDate: shift.date || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetStaff = locationStaff.find(s => s.id === formData.targetStaffId);
    const shiftTime = shift.startTime && shift.endTime 
      ? `${shift.startTime} - ${shift.endTime}`
      : shift.recurrence.startTime && shift.recurrence.endTime
      ? `${shift.recurrence.startTime} - ${shift.recurrence.endTime}`
      : 'TBD';

    createShiftSwapRequest({
      shiftId: shift.id,
      shiftDate: formData.shiftDate,
      shiftTime,
      requesterId: staffId,
      requesterName: staffName,
      kind: formData.kind,
      targetStaffId: formData.kind === 'direct' ? formData.targetStaffId : undefined,
      targetStaffName: formData.kind === 'direct' ? targetStaff?.name : undefined,
      reason: formData.reason,
      location,
    });
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Request Shift Swap</h2>
          <p className="text-sm text-gray-600 mt-1">
            {shift.templateType.replace('-', ' ')} - {shift.startTime || shift.recurrence.startTime} to {shift.endTime || shift.recurrence.endTime}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Date
            </label>
            <input
              type="date"
              value={formData.shiftDate}
              onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Swap Type
            </label>
            <select
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as 'open' | 'direct' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
            >
              <option value="open">Open to Anyone</option>
              <option value="direct">Request Specific Person</option>
            </select>
          </div>

          {formData.kind === 'direct' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Swap With
              </label>
              <select
                value={formData.targetStaffId}
                onChange={(e) => setFormData({ ...formData, targetStaffId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
                required
              >
                <option value="">Select staff member...</option>
                {locationStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[rgb(172,19,5)] focus:border-transparent"
              placeholder="Please provide a reason for your swap request..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)]"
            >
              Submit Request
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
