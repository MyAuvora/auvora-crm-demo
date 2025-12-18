'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  DollarSign,
  Activity,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Target,
  Zap
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

const revenueByPlan = [
  { name: 'Enterprise', value: 45, amount: 21825, color: '#7c3aed' },
  { name: 'Professional', value: 40, amount: 19400, color: '#0f5257' },
  { name: 'Starter', value: 15, amount: 7275, color: '#d4af37' },
];

const clientGrowth = [
  { month: 'Jul', clients: 18 },
  { month: 'Aug', clients: 20 },
  { month: 'Sep', clients: 22 },
  { month: 'Oct', clients: 25 },
  { month: 'Nov', clients: 28 },
  { month: 'Dec', clients: 30 },
];

const clientsByIndustry = [
  { industry: 'Fitness', count: 18, color: '#3b82f6', percentage: 60 },
  { industry: 'Education', count: 6, color: '#8b5cf6', percentage: 20 },
  { industry: 'Wellness', count: 4, color: '#22c55e', percentage: 13 },
  { industry: 'Beauty', count: 1, color: '#ec4899', percentage: 4 },
  { industry: 'Auxiliary', count: 1, color: '#f97316', percentage: 3 },
];

const engagementMetrics = [
  { metric: 'Daily Active Users', value: '2,450', change: 8.5 },
  { metric: 'Avg Session Duration', value: '12m 34s', change: 3.2 },
  { metric: 'Feature Adoption', value: '78%', change: 5.1 },
  { metric: 'Support Tickets', value: '23', change: -12.5 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '$366,400',
      change: 24.5,
      changeLabel: 'vs last year',
      icon: <DollarSign size={24} />,
      color: 'green',
    },
        {
          title: 'Active Clients',
          value: '30',
          change: 66.7,
          changeLabel: 'vs last year',
          icon: <Building2 size={24} />,
          color: 'blue',
        },
    {
      title: 'Total End Users',
      value: '4,850',
      change: 42.3,
      changeLabel: 'vs last year',
      icon: <Users size={24} />,
      color: 'purple',
    },
        {
          title: 'Avg Revenue/Client',
          value: '$1,617',
          change: 8.2,
          changeLabel: 'vs last month',
          icon: <Target size={24} />,
          color: 'teal',
        },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'blue': return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'purple': return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'teal': return { bg: 'bg-[#0f5257]/10', text: 'text-[#0f5257]' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const maxClients = Math.max(...clientGrowth.map(d => d.clients));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform performance and business insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const colors = getColorClasses(metric.color);
          return (
            <div key={metric.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metric.change >= 0 ? (
                      <ArrowUpRight size={14} className="text-green-600" />
                    ) : (
                      <ArrowDownRight size={14} className="text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-xs text-gray-500">{metric.changeLabel}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <div className={colors.text}>{metric.icon}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Growth Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Client Growth</h2>
                      <p className="text-sm text-gray-500">New clients over time</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-[#0f5257] rounded-full"></div>
                      <span className="text-gray-600">Active Clients</span>
                    </div>
                  </div>
          
                  <div className="h-48 flex items-end gap-4">
                    {clientGrowth.map((data) => (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gradient-to-t from-[#0f5257] to-[#0f5257]/70 rounded-t-lg transition-all hover:from-[#0a3d41] cursor-pointer group relative"
                          style={{ height: `${(data.clients / maxClients) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.clients}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

        {/* Revenue by Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue by Plan</h2>
              <p className="text-sm text-gray-500">Distribution across pricing tiers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            {/* Donut Chart Placeholder */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {revenueByPlan.reduce((acc, plan, index) => {
                  const prevTotal = revenueByPlan.slice(0, index).reduce((sum, p) => sum + p.value, 0);
                  const circumference = 2 * Math.PI * 35;
                  const offset = (prevTotal / 100) * circumference;
                  const length = (plan.value / 100) * circumference;
                  
                  acc.push(
                    <circle
                      key={plan.name}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke={plan.color}
                      strokeWidth="20"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$48.5K</div>
                  <div className="text-xs text-gray-500">MRR</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {revenueByPlan.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                    <span className="text-sm text-gray-700">{plan.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">${plan.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{plan.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

            {/* Clients by Industry & Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clients by Industry */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Clients by Industry</h2>
                  <span className="text-sm text-gray-500">Distribution</span>
                </div>
          
                <div className="space-y-4">
                  {clientsByIndustry.map((item) => (
                    <div key={item.industry} className="flex items-center gap-4">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.count}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{item.industry}</span>
                          <span className="text-sm text-gray-600">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

        {/* Platform Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Engagement</h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {engagementMetrics.map((item) => (
              <div key={item.metric} className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">{item.metric}</div>
                <div className="text-xl font-bold text-gray-900">{item.value}</div>
                <div className={`text-xs flex items-center gap-1 mt-1 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-[#0f5257] to-[#0a3d41] rounded-xl text-white">
            <div className="flex items-center gap-3">
              <Zap size={24} />
              <div>
                <div className="font-semibold">Platform Health Score</div>
                <div className="text-sm text-white/80">Based on uptime, performance, and user satisfaction</div>
              </div>
              <div className="ml-auto text-3xl font-bold">98%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
