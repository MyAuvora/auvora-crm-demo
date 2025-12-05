'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { 
  getAllStaffTimeOffRequests, 
  getAllShiftSwapRequests,
  approveStaffTimeOffRequest,
  rejectStaffTimeOffRequest,
  approveShiftSwapRequest,
  rejectShiftSwapRequest,
  getAllStaff
} from '@/lib/dataStore';
import { Clock, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function StaffScheduleApprovals() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'time-off' | 'swaps'>('time-off');
  const [, setRefreshTrigger] = useState(0);

  const allTimeOffRequests = getAllStaffTimeOffRequests();
  const allSwapRequests = getAllShiftSwapRequests();
  const allStaff = getAllStaff();

  const locationTimeOffRequests = allTimeOffRequests.filter(r => r.location === location);
  const locationSwapRequests = allSwapRequests.filter(r => r.location === location);

  const pendingTimeOff = locationTimeOffRequests.filter(r => r.status === 'pending');
  const pendingSwaps = locationSwapRequests.filter(r => r.status === 'pending');

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleApproveTimeOff = (requestId: string) => {
    approveStaffTimeOffRequest(requestId, 'manager-demo');
    handleRefresh();
  };

  const handleRejectTimeOff = (requestId: string) => {
    rejectStaffTimeOffRequest(requestId, 'manager-demo');
    handleRefresh();
  };

  const handleApproveSwap = (requestId: string) => {
    approveShiftSwapRequest(requestId, 'manager-demo');
    handleRefresh();
  };

  const handleRejectSwap = (requestId: string) => {
    rejectShiftSwapRequest(requestId, 'manager-demo');
    handleRefresh();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Staff Schedule Requests</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Review and approve time-off and shift swap requests</p>
        </div>
        <div className="flex gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('time-off')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'time-off' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock size={14} className="sm:w-4 sm:h-4" />
              Time Off ({pendingTimeOff.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'swaps' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users size={14} className="sm:w-4 sm:h-4" />
              Shift Swaps ({pendingSwaps.length})
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'time-off' ? (
        <div className="space-y-3">
          {pendingTimeOff.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
              <Clock size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No pending time-off requests</p>
            </div>
          ) : (
            pendingTimeOff.map(request => (
              <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.staffName}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Pending
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span> {request.reason}
                      </div>
                      <div>
                        <span className="font-medium">Affected Shifts:</span> {request.affectedShiftIds.length} shift(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        Requested on {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleApproveTimeOff(request.id)}
                      className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectTimeOff(request.id)}
                      className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                    >
                      <XCircle size={16} />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pendingSwaps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No pending shift swap requests</p>
            </div>
          ) : (
            pendingSwaps.map(request => (
              <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.requesterName}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Pending
                      </span>
                      {request.kind === 'direct' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Direct Swap
                        </span>
                      )}
                      {request.kind === 'open' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          Open to Anyone
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{formatDate(request.shiftDate)} at {request.shiftTime}</span>
                      </div>
                      {request.kind === 'direct' && request.targetStaffName && (
                        <div>
                          <span className="font-medium">Requesting swap with:</span> {request.targetStaffName}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Reason:</span> {request.reason}
                      </div>
                      <div className="text-xs text-gray-500">
                        Requested on {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveSwap(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectSwap(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Decisions</h3>
        <div className="space-y-2">
          {activeTab === 'time-off' ? (
            locationTimeOffRequests
              .filter(r => r.status !== 'pending')
              .slice(0, 5)
              .map(request => (
                <div key={request.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{request.staffName}</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'approved' ? 'Approved' : 'Denied'}
                    </span>
                  </div>
                </div>
              ))
          ) : (
            locationSwapRequests
              .filter(r => r.status !== 'pending')
              .slice(0, 5)
              .map(request => (
                <div key={request.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{request.requesterName}</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(request.shiftDate)} at {request.shiftTime}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
