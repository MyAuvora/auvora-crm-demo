/**
 * AI Agent Recommendations Engine
 * Generates actionable recommendations based on business context and historical patterns
 */

import { PromoPerformance, RevenueAnalysis, CancellationAnalysis } from './analytics';

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'revenue' | 'retention' | 'operations' | 'marketing';
  title: string;
  description: string;
  reasoning: string;
  projectedImpact: string;
  confidence: number; // 0-1
  actions: Array<{
    label: string;
    toolId: string;
    params: any;
  }>;
  basedOn: string[]; // Data sources used
}

/**
 * Recommend promotions based on context
 */
export function recommendPromotion(
  context: {
    currentMonth: number;
    revenueTarget: number;
    currentRevenue: number;
    historicalPromos: PromoPerformance[];
    recentCancellations: number;
  }
): Recommendation | null {
  const { currentMonth, revenueTarget, currentRevenue, historicalPromos, recentCancellations } = context;
  
  const revenuePacing = currentRevenue / revenueTarget;
  
  if (revenuePacing < 0.75) {
    const bestPromo = historicalPromos[0];
    
    if (bestPromo) {
      return {
        id: `rec-promo-${Date.now()}`,
        priority: 'high',
        category: 'revenue',
        title: 'Run High-Impact Promotion',
        description: `Revenue is tracking ${((1 - revenuePacing) * 100).toFixed(0)}% below target. Run a proven promotion to boost sales.`,
        reasoning: `Based on historical data, "${bestPromo.promoName}" generated $${bestPromo.totalRevenue.toFixed(0)} with ${(bestPromo.conversionRate * 100).toFixed(1)}% conversion rate.`,
        projectedImpact: `Estimated $${(bestPromo.avgTransactionValue * 20).toFixed(0)} in additional revenue`,
        confidence: 0.75,
        actions: [
          {
            label: 'Create Similar Promotion',
            toolId: 'create_promotion',
            params: {
              name: `${getMonthName(currentMonth)} Flash Sale`,
              discount: 20,
              duration: 7,
            },
          },
        ],
        basedOn: ['Historical promo performance', 'Current revenue pacing'],
      };
    }
  }

  if (currentMonth === 0) {
    return {
      id: `rec-promo-newyear-${Date.now()}`,
      priority: 'high',
      category: 'marketing',
      title: 'New Year Resolution Campaign',
      description: 'January is peak season for fitness signups. Capitalize on New Year motivation.',
      reasoning: 'Historical data shows 40% higher conversion rates in January',
      projectedImpact: 'Estimated 30-50 new members',
      confidence: 0.85,
      actions: [
        {
          label: 'Create New Year Promo',
          toolId: 'create_promotion',
          params: {
            name: 'New Year New You',
            discount: 20,
            duration: 14,
          },
        },
      ],
      basedOn: ['Seasonal trends', 'Historical January performance'],
    };
  }

  if (currentMonth >= 5 && currentMonth <= 7) {
    return {
      id: `rec-promo-summer-${Date.now()}`,
      priority: 'medium',
      category: 'retention',
      title: 'Summer Retention Campaign',
      description: 'Summer typically sees higher cancellations. Focus on retention.',
      reasoning: 'Historical data shows 50% higher churn rate during summer months',
      projectedImpact: 'Prevent 10-15 cancellations',
      confidence: 0.70,
      actions: [
        {
          label: 'Create Freeze Option Promo',
          toolId: 'create_promotion',
          params: {
            name: 'Summer Pause - Keep Your Spot',
            discount: 0,
            duration: 30,
          },
        },
      ],
      basedOn: ['Seasonal churn patterns', 'Summer cancellation rates'],
    };
  }

  if (currentMonth === 8) {
    return {
      id: `rec-promo-backtoschool-${Date.now()}`,
      priority: 'high',
      category: 'marketing',
      title: 'Back to School Campaign',
      description: 'September sees renewed commitment to fitness routines.',
      reasoning: 'Historical data shows 30% increase in signups in September',
      projectedImpact: 'Estimated 20-30 new members',
      confidence: 0.80,
      actions: [
        {
          label: 'Create Back to School Promo',
          toolId: 'create_promotion',
          params: {
            name: 'Back to Routine Special',
            discount: 15,
            duration: 14,
          },
        },
      ],
      basedOn: ['Seasonal trends', 'Historical September performance'],
    };
  }

  return null;
}

/**
 * Recommend retention actions
 */
