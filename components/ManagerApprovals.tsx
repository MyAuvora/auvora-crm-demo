'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { 
  getPendingSubstitutionRequests,
  getPendingTimeOffRequests,
  updateSubstitutionRequest,
  updateTimeOffRequest,
  getAllStaff
} from '@/lib/dataStore';
import { CheckCircle, XCircle, Clock, Calendar, UserX } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerApprovals() {
  const { location } = useApp();
  const [, setRefreshTrigger] = useState(0);
  
  const staff = getAllStaff();
  const currentManager = staff.find(s => s.location === location);
  
  const substitutionRequests = getPendingSubstitutionRequests(location);
  const timeOffRequests = getPendingTimeOffRequests(location);

  const handleApproveSubstitution = (requestId: string) => {
    const result = updateSubstitutionRequest(requestId, {
      status: 'approved',
      reviewedBy: currentManager?.id,
    });
    
    if (result.success) {
      alert('Substitution request approved!');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDenySubstitution = (requestId: string) => {
    const result = updateSubstitutionRequest(requestId, {
      status: 'denied',
      reviewedBy: currentManager?.id,
    });
    
    if (result.success) {
      alert('Substitution request denied.');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleApproveTimeOff = (requestId: string) => {
    const result = updateTimeOffRequest(requestId, {
      status: 'approved',
      reviewedBy: currentManager?.id,
    });
    
    if (result.success) {
      alert('Time off request approved!');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDenyTimeOff = (requestId: string) => {
    const result = updateTimeOffRequest(requestId, {
      status: 'denied',
      reviewedBy: currentManager?.id,
    });
    
    if (result.success) {
      alert('Time off request denied.');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve coach requests</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Substitution Requests</h2>
            <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {substitutionRequests.length} pending
            </span>
          </div>
        </div>
        <div className="p-6">
          {substitutionRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-3 text-gray-400" />
              <p>No pending substitution requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {substitutionRequests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.className}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.type === 'switch' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.type === 'switch' ? 'Switch Request' : 'Available for Sub'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Coach:</strong> {request.requestingCoachName}</p>
                        <p><strong>Date:</strong> {format(new Date(request.classDate), 'MMMM d, yyyy')}</p>
                        <p><strong>Time:</strong> {request.classTime}</p>
                        {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                        {request.targetCoachName && (
                          <p><strong>Requested Switch With:</strong> {request.targetCoachName}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Requested {format(new Date(request.createdDate), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
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
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserX size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Time Off Requests</h2>
            <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {timeOffRequests.length} pending
            </span>
          </div>
        </div>
        <div className="p-6">
          {timeOffRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-3 text-gray-400" />
              <p>No pending time off requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeOffRequests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.coachName}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Start Date:</strong> {format(new Date(request.startDate), 'MMMM d, yyyy')}</p>
                        <p><strong>End Date:</strong> {format(new Date(request.endDate), 'MMMM d, yyyy')}</p>
                        <p><strong>Reason:</strong> {request.reason}</p>
                        <p><strong>Affected Classes:</strong> {request.affectedClassIds.length} classes</p>
                        <p className="text-xs text-gray-500">
                          Requested {format(new Date(request.createdDate), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
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
          )}
        </div>
      </div>
    </div>
  );
}
