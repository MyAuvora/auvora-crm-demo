'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { generateDailyBrief, DailyBrief, shouldShowDailyBrief, markDailyBriefShown } from '@/lib/agent/proactive';
import { getAllMembers, getAllTransactions, getMembershipCancellations } from '@/lib/dataStore';
import { useApp } from '@/lib/context';

export default function AgentDailyBrief() {
  const { setActiveSection, openChatWithQuery } = useApp();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!shouldShowDailyBrief()) {
      setDismissed(true);
      return;
    }

    const members = getAllMembers();
    const transactions = getAllTransactions();
    const cancellations = getMembershipCancellations();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      return txDate >= monthStart;
    });

    const lastMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      return txDate >= lastMonthStart && txDate <= lastMonthEnd;
    });

    const currentRevenue = thisMonthTransactions.reduce((sum, t) => sum + t.total, 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + t.total, 0);
    const revenueTarget = 40000; // Starting target

    const activeMembers = members.filter(m => m.status === 'active').length;
    const atRiskMembers = members.filter(m => {
      if (m.status !== 'active') return false;
      const lastVisit = new Date(m.lastVisit);
      const daysSince = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 14;
    }).length;

    const newMembersThisWeek = members.filter(m => {
      const joinDate = new Date(m.joinDate);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return joinDate >= weekAgo;
    }).length;

    const overdueMembers = members.filter(m => m.paymentStatus === 'overdue');
    const overdueAmount = overdueMembers.length * 150; // Estimate

    const thisMonthCancellations = cancellations.filter(c => {
      const cancelDate = new Date(c.cancellationDate);
      return cancelDate >= monthStart;
    }).length;

    const lastMonthCancellations = cancellations.filter(c => {
      const cancelDate = new Date(c.cancellationDate);
      return cancelDate >= lastMonthStart && cancelDate <= lastMonthEnd;
    }).length;

    const navigationHandlers = {
      viewReports: () => setActiveSection('reports'),
      viewPromotions: () => setActiveSection('promotions'),
      viewPOS: () => setActiveSection('pos'),
      viewLeadsMembers: () => setActiveSection('leads-members'),
      viewSchedule: () => setActiveSection('schedule'),
      viewStaff: () => setActiveSection('staff'),
      viewMessaging: () => setActiveSection('messaging'),
    };

    const generatedBrief = generateDailyBrief({
      date: now,
      revenue: {
        current: currentRevenue,
        target: revenueTarget,
        lastMonth: lastMonthRevenue,
      },
      members: {
        active: activeMembers,
        atRisk: atRiskMembers,
        new: newMembersThisWeek,
      },
      operations: {
        overduePayments: overdueMembers.length,
        overdueAmount,
        pendingApprovals: 5,
      },
      classes: {
        today: 18,
        overfilled: 18,
        lowAttendance: 0,
      },
      cancellations: {
        thisMonth: thisMonthCancellations,
        lastMonth: lastMonthCancellations,
      },
    });

    const briefWithActions = {
      ...generatedBrief,
      cards: generatedBrief.cards.map(card => ({
        ...card,
        actions: card.actions.map(action => {
          let onClick = action.onClick;
          
          if (card.id === 'revenue-pacing') {
            if (action.label === 'View Recommendations') {
              onClick = () => openChatWithQuery('Give me revenue recommendations to hit this month\'s target based on current performance. Include concrete steps and projected impact.');
            } else if (action.label === 'Run Promotion') {
              onClick = navigationHandlers.viewPromotions;
            }
          }else if (card.id === 'overdue-payments') {
            onClick = navigationHandlers.viewPOS;
          } else if (card.id === 'at-risk-members') {
            if (action.label === 'View List') {
              onClick = navigationHandlers.viewLeadsMembers;
            } else if (action.label === 'Send Re-engagement') {
              onClick = navigationHandlers.viewMessaging;
            }
          } else if (card.id === 'overfilled-classes') {
            onClick = navigationHandlers.viewSchedule;
          } else if (card.id === 'pending-approvals') {
            onClick = navigationHandlers.viewStaff;
          } else if (card.id === 'new-members') {
            onClick = navigationHandlers.viewMessaging;
          } else if (card.id === 'cancellation-spike') {
            onClick = navigationHandlers.viewReports;
          }
          
          return { ...action, onClick };
        }),
      })),
    };

    setBrief(briefWithActions);
  }, []);

  const handleDismiss = () => {
    markDailyBriefShown();
    setDismissed(true);
  };

  if (dismissed || !brief || brief.cards.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'medium':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'low':
        return <CheckCircle className="text-blue-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-600" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
    return null;
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-lg border-2 border-[#AC1305] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-[#AC1305]">🤖</span> Daily Brief by Auvora
          </h2>
          <p className="text-gray-600 mt-1">{brief.summary}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brief.cards.map((card) => (
          <div
            key={card.id}
            className={`border-2 rounded-lg p-4 ${getPriorityColor(card.priority)} cursor-pointer hover:shadow-lg transition-shadow`}
            role="button"
            tabIndex={0}
            aria-label={`${card.title}: ${card.description}`}
            onClick={() => {
              if (card.actions.length > 0) {
                card.actions[0].onClick();
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && card.actions.length > 0) {
                e.preventDefault();
                card.actions[0].onClick();
              }
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getPriorityIcon(card.priority)}
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{card.description}</p>

            {card.metric && (
              <div className="bg-white rounded p-3 mb-3">
                <div className="text-xs text-gray-600 mb-1">{card.metric.label}</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{card.metric.value}</div>
                  {card.metric.trend && getTrendIcon(card.metric.trend)}
                </div>
                {card.metric.change && (
                  <div className="text-xs text-gray-600 mt-1">{card.metric.change}</div>
                )}
              </div>
            )}

            {card.actions.length > 0 && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {card.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                      action.type === 'primary'
                        ? 'bg-[#AC1305] text-white hover:bg-[#8B0F04]'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
