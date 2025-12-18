'use client';

import { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Activity,
  Briefcase,
  GraduationCap,
  Heart,
  Scissors,
  Wrench,
  DollarSign,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  industry: string;
  onboarding_status: string;
  subscription_status: string;
  created_at: string;
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  pendingClients: number;
  clientsByIndustry: Record<string, number>;
  subscriptionMRR: number;
  mrrGrowth: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: 'client' | 'subscription' | 'onboarding' | 'support';
}

const industries = [
  { key: 'fitness', label: 'Fitness', icon: Briefcase, color: 'bg-blue-500' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: 'bg-purple-500' },
  { key: 'wellness', label: 'Wellness', icon: Heart, color: 'bg-green-500' },
  { key: 'beauty', label: 'Beauty', icon: Scissors, color: 'bg-pink-500' },
  { key: 'auxiliary', label: 'Auxiliary', icon: Wrench, color: 'bg-orange-500' },
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'client_added',
    title: 'New Client Onboarded',
    description: 'Iron Fitness Tampa - Fitness',
    timestamp: '2 hours ago',
    icon: 'client',
  },
  {
    id: '2',
    type: 'subscription_paid',
    title: 'Subscription Payment',
    description: '$299/mo from CrossFit Downtown',
    timestamp: '4 hours ago',
    icon: 'subscription',
  },
  {
    id: '3',
    type: 'onboarding_complete',
    title: 'Onboarding Complete',
    description: 'Bright Minds Academy is now live',
    timestamp: '1 day ago',
    icon: 'onboarding',
  },
  {
    id: '4',
    type: 'support_request',
    title: 'Support Request',
    description: 'Data import help for Zen Wellness',
    timestamp: '2 days ago',
    icon: 'support',
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    onboardingClients: 0,
    pendingClients: 0,
    clientsByIndustry: {
      fitness: 0,
      education: 0,
      wellness: 0,
      beauty: 0,
      auxiliary: 0,
    },
    subscriptionMRR: 8970,
    mrrGrowth: 12.5,
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
        const clients = data.tenants;
        const byIndustry: Record<string, number> = {
          fitness: 0,
          education: 0,
          wellness: 0,
          beauty: 0,
          auxiliary: 0,
        };
        
        clients.forEach((client: Client) => {
          const industry = client.industry || 'fitness';
          if (byIndustry[industry] !== undefined) {
            byIndustry[industry]++;
          }
        });

        setStats(prev => ({
          ...prev,
          totalClients: clients.length,
          activeClients: clients.filter((c: Client) => c.onboarding_status === 'live').length,
          onboardingClients: clients.filter((c: Client) => !['live', 'pending'].includes(c.onboarding_status)).length,
          pendingClients: clients.filter((c: Client) => c.onboarding_status === 'pending').length,
          clientsByIndustry: byIndustry,
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
      case 'client': return <Building2 size={16} className="text-blue-600" />;
      case 'subscription': return <DollarSign size={16} className="text-green-600" />;
      case 'onboarding': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'support': return <AlertCircle size={16} className="text-orange-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f5257]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your Auvora business at a glance</p>
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
              <p className="text-sm text-gray-600 font-medium">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
              <p className="text-sm text-gray-500 mt-1">Across all industries</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Clients</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeClients}</p>
              <p className="text-sm text-gray-500 mt-1">Live on platform</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Subscription MRR</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">${stats.subscriptionMRR.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight size={14} className="text-green-600" />
                <span className="text-sm text-green-600 font-medium">+{stats.mrrGrowth}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-[#d4af37]/20 rounded-xl flex items-center justify-center">
              <DollarSign className="text-[#d4af37]" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">In Onboarding</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.onboardingClients}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.pendingClients} pending setup</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Clients by Industry & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Industry */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Clients by Industry</h2>
              <p className="text-sm text-gray-500">Distribution across verticals</p>
            </div>
            <Link href="/admin" className="text-sm text-[#0f5257] hover:underline">
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {industries.map((industry) => {
              const count = stats.clientsByIndustry[industry.key] || 0;
              const percentage = stats.totalClients > 0 ? (count / stats.totalClients) * 100 : 0;
              const Icon = industry.icon;
              
              return (
                <div key={industry.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${industry.color} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{industry.label}</span>
                      <span className="text-sm text-gray-600">{count} clients</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${industry.color} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {stats.totalClients === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 size={32} className="mx-auto mb-2 opacity-50" />
              <p>No clients yet</p>
              <Link href="/admin" className="text-[#0f5257] hover:underline text-sm">
                Add your first client
              </Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="space-y-4">
            {mockActivity.map((activity) => (
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

      {/* Onboarding Pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Onboarding Pipeline</h2>
            <p className="text-sm text-gray-500">Track client setup progress</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { status: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
            { status: 'provisioned', label: 'Provisioned', color: 'bg-blue-100 text-blue-700' },
            { status: 'branded', label: 'Branded', color: 'bg-purple-100 text-purple-700' },
            { status: 'imported', label: 'Data Imported', color: 'bg-yellow-100 text-yellow-700' },
            { status: 'testing', label: 'Testing', color: 'bg-orange-100 text-orange-700' },
            { status: 'ready', label: 'Ready', color: 'bg-green-100 text-green-700' },
            { status: 'live', label: 'Live', color: 'bg-[#0f5257] text-white' },
          ].map((stage) => (
            <div key={stage.status} className={`rounded-lg p-4 text-center ${stage.color}`}>
              <div className="text-2xl font-bold">
                {stage.status === 'live' ? stats.activeClients : 
                 stage.status === 'pending' ? stats.pendingClients : 
                 Math.floor(stats.onboardingClients / 5)}
              </div>
              <div className="text-xs font-medium mt-1">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Manage Clients</p>
            <p className="text-xs text-gray-500">View and edit client accounts</p>
          </div>
        </Link>

        <Link
          href="/admin/payments"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Subscriptions</p>
            <p className="text-xs text-gray-500">Track billing and payments</p>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Analytics</p>
            <p className="text-xs text-gray-500">Platform insights and reports</p>
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
      content: "Hello! I'm Auvora, your AI assistant. I can help you with:\n\n• Client portfolio overview\n• Subscription and billing insights\n• Onboarding pipeline status\n• Platform adoption metrics\n• Industry breakdown analysis\n\nWhat would you like to know about your business?",
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

      if (lowerInput.includes('client') || lowerInput.includes('customer') || lowerInput.includes('account')) {
        response = "**Client Portfolio Overview**\n\nYou currently have clients across multiple industries:\n\n• **Fitness**: Gyms, studios, and fitness centers\n• **Education**: Micro schools and daycares\n• **Wellness**: Chiropractic, PT, and wellness practices\n\n**Recommendations:**\n1. Focus onboarding efforts on clients in the pipeline\n2. Schedule check-ins with recently onboarded clients\n3. Identify opportunities to expand into Beauty and Auxiliary verticals";
      } else if (lowerInput.includes('subscription') || lowerInput.includes('billing') || lowerInput.includes('mrr') || lowerInput.includes('revenue')) {
        response = "**Subscription Insights**\n\nYour subscription metrics:\n\n• **MRR**: Growing steadily month-over-month\n• **Billing Status**: Most clients are current on payments\n• **Plan Distribution**: Mix of Starter, Professional, and Enterprise tiers\n\n**Action Items:**\n1. Follow up on any past-due accounts\n2. Identify upgrade opportunities for Starter plan clients\n3. Review clients approaching renewal dates";
      } else if (lowerInput.includes('onboarding') || lowerInput.includes('pipeline') || lowerInput.includes('setup')) {
        response = "**Onboarding Pipeline Status**\n\nYour client onboarding funnel:\n\n• **Pending**: Awaiting initial setup\n• **In Progress**: Moving through branding, data import, and testing\n• **Ready to Launch**: Final review before going live\n\n**Tips:**\n1. Prioritize clients who have been in onboarding longest\n2. Reach out to pending clients to schedule kickoff calls\n3. Ensure data imports are validated before testing phase";
      } else if (lowerInput.includes('industry') || lowerInput.includes('vertical') || lowerInput.includes('fitness') || lowerInput.includes('education') || lowerInput.includes('wellness')) {
        response = "**Industry Analysis**\n\nAuvora serves five key verticals:\n\n• **Fitness**: Boutique studios, gyms, dance studios\n• **Education**: Micro schools, daycares, tutoring centers\n• **Wellness**: Chiropractic, PT, massage, holistic practices\n• **Beauty**: Salons, barbershops, med spas (coming soon)\n• **Auxiliary**: Local services like lawn care, pet care (coming soon)\n\n**Growth Opportunities:**\n1. Fitness remains your largest vertical\n2. Education and Wellness are growing segments\n3. Beauty and Auxiliary represent expansion opportunities";
      } else if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
        response = "I can help you with:\n\n**Portfolio Management:**\n• Client count and status overview\n• Industry breakdown and trends\n• Onboarding pipeline tracking\n\n**Business Metrics:**\n• Subscription MRR and growth\n• Billing and payment status\n• Client retention insights\n\n**Operations:**\n• Onboarding recommendations\n• Support queue overview\n• Platform adoption metrics\n\nJust ask me anything about your Auvora business!";
      } else {
        response = "I understand you're asking about: \"" + userMessage + "\"\n\nAs the owner of Auvora, here's what I can tell you:\n\n• Your client portfolio spans multiple industries\n• Subscription revenue is tracking well\n• Onboarding pipeline has active clients in progress\n\nWould you like me to dive deeper into clients by industry, subscription metrics, or onboarding status?";
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
              placeholder="Ask about clients, subscriptions, onboarding..."
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
              onClick={() => setInput('How are my clients distributed by industry?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Clients by industry
            </button>
            <button
              type="button"
              onClick={() => setInput('What is my subscription status?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Subscription status
            </button>
            <button
              type="button"
              onClick={() => setInput('How is my onboarding pipeline?')}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Onboarding pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
