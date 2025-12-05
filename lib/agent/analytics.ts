/**
 * AI Agent Analytics Engine
 * Computes business metrics, insights, and patterns from historical data
 */

import { Transaction } from '../dataStore';

export interface PromoPerformance {
  promoCode: string;
  promoName: string;
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  conversionRate: number;
  roi: number;
  period: string;
}

export interface CancellationAnalysis {
  totalCancellations: number;
  cancellationRate: number;
  topReasons: Array<{ reason: string; count: number; percentage: number }>;
  avgTenure: number;
  byMonth: Array<{ month: string; count: number }>;
}

export interface RevenueAnalysis {
  totalRevenue: number;
  avgMonthlyRevenue: number;
  growthRate: number;
  byCategory: Array<{ category: string; revenue: number; percentage: number }>;
  byMonth: Array<{ month: string; revenue: number }>;
  trend: 'up' | 'down' | 'stable';
}

export interface ChurnInsight {
  atRiskMembers: number;
  churnRate: number;
  topRiskFactors: string[];
  recommendedActions: string[];
}

export interface BusinessInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  metric?: string;
  change?: number;
  actionable: boolean;
  suggestedAction?: string;
}

/**
 * Analyze promotion performance
 */
export function analyzePromoPerformance(
  transactions: Transaction[],
  timeRange?: { start: Date; end: Date }
): PromoPerformance[] {
  let filteredTransactions = transactions;
  if (timeRange) {
    filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      return txDate >= timeRange.start && txDate <= timeRange.end;
    });
  }

  const promoMap = new Map<string, Transaction[]>();
  filteredTransactions.forEach(t => {
    if (t.promoCode) {
      if (!promoMap.has(t.promoCode)) {
        promoMap.set(t.promoCode, []);
      }
      promoMap.get(t.promoCode)!.push(t);
    }
  });

  const results: PromoPerformance[] = [];
  promoMap.forEach((txns, promoCode) => {
    const totalRevenue = txns.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = txns.length;
    const avgTransactionValue = totalRevenue / totalTransactions;
    
    const totalPossibleTransactions = filteredTransactions.length;
    const conversionRate = totalTransactions / totalPossibleTransactions;
    
    const totalDiscounts = txns.reduce((sum, t) => sum + t.discount, 0);
    const roi = totalDiscounts > 0 ? ((totalRevenue - totalDiscounts) / totalDiscounts) : 0;

    results.push({
      promoCode,
      promoName: promoCode.replace(/_/g, ' '),
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
      conversionRate,
      roi,
      period: timeRange ? `${timeRange.start.toLocaleDateString()} - ${timeRange.end.toLocaleDateString()}` : 'All time',
    });
  });

  return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Analyze cancellations
 */
