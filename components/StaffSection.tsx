'use client';

import { useApp } from '@/lib/context';
import { staff, classes } from '@/data/seedData';
import { UserCog, Award } from 'lucide-react';

export default function StaffSection() {
  const { location } = useApp();

  const locationStaff = staff.filter(s => s.location === location);
  const locationClasses = classes.filter(c => c.location === location);

  const getStaffMetrics = (staffId: string) => {
    const staffClasses = locationClasses.filter(c => c.coachId === staffId);
    const totalClasses = staffClasses.length;
    const avgClassSize = totalClasses > 0
      ? Math.round(staffClasses.reduce((sum, c) => sum + c.bookedCount, 0) / totalClasses)
      : 0;
    
    return { totalClasses, avgClassSize };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coaches & Staff</h1>
        <p className="text-gray-600 mt-1">Manage your team and view performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationStaff.map(member => {
          const metrics = member.role !== 'front-desk' ? getStaffMetrics(member.id) : null;
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-full">
                    <UserCog className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{member.role.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">{member.email}</p>
                </div>

                {member.specialties && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.styles && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dance Styles</p>
                    <div className="flex flex-wrap gap-2">
                      {member.styles.map((style, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {metrics && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-yellow-500" size={16} />
                      <p className="text-sm font-medium text-gray-700">Performance</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Classes/Week</p>
                        <p className="text-lg font-bold text-gray-900">{metrics.totalClasses}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Avg Size</p>
                        <p className="text-lg font-bold text-gray-900">{metrics.avgClassSize}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
