'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { staff, classes } from '@/data/seedData';
import { UserCog, Award, Plus, Edit2, X } from 'lucide-react';
import { Staff } from '@/lib/types';

export default function StaffSection() {
  const { location } = useApp();
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

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

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setShowEditStaffModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coaches & Staff</h1>
          <p className="text-gray-600 mt-1">Manage your team and view performance</p>
        </div>
        <button
          onClick={() => setShowAddStaffModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationStaff.map(member => {
          const metrics = member.role !== 'front-desk' ? getStaffMetrics(member.id) : null;
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditStaff(member)}>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStaff(member);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
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

      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Staff Member</h2>
              <button onClick={() => setShowAddStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="coach">Coach</option>
                    <option value="instructor">Instructor</option>
                    <option value="front-desk">Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="strength, conditioning, beginners"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    alert('Staff member added! (Full save functionality coming soon)');
                    setShowAddStaffModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Add Staff Member
                </button>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditStaffModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Staff Member</h2>
              <button onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={editingStaff.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={editingStaff.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select defaultValue={editingStaff.role} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="coach">Coach</option>
                    <option value="instructor">Instructor</option>
                    <option value="front-desk">Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma-separated)</label>
                  <input
                    type="text"
                    defaultValue={editingStaff.specialties?.join(', ') || editingStaff.styles?.join(', ') || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    alert('Staff member updated! (Full save functionality coming soon)');
                    setShowEditStaffModal(false);
                    setEditingStaff(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
