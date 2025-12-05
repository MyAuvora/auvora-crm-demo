'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllStaff, getAllClasses, addStaff, updateStaff, deleteStaff } from '@/lib/dataStore';
import { UserCog, Award, Plus, Edit2, X } from 'lucide-react';
import { Staff } from '@/lib/types';

export default function StaffSection() {
  const { location } = useApp();
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [, setRefreshTrigger] = useState(0);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'coach' as 'head-coach' | 'coach' | 'instructor' | 'front-desk' | 'manager',
    specialties: '',
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'coach' as 'head-coach' | 'coach' | 'instructor' | 'front-desk' | 'manager',
    specialties: '',
  });

  const locationStaff = getAllStaff().filter(s => s.location === location);
  const locationClasses = getAllClasses().filter(c => c.location === location);

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
    setEditForm({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      specialties: staffMember.specialties?.join(', ') || staffMember.styles?.join(', ') || '',
    });
    setShowEditStaffModal(true);
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleSaveNewStaff = () => {
    if (!newStaff.name || !newStaff.email) {
      alert('Please fill in name and email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    const specialtiesArray = newStaff.specialties
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const staffData: Omit<Staff, 'id'> = {
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      location,
    };
    
    if (location === 'athletic-club' && specialtiesArray.length > 0) {
      staffData.specialties = specialtiesArray;
    } else if (location === 'dance-studio' && specialtiesArray.length > 0) {
      staffData.styles = specialtiesArray;
    }
    
    addStaff(staffData);
    
    setNewStaff({
      name: '',
      email: '',
      role: 'coach',
      specialties: '',
    });
    setShowAddStaffModal(false);
    handleRefresh();
  };
  
  const handleSaveEditStaff = () => {
    if (!editingStaff || !editForm.name || !editForm.email) {
      alert('Please fill in name and email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    const specialtiesArray = editForm.specialties
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const updates: Partial<Omit<Staff, 'id'>> = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
    };
    
    if (location === 'athletic-club' && specialtiesArray.length > 0) {
      updates.specialties = specialtiesArray;
    } else if (location === 'dance-studio' && specialtiesArray.length > 0) {
      updates.styles = specialtiesArray;
    }
    
    updateStaff(editingStaff.id, updates);
    
    setShowEditStaffModal(false);
    setEditingStaff(null);
    handleRefresh();
  };
  
  const handleDeleteStaff = (staffId: string) => {
    const staffClasses = locationClasses.filter(c => c.coachId === staffId);
    if (staffClasses.length > 0) {
      alert(`Cannot delete staff member who is assigned to ${staffClasses.length} class(es). Please reassign or delete those classes first.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(staffId);
      setShowEditStaffModal(false);
      setEditingStaff(null);
      handleRefresh();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coaches & Staff</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your team and view performance</p>
        </div>
        <button
          onClick={() => setShowAddStaffModal(true)}
          className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {locationStaff.map(member => {
          const metrics = member.role !== 'front-desk' ? getStaffMetrics(member.id) : null;
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditStaff(member)}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                    <UserCog className="text-red-600" size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 capitalize">{member.role.replace('-', ' ')}</p>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Staff Member</h2>
              <button onClick={() => setShowAddStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as 'head-coach' | 'coach' | 'instructor' | 'front-desk' | 'manager' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="head-coach">Head Coach</option>
                    <option value="coach">Coach</option>
                    <option value="instructor">Instructor</option>
                    <option value="front-desk">Front Desk</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {location === 'athletic-club' ? 'Specialties' : 'Dance Styles'} (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newStaff.specialties}
                    onChange={(e) => setNewStaff({ ...newStaff, specialties: e.target.value })}
                    placeholder={location === 'athletic-club' ? 'strength, conditioning, beginners' : 'ballet, hip-hop, contemporary'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveNewStaff}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select 
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'head-coach' | 'coach' | 'instructor' | 'front-desk' | 'manager' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="head-coach">Head Coach</option>
                    <option value="coach">Coach</option>
                    <option value="instructor">Instructor</option>
                    <option value="front-desk">Front Desk</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {location === 'athletic-club' ? 'Specialties' : 'Dance Styles'} (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.specialties}
                    onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEditStaff}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => handleDeleteStaff(editingStaff.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
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
