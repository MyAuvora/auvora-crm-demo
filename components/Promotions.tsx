'use client';

import { useApp } from '@/lib/context';
import { promotions } from '@/data/seedData';
import { Tag, TrendingUp, Calendar } from 'lucide-react';

export default function Promotions() {
  const { location } = useApp();

  const locationPromotions = promotions.filter(p => p.location === location);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
        <p className="text-gray-600 mt-1">Manage promotional campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationPromotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <Tag className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{promo.name}</h3>
                  <p className="text-sm text-gray-600">{promo.type}</p>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
