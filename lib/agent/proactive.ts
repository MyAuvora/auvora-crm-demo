/**
 * AI Agent Proactive Monitoring
 * Monitors business metrics and generates daily briefs with actionable suggestions
 */

import { Recommendation } from './recommendations';

export interface DailyBriefCard {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'alert' | 'opportunity' | 'insight';
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
  };
  actions: Array<{
    label: string;
    type: 'primary' | 'secondary';
    onClick: () => void;
  }>;
  dismissible: boolean;
}

export interface DailyBrief {
  date: string;
  summary: string;
  cards: DailyBriefCard[];
  recommendations: Recommendation[];
}

/**
 * Generate daily brief
 */
export function generateDailyBrief(context: {
  date: Date;
  revenue: { current: number; target: number; lastMonth: number };
  members: { active: number; atRisk: number; new: number };
  operations: { overduePayments: number; overdueAmount: number; pendingApprovals: number };
  classes: { today: number; overfilled: number; lowAttendance: number };
  cancellations: { thisMonth: number; lastMonth: number };
}): DailyBrief {
  const cards: DailyBriefCard[] = [];
  const { date, revenue, members, operations, classes, cancellations } = context;

  const revenuePacing = revenue.current / revenue.target;
  if (revenuePacing < 0.75) {
    cards.push({
      id: 'revenue-pacing',
      priority: 'critical',
      category: 'alert',
      title: 'Revenue Below Target',
      description: `Tracking ${((1 - revenuePacing) * 100).toFixed(0)}% below monthly goal`,
      metric: {
        label: 'MTD Revenue',
        value: `$${revenue.current.toFixed(0)}`,
        change: `$${(revenue.target - revenue.current).toFixed(0)} to goal`,
        trend: 'down',
      },
      actions: [
        {
          label: 'View Recommendations',
          type: 'primary',
          onClick: () => {},
        },
        {
          label: 'Run Promotion',
          type: 'secondary',
          onClick: () => {},
        },
      ],
      dismissible: false,
    });
  } else if (revenuePacing > 1.1) {
    cards.push({
      id: 'revenue-exceeding',
      priority: 'low',
      category: 'insight',
      title: 'Revenue Exceeding Target',
      description: `Tracking ${((revenuePacing - 1) * 100).toFixed(0)}% above monthly goal`,
      metric: {
        label: 'MTD Revenue',
        value: `$${revenue.current.toFixed(0)}`,
        change: `+$${(revenue.current - revenue.target).toFixed(0)}`,
        trend: 'up',
      },
      actions: [],
      dismissible: true,
    });
  }

  if (operations.overduePayments > 5) {
    cards.push({
      id: 'overdue-payments',
      priority: 'high',
      category: 'alert',
      title: `${operations.overduePayments} Missed Payments`,
      description: `$${operations.overdueAmount.toFixed(0)} in overdue payments`,
      metric: {
        label: 'Overdue Amount',
        value: `$${operations.overdueAmount.toFixed(0)}`,
        change: `${operations.overduePayments} members`,
        trend: 'down',
      },
      actions: [
        {
          label: 'Process All',
          type: 'primary',
          onClick: () => {},
        },
        {
          label: 'View Details',
          type: 'secondary',
          onClick: () => {},
        },
      ],
      dismissible: false,
    });
  }

  if (members.atRisk > 10) {
    cards.push({
      id: 'at-risk-members',
      priority: 'high',
      category: 'alert',
      title: `${members.atRisk} At-Risk Members`,
      description: 'Members inactive 14+ days may churn soon',
      metric: {
        label: 'At-Risk Members',
        value: members.atRisk.toString(),
        change: `${((members.atRisk / members.active) * 100).toFixed(0)}% of active`,
        trend: 'down',
      },
      actions: [
        {
          label: 'Send Re-engagement',
          type: 'primary',
          onClick: () => {},
        },
        {
          label: 'View List',
          type: 'secondary',
          onClick: () => {},
        },
      ],
      dismissible: false,
    });
  }

  if (classes.overfilled > 0) {
    cards.push({
      id: 'overfilled-classes',
      priority: 'medium',
      category: 'alert',
      title: `${classes.overfilled} Overfilled Classes Today`,
      description: 'Classes are over capacity',
      metric: {
        label: 'Overfilled',
        value: classes.overfilled.toString(),
        change: `of ${classes.today} classes`,
        trend: 'stable',
      },
      actions: [
        {
          label: 'View Schedule',
          type: 'primary',
          onClick: () => {},
        },
      ],
      dismissible: true,
    });
  }

  if (operations.pendingApprovals > 0) {
    cards.push({
      id: 'pending-approvals',
      priority: 'medium',
      category: 'alert',
      title: 'Pending Approvals',
      description: `${operations.pendingApprovals} requests need your review`,
      actions: [
        {
          label: 'Review Now',
          type: 'primary',
          onClick: () => {},
        },
      ],
      dismissible: true,
    });
  }

  if (members.new > 0) {
    cards.push({
      id: 'new-members',
      priority: 'low',
      category: 'insight',
      title: `${members.new} New Members This Week`,
      description: 'Welcome new members to build retention',
      metric: {
        label: 'New Members',
        value: members.new.toString(),
        trend: 'up',
      },
      actions: [
        {
          label: 'Send Welcome',
          type: 'primary',
          onClick: () => {},
        },
      ],
      dismissible: true,
    });
  }

  if (cancellations.thisMonth > cancellations.lastMonth * 1.3) {
    const increase = ((cancellations.thisMonth - cancellations.lastMonth) / cancellations.lastMonth) * 100;
    cards.push({
      id: 'cancellation-spike',
      priority: 'high',
      category: 'alert',
      title: 'Cancellations Increasing',
      description: `Up ${increase.toFixed(0)}% from last month`,
      metric: {
        label: 'This Month',
        value: cancellations.thisMonth.toString(),
        change: `+${cancellations.thisMonth - cancellations.lastMonth}`,
        trend: 'down',
      },
      actions: [
        {
          label: 'Analyze Reasons',
          type: 'primary',
          onClick: () => {},
        },
      ],
      dismissible: false,
    });
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const criticalCount = cards.filter(c => c.priority === 'critical').length;
  const highCount = cards.filter(c => c.priority === 'high').length;
  
  let summary = '';
  if (criticalCount > 0) {
    summary = `${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} need immediate attention.`;
  } else if (highCount > 0) {
    summary = `${highCount} high-priority item${highCount > 1 ? 's' : ''} to review today.`;
  } else if (cards.length > 0) {
    summary = `${cards.length} insight${cards.length > 1 ? 's' : ''} for today.`;
  } else {
    summary = 'All systems running smoothly!';
  }

  return {
    date: date.toISOString(),
    summary,
    cards: cards.slice(0, 5), // Limit to top 5 cards
    recommendations: [],
  };
}

/**
 * Check if daily brief should be shown
 */
export function shouldShowDailyBrief(): boolean {
  const lastShown = localStorage.getItem('auvora-daily-brief-last-shown');
  if (!lastShown) return true;

  const lastShownDate = new Date(lastShown);
  const today = new Date();
  
  return lastShownDate.toDateString() !== today.toDateString();
}

/**
 * Mark daily brief as shown
 */
export function markDailyBriefShown(): void {
  localStorage.setItem('auvora-daily-brief-last-shown', new Date().toISOString());
}
