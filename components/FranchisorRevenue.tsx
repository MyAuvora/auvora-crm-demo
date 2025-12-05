'use client';

import React, { useState } from 'react';
import { TrendingUp, DollarSign, PiggyBank, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getFranchiseLocations } from '@/lib/dataStore';

export default function FranchisorRevenue() {
  const franchiseLocations = getFranchiseLocations();
  const [selectedYear, setSelectedYear] = useState('2024');

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => {
      const baseRevenue = 600000 + (index * 15000);
      const totalRevenue = baseRevenue + Math.random() * 50000;
      const royalties = totalRevenue * 0.07;
      const brandFund = totalRevenue * 0.02;
      const totalFees = royalties + brandFund;
      
      return {
        month,
        totalRevenue: Math.round(totalRevenue),
        royalties: Math.round(royalties),
        brandFund: Math.round(brandFund),
        totalFees: Math.round(totalFees)
      };
    });
  };

  const monthlyData = generateMonthlyData();

  const ytdTotalRevenue = monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0);
  const ytdRoyalties = monthlyData.reduce((sum, m) => sum + m.royalties, 0);
  const ytdBrandFund = monthlyData.reduce((sum, m) => sum + m.brandFund, 0);
  const ytdTotalFees = monthlyData.reduce((sum, m) => sum + m.totalFees, 0);

  const avgMonthlyRevenue = ytdTotalRevenue / monthlyData.length;
  const avgMonthlyFees = ytdTotalFees / monthlyData.length;

  const lastMonthRevenue = monthlyData[monthlyData.length - 1].totalRevenue;
  const prevMonthRevenue = monthlyData[monthlyData.length - 2].totalRevenue;
  const momGrowth = ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

  const quarterlyData = [
    {
      quarter: 'Q1 2024',
      royalties: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.royalties, 0),
      brandFund: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.brandFund, 0),
      total: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalFees, 0)
    },
    {
      quarter: 'Q2 2024',
      royalties: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.royalties, 0),
      brandFund: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.brandFund, 0),
      total: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalFees, 0)
    },
    {
      quarter: 'Q3 2024',
      royalties: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.royalties, 0),
      brandFund: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.brandFund, 0),
      total: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalFees, 0)
    },
    {
      quarter: 'Q4 2024',
      royalties: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.royalties, 0),
      brandFund: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.brandFund, 0),
      total: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalFees, 0)
    }
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Franchisor Revenue</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track franchisor revenue from royalties and brand fund</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
        >
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-[#AC1305] to-[#8B0F04] p-4 sm:p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">YTD Total Fees</span>
            <PiggyBank size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">${ytdTotalFees.toLocaleString()}</div>
          <p className="text-[10px] sm:text-xs mt-2 opacity-90">From {franchiseLocations.length} locations</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">YTD Royalties</span>
            <DollarSign className="text-gray-400" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">${ytdRoyalties.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">7% of total revenue</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">YTD Brand Fund</span>
            <DollarSign className="text-gray-400" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">${ytdBrandFund.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">2% of total revenue</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">MoM Growth</span>
            <TrendingUp className={momGrowth >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
          </div>
          <div className={`text-2xl font-bold ${momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">vs previous month</p>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Monthly Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} wrapperStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="totalFees" stroke="#AC1305" strokeWidth={2} name="Total Fees" />
            <Line type="monotone" dataKey="royalties" stroke="#2563eb" strokeWidth={2} name="Royalties" />
            <Line type="monotone" dataKey="brandFund" stroke="#16a34a" strokeWidth={2} name="Brand Fund" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Breakdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quarterly Breakdown</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} wrapperStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="royalties" fill="#2563eb" name="Royalties (7%)" />
            <Bar dataKey="brandFund" fill="#16a34a" name="Brand Fund (2%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-gray-600">Total Franchise Revenue (YTD)</span>
              <span className="font-semibold text-gray-900">${ytdTotalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-gray-600">Average Monthly Revenue</span>
              <span className="font-semibold text-gray-900">${Math.round(avgMonthlyRevenue).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-gray-600">Average Monthly Fees</span>
              <span className="font-semibold text-gray-900">${Math.round(avgMonthlyFees).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-gray-600">Revenue per Location</span>
              <span className="font-semibold text-gray-900">${Math.round(ytdTotalRevenue / franchiseLocations.length).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fees per Location</span>
              <span className="font-semibold text-[#AC1305]">${Math.round(ytdTotalFees / franchiseLocations.length).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Structure</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Royalty Fee</span>
                <span className="text-2xl font-bold text-blue-900">7%</span>
              </div>
              <p className="text-xs text-blue-700">Of gross monthly revenue</p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="text-sm text-blue-900">YTD Total: <span className="font-bold">${ytdRoyalties.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Brand Fund</span>
                <span className="text-2xl font-bold text-green-900">2%</span>
              </div>
              <p className="text-xs text-green-700">Of gross monthly revenue</p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="text-sm text-green-900">YTD Total: <span className="font-bold">${ytdBrandFund.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Total Fees</span>
                <span className="text-2xl font-bold text-red-900">9%</span>
              </div>
              <p className="text-xs text-red-700">Combined franchise fees</p>
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="text-sm text-red-900">YTD Total: <span className="font-bold">${ytdTotalFees.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
