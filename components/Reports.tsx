'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllClassPackClients, getAllLeads, getAllTransactions, getAllBookings, getAllClasses, getCohortAnalysis } from '@/lib/dataStore';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import CommissionReports from './CommissionReports';

export default function Reports() {
  const { location, userRole } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'commissions'>('analytics');

  const locationMembers = getAllMembers().filter(m => m.location === location);
  const locationPackClients = getAllClassPackClients().filter(c => c.location === location);
  const locationLeads = getAllLeads().filter(l => l.location === location);
  const transactions = getAllTransactions().filter(t => t.location === location);
  const bookings = getAllBookings();
  const classes = getAllClasses().filter(c => c.location === location);

  const membershipData = location === 'athletic-club' ? [
    { name: '1x/week', count: locationMembers.filter(m => m.membershipType === '1x-week').length },
    { name: '2x/week', count: locationMembers.filter(m => m.membershipType === '2x-week').length },
    { name: 'Unlimited', count: locationMembers.filter(m => m.membershipType === 'unlimited').length },
  ] : [];

  const packData = [
    { name: '5-pack', count: locationPackClients.filter(c => c.packType === '5-pack').length },
    { name: '10-pack', count: locationPackClients.filter(c => c.packType === '10-pack').length },
    { name: '20-pack', count: locationPackClients.filter(c => c.packType === '20-pack').length },
  ];

  const leadSourceData = [
    { name: 'Website', count: locationLeads.filter(l => l.source === 'website').length },
    { name: 'Instagram', count: locationLeads.filter(l => l.source === 'instagram').length },
    { name: 'Facebook', count: locationLeads.filter(l => l.source === 'facebook').length },
    { name: 'Walk-in', count: locationLeads.filter(l => l.source === 'walk-in').length },
  ];

  const zipCodeCounts: { [key: string]: number } = {};
  [...locationMembers, ...locationPackClients].forEach(m => {
    zipCodeCounts[m.zipCode] = (zipCodeCounts[m.zipCode] || 0) + 1;
  });

  const zipCodeData = Object.entries(zipCodeCounts)
    .map(([zip, count]) => ({ name: zip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7'];

  const thisMonth = new Date().toISOString().slice(0, 7);
  const cancellations = locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth)).length;

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const avgTransactionValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  
  const mrr = location === 'athletic-club' 
    ? locationMembers.filter(m => m.status === 'active').length * 150 // avg membership price
    : locationPackClients.length * 50; // avg monthly from packs

  const trialLeads = locationLeads.filter(l => l.status === 'trial-showed' || l.status === 'joined').length;
  const joinedLeads = locationLeads.filter(l => l.status === 'joined').length;
  const conversionRate = trialLeads > 0 ? (joinedLeads / trialLeads) * 100 : 0;

  const classFillRates = classes.map(cls => {
    const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled').length;
    const fillRate = cls.capacity > 0 ? (classBookings / cls.capacity) * 100 : 0;
    return {
      name: `${cls.dayOfWeek.substring(0, 3)} ${cls.time}`,
      fillRate: Math.round(fillRate),
    };
  }).slice(0, 10);

  const promoRevenue: { [key: string]: number } = {};
  transactions.forEach(t => {
    if (t.promoCode) {
      promoRevenue[t.promoCode] = (promoRevenue[t.promoCode] || 0) + t.total;
    }
  });
  const promoData = Object.entries(promoRevenue).map(([code, revenue]) => ({ name: code, revenue }));

  const cohortData = getCohortAnalysis(location);
  
  const canViewCommissions = userRole === 'owner' || userRole === 'manager';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into your business performance</p>
        
        {canViewCommissions && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors min-h-[44px] text-sm sm:text-base ${
                activeTab === 'analytics'
                  ? 'bg-auvora-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors min-h-[44px] text-sm sm:text-base ${
                activeTab === 'commissions'
                  ? 'bg-auvora-teal text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Commission Reports</span>
              <span className="sm:hidden">Commissions</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'commissions' && canViewCommissions ? (
        <CommissionReports />
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">${totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">MRR</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">${mrr.toFixed(0)}</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Conversion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{conversionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
              <Target className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Avg Transaction</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">${avgTransactionValue.toFixed(0)}</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
              <Users className="text-orange-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {location === 'athletic-club' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Membership Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={membershipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" fill="#DC2626" name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Class Pack Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={packData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="count" fill="#EA580C" name="Clients" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Lead Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadSourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {leadSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Leads & Cancellations</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{locationLeads.length}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Cancellations (Last 30 Days)</p>
              <p className="text-2xl sm:text-3xl font-bold text-auvora-teal">{cancellations}</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">New Leads (This Month)</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {locationLeads.filter(l => l.createdDate.startsWith(thisMonth)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Top 10 Zip Codes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={zipCodeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="count" fill="#16A34A" name="Members" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {classFillRates.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Class Fill Rates</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classFillRates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="fillRate" fill="#8B5CF6" name="Fill Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {promoData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Revenue by Promo Code</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={promoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cohortData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Cohort Analysis - Member Retention</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">Track how well you retain members over time by their join month</p>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort Month</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1 Month</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3 Months</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">6 Months</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cohortData.slice(0, 12).map((cohort) => (
                    <tr key={cohort.cohortMonth} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {cohort.cohortMonth}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {cohort.memberCount}
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cohort.retention1Month >= 80 ? 'bg-green-100 text-green-700' :
                          cohort.retention1Month >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cohort.retention1Month.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cohort.retention3Month >= 70 ? 'bg-green-100 text-green-700' :
                          cohort.retention3Month >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cohort.retention3Month.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cohort.retention6Month >= 60 ? 'bg-green-100 text-green-700' :
                          cohort.retention6Month >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cohort.retention6Month.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        ${cohort.totalRevenue.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Retention Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohortData.slice(0, 12).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohortMonth" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="retention1Month" stroke="#10B981" name="1 Month %" strokeWidth={2} />
                <Line type="monotone" dataKey="retention3Month" stroke="#F59E0B" name="3 Months %" strokeWidth={2} />
                <Line type="monotone" dataKey="retention6Month" stroke="#DC2626" name="6 Months %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
