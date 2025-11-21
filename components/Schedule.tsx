'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { classes, staff } from '@/data/seedData';
import { X } from 'lucide-react';

export default function Schedule() {
  const { location } = useApp();
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const locationClasses = classes.filter(c => c.location === location);
  const locationStaff = staff.filter(s => s.location === location);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getStaffName = (coachId: string) => {
    const staffMember = locationStaff.find(s => s.id === coachId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule & Classes</h1>
        <p className="text-gray-600 mt-1">View and manage class schedules</p>
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Instructor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {daysOfWeek.map(day => {
                  const dayClasses = locationClasses.filter(c => c.dayOfWeek === day);
                  if (dayClasses.length === 0) return null;
                  
                  return dayClasses.map((cls, idx) => (
                    <tr
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{day}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{cls.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{cls.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cls.duration} min</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getStaffName(cls.coachId)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${
                          cls.bookedCount >= cls.capacity * 0.9 ? 'text-red-600' :
                          cls.bookedCount >= cls.capacity * 0.7 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {cls.bookedCount} / {cls.capacity}
                        </span>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
          >
            <X size={20} />
            <span>Back to schedule</span>
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h2>
              <p className="text-gray-600 mt-1">{selectedClass.dayOfWeek} at {selectedClass.time}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">{selectedClass.duration} minutes</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Instructor</p>
                <p className="text-xl font-bold text-gray-900">{getStaffName(selectedClass.coachId)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-xl font-bold text-gray-900">{selectedClass.bookedCount} / {selectedClass.capacity}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Booked Members</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  {selectedClass.bookedCount} members are booked for this class.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
