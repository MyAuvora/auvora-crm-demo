'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Send, Building2, Check } from 'lucide-react';
import { getFranchiseLocations } from '@/lib/dataStore';

interface FranchisePromo {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  targetLocations: string[]; // 'all' or specific location IDs
  status: 'draft' | 'active' | 'scheduled' | 'expired';
  createdDate: string;
}

export default function FranchisorPromos() {
  const franchiseLocations = getFranchiseLocations();
  const [promos, setPromos] = useState<FranchisePromo[]>([
    {
      id: '1',
      name: 'New Year Kickstart',
      description: '50% off first month for new members',
      discountType: 'percentage',
      discountValue: 50,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      targetLocations: ['all'],
      status: 'scheduled',
      createdDate: '2024-12-01'
    },
    {
      id: '2',
      name: 'Summer Fitness Challenge',
      description: '$100 off annual memberships',
      discountType: 'fixed',
      discountValue: 100,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      targetLocations: ['all'],
      status: 'expired',
      createdDate: '2024-05-15'
    }
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<FranchisePromo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    startDate: '',
    endDate: '',
    targetLocations: ['all'] as string[]
  });

  const handleCreatePromo = () => {
    const newPromo: FranchisePromo = {
      id: Date.now().toString(),
      ...formData,
      status: new Date(formData.startDate) > new Date() ? 'scheduled' : 'active',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setPromos([...promos, newPromo]);
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdatePromo = () => {
    if (!editingPromo) return;
    setPromos(promos.map(p => p.id === editingPromo.id ? { ...editingPromo, ...formData } : p));
    setEditingPromo(null);
    resetForm();
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      setPromos(promos.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      startDate: '',
      endDate: '',
      targetLocations: ['all']
    });
  };

  const openEditModal = (promo: FranchisePromo) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      targetLocations: promo.targetLocations
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationDisplay = (targetLocations: string[]) => {
    if (targetLocations.includes('all')) return 'All Locations';
    return `${targetLocations.length} Location${targetLocations.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Brand Promotions</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage promotions for all franchise locations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#AC1305] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#8B0F04] flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Create Promotion
        </button>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{promo.name}</div>
                      <div className="text-sm text-gray-500">{promo.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`} off
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promo.startDate} to {promo.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{getLocationDisplay(promo.targetLocations)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promo.status)}`}>
                      {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="text-[#AC1305] hover:text-[#8B0F04] mr-3"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePromo(promo.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingPromo ? 'Edit Promotion' : 'Create New Promotion'}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                  placeholder="e.g., Spring Sale 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                  rows={3}
                  placeholder="Describe the promotion..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                    placeholder={formData.discountType === 'percentage' ? '50' : '100'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Locations</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.targetLocations.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetLocations: ['all'] });
                        } else {
                          setFormData({ ...formData, targetLocations: [] });
                        }
                      }}
                      className="rounded text-[#AC1305] focus:ring-[#AC1305]"
                    />
                    <span className="font-semibold">All Locations</span>
                  </label>
                  {!formData.targetLocations.includes('all') && franchiseLocations.map((location) => (
                    <label key={location.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.targetLocations.includes(location.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, targetLocations: [...formData.targetLocations, location.id] });
                          } else {
                            setFormData({ ...formData, targetLocations: formData.targetLocations.filter(id => id !== location.id) });
                          }
                        }}
                        className="rounded text-[#AC1305] focus:ring-[#AC1305]"
                      />
                      <span>{location.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPromo(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingPromo ? handleUpdatePromo : handleCreatePromo}
                className="px-4 py-2 bg-[#AC1305] text-white rounded-lg hover:bg-[#8B0F04]"
              >
                {editingPromo ? 'Update Promotion' : 'Create Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