export function recommendRetentionActions(
  context: {
    atRiskMembers: number;
    recentCancellations: CancellationAnalysis;
    avgTenure: number;
  }
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { atRiskMembers, recentCancellations, avgTenure } = context;

  if (atRiskMembers > 10) {
    recommendations.push({
      id: `rec-retention-atrisk-${Date.now()}`,
      priority: 'high',
      category: 'retention',
      title: 'Re-engage At-Risk Members',
      description: `${atRiskMembers} members haven't visited in 14+ days and may churn soon.`,
      reasoning: 'Members with 14+ day gaps have 3x higher churn risk',
      projectedImpact: `Prevent 20-30% of potential cancellations (${Math.floor(atRiskMembers * 0.25)} members)`,
      confidence: 0.65,
      actions: [
        {
          label: 'Send Re-engagement Campaign',
          toolId: 'send_message',
          params: {
            recipients: Array(atRiskMembers).fill('member-id'),
            message: "We miss you! Come back this week and get a free personal training session.",
            type: 'sms',
          },
        },
      ],
      basedOn: ['Member activity patterns', 'Historical churn data'],
    });
  }

  if (recentCancellations.topReasons.length > 0) {
    const topReason = recentCancellations.topReasons[0];
    
    if (topReason.reason === 'Schedule conflicts' && topReason.percentage > 30) {
      recommendations.push({
        id: `rec-retention-schedule-${Date.now()}`,
        priority: 'medium',
        category: 'operations',
        title: 'Address Schedule Conflicts',
        description: `${topReason.percentage.toFixed(0)}% of cancellations cite schedule conflicts.`,
        reasoning: 'Adding more flexible class times could reduce churn',
        projectedImpact: 'Reduce cancellations by 15-20%',
        confidence: 0.60,
        actions: [],
        basedOn: ['Cancellation reasons', 'Member feedback'],
      });
    }

    if (topReason.reason === 'Financial reasons' && topReason.percentage > 25) {
      recommendations.push({
        id: `rec-retention-financial-${Date.now()}`,
        priority: 'medium',
        category: 'retention',
        title: 'Offer Payment Flexibility',
        description: `${topReason.percentage.toFixed(0)}% of cancellations cite financial reasons.`,
        reasoning: 'Payment plans or downgrade options could retain members',
        projectedImpact: 'Retain 30-40% of at-risk members',
        confidence: 0.55,
        actions: [],
        basedOn: ['Cancellation reasons', 'Member demographics'],
      });
    }
  }

  if (avgTenure < 6) {
    recommendations.push({
      id: `rec-retention-newmember-${Date.now()}`,
      priority: 'medium',
      category: 'retention',
      title: 'Implement 90-Day Check-ins',
      description: 'Many cancellations occur within first 6 months.',
      reasoning: 'Proactive check-ins at 30, 60, 90 days improve retention by 25%',
      projectedImpact: 'Improve new member retention by 20-25%',
      confidence: 0.70,
      actions: [],
      basedOn: ['Tenure analysis', 'Industry best practices'],
    });
  }

  return recommendations;
}

/**
 * Recommend operational improvements
 */
export function recommendOperationalImprovements(
  context: {
    overduePayments: number;
    overdueAmount: number;
    lowClassPacks: number;
    overfilledClasses: number;
  }
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { overduePayments, overdueAmount, lowClassPacks, overfilledClasses } = context;

  if (overduePayments > 5) {
    recommendations.push({
      id: `rec-ops-payments-${Date.now()}`,
      priority: 'high',
      category: 'operations',
      title: 'Process Overdue Payments',
      description: `${overduePayments} members have overdue payments totaling $${overdueAmount.toFixed(0)}.`,
      reasoning: 'Processing overdue payments improves cash flow and reduces bad debt',
      projectedImpact: `Collect $${(overdueAmount * 0.7).toFixed(0)} (70% success rate)`,
      confidence: 0.80,
      actions: [
        {
          label: 'Process All Payments',
          toolId: 'process_payments',
          params: {
            memberIds: Array(overduePayments).fill('member-id'),
            amount: overdueAmount,
          },
        },
      ],
      basedOn: ['Payment status', 'Historical collection rates'],
    });
  }

  if (lowClassPacks > 5) {
    recommendations.push({
      id: `rec-ops-classpacks-${Date.now()}`,
      priority: 'medium',
      category: 'revenue',
      title: 'Promote Class Pack Renewals',
      description: `${lowClassPacks} clients have ≤2 classes remaining.`,
      reasoning: 'Proactive renewal offers have 60% conversion rate',
      projectedImpact: `Generate $${(lowClassPacks * 140 * 0.6).toFixed(0)} in pack renewals`,
      confidence: 0.75,
      actions: [
        {
          label: 'Send Renewal Offers',
          toolId: 'send_message',
          params: {
            recipients: Array(lowClassPacks).fill('client-id'),
            message: "You're running low on classes! Renew now and get 10% off your next pack.",
            type: 'sms',
          },
        },
      ],
      basedOn: ['Class pack usage', 'Historical renewal rates'],
    });
  }

  if (overfilledClasses > 3) {
    recommendations.push({
      id: `rec-ops-capacity-${Date.now()}`,
      priority: 'medium',
      category: 'operations',
      title: 'Address Class Capacity Issues',
      description: `${overfilledClasses} classes are over capacity today.`,
      reasoning: 'Overcrowded classes reduce member satisfaction and safety',
      projectedImpact: 'Improve member experience and retention',
      confidence: 0.70,
      actions: [],
      basedOn: ['Class bookings', 'Capacity limits'],
    });
  }

  return recommendations;
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
}
