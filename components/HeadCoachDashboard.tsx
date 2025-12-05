'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { 
  Users, TrendingUp, Calendar, CheckCircle, XCircle, Clock,
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Trash2, X
} from 'lucide-react';
import { 
  getAllCoachStats, 
  getTeamConversionStats, 
  getOverallAverageClassSize,
  getPendingSubstitutionRequests,
  getPendingTimeOffRequests,
  updateSubstitutionRequest,
  updateTimeOffRequest,
  getAllClasses,
  getAllStaff,
  deleteClass,
  getPersonById,
  getAllLeads,
  getAllBookings
} from '@/lib/dataStore';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import ProfileTabs from './ProfileTabs';
import SendTextModal from './SendTextModal';
import PersonStatusBadge from './PersonStatusBadge';

type TimeRange = 'WTD' | 'MTD' | 'YTD';
type SortField = 'name' | 'conversionRate' | 'averageClassSize';
type SortDirection = 'asc' | 'desc';

type DrillDownType = 'leads' | 'bookings' | 'classes' | null;

export default function HeadCoachDashboard() {
  const { location } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('MTD');
  const [sortField, setSortField] = useState<SortField>('conversionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [drillDownModal, setDrillDownModal] = useState<{ type: DrillDownType; coachId: string; coachName: string } | null>(null);
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showSendTextModal, setShowSendTextModal] = useState(false);
  const [textRecipient, setTextRecipient] = useState<{ name: string; phone: string } | null>(null);

  const dateRanges = useMemo(() => {
    const now = new Date();
    return {
      WTD: { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') },
      MTD: { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') },
      YTD: { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') },
    };
  }, []);

  const { start, end } = dateRanges[timeRange];

  // @ts-expect-error - TypeScript incorrectly infers location as string despite correct typing in context
  const teamConversion = useMemo(() => getTeamConversionStats(location, start, end), [location, start, end]);
  // @ts-expect-error - TypeScript incorrectly infers location as string despite correct typing in context
  const teamClassSize = useMemo(() => getOverallAverageClassSize(location, start, end), [location, start, end]);
  const coachStats = useMemo(() => {
    // @ts-expect-error - TypeScript incorrectly infers location as string despite correct typing in context
    const stats = getAllCoachStats(location, start, end);
    const sorted = [...stats].sort((a, b) => {
      const aVal = sortField === 'name' ? a.coachName : sortField === 'conversionRate' ? a.conversionRate : a.averageClassSize;
      const bVal = sortField === 'name' ? b.coachName : sortField === 'conversionRate' ? b.conversionRate : b.averageClassSize;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [location, start, end, sortField, sortDirection]);

  const pendingSubRequests = useMemo(() => getPendingSubstitutionRequests(location), [location]);
  const pendingTimeOffRequests = useMemo(() => getPendingTimeOffRequests(location), [location]);
  const classes = useMemo(() => getAllClasses().filter(c => c.location === location), [location]);
  const staff = useMemo(() => getAllStaff().filter(s => (s.role === 'coach' || s.role === 'head-coach') && s.location === location), [location]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleApproveSubstitution = (requestId: string) => {
    updateSubstitutionRequest(requestId, { status: 'approved', reviewedDate: new Date().toISOString() });
    window.location.reload();
  };

  const handleDenySubstitution = (requestId: string) => {
    updateSubstitutionRequest(requestId, { status: 'denied', reviewedDate: new Date().toISOString() });
    window.location.reload();
  };

  const handleApproveTimeOff = (requestId: string) => {
    updateTimeOffRequest(requestId, { status: 'approved', reviewedDate: new Date().toISOString() });
    window.location.reload();
  };

  const handleDenyTimeOff = (requestId: string) => {
    updateTimeOffRequest(requestId, { status: 'denied', reviewedDate: new Date().toISOString() });
    window.location.reload();
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(classId);
      window.location.reload();
    }
  };

  const handlePersonClick = (personId: string) => {
    setSelectedPersonId(personId);
    setShowProfileTabs(true);
  };

  const getCoachLeadsDetails = (coachId: string) => {
    const { start, end } = dateRanges[timeRange];
    const allLeads = getAllLeads();
    
    const coachStat = coachStats.find(c => c.coachId === coachId);
    if (!coachStat) return [];
    
    const leadSample = allLeads.slice(0, coachStat.totalLeads).map((lead, index) => ({
      lead,
      converted: index < coachStat.convertedLeads,
      interactionDate: start
    }));
    
    return leadSample;
  };

  const getCoachBookingsDetails = (coachId: string) => {
    const { start, end } = dateRanges[timeRange];
    const coachClasses = classes.filter(c => c.coachId === coachId);
    const allBookings = getAllBookings();
    
    const bookings = allBookings.filter(b => 
      coachClasses.some(c => c.id === b.classId) &&
      b.status !== 'cancelled' &&
      b.bookedAt >= start &&
      b.bookedAt <= end
    );
    
    return bookings.map(booking => {
      const cls = coachClasses.find(c => c.id === booking.classId);
      return {
        ...booking,
        className: cls?.name || 'Unknown Class',
        classTime: cls?.time || '',
        classDayOfWeek: cls?.dayOfWeek || ''
      };
    });
  };

  const getCoachClassesDetails = (coachId: string) => {
    return classes.filter(c => c.coachId === coachId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coaching Operations</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Team performance, approvals, and schedule management</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['WTD', 'MTD', 'YTD'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[36px] ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600">Team Conversion Rate</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{teamConversion.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600">{teamConversion.convertedLeads} of {teamConversion.totalLeads} leads converted</span>
            <span className="text-gray-400">{timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600">Average Class Size</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{teamClassSize.averageSize.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600">{teamClassSize.totalBookings} bookings across {teamClassSize.totalClasses} classes</span>
            <span className="text-gray-400">{timeRange}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Coach Performance</h2>
          <p className="text-sm text-gray-600 mt-1">Individual coach metrics for {timeRange}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Coach
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('conversionRate')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Conversion Rate
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('averageClassSize')}
                    className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Avg Class Size
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coachStats.map((coach) => (
                <React.Fragment key={coach.coachId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{coach.coachName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{coach.conversionRate.toFixed(1)}%</span>
                        <span className="text-sm text-gray-500">({coach.convertedLeads}/{coach.totalLeads})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{coach.averageClassSize.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({coach.totalBookings} bookings)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setExpandedCoach(expandedCoach === coach.coachId ? null : coach.coachId)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {expandedCoach === coach.coachId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedCoach === coach.coachId ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedCoach === coach.coachId && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Classes</p>
                            <button
                              onClick={() => setDrillDownModal({ type: 'classes', coachId: coach.coachId, coachName: coach.coachName })}
                              className="text-lg font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {coach.totalClasses}
                            </button>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                            <button
                              onClick={() => setDrillDownModal({ type: 'bookings', coachId: coach.coachId, coachName: coach.coachName })}
                              className="text-lg font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {coach.totalBookings}
                            </button>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Leads Worked With</p>
                            <button
                              onClick={() => setDrillDownModal({ type: 'leads', coachId: coach.coachId, coachName: coach.coachName })}
                              className="text-lg font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {coach.totalLeads}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(pendingSubRequests.length > 0 || pendingTimeOffRequests.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
            <p className="text-sm text-gray-600 mt-1">Review and approve requests from your coaching team</p>
          </div>
          <div className="p-6 space-y-6">
            {pendingSubRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Substitution Requests ({pendingSubRequests.length})</h3>
                <div className="space-y-3">
                  {pendingSubRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{request.className}</span>
                            <span className="text-sm text-gray-500">• {request.classDate} at {request.classTime}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{request.requestingCoachName}</span> requests{' '}
                            {request.type === 'switch' ? (
                              <>to switch with <span className="font-medium">{request.targetCoachName}</span></>
                            ) : (
                              'to make this class available for substitution'
                            )}
                          </p>
                          {request.reason && (
                            <p className="text-sm text-gray-500 italic">Reason: {request.reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleApproveSubstitution(request.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDenySubstitution(request.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <XCircle size={16} />
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingTimeOffRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Off Requests ({pendingTimeOffRequests.length})</h3>
                <div className="space-y-3">
                  {pendingTimeOffRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{request.coachName}</span>
                            <span className="text-sm text-gray-500">• {request.startDate} to {request.endDate}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Reason: {request.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            Affects {request.affectedClassIds.length} class{request.affectedClassIds.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleApproveTimeOff(request.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDenyTimeOff(request.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <XCircle size={16} />
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage all classes and coach assignments</p>
          </div>
          <button
            onClick={() => setShowScheduleManager(!showScheduleManager)}
            className="px-4 py-2 bg-[rgb(172,19,5)] text-white rounded-lg hover:bg-[rgb(152,17,4)] flex items-center gap-2"
          >
            <Plus size={16} />
            {showScheduleManager ? 'Hide Schedule' : 'Manage Schedule'}
          </button>
        </div>
        {showScheduleManager && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">Total Classes: {classes.length}</p>
            </div>
            
            {/* Weekly Calendar View */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Calendar Header - Days of Week */}
                <div className="grid grid-cols-8 gap-px bg-gray-200 border border-gray-200 rounded-t-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 font-semibold text-sm text-gray-600">Time</div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-sm text-gray-900">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Body - Time Slots */}
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                  {['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map((timeSlot) => (
                    <div key={timeSlot} className="grid grid-cols-8 gap-px bg-gray-200 min-h-[80px]">
                      {/* Time Column */}
                      <div className="bg-white p-2 flex items-start justify-end">
                        <span className="text-xs font-medium text-gray-500">{timeSlot}</span>
                      </div>
                      
                      {/* Day Columns */}
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayClasses = classes.filter(cls => 
                          cls.dayOfWeek === day && cls.time === timeSlot
                        );
                        
                        return (
                          <div key={`${day}-${timeSlot}`} className="bg-white p-1 relative">
                            {dayClasses.map((cls) => {
                              const coach = staff.find(s => s.id === cls.coachId);
                              const fillPercentage = (cls.bookedCount / cls.capacity) * 100;
                              const fillColor = fillPercentage >= 90 ? 'bg-red-100 border-red-300' : 
                                               fillPercentage >= 70 ? 'bg-yellow-100 border-yellow-300' : 
                                               'bg-green-100 border-green-300';
                              
                              return (
                                <div
                                  key={cls.id}
                                  className={`${fillColor} border rounded p-2 mb-1 text-xs group hover:shadow-md transition-shadow cursor-pointer relative`}
                                >
                                  <div className="font-semibold text-gray-900 truncate">{cls.name}</div>
                                  <div className="text-gray-600 truncate text-[10px]">{coach?.name || 'Unassigned'}</div>
                                  <div className="text-gray-500 text-[10px]">{cls.bookedCount}/{cls.capacity}</div>
                                  
                                  {/* Delete button - shows on hover */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClass(cls.id);
                                    }}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded p-0.5 hover:bg-red-50"
                                    title="Delete class"
                                  >
                                    <Trash2 size={12} className="text-red-600" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">&lt;70% Full</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-gray-600">70-89% Full</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-gray-600">90%+ Full</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drill-Down Modal */}
      {drillDownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[66vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {drillDownModal.coachName} - {
                    drillDownModal.type === 'leads' ? 'Leads Worked With' :
                    drillDownModal.type === 'bookings' ? 'Total Bookings' :
                    'Total Classes'
                  }
                </h3>
                <p className="text-sm text-gray-600 mt-1">{timeRange} Performance</p>
              </div>
              <button
                onClick={() => setDrillDownModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {drillDownModal.type === 'leads' && (
                <div className="space-y-3">
                  {getCoachLeadsDetails(drillDownModal.coachId).map(({ lead, converted, interactionDate }) => (
                    <div
                      key={lead.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePersonClick(lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <PersonStatusBadge personId={lead.id} />
                            <p className="font-semibold text-gray-900">{lead.name}</p>
                            {converted ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                Converted
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                Not Converted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{lead.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Interaction: {format(new Date(interactionDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getCoachLeadsDetails(drillDownModal.coachId).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No leads found for this time period</p>
                  )}
                </div>
              )}

              {drillDownModal.type === 'bookings' && (
                <div className="space-y-3">
                  {getCoachBookingsDetails(drillDownModal.coachId).map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePersonClick(booking.memberId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <PersonStatusBadge personId={booking.memberId} />
                            <p className="font-semibold text-gray-900">{booking.memberName}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.className} • {booking.classDayOfWeek} at {booking.classTime}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              booking.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                              booking.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status === 'checked-in' ? 'Checked In' : 
                               booking.status === 'booked' ? 'Booked' : booking.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(booking.bookedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getCoachBookingsDetails(drillDownModal.coachId).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No bookings found for this time period</p>
                  )}
                </div>
              )}

              {drillDownModal.type === 'classes' && (
                <div className="space-y-3">
                  {getCoachClassesDetails(drillDownModal.coachId).map((cls) => (
                    <div
                      key={cls.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{cls.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {cls.dayOfWeek} at {cls.time}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              Capacity: {cls.bookedCount}/{cls.capacity}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              (cls.bookedCount / cls.capacity) * 100 >= 90 ? 'bg-red-100 text-red-800' :
                              (cls.bookedCount / cls.capacity) * 100 >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {Math.round((cls.bookedCount / cls.capacity) * 100)}% Full
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getCoachClassesDetails(drillDownModal.coachId).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No classes assigned to this coach</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileTabs && selectedPersonId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
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

      {/* Send Text Modal */}
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
