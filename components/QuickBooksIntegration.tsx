'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { CheckCircle, XCircle, RefreshCw, Settings, DollarSign, Calendar, AlertCircle } from 'lucide-react';

export default function QuickBooksIntegration() {
  const { location } = useApp();
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'mappings' | 'sync-history'>('overview');
  const [lastSync, setLastSync] = useState(new Date().toISOString());

  const handleConnect = () => {
    alert('In production, this would redirect to QuickBooks OAuth flow.\n\nYou would:\n1. Authorize the app\n2. Select your QuickBooks company\n3. Return to complete setup');
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from QuickBooks? This will stop all automatic syncing.')) {
      setIsConnected(false);
    }
  };

  const handleSync = () => {
    alert('Syncing data to QuickBooks...\n\nIn production, this would:\n• Push pending transactions\n• Update customer records\n• Sync staff time entries\n• Pull latest account mappings');
    setLastSync(new Date().toISOString());
  };

  const syncStats = {
    totalTransactions: 1247,
    syncedToday: 23,
    pendingSync: 2,
    failedSync: 0,
    lastSyncTime: new Date(lastSync).toLocaleString()
  };

  const accountMappings = [
    { category: 'Membership Revenue', qbAccount: 'Sales - Memberships', qbItem: 'Monthly Membership', status: 'mapped' },
    { category: 'Class Pack Revenue', qbAccount: 'Sales - Class Packs', qbItem: 'Class Pack', status: 'mapped' },
    { category: 'Drop-In Revenue', qbAccount: 'Sales - Drop-Ins', qbItem: 'Drop-In Class', status: 'mapped' },
    { category: 'Retail Sales', qbAccount: 'Sales - Retail', qbItem: 'Retail Product', status: 'mapped' },
    { category: 'Discounts Given', qbAccount: 'Discounts', qbItem: 'Discount', status: 'mapped' },
    { category: 'Sales Tax Payable', qbAccount: 'Sales Tax Payable', qbItem: 'Tax', status: 'mapped' },
  ];

  const recentSyncs = [
    { id: 1, type: 'SalesReceipt', description: 'POS Sale - $125.00', status: 'success', time: '2 minutes ago', qbId: 'SR-1234' },
    { id: 2, type: 'Customer', description: 'New Member - John Smith', status: 'success', time: '15 minutes ago', qbId: 'CUST-5678' },
    { id: 3, type: 'Invoice', description: 'Monthly Membership - Sarah Johnson', status: 'success', time: '1 hour ago', qbId: 'INV-9012' },
    { id: 4, type: 'RefundReceipt', description: 'Refund - $75.00', status: 'success', time: '2 hours ago', qbId: 'RR-3456' },
    { id: 5, type: 'TimeActivity', description: 'Coach Time - 3 classes', status: 'success', time: '3 hours ago', qbId: 'TA-7890' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Sync your financial data with QuickBooks Online</p>
        </div>
        {isConnected ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleSync}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <RefreshCw size={18} className="sm:w-5 sm:h-5" />
              Sync Now
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <Settings size={18} className="sm:w-5 sm:h-5" />
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
          >
            <CheckCircle size={18} className="sm:w-5 sm:h-5" />
            Connect to QuickBooks
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">QuickBooks Not Connected</h3>
              <p className="text-sm sm:text-base text-yellow-800 mb-3 sm:mb-4">
                Connect your QuickBooks Online account to automatically sync transactions, customers, and financial data.
              </p>
              <button
                onClick={handleConnect}
                className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm min-h-[44px]"
              >
                Connect Now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'text-auvora-teal border-b-2 border-auvora-teal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('mappings')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'mappings'
                      ? 'text-auvora-teal border-b-2 border-auvora-teal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Account Mappings
                </button>
                <button
                  onClick={() => setActiveTab('sync-history')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'sync-history'
                      ? 'text-auvora-teal border-b-2 border-auvora-teal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sync History
                </button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-green-900">Connection Status</span>
                      <CheckCircle className="text-green-600 w-[18px] h-[18px] sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-900">Connected</p>
                    <p className="text-[10px] sm:text-xs text-green-700 mt-1">Company: {location === 'athletic-club' ? 'The Lab Tampa - Athletic' : 'The Lab Tampa - Dance'}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Total Synced</span>
                      <DollarSign className="text-blue-600 w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{syncStats.totalTransactions}</p>
                    <p className="text-xs text-blue-700 mt-1">Transactions</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-900">Today</span>
                      <RefreshCw className="text-purple-600 w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{syncStats.syncedToday}</p>
                    <p className="text-xs text-purple-700 mt-1">Synced today</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-900">Pending</span>
                      <AlertCircle className="text-orange-600 w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{syncStats.pendingSync}</p>
                    <p className="text-xs text-orange-700 mt-1">Awaiting sync</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">What Syncs to QuickBooks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sales & Transactions</p>
                        <p className="text-xs text-gray-600">POS sales → SalesReceipts, Refunds → RefundReceipts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Members & Customers</p>
                        <p className="text-xs text-gray-600">All members sync as QuickBooks Customers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Membership Billing</p>
                        <p className="text-xs text-gray-600">Monthly charges → Invoices + Payments</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Staff Time Tracking</p>
                        <p className="text-xs text-gray-600">Classes taught → TimeActivity entries</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-blue-600" size={20} />
                    <h3 className="text-sm font-semibold text-blue-900">Last Sync</h3>
                  </div>
                  <p className="text-sm text-blue-800">{syncStats.lastSyncTime}</p>
                  <p className="text-xs text-blue-700 mt-1">Next automatic sync in 15 minutes</p>
                </div>
              </div>
            )}

            {activeTab === 'mappings' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Mappings</h3>
                  <p className="text-sm text-gray-600">
                    These mappings determine how your CRM data is categorized in QuickBooks.
                  </p>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">CRM Category</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">QuickBooks Account</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">QuickBooks Item</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accountMappings.map((mapping, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{mapping.category}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{mapping.qbAccount}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">{mapping.qbItem}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded">
                              {mapping.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> In production, you can customize these mappings to match your QuickBooks Chart of Accounts.
                    Changes will apply to all future syncs.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'sync-history' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Sync Activity</h3>
                  <p className="text-sm text-gray-600">
                    View the latest data synchronized with QuickBooks.
                  </p>
                </div>

                <div className="space-y-3">
                  {recentSyncs.map((sync) => (
                    <div key={sync.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          sync.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {sync.status === 'success' ? (
                            <CheckCircle className="text-green-600" size={20} />
                          ) : (
                            <XCircle className="text-auvora-teal" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sync.description}</p>
                          <p className="text-xs text-gray-600">Type: {sync.type} • QB ID: {sync.qbId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{sync.time}</p>
                        <span className={`text-xs font-medium ${
                          sync.status === 'success' ? 'text-green-600' : 'text-auvora-teal'
                        }`}>
                          {sync.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                    View All Sync History →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
