'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllLeads, getAllClasses, getAllClassPackClients, getAllDropInClients, getAllStaff, getFranchiseLocations } from '@/lib/dataStore';
import { getFranchiseOverview, rankLocationsByMetric, computeRoyalty, LocationMetrics } from '@/lib/analytics/franchise';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, BarChart3, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function FranchisorDashboard() {
  const { setLocation, setActiveSection } = useApp();
  const members = getAllMembers();
  const leads = getAllLeads();
  const classes = getAllClasses();
  const classPacks = getAllClassPackClients();
  const dropIns = getAllDropInClients();
  const staff = getAllStaff();
  const franchiseLocations = getFranchiseLocations();
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'members' | 'conversion' | 'fillRate'>('revenue');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const overview = getFranchiseOverview(members, leads, classes, classPacks, dropIns, staff);
  
  const rankedLocations = rankLocationsByMetric(overview.locationMetrics, selectedMetric);

  const royalties = overview.locationMetrics.map(loc => ({
    location: loc.locationName,
    ...computeRoyalty(loc.revenue.mtd)
  }));

  const totalRoyalty = royalties.reduce((sum, r) => sum + r.total, 0);

  const revenueChartData = overview.locationMetrics.map(loc => ({
    name: loc.locationName,
    'MTD Revenue': loc.revenue.mtd,
    'Last Month': loc.revenue.lastMonth,
    'YoY Growth %': loc.revenue.yoyGrowth.toFixed(1)
  }));

  const memberChartData = overview.locationMetrics.map(loc => ({
    name: loc.locationName,
    'Active Members': loc.members.active,
    'New Members': loc.members.new,
    'Cancelled': loc.members.cancelled
  }));

  const conversionChartData = overview.locationMetrics.map(loc => ({
    name: loc.locationName,
    'Conversion Rate': loc.leads.conversionRate.toFixed(1),
    'Total Leads': loc.leads.total,
    'Converted': loc.leads.converted
  }));

  const fillRateChartData = overview.locationMetrics.map(loc => ({
    name: loc.locationName,
    'Fill Rate %': loc.classes.averageFillRate.toFixed(1),
    'Total Capacity': loc.classes.totalCapacity,
    'Total Booked': loc.classes.totalBooked
  }));

  const handleLocationClick = (locationId: string) => {
    const franchiseLocations = getFranchiseLocations();
    const location = franchiseLocations.find(l => l.id === locationId);
    if (location && location.clickable) {
      setLocation(locationId);
      setSelectedLocation(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (selectedLocation) {
    const locationData = overview.locationMetrics.find(l => l.locationName === selectedLocation);
    if (!locationData) return null;

    return (
      <div className="p-4 sm:p-8">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setSelectedLocation(null)}
            className="text-[#AC1305] hover:underline mb-2 text-sm sm:text-base"
          >
            ← Back to All Locations
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{locationData.locationName} - Detailed View</h1>
        </div>

        {/* Location Detail Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-600">MTD Revenue</span>
              <DollarSign className="text-green-600" size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(locationData.revenue.mtd)}</div>
            <div className={`text-xs sm:text-sm mt-1 ${locationData.revenue.momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(locationData.revenue.momGrowth)} MoM
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-600">Active Members</span>
              <Users className="text-blue-600" size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{locationData.members.active}</div>
            <div className={`text-xs sm:text-sm mt-1 ${locationData.members.netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {locationData.members.netGrowth >= 0 ? '+' : ''}{locationData.members.netGrowth} net growth
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-600">Lead Conversion</span>
              <Target className="text-purple-600" size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{locationData.leads.conversionRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              {locationData.leads.converted} / {locationData.leads.total} leads
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-600">Class Fill Rate</span>
              <Calendar className="text-orange-600" size={18} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{locationData.classes.averageFillRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              {locationData.classes.totalBooked} / {locationData.classes.totalCapacity} capacity
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Additional Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <div className="text-xs sm:text-sm text-gray-600">YTD Revenue</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{formatCurrency(locationData.revenue.ytd)}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">YoY Growth</div>
              <div className={`text-base sm:text-lg font-semibold ${locationData.revenue.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(locationData.revenue.yoyGrowth)}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">Retention Rate</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{locationData.members.retention.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">Churn Rate</div>
              <div className="text-base sm:text-lg font-semibold text-red-600">{locationData.members.churn.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">New Members MTD</div>
              <div className="text-base sm:text-lg font-semibold text-green-600">+{locationData.members.new}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">Cancelled MTD</div>
              <div className="text-base sm:text-lg font-semibold text-red-600">-{locationData.members.cancelled}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">Total Staff</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{locationData.staff.total}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600">Total Classes</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{locationData.classes.total}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Note:</strong> This is a read-only view. To make changes to this location, please contact the location manager or owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Franchisor Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor performance across all franchise locations</p>
      </div>

      {/* Global KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Revenue MTD</span>
            <DollarSign size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(overview.totalRevenue.mtd)}</div>
          <div className="flex items-center mt-2 text-xs sm:text-sm">
            {overview.totalRevenue.momGrowth >= 0 ? (
              <ArrowUpRight size={14} className="mr-1 sm:w-4 sm:h-4" />
            ) : (
              <ArrowDownRight size={14} className="mr-1 sm:w-4 sm:h-4" />
            )}
            <span>{formatPercent(overview.totalRevenue.momGrowth)} MoM</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Active Members</span>
            <Users size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{overview.totalMembers.active}</div>
          <div className="flex items-center mt-2 text-xs sm:text-sm">
            {overview.totalMembers.netGrowth >= 0 ? (
              <ArrowUpRight size={14} className="mr-1 sm:w-4 sm:h-4" />
            ) : (
              <ArrowDownRight size={14} className="mr-1 sm:w-4 sm:h-4" />
            )}
            <span>{overview.totalMembers.netGrowth >= 0 ? '+' : ''}{overview.totalMembers.netGrowth} net</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Lead Conversion</span>
            <Target size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{overview.totalLeads.conversionRate.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm mt-2 opacity-90">{overview.totalLeads.count} total leads</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Avg Fill Rate</span>
            <Calendar size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{overview.averageFillRate.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm mt-2 opacity-90">Across all locations</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Churn Rate</span>
            <TrendingDown size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{overview.totalMembers.churn.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm mt-2 opacity-90">Month to date</div>
        </div>
      </div>

      {/* Revenue by Location Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Revenue by Location</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} wrapperStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="MTD Revenue" fill="#10b981" />
            <Bar dataKey="Last Month" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Metrics by Location */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Member Metrics by Location</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={memberChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip wrapperStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Active Members" fill="#3b82f6" />
            <Bar dataKey="New Members" fill="#10b981" />
            <Bar dataKey="Cancelled" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Rankings Table */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Location Performance Rankings</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMetric('revenue')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm min-h-[36px] ${selectedMetric === 'revenue' ? 'bg-[#AC1305] text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSelectedMetric('members')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm min-h-[36px] ${selectedMetric === 'members' ? 'bg-[#AC1305] text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Members
            </button>
            <button
              onClick={() => setSelectedMetric('conversion')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm min-h-[36px] ${selectedMetric === 'conversion' ? 'bg-[#AC1305] text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Conversion
            </button>
            <button
              onClick={() => setSelectedMetric('fillRate')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm min-h-[36px] ${selectedMetric === 'fillRate' ? 'bg-[#AC1305] text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Fill Rate
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MTD Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">YoY Growth</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Active Members</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankedLocations.map((loc, index) => (
                <tr key={loc.location} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                      index === 1 ? 'bg-gray-100 text-gray-800' : 
                      'bg-orange-100 text-orange-800'
                    } font-semibold`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="mr-2 text-gray-400" size={20} />
                      <span className="font-medium text-gray-900">{loc.locationName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(loc.revenue.mtd)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <span className={loc.revenue.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(loc.revenue.yoyGrowth)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {loc.members.active}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {loc.leads.conversionRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {loc.classes.averageFillRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    {franchiseLocations.find(fl => fl.id === loc.location)?.clickable ? (
                      <button
                        onClick={() => handleLocationClick(loc.location)}
                        className="text-[#AC1305] hover:underline"
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Royalty Calculator */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Royalty & Brand Fund Calculator</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">MTD Revenue</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Royalty (7%)</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Brand Fund (2%)</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Total Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {royalties.map((r) => (
                <tr key={r.location}>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{r.location}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                    {formatCurrency(overview.locationMetrics.find(l => l.locationName === r.location)?.revenue.mtd || 0)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">{formatCurrency(r.royalty)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">{formatCurrency(r.brandFund)}</td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-gray-900">{formatCurrency(r.total)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">TOTAL</td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                  {formatCurrency(overview.totalRevenue.mtd)}
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                  {formatCurrency(royalties.reduce((sum, r) => sum + r.royalty, 0))}
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                  {formatCurrency(royalties.reduce((sum, r) => sum + r.brandFund, 0))}
                </td>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                  {formatCurrency(totalRoyalty)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 sm:mt-4">
          <button className="bg-[#AC1305] text-white px-4 py-2 rounded hover:bg-[#8B0F04] text-sm min-h-[44px]">
            Export to CSV
          </button>
        </div>
      </div>

      {/* Alerts & Insights */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-yellow-900 mb-2 sm:mb-3">⚠️ Alerts & Insights</h2>
        <ul className="space-y-2">
          {overview.locationMetrics.map(loc => {
            const alerts = [];
            if (loc.members.churn > 5) {
              alerts.push(`${loc.locationName}: High churn rate (${loc.members.churn.toFixed(1)}%)`);
            }
            if (loc.leads.conversionRate < 20) {
              alerts.push(`${loc.locationName}: Low conversion rate (${loc.leads.conversionRate.toFixed(1)}%)`);
            }
            if (loc.classes.averageFillRate < 60) {
              alerts.push(`${loc.locationName}: Low class fill rate (${loc.classes.averageFillRate.toFixed(1)}%)`);
            }
            return alerts;
          }).flat().map((alert, index) => (
            <li key={index} className="text-xs sm:text-sm text-yellow-800">• {alert}</li>
          ))}
          {overview.locationMetrics.every(loc => loc.members.churn <= 5 && loc.leads.conversionRate >= 20 && loc.classes.averageFillRate >= 60) && (
            <li className="text-xs sm:text-sm text-green-800">✓ All locations performing within healthy ranges</li>
          )}
        </ul>
      </div>
    </div>
  );
}
