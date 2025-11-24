'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Class } from '@/lib/types';
import { getAllBookings, checkInMember, cancelBooking } from '@/lib/dataStore';

interface CheckInModalProps {
  classData: Class;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckInModal({ classData, onClose, onSuccess }: CheckInModalProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const bookings = getAllBookings().filter(b => b.classId === classData.id && b.status !== 'cancelled');

  const handleCheckIn = (bookingId: string) => {
    const result = checkInMember(bookingId);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
  };

  const handleCancel = (bookingId: string) => {
    const result = cancelBooking(bookingId);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Class Roster & Check-In</h2>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">{classData.name}</h3>
            <p className="text-gray-600">{classData.dayOfWeek} at {classData.time}</p>
            <p className="text-gray-600">
              {bookings.length} / {classData.capacity} booked
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="overflow-y-auto max-h-96">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings for this class yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Member</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Booked At</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{booking.memberName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                          booking.status === 'no-show' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {booking.status === 'checked-in' ? 'Checked In' :
                           booking.status === 'no-show' ? 'No Show' :
                           'Booked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(booking.bookedAt).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {booking.status === 'booked' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleCheckIn(booking.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                            >
                              <CheckCircle size={16} />
                              Check In
                            </button>
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {booking.status === 'checked-in' && (
                          <span className="text-green-600 font-medium">✓ Checked In</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
