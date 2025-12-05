'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllCommissionReports, CommissionReport } from '@/lib/dataStore';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';

export default function CommissionReports() {
  const { location } = useApp();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'last-month'>('month');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999))
        };
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
    }
  };

  const { start, end } = getDateRange();
  const reports = getAllCommissionReports(location, start, end);

  const totalSales = reports.reduce((sum, r) => sum + r.totalSales, 0);
  const totalCommissions = reports.reduce((sum, r) => sum + r.commissionAmount, 0);
  const totalTransactions = reports.reduce((sum, r) => sum + r.transactionCount, 0);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'front-desk': return 'Front Desk';
      case 'coach': return 'Coach';
      case 'head-coach': return 'Head Coach';
      case 'manager': return 'Manager';
      case 'owner': return 'Owner';
      default: return role;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission Reports</h1>
            <p className="text-sm sm:text-base text-gray-600">Track sales and commissions for all employees</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-600" size={18} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Sales</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Commissions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">${totalCommissions.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Transactions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Commission Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Employee Performance</h2>
        </div>
        
        {reports.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
            No sales data for the selected period
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Sales</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Transactions</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Commission Rate</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.sellerId} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{report.sellerName}</p>
                        <div className="mt-1 sm:mt-2 space-y-1">
                          {report.categoryBreakdown.memberships > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-600">
                              Memberships: ${report.categoryBreakdown.memberships.toFixed(2)}
                            </p>
                          )}
                          {report.categoryBreakdown.classPacks > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-600">
                              Class Packs: ${report.categoryBreakdown.classPacks.toFixed(2)}
                            </p>
                          )}
                          {report.categoryBreakdown.dropIn > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-600">
                              Drop-In: ${report.categoryBreakdown.dropIn.toFixed(2)}
                            </p>
                          )}
                          {report.categoryBreakdown.retail > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-600">
                              Retail: ${report.categoryBreakdown.retail.toFixed(2)}
                            </p>
                          )}
                          {report.categoryBreakdown.other > 0 && (
                            <p className="text-[10px] sm:text-xs text-gray-600">
                              Other: ${report.categoryBreakdown.other.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{getRoleName(report.sellerRole)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">${report.totalSales.toFixed(2)}</p>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-gray-600">{report.transactionCount}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-gray-600">
                      {(report.commissionRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <p className="font-semibold text-green-600 text-sm sm:text-base">${report.commissionAmount.toFixed(2)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-900 text-sm sm:text-base">${totalSales.toFixed(2)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-bold text-gray-900 text-xs sm:text-sm">{totalTransactions}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4"></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-bold text-green-600 text-sm sm:text-base">${totalCommissions.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
