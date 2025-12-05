'use client';

import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react';
import { getFranchiseLocations } from '@/lib/dataStore';

interface FeePayment {
  id: string;
  locationId: string;
  locationName: string;
  month: string;
  revenue: number;
  royaltyRate: number;
  royaltyAmount: number;
  brandFundRate: number;
  brandFundAmount: number;
  totalDue: number;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  dueDate: string;
}

export default function FranchiseFees() {
  const franchiseLocations = getFranchiseLocations();
  const [selectedMonth, setSelectedMonth] = useState('2024-12');
  
  const generateFeePayments = (month: string): FeePayment[] => {
    const dueDate = `${month}-15`;
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    
    return franchiseLocations.map((location, index) => {
      const baseRevenue = 15000 + (index * 1500);
      const revenue = baseRevenue + Math.random() * 10000;
      const royaltyRate = 0.07; // 7%
      const brandFundRate = 0.02; // 2%
      const royaltyAmount = revenue * royaltyRate;
      const brandFundAmount = revenue * brandFundRate;
      const totalDue = royaltyAmount + brandFundAmount;
      
      let status: 'paid' | 'pending' | 'overdue';
      let paidDate: string | undefined;
      
      if (index % 5 === 0 && today > dueDateObj) {
        status = 'overdue';
      } else if (index % 3 === 0) {
        status = 'pending';
      } else {
        status = 'paid';
        paidDate = `${month}-${10 + (index % 5)}`;
      }
      
      return {
        id: `${location.id}-${month}`,
        locationId: location.id,
        locationName: location.name,
        month,
        revenue,
        royaltyRate,
        royaltyAmount,
        brandFundRate,
        brandFundAmount,
        totalDue,
        status,
        paidDate,
        dueDate
      };
    });
  };

  const [feePayments, setFeePayments] = useState<FeePayment[]>(generateFeePayments(selectedMonth));

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setFeePayments(generateFeePayments(month));
  };

  const totalRevenue = feePayments.reduce((sum, payment) => sum + payment.revenue, 0);
  const totalRoyalties = feePayments.reduce((sum, payment) => sum + payment.royaltyAmount, 0);
  const totalBrandFund = feePayments.reduce((sum, payment) => sum + payment.brandFundAmount, 0);
  const totalDue = feePayments.reduce((sum, payment) => sum + payment.totalDue, 0);
  const totalPaid = feePayments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.totalDue, 0);
  const totalPending = feePayments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.totalDue, 0);
  const totalOverdue = feePayments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.totalDue, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={18} className="text-green-600" />;
      case 'pending': return <Clock size={18} className="text-yellow-600" />;
      case 'overdue': return <AlertCircle size={18} className="text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Location', 'Month', 'Revenue', 'Royalty (7%)', 'Brand Fund (2%)', 'Total Due', 'Status', 'Paid Date'];
    const rows = feePayments.map(payment => [
      payment.locationName,
      payment.month,
      `$${payment.revenue.toFixed(2)}`,
      `$${payment.royaltyAmount.toFixed(2)}`,
      `$${payment.brandFundAmount.toFixed(2)}`,
      `$${payment.totalDue.toFixed(2)}`,
      payment.status,
      payment.paidDate || 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `franchise-fees-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Franchise Fees</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track monthly franchise fees from all locations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
          >
            <option value="2024-12">December 2024</option>
            <option value="2024-11">November 2024</option>
            <option value="2024-10">October 2024</option>
            <option value="2024-09">September 2024</option>
            <option value="2024-08">August 2024</option>
          </select>
          <button
            onClick={exportToCSV}
            className="bg-[#AC1305] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#8B0F04] flex items-center justify-center gap-2 text-sm min-h-[44px]"
          >
            <Download size={18} className="sm:w-5 sm:h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</span>
            <DollarSign className="text-gray-400" size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Across all locations</p>
        </div>
        <div className="bg-green-50 p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-green-700">Paid</span>
            <CheckCircle className="text-green-600" size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-900">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] sm:text-xs text-green-600 mt-1">{feePayments.filter(p => p.status === 'paid').length} locations</p>
        </div>
        <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-yellow-700">Pending</span>
            <Clock className="text-yellow-600" size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-900">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] sm:text-xs text-yellow-600 mt-1">{feePayments.filter(p => p.status === 'pending').length} locations</p>
        </div>
        <div className="bg-red-50 p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-red-700">Overdue</span>
            <AlertCircle className="text-red-600" size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-900">${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-[10px] sm:text-xs text-red-600 mt-1">{feePayments.filter(p => p.status === 'overdue').length} locations</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Fee Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Royalty Fees (7%)</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">${totalRoyalties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Brand Fund (2%)</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">${totalBrandFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Fees (9%)</div>
            <div className="text-xl sm:text-2xl font-bold text-[#AC1305]">${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Royalty (7%)</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Brand Fund (2%)</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Total Due</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Paid Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feePayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">{payment.locationName}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-gray-900 text-xs sm:text-sm">
                    ${payment.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-gray-900 text-xs sm:text-sm">
                    ${payment.royaltyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-gray-900 text-xs sm:text-sm">
                    ${payment.brandFundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right font-semibold text-gray-900 text-xs sm:text-sm">
                    ${payment.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      {getStatusIcon(payment.status)}
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {payment.paidDate || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-900 text-xs sm:text-sm">TOTAL</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-900 text-xs sm:text-sm">
                  ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-900 text-xs sm:text-sm">
                  ${totalRoyalties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-900 text-xs sm:text-sm">
                  ${totalBrandFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-[#AC1305] text-xs sm:text-sm">
                  ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4"></td>
                <td className="px-3 sm:px-6 py-3 sm:py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