export function analyzeCancellations(
  cancellations: Array<{ cancellationDate: string; reason: string; tenure: number }>,
  totalMembers: number,
  timeRange?: { start: Date; end: Date }
): CancellationAnalysis {
  let filtered = cancellations;
  if (timeRange) {
    filtered = cancellations.filter(c => {
      const cancelDate = new Date(c.cancellationDate);
      return cancelDate >= timeRange.start && cancelDate <= timeRange.end;
    });
  }

  const reasonCounts = new Map<string, number>();
  let totalTenure = 0;
  filtered.forEach(c => {
    reasonCounts.set(c.reason, (reasonCounts.get(c.reason) || 0) + 1);
    totalTenure += c.tenure;
  });

  const topReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: (count / filtered.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const byMonth = new Map<string, number>();
  filtered.forEach(c => {
    const date = new Date(c.cancellationDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
  });

  const monthlyData = Array.from(byMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCancellations: filtered.length,
    cancellationRate: totalMembers > 0 ? (filtered.length / totalMembers) * 100 : 0,
    topReasons,
    avgTenure: filtered.length > 0 ? totalTenure / filtered.length : 0,
    byMonth: monthlyData,
  };
}

/**
 * Analyze revenue trends
 */
export function analyzeRevenue(
  transactions: Transaction[],
  timeRange?: { start: Date; end: Date }
): RevenueAnalysis {
  let filtered = transactions;
  if (timeRange) {
    filtered = transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      return txDate >= timeRange.start && txDate <= timeRange.end;
    });
  }

  const totalRevenue = filtered.reduce((sum, t) => sum + t.total, 0);

  const byMonth = new Map<string, number>();
  filtered.forEach(t => {
    const date = new Date(t.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + t.total);
  });

  const monthlyData = Array.from(byMonth.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const avgMonthlyRevenue = monthlyData.length > 0 
    ? totalRevenue / monthlyData.length 
    : 0;

  let growthRate = 0;
  if (monthlyData.length >= 2) {
    const lastMonth = monthlyData[monthlyData.length - 1].revenue;
    const prevMonth = monthlyData[monthlyData.length - 2].revenue;
    growthRate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  }

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (growthRate > 5) trend = 'up';
  else if (growthRate < -5) trend = 'down';

  const byCategory = new Map<string, number>();
  filtered.forEach(t => {
    t.items.forEach(item => {
      const category = item.productName.includes('Membership') ? 'Membership' :
                      item.productName.includes('Pack') ? 'Class Packs' :
                      item.productName.includes('Drop-In') ? 'Drop-In' : 'Retail';
      byCategory.set(category, (byCategory.get(category) || 0) + (item.price * item.quantity));
    });
  });

  const categoryData = Array.from(byCategory.entries())
    .map(([category, revenue]) => ({
      category,
      revenue,
      percentage: (revenue / totalRevenue) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    avgMonthlyRevenue,
    growthRate,
    byCategory: categoryData,
    byMonth: monthlyData,
    trend,
  };
}

/**
 * Generate business insights
 */
export function generateInsights(
  revenueAnalysis: RevenueAnalysis,
  cancellationAnalysis: CancellationAnalysis,
  promoPerformance: PromoPerformance[]
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  if (revenueAnalysis.trend === 'up') {
    insights.push({
      type: 'positive',
      title: 'Revenue Growing',
      description: `Revenue is up ${revenueAnalysis.growthRate.toFixed(1)}% from last month`,
      metric: 'revenue',
      change: revenueAnalysis.growthRate,
      actionable: false,
    });
  } else if (revenueAnalysis.trend === 'down') {
    insights.push({
      type: 'negative',
      title: 'Revenue Declining',
      description: `Revenue is down ${Math.abs(revenueAnalysis.growthRate).toFixed(1)}% from last month`,
      metric: 'revenue',
      change: revenueAnalysis.growthRate,
      actionable: true,
      suggestedAction: 'Consider running a promotional campaign to boost sales',
    });
  }

  if (cancellationAnalysis.cancellationRate > 5) {
    const topReason = cancellationAnalysis.topReasons[0];
    insights.push({
      type: 'negative',
      title: 'High Cancellation Rate',
      description: `${cancellationAnalysis.cancellationRate.toFixed(1)}% cancellation rate. Top reason: ${topReason.reason}`,
      metric: 'churn',
      change: cancellationAnalysis.cancellationRate,
      actionable: true,
      suggestedAction: `Address "${topReason.reason}" with targeted retention campaigns`,
    });
  }

  if (promoPerformance.length > 0) {
    const bestPromo = promoPerformance[0];
    insights.push({
      type: 'positive',
      title: 'Top Performing Promo',
      description: `${bestPromo.promoName} generated $${bestPromo.totalRevenue.toFixed(0)} with ${(bestPromo.conversionRate * 100).toFixed(1)}% conversion`,
      metric: 'promo',
      actionable: true,
      suggestedAction: 'Consider running similar promotions in the future',
    });
  }

  return insights;
}

/**
 * Compare two time periods
 */
export function comparePeriods(
  current: { revenue: number; members: number; cancellations: number },
  previous: { revenue: number; members: number; cancellations: number }
): {
  revenueChange: number;
  memberChange: number;
  cancellationChange: number;
  summary: string;
} {
  const revenueChange = previous.revenue > 0 
    ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
    : 0;
  
  const memberChange = previous.members > 0 
    ? ((current.members - previous.members) / previous.members) * 100 
    : 0;
  
  const cancellationChange = previous.cancellations > 0 
    ? ((current.cancellations - previous.cancellations) / previous.cancellations) * 100 
    : 0;

  let summary = '';
  if (revenueChange > 0) {
    summary += `Revenue up ${revenueChange.toFixed(1)}%. `;
  } else if (revenueChange < 0) {
    summary += `Revenue down ${Math.abs(revenueChange).toFixed(1)}%. `;
  }

  if (memberChange > 0) {
    summary += `Members up ${memberChange.toFixed(1)}%. `;
  } else if (memberChange < 0) {
    summary += `Members down ${Math.abs(memberChange).toFixed(1)}%. `;
  }

  return {
    revenueChange,
    memberChange,
    cancellationChange,
    summary: summary || 'No significant changes',
  };
}

/**
 * Rank coaches by cancellations
 */
export function rankCoachesByCancellations(
  bookings: Array<{ id: string; classId: string; memberId: string; memberName: string; status: string; bookedAt: string; checkedInAt?: string }>,
  classes: Array<{ id: string; name: string; coachId: string }>,
  staff: Array<{ id: string; name: string }>,
  timeRange?: { start: Date; end: Date }
): Array<{ coachId: string; coachName: string; cancellationCount: number; totalBookings: number; cancellationRate: number }> {
  let filteredBookings = bookings;
  if (timeRange) {
    filteredBookings = bookings.filter(b => {
      const bookingDate = new Date(b.bookedAt);
      return bookingDate >= timeRange.start && bookingDate <= timeRange.end;
    });
  }

  const classToCoach = new Map<string, string>();
  classes.forEach(c => {
    classToCoach.set(c.id, c.coachId);
  });

  const coachIdToName = new Map<string, string>();
  staff.forEach(s => {
    coachIdToName.set(s.id, s.name);
  });

  const coachStats = new Map<string, { cancellations: number; total: number }>();
  
  filteredBookings.forEach(booking => {
    const coachId = classToCoach.get(booking.classId);
    if (!coachId) return; // Skip if class not found
    
    if (!coachStats.has(coachId)) {
      coachStats.set(coachId, { cancellations: 0, total: 0 });
    }
    
    const stats = coachStats.get(coachId)!;
    stats.total++;
    
    if (booking.status === 'cancelled' || booking.status === 'no-show') {
      stats.cancellations++;
    }
  });

  const results = Array.from(coachStats.entries())
    .map(([coachId, stats]) => ({
      coachId,
      coachName: coachIdToName.get(coachId) || 'Unknown Coach',
      cancellationCount: stats.cancellations,
      totalBookings: stats.total,
      cancellationRate: stats.total > 0 ? (stats.cancellations / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.cancellationCount - a.cancellationCount);

  return results;
}

/**
 * Rank members by activity (check-ins)
 */
export function rankMembersByActivity(
  bookings: Array<{ id: string; classId: string; memberId: string; memberName: string; status: string; bookedAt: string; checkedInAt?: string }>,
  members: Array<{ id: string; name: string }>,
  timeRange?: { start: Date; end: Date },
  metric: 'checkins' | 'bookings' = 'checkins'
): Array<{ memberId: string; memberName: string; count: number; lastActivity?: string }> {
  let filteredBookings = bookings;
  if (timeRange) {
    filteredBookings = bookings.filter(b => {
      const bookingDate = new Date(b.bookedAt);
      return bookingDate >= timeRange.start && bookingDate <= timeRange.end;
    });
  }

  const memberActivity = new Map<string, { count: number; lastActivity?: string }>();
  
  filteredBookings.forEach(booking => {
    if (metric === 'checkins' && booking.status !== 'checked-in') {
      return;
    }
    
    if (!memberActivity.has(booking.memberId)) {
      memberActivity.set(booking.memberId, { count: 0 });
    }
    
    const activity = memberActivity.get(booking.memberId)!;
    activity.count++;
    
    const activityDate = booking.checkedInAt || booking.bookedAt;
    if (!activity.lastActivity || activityDate > activity.lastActivity) {
      activity.lastActivity = activityDate;
    }
  });

  const results = Array.from(memberActivity.entries())
    .map(([memberId, activity]) => ({
      memberId,
      memberName: filteredBookings.find(b => b.memberId === memberId)?.memberName || 'Unknown Member',
      count: activity.count,
      lastActivity: activity.lastActivity,
    }))
    .sort((a, b) => b.count - a.count);

  return results;
}

export interface MemberFrequencyStats {
  memberId: string;
  memberName: string;
  totalOccurrences: number;
  weeksConsidered: number;
  avgPerWeek: number;
  avgPerMonth: number;
  lastActivity?: string;
}

export interface FrequencyAnalysisResult {
  count: number;
  members: MemberFrequencyStats[];
  summary: {
    totalMembersAnalyzed: number;
    timeframeDescription: string;
    metric: 'checkins' | 'bookings';
    period: 'week' | 'month';
  };
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Compute member frequency statistics (classes per week/month on average)
 */
export function computeMemberFrequency(
  bookings: Array<{ id: string; classId: string; memberId: string; memberName: string; status: string; bookedAt: string; checkedInAt?: string }>,
  options: {
    period?: 'week' | 'month';
    timeRange?: { start: Date; end: Date; description: string };
    metric?: 'checkins' | 'bookings';
  } = {}
): MemberFrequencyStats[] {
  const { period = 'week', metric = 'checkins' } = options;
  
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - (8 * 7));
  
  const timeRange = options.timeRange || {
    start: defaultStart,
    end: now,
    description: 'Last 8 weeks'
  };
  
  let filteredBookings = bookings.filter(b => {
    const bookingDate = new Date(b.bookedAt);
    return bookingDate >= timeRange.start && bookingDate <= timeRange.end;
  });
  
  if (metric === 'checkins') {
    filteredBookings = filteredBookings.filter(b => b.status === 'checked-in');
  }
  
  const memberStats = new Map<string, {
    name: string;
    occurrencesByPeriod: Map<string, number>;
    lastActivity?: string;
  }>();
  
  filteredBookings.forEach(booking => {
    if (!memberStats.has(booking.memberId)) {
      memberStats.set(booking.memberId, {
        name: booking.memberName,
        occurrencesByPeriod: new Map(),
        lastActivity: undefined
      });
    }
    
    const stats = memberStats.get(booking.memberId)!;
    const activityDate = new Date(booking.checkedInAt || booking.bookedAt);
    const periodKey = period === 'week' ? getISOWeek(activityDate) : getMonthKey(activityDate);
    
    stats.occurrencesByPeriod.set(periodKey, (stats.occurrencesByPeriod.get(periodKey) || 0) + 1);
    
    const activityDateStr = booking.checkedInAt || booking.bookedAt;
    if (!stats.lastActivity || activityDateStr > stats.lastActivity) {
      stats.lastActivity = activityDateStr;
    }
  });
  
  const totalPeriods = period === 'week'
    ? Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (30 * 24 * 60 * 60 * 1000));
  
  const results: MemberFrequencyStats[] = [];
  
  memberStats.forEach((stats, memberId) => {
    const totalOccurrences = Array.from(stats.occurrencesByPeriod.values()).reduce((sum, count) => sum + count, 0);
    const weeksConsidered = totalPeriods;
    const avgPerWeek = totalOccurrences / weeksConsidered;
    const avgPerMonth = avgPerWeek * 4.33;
    
    results.push({
      memberId,
      memberName: stats.name,
      totalOccurrences,
      weeksConsidered,
      avgPerWeek,
      avgPerMonth,
      lastActivity: stats.lastActivity
    });
  });
  
  return results.sort((a, b) => b.avgPerWeek - a.avgPerWeek);
}

/**
 * Filter members by frequency threshold
 */
export function filterMembersByFrequency(
  frequencyStats: MemberFrequencyStats[],
  options: {
    operator: 'at_least' | 'at_most' | 'equal' | 'gt' | 'lt';
    value: number;
    period: 'week' | 'month';
  }
): FrequencyAnalysisResult {
  const { operator, value, period } = options;
  
  const filtered = frequencyStats.filter(member => {
    const compareValue = period === 'week' ? member.avgPerWeek : member.avgPerMonth;
    
    switch (operator) {
      case 'at_least':
        return compareValue >= value;
      case 'at_most':
        return compareValue <= value;
      case 'equal':
        return Math.abs(compareValue - value) < 0.5;
      case 'gt':
        return compareValue > value;
      case 'lt':
        return compareValue < value;
      default:
        return false;
    }
  });
  
  return {
    count: filtered.length,
    members: filtered,
    summary: {
      totalMembersAnalyzed: frequencyStats.length,
      timeframeDescription: frequencyStats[0]?.weeksConsidered 
        ? `${frequencyStats[0].weeksConsidered} weeks`
        : 'Unknown timeframe',
      metric: 'checkins',
      period
    }
  };
}
