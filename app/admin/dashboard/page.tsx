'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Calendar,
  CreditCard,
  PieChart,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  pendingOnboarding: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'tenant_created' | 'user_added' | 'payment_received' | 'onboarding_complete' | 'support_ticket';
  title: string;
  description: string;
  timestamp: string;
  icon: 'building' | 'user' | 'dollar' | 'check' | 'alert';
}

const mockRevenueData = [
  { month: 'Jan', revenue: 12500, subscriptions: 8 },
  { month: 'Feb', revenue: 15200, subscriptions: 10 },
  { month: 'Mar', revenue: 18900, subscriptions: 12 },
  { month: 'Apr', revenue: 22100, subscriptions: 14 },
  { month: 'May', revenue: 25800, subscriptions: 16 },
  { month: 'Jun', revenue: 28500, subscriptions: 18 },
  { month: 'Jul', revenue: 32000, subscriptions: 20 },
  { month: 'Aug', revenue: 35200, subscriptions: 22 },
  { month: 'Sep', revenue: 38900, subscriptions: 24 },
  { month: 'Oct', revenue: 42500, subscriptions: 26 },
  { month: 'Nov', revenue: 45800, subscriptions: 28 },
  { month: 'Dec', revenue: 48500, subscriptions: 30 },
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'tenant_created',
    title: 'New Tenant Created',
    description: 'Iron Fitness Tampa has been provisioned',
    timestamp: '2 hours ago',
    icon: 'building',
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Payment Received',
    description: '$299/mo subscription from CrossFit Downtown',
    timestamp: '4 hours ago',
    icon: 'dollar',
  },
  {
    id: '3',
    type: 'onboarding_complete',
    title: 'Onboarding Complete',
    description: 'Yoga Studio Miami is now live',
    timestamp: '1 day ago',
    icon: 'check',
  },
  {
    id: '4',
    type: 'user_added',
    title: 'New User Added',
    description: 'Sarah Johnson joined as admin at FitLife Gym',
    timestamp: '2 days ago',
    icon: 'user',
  },
  {
    id: '5',
    type: 'support_ticket',
    title: 'Support Request',
    description: 'Data import assistance needed for Peak Performance',
    timestamp: '3 days ago',
    icon: 'alert',
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 48500,
    yearlyRevenue: 366400,
    revenueGrowth: 12.5,
    pendingOnboarding: 0,
    recentActivity: mockActivity,
  });
  const [loading, setLoading] = useState(true);
  const [showAskAuvora, setShowAskAuvora] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      if (data.tenants) {
        const tenants = data.tenants;
        setStats(prev => ({
          ...prev,
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t: { onboarding_status: string }) => t.onboarding_status === 'live').length,
          pendingOnboarding: tenants.filter((t: { onboarding_status: string }) => !['live', 'pending'].includes(t.onboarding_status)).length,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'building': return <Building2 size={16} className="text-blue-600" />;
      case 'user': return <Users size={16} className="text-purple-600" />;
      case 'dollar': return <DollarSign size={16} className="text-green-600" />;
      case 'check': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'alert': return <AlertCircle size={16} className="text-orange-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your business overview.</p>
        </div>
        <button
          onClick={() => setShowAskAuvora(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0f5257] to-[#0a3d41] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Sparkles size={18} />
          Ask Auvora
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight size={14} className="text-green-600" />
                <span className="text-sm text-green-600 font-medium">+{stats.revenueGrowth}%</span>
                <span className="text-xs text-gray-500">vs last month</span>
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
              <p className="text-sm text-gray-600 font-medium">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeTenants}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-gray-500">{stats.totalTenants} total</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">YTD Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.yearlyRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={14} className="text-[#0f5257]" />
                <span className="text-sm text-[#0f5257] font-medium">On track</span>
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
              <p className="text-sm text-gray-600 font-medium">Pending Onboarding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOnboarding}</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock size={14} className="text-orange-500" />
                <span className="text-sm text-orange-500 font-medium">Needs attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Monthly subscription revenue</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-[#0f5257] text-white rounded-lg">2024</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">2023</button>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end gap-2">
            {mockRevenueData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-[#0f5257] to-[#0f5257]/70 rounded-t-lg transition-all hover:from-[#0a3d41] hover:to-[#0a3d41]/70 cursor-pointer group relative"
                  style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.revenue.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">${stats.yearlyRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Monthly</p>
              <p className="text-lg font-semibold text-gray-900">${Math.round(stats.yearlyRevenue / 12).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-lg font-semibold text-green-600">+{stats.revenueGrowth}%</p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm text-[#0f5257] hover:underline">
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/tenants"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Manage Tenants</p>
            <p className="text-xs text-gray-500">View and edit accounts</p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">User Management</p>
            <p className="text-xs text-gray-500">Manage all users</p>
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Payments</p>
            <p className="text-xs text-gray-500">Track subscriptions</p>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-[#d4af37]/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-[#d4af37]" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Analytics</p>
            <p className="text-xs text-gray-500">View reports</p>
          </div>
        </Link>
      </div>

      {/* Ask Auvora Modal */}
      {showAskAuvora && (
        <AskAuvoraAdmin isOpen={showAskAuvora} onClose={() => setShowAskAuvora(false)} />
      )}
    </div>
  );
}

function AskAuvoraAdmin({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Auvora, your AI business assistant. I can help you with:\n\n• Revenue analysis and forecasting\n• Tenant performance insights\n• Onboarding recommendations\n• Business growth strategies\n• Platform usage analytics\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      let response = '';
      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes('revenue') || lowerInput.includes('money') || lowerInput.includes('income')) {
        response = "**Revenue Analysis**\n\nYour current monthly recurring revenue (MRR) is $48,500, up 12.5% from last month.\n\n**Key Insights:**\n• YTD revenue: $366,400\n• Average revenue per tenant: $1,617/month\n• Projected annual revenue: $582,000\n\n**Recommendations:**\n1. Focus on converting the 3 pending onboarding tenants\n2. Consider introducing a premium tier for high-volume gyms\n3. Implement referral incentives for existing tenants";
      } else if (lowerInput.includes('tenant') || lowerInput.includes('client') || lowerInput.includes('customer')) {
        response = "**Tenant Overview**\n\nYou currently have 30 active tenants with 3 in the onboarding pipeline.\n\n**Tenant Health:**\n• 28 tenants (93%) are actively using the platform daily\n• 2 tenants have reduced activity this month\n• Average tenant lifetime: 8.5 months\n\n**Action Items:**\n1. Schedule check-in calls with low-activity tenants\n2. Send onboarding completion reminders\n3. Gather feedback from top-performing tenants";
      } else if (lowerInput.includes('growth') || lowerInput.includes('forecast') || lowerInput.includes('projection')) {
        response = "**Growth Forecast**\n\nBased on current trends, here's your projected growth:\n\n**Next Quarter:**\n• Expected new tenants: 8-12\n• Projected MRR: $62,000\n• Revenue growth: 28%\n\n**Next Year:**\n• Target tenants: 75\n• Projected ARR: $900,000\n\n**Growth Strategies:**\n1. Launch referral program (est. 20% of new signups)\n2. Expand to Education and Wellness verticals\n3. Introduce enterprise pricing tier";
      } else if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
        response = "I can help you with:\n\n**Analytics & Insights:**\n• Revenue analysis and forecasting\n• Tenant performance metrics\n• User engagement statistics\n\n**Business Operations:**\n• Onboarding status tracking\n• Support ticket prioritization\n• Churn risk identification\n\n**Strategic Planning:**\n• Growth recommendations\n• Pricing optimization\n• Market expansion analysis\n\nJust ask me anything about your business!";
      } else {
        response = "I understand you're asking about: \"" + userMessage + "\"\n\nLet me help you with that. Based on your current data:\n\n• Your platform is performing well with 30 active tenants\n• Monthly revenue is growing at 12.5%\n• 3 tenants are in the onboarding pipeline\n\nWould you like me to dive deeper into any specific area? I can analyze revenue, tenant performance, growth projections, or provide strategic recommendations.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsProcessing(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#0f5257] to-[#0a3d41] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Ask Auvora</h2>
              <p className="text-xs text-white/70">AI Business Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#0f5257] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0f5257] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#0f5257] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[#0f5257] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revenue, tenants, growth..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="px-4 py-2 bg-[#0f5257] text-white rounded-xl hover:bg-[#0a3d41] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare size={20} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInput('What is my current revenue?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Revenue analysis
            </button>
            <button
              type="button"
              onClick={() => setInput('How are my tenants performing?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Tenant performance
            </button>
            <button
              type="button"
              onClick={() => setInput('What is my growth forecast?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Growth forecast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
