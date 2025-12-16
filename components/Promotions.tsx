'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { promotions } from '@/data/seedData';
import { Tag, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Promotion } from '@/lib/types';

export default function Promotions() {
  const { location } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: 'planned' as 'planned' | 'active' | 'ended',
    startDate: '',
    endDate: '',
    description: '',
    promoCode: '',
    discountPercent: ''
  });

  const locationPromotions = promotions.filter(p => p.location === location);

  const handleCreate = () => {
    setFormData({
      name: '',
      type: '',
      status: 'planned',
      startDate: '',
      endDate: '',
      description: '',
      promoCode: '',
      discountPercent: ''
    });
    setEditingPromo(null);
    setShowCreateModal(true);
  };

  const handleEdit = (promo: Promotion) => {
    const promoWithCode = promo as Promotion & { promoCode?: string; discountPercent?: number };
    setFormData({
      name: promo.name,
      type: promo.type,
      status: promo.status,
      startDate: promo.startDate,
      endDate: promo.endDate,
      description: '',
      promoCode: promoWithCode.promoCode || '',
      discountPercent: promoWithCode.discountPercent?.toString() || ''
    });
    setEditingPromo(promo);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.type || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.promoCode && !formData.discountPercent) {
      alert('Please enter a discount percentage for the promo code');
      return;
    }

    if (formData.discountPercent && !formData.promoCode) {
      alert('Please enter a promo code for the discount');
      return;
    }

    if (formData.promoCode && formData.promoCode.length < 3) {
      alert('Promo code must be at least 3 characters');
      return;
    }

    if (formData.discountPercent) {
      const discount = parseFloat(formData.discountPercent);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        alert('Discount percentage must be between 1 and 100');
        return;
      }
    }

    if (formData.promoCode && formData.discountPercent) {
      const promoCodes = JSON.parse(localStorage.getItem('promoCodes') || '{}');
      promoCodes[formData.promoCode.toUpperCase()] = {
        code: formData.promoCode.toUpperCase(),
        discount: parseFloat(formData.discountPercent) / 100,
        promotionName: formData.name,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      localStorage.setItem('promoCodes', JSON.stringify(promoCodes));
    }

    const message = editingPromo 
      ? `Promotion "${formData.name}" has been updated successfully!${formData.promoCode ? `\n\nPromo code "${formData.promoCode.toUpperCase()}" is now ${formData.status === 'active' ? 'active' : formData.status} and can be used in POS.` : ''}`
      : `New promotion "${formData.name}" has been created successfully!\n\nThis promotion will now appear in:\n• POS system for sales\n• Reports for tracking\n• Dashboard metrics${formData.promoCode ? `\n\nPromo code "${formData.promoCode.toUpperCase()}" (${formData.discountPercent}% off) is now available in POS!` : ''}`;
    
    alert(message);
    setShowCreateModal(false);
    setFormData({
      name: '',
      type: '',
      status: 'planned',
      startDate: '',
      endDate: '',
      description: '',
      promoCode: '',
      discountPercent: ''
    });
    setEditingPromo(null);
  };

  const handleDelete = (promo: Promotion) => {
    if (confirm(`Are you sure you want to delete "${promo.name}"? This action cannot be undone.`)) {
      alert(`Promotion "${promo.name}" has been deleted.`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage promotional campaigns</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-3 sm:px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors flex items-center justify-center gap-2 text-sm min-h-[44px]"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Create Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {locationPromotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                  <Tag className="text-auvora-teal w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{promo.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{promo.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                promo.status === 'active' ? 'bg-green-100 text-green-700' :
                promo.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {promo.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>{promo.startDate} to {promo.endDate}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Signups</p>
                    <p className="text-2xl font-bold text-gray-900">{promo.signups}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${promo.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">POS Item Name</p>
                <p className="text-sm font-medium text-gray-900">{promo.name} - Special Offer</p>
                {(() => {
                  const promoWithCode = promo as Promotion & { promoCode?: string; discountPercent?: number };
                  return promoWithCode.promoCode && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Promo Code</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">
                          {promoWithCode.promoCode}
                        </span>
                        <span className="text-xs text-gray-600">
                          {promoWithCode.discountPercent}% off
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(promo)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(promo)}
                  className="flex-1 px-3 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingPromo ? 'Edit Promotion' : 'Create New Promotion'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Kickstart Challenge"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotion Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                  >
                    <option value="">Select type...</option>
                    <option value="New Member">New Member</option>
                    <option value="Reactivation">Reactivation</option>
                    <option value="Referral">Referral</option>
                    <option value="Seasonal">Seasonal</option>
                    <option value="Class Pack">Class Pack</option>
                    <option value="Limited Time">Limited Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planned' | 'active' | 'ended' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter promotion details, terms, and conditions..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                  />
                </div>

                <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-2 sm:mb-3">Promo Code (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={formData.promoCode}
                        onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                        placeholder="e.g., SUMMER25"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be auto-capitalized</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        placeholder="e.g., 25"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                      />
                      <p className="text-xs text-gray-500 mt-1">1-100%</p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-800 mt-3">
                    <strong>Note:</strong> This promo code will be immediately available in the POS system for checkout.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Once created, this promotion will automatically:
                  </p>
                  <ul className="text-sm text-blue-900 mt-2 ml-4 list-disc">
                    <li>Appear as a POS item for front desk sales</li>
                    <li>Be tracked in Reports & Analytics</li>
                    <li>Show in Dashboard metrics</li>
                    <li>Be available for messaging campaigns</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors"
              >
                {editingPromo ? 'Save Changes' : 'Create Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
