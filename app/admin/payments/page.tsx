'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Payment {
  id: string;
  clientName: string;
  clientId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: string;
  method: 'card' | 'bank' | 'invoice';
  plan: string;
  invoiceId: string;
}

interface Subscription {
  id: string;
  clientName: string;
  clientId: string;
  plan: string;
  amount: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  nextBillingDate: string;
  startDate: string;
}

const mockPayments: Payment[] = [
  { id: 'pay_1', clientName: 'Iron Fitness Tampa', clientId: 't1', amount: 299, status: 'paid', date: '2024-12-15', method: 'card', plan: 'Professional', invoiceId: 'INV-001' },
  { id: 'pay_2', clientName: 'CrossFit Downtown', clientId: 't2', amount: 499, status: 'paid', date: '2024-12-14', method: 'card', plan: 'Enterprise', invoiceId: 'INV-002' },
  { id: 'pay_3', clientName: 'Yoga Studio Miami', clientId: 't3', amount: 199, status: 'paid', date: '2024-12-13', method: 'bank', plan: 'Starter', invoiceId: 'INV-003' },
  { id: 'pay_4', clientName: 'FitLife Gym', clientId: 't4', amount: 299, status: 'pending', date: '2024-12-12', method: 'invoice', plan: 'Professional', invoiceId: 'INV-004' },
  { id: 'pay_5', clientName: 'Peak Performance', clientId: 't5', amount: 299, status: 'failed', date: '2024-12-11', method: 'card', plan: 'Professional', invoiceId: 'INV-005' },
  { id: 'pay_6', clientName: 'Strength Lab', clientId: 't6', amount: 499, status: 'paid', date: '2024-12-10', method: 'card', plan: 'Enterprise', invoiceId: 'INV-006' },
  { id: 'pay_7', clientName: 'Zen Fitness', clientId: 't7', amount: 199, status: 'paid', date: '2024-12-09', method: 'card', plan: 'Starter', invoiceId: 'INV-007' },
  { id: 'pay_8', clientName: 'Elite Training', clientId: 't8', amount: 299, status: 'refunded', date: '2024-12-08', method: 'card', plan: 'Professional', invoiceId: 'INV-008' },
];

const mockSubscriptions: Subscription[] = [
  { id: 'sub_1', clientName: 'Iron Fitness Tampa', clientId: 't1', plan: 'Professional', amount: 299, status: 'active', nextBillingDate: '2025-01-15', startDate: '2024-06-15' },
  { id: 'sub_2', clientName: 'CrossFit Downtown', clientId: 't2', plan: 'Enterprise', amount: 499, status: 'active', nextBillingDate: '2025-01-14', startDate: '2024-03-14' },
  { id: 'sub_3', clientName: 'Yoga Studio Miami', clientId: 't3', plan: 'Starter', amount: 199, status: 'active', nextBillingDate: '2025-01-13', startDate: '2024-08-13' },
  { id: 'sub_4', clientName: 'FitLife Gym', clientId: 't4', plan: 'Professional', amount: 299, status: 'past_due', nextBillingDate: '2024-12-12', startDate: '2024-05-12' },
  { id: 'sub_5', clientName: 'Peak Performance', clientId: 't5', plan: 'Professional', amount: 299, status: 'past_due', nextBillingDate: '2024-12-11', startDate: '2024-07-11' },
  { id: 'sub_6', clientName: 'Strength Lab', clientId: 't6', plan: 'Enterprise', amount: 499, status: 'active', nextBillingDate: '2025-01-10', startDate: '2024-04-10' },
  { id: 'sub_7', clientName: 'Zen Fitness', clientId: 't7', plan: 'Starter', amount: 199, status: 'trialing', nextBillingDate: '2025-01-09', startDate: '2024-12-09' },
  { id: 'sub_8', clientName: 'Elite Training', clientId: 't8', plan: 'Professional', amount: 299, status: 'canceled', nextBillingDate: '-', startDate: '2024-02-08' },
];

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-700',
  trialing: 'bg-blue-100 text-blue-700',
};

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscriptions'>('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredPayments = mockPayments.filter(payment => {
      const matchesSearch = payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const filteredSubscriptions = mockSubscriptions.filter(sub => {
      const matchesSearch = sub.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const totalRevenue = mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = mockPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const failedAmount = mockPayments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0);
  const mrr = mockSubscriptions.filter(s => s.status === 'active' || s.status === 'trialing').reduce((sum, s) => sum + s.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'active':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'pending':
      case 'trialing':
        return <Clock size={14} className="text-yellow-600" />;
      case 'failed':
      case 'past_due':
        return <AlertCircle size={14} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track subscriptions and payment history</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Monthly Recurring</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${mrr.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight size={14} className="text-green-600" />
                <span className="text-sm text-green-600 font-medium">+8.2%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-[#0f5257]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-[#0f5257]" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Collected This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-gray-500">{mockPayments.filter(p => p.status === 'paid').length} payments</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">${pendingAmount.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock size={14} className="text-yellow-600" />
                <span className="text-sm text-yellow-600">{mockPayments.filter(p => p.status === 'pending').length} invoices</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">${failedAmount.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle size={14} className="text-red-600" />
                <span className="text-sm text-red-600">{mockPayments.filter(p => p.status === 'failed').length} failed</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('payments'); setStatusFilter('all'); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-[#0f5257] text-[#0f5257]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment History
            </button>
            <button
              onClick={() => { setActiveTab('subscriptions'); setStatusFilter('all'); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-[#0f5257] text-[#0f5257]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Subscriptions
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'payments' ? 'Search payments...' : 'Search subscriptions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
          >
            <option value="all">All Status</option>
            {activeTab === 'payments' ? (
              <>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </>
            ) : (
              <>
                <option value="active">Active</option>
                <option value="past_due">Past Due</option>
                <option value="trialing">Trialing</option>
                <option value="canceled">Canceled</option>
              </>
            )}
          </select>
        </div>

        {/* Table */}
        {activeTab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0f5257] rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          {payment.clientName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{payment.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{payment.invoiceId}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${payment.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payment.plan}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 capitalize">{payment.method}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0f5257] rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          {sub.clientName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{sub.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sub.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                        sub.plan === 'Professional' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${sub.amount}/mo</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                        {getStatusIcon(sub.status)}
                        {sub.status === 'past_due' ? 'Past Due' : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.startDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.nextBillingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
