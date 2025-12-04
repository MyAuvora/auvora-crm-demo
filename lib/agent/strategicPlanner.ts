/**
 * AI Agent Strategic Planner
 * Generates comprehensive strategic plans with forecasting, risk analysis, and actionable recommendations
 */

import { getAllTransactions, getAllMembers, getAllClassPackClients, getAllLeads, getAllClasses } from '../dataStore';
import { analyzeRevenue, analyzePromoPerformance, analyzeCancellations, RevenueAnalysis, PromoPerformance } from './analytics';
import { recommendPromotion, recommendRetentionActions, recommendOperationalImprovements, Recommendation } from './recommendations';

export const SEASONALITY_FACTORS: { [month: number]: number } = {
  0: 1.4,   // January - New Year spike
  1: 1.2,   // February - momentum continues
  2: 1.1,   // March - spring prep
  3: 1.0,   // April - baseline
  4: 0.95,  // May - slight dip
  5: 0.7,   // June - summer slump begins
  6: 0.7,   // July - summer slump
  7: 0.75,  // August - summer slump ends
  8: 1.3,   // September - back to school spike
  9: 1.1,   // October - fall momentum
  10: 0.95, // November - holiday prep
  11: 0.85, // December - holiday season
};

export interface Forecast {
  month: string;
  revenue: number;
  confidence: number;
  seasonalityFactor: number;
  trend: 'up' | 'down' | 'stable';
  assumptions: string[];
}

export interface RiskFactor {
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  likelihood: number; // 0-1
  impact: string;
  mitigation: string;
}

export interface StrategicPlan {
  summary: string;
  forecast: Forecast;
  risks: RiskFactor[];
  recommendations: Recommendation[];
  keyMetrics: {
    currentRevenue: number;
    forecastRevenue: number;
    revenueGap: number;
    atRiskMembers: number;
    churnRate: number;
    topPromo: string;
  };
  citations: string[];
  generatedAt: Date;
}

/**
 * Forecast next month's revenue using historical data and seasonality
 */
function forecastNextMonth(
  revenueAnalysis: RevenueAnalysis,
  nextMonth: number
): Forecast {
  const monthlyRevenues = revenueAnalysis.byMonth;
  
  const recentMonths = monthlyRevenues.slice(-6);
  let trend: 'up' | 'down' | 'stable' = 'stable';
  
  if (recentMonths.length >= 2) {
    const firstHalf = recentMonths.slice(0, 3).reduce((sum, m) => sum + m.revenue, 0) / 3;
    const secondHalf = recentMonths.slice(-3).reduce((sum, m) => sum + m.revenue, 0) / 3;
    const trendRate = (secondHalf - firstHalf) / firstHalf;
    
    if (trendRate > 0.05) trend = 'up';
    else if (trendRate < -0.05) trend = 'down';
  }
  
  const baseRevenue = recentMonths.length > 0
    ? recentMonths.slice(-3).reduce((sum, m) => sum + m.revenue, 0) / Math.min(3, recentMonths.length)
    : revenueAnalysis.avgMonthlyRevenue;
  
  const seasonalityFactor = SEASONALITY_FACTORS[nextMonth] || 1.0;
  const forecastRevenue = baseRevenue * seasonalityFactor;
  
  let confidence = 0.7;
  if (recentMonths.length >= 6) confidence += 0.1;
  if (trend === 'stable') confidence += 0.1;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  return {
    month: monthNames[nextMonth],
    revenue: forecastRevenue,
    confidence,
    seasonalityFactor,
    trend,
    assumptions: [
      `Based on last ${recentMonths.length} months average: $${baseRevenue.toFixed(0)}`,
      `Seasonality factor for ${monthNames[nextMonth]}: ${seasonalityFactor}x`,
      `Historical trend: ${trend}`,
    ],
  };
}

/**
 * Identify business risks
 */
