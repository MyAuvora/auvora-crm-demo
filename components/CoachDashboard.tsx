'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { 
  getAllClasses, 
  getAllBookings, 
  getAllStaff,
  getCoachConversionStats,
  createSubstitutionRequest,
  createTimeOffRequest,
  getPersonById
} from '@/lib/dataStore';
import { Calendar, Users, TrendingUp, Clock, UserX, ArrowLeftRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import ProfileTabs from './ProfileTabs';
import SendTextModal from './SendTextModal';
import PersonStatusBadge from './PersonStatusBadge';

export default function CoachDashboard() {
  const { location } = useApp();
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [selectedClassForSub, setSelectedClassForSub] = useState<{ id: string; name: string; time: string; dayOfWeek: string } | null>(null);
  const [showSendTextModal, setShowSendTextModal] = useState(false);
  const [textRecipient, setTextRecipient] = useState<{ name: string; phone: string } | null>(null);
  
  const staff = getAllStaff();
  const locationCoaches = staff.filter(s => s.role === 'coach' && s.location === location);
  
  const defaultCoachId = locationCoaches.find(c => c.id === 'coach-1')?.id || locationCoaches[0]?.id || '';
  const [selectedCoachId, setSelectedCoachId] = useState(defaultCoachId);
  
  const currentCoach = staff.find(s => s.id === selectedCoachId);
  
  if (!currentCoach || locationCoaches.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Coach profile not found. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  const classes = getAllClasses().filter(c => c.location === location && c.coachId === currentCoach.id);
  const bookings = getAllBookings();
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = format(today, 'EEEE');
  
  const todaysClasses = classes.filter(c => c.dayOfWeek === dayOfWeek).map(cls => {
    const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
    return {
      ...cls,
      bookings: classBookings,
      bookedCount: classBookings.length,
    };
  });
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyClasses = daysOfWeek.map(day => {
    const dayClasses = classes.filter(c => c.dayOfWeek === day).map(cls => {
      const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
      return {
        ...cls,
        bookings: classBookings,
        bookedCount: classBookings.length,
      };
    });
    return { day, classes: dayClasses };
  });
  
  const wtdStart = format(weekStart, 'yyyy-MM-dd');
  const wtdEnd = format(weekEnd, 'yyyy-MM-dd');
  const mtdStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const mtdEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const ytdStart = format(startOfYear(today), 'yyyy-MM-dd');
  const ytdEnd = format(endOfYear(today), 'yyyy-MM-dd');
  
  const wtdStats = getCoachConversionStats(currentCoach.id, wtdStart, wtdEnd);
  const mtdStats = getCoachConversionStats(currentCoach.id, mtdStart, mtdEnd);
  const ytdStats = getCoachConversionStats(currentCoach.id, ytdStart, ytdEnd);

  const handleClassClick = (cls: { id: string; name: string; time: string; dayOfWeek: string }) => {
    setSelectedClassForSub(cls);
    setShowSubstitutionModal(true);
  };

  const handlePersonClick = (personId: string) => {
    setSelectedPersonId(personId);
    setShowProfileTabs(true);
  };

  const handleRequestSubstitution = (type: 'switch' | 'available') => {
    if (!selectedClassForSub) return;
    
    const result = createSubstitutionRequest({
      classId: selectedClassForSub.id,
      className: selectedClassForSub.name,
      classDate: todayStr,
      classTime: selectedClassForSub.time,
      requestingCoachId: currentCoach.id,
      requestingCoachName: currentCoach.name,
      type,
      location,
    });
    
    if (result.success) {
      alert(`Substitution request submitted! A manager will review it.`);
      setShowSubstitutionModal(false);
      setSelectedClassForSub(null);
    }
  };

  const handleRequestTimeOff = (startDate: string, endDate: string, reason: string) => {
    const affectedClasses = classes.map(c => c.id);
    
    const result = createTimeOffRequest({
      coachId: currentCoach.id,
      coachName: currentCoach.name,
      startDate,
      endDate,
      reason,
      affectedClassIds: affectedClasses,
      location,
    });
    
    if (result.success) {
      alert(`Time off request submitted! A manager will review it.`);
      setShowTimeOffModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {currentCoach.name}!</h1>
          <p className="text-gray-600 mt-1">Your personalized coach dashboard</p>
        </div>
        <div className="flex gap-3 items-center">
          {locationCoaches.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Viewing as:</label>
              <select
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                {locationCoaches.map(coach => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserX size={20} />
            Request Time Off
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Week to Date</h3>
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{wtdStats.conversionRate.toFixed(1)}%</div>
          <p className="text-sm text-gray-600 mt-1">
            {wtdStats.convertedLeads} of {wtdStats.totalLeads} leads converted
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Month to Date</h3>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{mtdStats.conversionRate.toFixed(1)}%</div>
          <p className="text-sm text-gray-600 mt-1">
            {mtdStats.convertedLeads} of {mtdStats.totalLeads} leads converted
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Year to Date</h3>
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{ytdStats.conversionRate.toFixed(1)}%</div>
          <p className="text-sm text-gray-600 mt-1">
            {ytdStats.convertedLeads} of {ytdStats.totalLeads} leads converted
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Today&apos;s Classes - {format(today, 'MMMM d, yyyy')}</h2>
            </div>
            <span className="text-sm text-gray-600">{todaysClasses.length} classes</span>
          </div>
        </div>
        <div className="p-6">
          {todaysClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 text-gray-400" />
              <p>No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysClasses.map(cls => (
                <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600">{cls.time} • {cls.duration} min • {cls.type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{cls.bookedCount}/{cls.capacity}</div>
                        <div className="text-xs text-gray-600">booked</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClassForSub(cls);
                          setShowSubstitutionModal(true);
                        }}
                        className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-2"
                      >
                        <ArrowLeftRight size={16} />
                        Request Sub
                      </button>
                    </div>
                  </div>
                  {cls.bookings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Booked Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {cls.bookings.map(booking => (
                          <button
                            key={booking.id}
                            onClick={() => handlePersonClick(booking.memberId)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 flex items-center gap-1.5"
                          >
                            <PersonStatusBadge personId={booking.memberId} />
                            {booking.memberName}
                            {booking.status === 'checked-in' && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">This Week&apos;s Schedule</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {weeklyClasses.map(({ day, classes: dayClasses }) => (
              <div key={day}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                {dayClasses.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-4">No classes scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map(cls => (
                      <div
                        key={cls.id}
                        className="ml-4 border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{cls.name}</span>
                            <span className="text-sm text-gray-600 ml-3">{cls.time} • {cls.duration} min</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                {cls.bookedCount}/{cls.capacity}
                              </span>
                              <Users size={16} className="text-gray-500" />
                            </div>
                            <button
                              onClick={() => handleClassClick(cls)}
                              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-1.5 text-sm"
                            >
                              <ArrowLeftRight size={14} />
                              Request Sub
                            </button>
                          </div>
                        </div>
                        {cls.bookings && cls.bookings.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1.5">Booked:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {cls.bookings.map((booking: { id: string; memberId: string; memberName: string; status: string }) => (
                                <button
                                  key={booking.id}
                                  onClick={() => handlePersonClick(booking.memberId)}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 flex items-center gap-1"
                                >
                                  <PersonStatusBadge personId={booking.memberId} className="w-4 h-4 text-[8px]" />
                                  {booking.memberName}
                                  {booking.status === 'checked-in' && (
                                    <span className="ml-1 text-green-600">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSubstitutionModal && selectedClassForSub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Request Substitution</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedClassForSub.name} - {selectedClassForSub.time}</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Choose how you&apos;d like to handle this class:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleRequestSubstitution('available')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left"
                >
                  <div className="font-medium">Make Available for Substitution</div>
                  <div className="text-sm text-blue-100 mt-1">Any coach can take this class</div>
                </button>
                <button
                  onClick={() => handleRequestSubstitution('switch')}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left"
                >
                  <div className="font-medium">Request Switch with Specific Coach</div>
                  <div className="text-sm text-purple-100 mt-1">Swap classes with another coach</div>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowSubstitutionModal(false);
                  setSelectedClassForSub(null);
                }}
                className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimeOffModal && (
        <TimeOffRequestModal
          coachName={currentCoach.name}
          onSubmit={handleRequestTimeOff}
          onClose={() => setShowTimeOffModal(false)}
        />
      )}

      {showProfileTabs && selectedPersonId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[66vh] overflow-hidden flex flex-col">
            <ProfileTabs
              personId={selectedPersonId}
              onClose={() => {
                setShowProfileTabs(false);
                setSelectedPersonId(null);
              }}
              onSendText={() => {
                const personData = getPersonById(selectedPersonId);
                if (personData) {
                  const { person } = personData;
                  setTextRecipient({
                    name: person.name,
                    phone: person.phone || '(555) 123-4567'
                  });
                  setShowSendTextModal(true);
                }
              }}
            />
          </div>
        </div>
      )}

      {showSendTextModal && textRecipient && (
        <SendTextModal
          recipientName={textRecipient.name}
          recipientPhone={textRecipient.phone}
          onClose={() => {
            setShowSendTextModal(false);
            setTextRecipient(null);
          }}
        />
      )}
    </div>
  );
}

function TimeOffRequestModal({ 
  coachName, 
  onSubmit, 
  onClose 
}: { 
  coachName: string; 
  onSubmit: (startDate: string, endDate: string, reason: string) => void; 
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!startDate || !endDate || !reason) {
      alert('Please fill in all fields');
      return;
    }
    
    if (startDate > endDate) {
      alert('End date must be after start date');
      return;
    }
    
    onSubmit(startDate, endDate, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Request Time Off</h2>
          <p className="text-sm text-gray-600 mt-1">{coachName}</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vacation, personal, medical, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Submit Request
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
