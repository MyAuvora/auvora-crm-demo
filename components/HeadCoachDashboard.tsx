'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { 
  Users, TrendingUp, Calendar, CheckCircle, XCircle, Clock,
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Trash2
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
  deleteClass
} from '@/lib/dataStore';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

type TimeRange = 'WTD' | 'MTD' | 'YTD';
type SortField = 'name' | 'conversionRate' | 'averageClassSize';
type SortDirection = 'asc' | 'desc';

export default function HeadCoachDashboard() {
  const { location } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('MTD');
  const [sortField, setSortField] = useState<SortField>('conversionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);
  const [showScheduleManager, setShowScheduleManager] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coaching Operations</h1>
          <p className="text-gray-600 mt-1">Team performance, approvals, and schedule management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['WTD', 'MTD', 'YTD'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Team Conversion Rate</h3>
              <p className="text-3xl font-bold text-gray-900">{teamConversion.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{teamConversion.convertedLeads} of {teamConversion.totalLeads} leads converted</span>
            <span className="text-gray-400">{timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Average Class Size</h3>
              <p className="text-3xl font-bold text-gray-900">{teamClassSize.averageSize.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
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
                            <p className="text-lg font-bold text-gray-900">{coach.totalClasses}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                            <p className="text-lg font-bold text-gray-900">{coach.totalBookings}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Leads Worked With</p>
                            <p className="text-lg font-bold text-gray-900">{coach.totalLeads}</p>
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
    </div>
  );
}