function identifyRisks(
  forecast: Forecast,
  revenueTarget: number,
  churnRate: number,
  atRiskMembers: number,
  overduePayments: number
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  
  if (forecast.revenue < revenueTarget * 0.9) {
    risks.push({
      type: 'high',
      title: 'Revenue Below Target',
      description: `Forecast $${forecast.revenue.toFixed(0)} vs target $${revenueTarget.toFixed(0)} (${((1 - forecast.revenue / revenueTarget) * 100).toFixed(0)}% gap)`,
      likelihood: 0.8,
      impact: `$${(revenueTarget - forecast.revenue).toFixed(0)} shortfall`,
      mitigation: 'Run high-performing promotion or increase sales efforts',
    });
  }
  
  if (churnRate > 5) {
    risks.push({
      type: 'high',
      title: 'High Churn Rate',
      description: `${churnRate.toFixed(1)}% monthly churn with ${atRiskMembers} at-risk members`,
      likelihood: 0.7,
      impact: `Potential loss of ${Math.floor(atRiskMembers * 0.3)} members`,
      mitigation: 'Launch re-engagement campaign for at-risk members',
    });
  } else if (atRiskMembers > 20) {
    risks.push({
      type: 'medium',
      title: 'At-Risk Member Pool Growing',
      description: `${atRiskMembers} members inactive 14+ days`,
      likelihood: 0.6,
      impact: `Potential loss of ${Math.floor(atRiskMembers * 0.2)} members`,
      mitigation: 'Proactive outreach to inactive members',
    });
  }
  
  if (forecast.seasonalityFactor < 0.9) {
    risks.push({
      type: 'medium',
      title: 'Seasonal Downturn Expected',
      description: `${forecast.month} historically ${((1 - forecast.seasonalityFactor) * 100).toFixed(0)}% below baseline`,
      likelihood: 0.75,
      impact: 'Lower revenue and higher cancellations',
      mitigation: 'Plan retention campaigns and adjust expectations',
    });
  }
  
  if (overduePayments > 10) {
    risks.push({
      type: 'medium',
      title: 'Overdue Payments Accumulating',
      description: `${overduePayments} members with overdue payments`,
      likelihood: 0.65,
      impact: 'Reduced cash flow and potential bad debt',
      mitigation: 'Process overdue payments and improve billing reminders',
    });
  }
  
  return risks.sort((a, b) => {
    const typeOrder = { high: 0, medium: 1, low: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * Generate comprehensive strategic plan
 */
export function generateStrategicPlan(
  location: string,
  timeframe: 'next-month' | 'this-month' | 'custom' = 'next-month'
): StrategicPlan {
  const now = new Date();
  const nextMonth = (now.getMonth() + 1) % 12;
  const targetMonth = timeframe === 'next-month' ? nextMonth : now.getMonth();
  
  const allTransactions = location === 'all' 
    ? getAllTransactions() 
    : getAllTransactions().filter(t => t.location === location);
  const allMembers = location === 'all'
    ? getAllMembers()
    : getAllMembers().filter(m => m.location === location);
  const allPackClients = location === 'all'
    ? getAllClassPackClients()
    : getAllClassPackClients().filter(c => c.location === location);
  const allLeads = location === 'all'
    ? getAllLeads()
    : getAllLeads().filter(l => l.location === location);
  const allClasses = location === 'all'
    ? getAllClasses()
    : getAllClasses().filter(c => c.location === location);
  
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const revenueAnalysis = analyzeRevenue(allTransactions, {
    start: twelveMonthsAgo,
    end: now,
  });
  
  const promoPerformance = analyzePromoPerformance(allTransactions, {
    start: twelveMonthsAgo,
    end: now,
  });
  
  const totalMembers = allMembers.length + allPackClients.length;
  const atRiskMembers = allMembers.filter(m => {
    const lastVisit = new Date(m.lastVisit);
    const daysSince = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 14;
  }).length;
  
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentCancellations = allLeads.filter(l => 
    l.status === 'cancelled' && new Date(l.createdDate) >= threeMonthsAgo
  );
  
  const cancellationAnalysis = analyzeCancellations(
    recentCancellations.map(l => ({
      cancellationDate: l.createdDate,
      reason: 'Various',
      tenure: 6,
    })),
    totalMembers,
    { start: threeMonthsAgo, end: now }
  );
  
  const revenueTarget = revenueAnalysis.avgMonthlyRevenue * 1.03;
  
  const forecast = forecastNextMonth(revenueAnalysis, targetMonth);
  
  const overduePayments = allMembers.filter(m => m.paymentStatus === 'overdue').length;
  const risks = identifyRisks(
    forecast,
    revenueTarget,
    cancellationAnalysis.cancellationRate,
    atRiskMembers,
    overduePayments
  );
  
  const recommendations: Recommendation[] = [];
  
  const promoRec = recommendPromotion({
    currentMonth: targetMonth,
    revenueTarget,
    currentRevenue: forecast.revenue,
    historicalPromos: promoPerformance,
    recentCancellations: recentCancellations.length,
  });
  if (promoRec) recommendations.push(promoRec);
  
  const retentionRecs = recommendRetentionActions({
    atRiskMembers,
    recentCancellations: cancellationAnalysis,
    avgTenure: 12,
  });
  recommendations.push(...retentionRecs);
  
  const lowClassPacks = allPackClients.filter(c => c.remainingClasses <= 2).length;
  const overfilledClasses = allClasses.filter(c => c.bookedCount > c.capacity).length;
  const overdueAmount = allMembers
    .filter(m => m.paymentStatus === 'overdue')
    .reduce((sum, m) => sum + (m.membershipType === 'unlimited' ? 199 : 
                                m.membershipType === '2x-week' ? 149 : 99), 0);
  
  const opsRecs = recommendOperationalImprovements({
    overduePayments,
    overdueAmount,
    lowClassPacks,
    overfilledClasses,
  });
  recommendations.push(...opsRecs);
  
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  const revenueGap = revenueTarget - forecast.revenue;
  const gapPercent = (revenueGap / revenueTarget) * 100;
  
  let summary = `Based on 12 months of historical data, ${forecast.month} revenue forecast: $${forecast.revenue.toFixed(0)} `;
  summary += `(${forecast.confidence * 100}% confidence). `;
  
  if (revenueGap > 0) {
    summary += `This is $${revenueGap.toFixed(0)} (${gapPercent.toFixed(0)}%) below target. `;
  } else {
    summary += `This exceeds target by $${Math.abs(revenueGap).toFixed(0)}. `;
  }
  
  if (forecast.seasonalityFactor < 1.0) {
    summary += `${forecast.month} is historically a slower month (${forecast.seasonalityFactor}x baseline). `;
  } else if (forecast.seasonalityFactor > 1.1) {
    summary += `${forecast.month} is historically a strong month (${forecast.seasonalityFactor}x baseline). `;
  }
  
  summary += `Top ${recommendations.length} recommended actions to optimize performance.`;
  
  return {
    summary,
    forecast,
    risks,
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    keyMetrics: {
      currentRevenue: revenueAnalysis.byMonth[revenueAnalysis.byMonth.length - 1]?.revenue || 0,
      forecastRevenue: forecast.revenue,
      revenueGap,
      atRiskMembers,
      churnRate: cancellationAnalysis.cancellationRate,
      topPromo: promoPerformance[0]?.promoName || 'None',
    },
    citations: [
      `Revenue analysis: Last 12 months (${revenueAnalysis.byMonth.length} months of data)`,
      `Promo performance: ${promoPerformance.length} promotions analyzed`,
      `Cancellation analysis: Last 3 months (${recentCancellations.length} cancellations)`,
      `Member activity: ${totalMembers} total members, ${atRiskMembers} at-risk`,
      `Seasonality model: Historical fitness industry patterns`,
    ],
    generatedAt: now,
  };
}

/**
 * Parse timeframe from query
 */
export function parseTimeframe(query: string): 'next-month' | 'this-month' | 'custom' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('next month') || lowerQuery.includes('prepare') || lowerQuery.includes('coming month')) {
    return 'next-month';
  }
  
  if (lowerQuery.includes('this month') || lowerQuery.includes('current month')) {
    return 'this-month';
  }
  
  return 'next-month'; // Default
}
