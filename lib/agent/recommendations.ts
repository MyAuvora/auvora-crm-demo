/**
 * AI Agent Recommendations Engine
 * Generates actionable, data-driven business recommendations with projections
 */

import { Member, Class, Promotion } from '../types';

export interface RevenueRecommendation {
  id: string;
  priority: 1 | 2 | 3; // 1 = highest
  title: string;
  whyNow: string;
  segmentSize: number;
  segmentDescription: string;
  steps: string[];
  assumedConversionRate: number; // 0-1
  arpu: number;
  projectedImpact: number;
  timelineDays: number;
  confidence: number; // 0-1
  risk: string;
  mitigation: string;
}

export interface RevenueRecommendationsPlan {
  executiveSummary: string;
  currentRevenue: number;
  targetRevenue: number;
  gap: number;
  gapPercentage: number;
  recommendations: RevenueRecommendation[];
  assumptions: string[];
  seasonalContext: string;
}

/**
 * Compute comprehensive revenue recommendations based on current business state
 */
export function computeRevenueRecommendations(
  transactions: Array<{ id: string; total: number; timestamp: string; category?: string; memberId?: string }>,
  members: Array<Member>,
  bookings: Array<{ id: string; classId: string; memberId: string; status: string; bookedAt: string }>,
  classes: Array<Class>,
  promotions: Array<Promotion>,
  timeRange?: { start: Date; end: Date },
  targetRevenue?: number
): RevenueRecommendationsPlan {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonth = now.getMonth();
  
  const mtdTransactions = transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return txDate >= monthStart && txDate <= now;
  });
  const currentRevenue = mtdTransactions.reduce((sum, t) => sum + t.total, 0);
  
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthTransactions = transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return txDate >= lastMonthStart && txDate <= lastMonthEnd;
  });
  const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + t.total, 0);
  const target = targetRevenue || lastMonthRevenue * 1.1;
  
  const gap = target - currentRevenue;
  const gapPercentage = target > 0 ? (gap / target) * 100 : 0;
  
  const avgARPU = mtdTransactions.length > 0 
    ? currentRevenue / mtdTransactions.length 
    : 150; // fallback estimate
  
  const recommendations: RevenueRecommendation[] = [];
  
  const overdueMembers = members.filter(m => m.paymentStatus === 'overdue');
  if (overdueMembers.length > 0) {
    const estimatedOverdueAmount = overdueMembers.length * avgARPU;
    recommendations.push({
      id: 'overdue-recovery',
      priority: 1,
      title: 'Overdue Payment Recovery',
      whyNow: `${overdueMembers.length} members have overdue payments. Immediate recovery improves cash flow and prevents bad debt.`,
      segmentSize: overdueMembers.length,
      segmentDescription: `Members with overdue payment status`,
      steps: [
        'Send automated payment reminder via SMS and email',
        'Offer payment plan option for members with financial hardship',
        'Follow up with personal phone call for amounts over $200',
        'Process payments through saved payment methods'
      ],
      assumedConversionRate: 0.70, // 70% collection rate
      arpu: avgARPU,
      projectedImpact: estimatedOverdueAmount * 0.70,
      timelineDays: 3,
      confidence: 0.85,
      risk: 'Some members may cancel rather than pay',
      mitigation: 'Offer payment plans and emphasize value of continued membership'
    });
  }
  
  const atRiskMembers = members.filter(m => {
    if (m.status !== 'active') return false;
    const lastVisit = new Date(m.lastVisit);
    const daysSince = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 14 && daysSince < 30;
  });
  
  if (atRiskMembers.length > 0) {
    recommendations.push({
      id: 'at-risk-reactivation',
      priority: 1,
      title: 'At-Risk Member Reactivation',
      whyNow: `${atRiskMembers.length} active members haven't visited in 14+ days. Early intervention prevents churn.`,
      segmentSize: atRiskMembers.length,
      segmentDescription: 'Active members with 14-30 days since last visit',
      steps: [
        'Send personalized "We miss you" message with coach signature',
        'Offer complimentary personal training session or class',
        'Schedule follow-up call from their preferred coach',
        'Identify and address any barriers to attendance'
      ],
      assumedConversionRate: 0.35, // 35% reactivation rate
      arpu: avgARPU * 0.8, // Partial month value
      projectedImpact: atRiskMembers.length * 0.35 * (avgARPU * 0.8),
      timelineDays: 7,
      confidence: 0.75,
      risk: 'Some members may have already decided to cancel',
      mitigation: 'Act quickly before 30-day mark when churn risk doubles'
    });
  }
  
  const overfilledClasses = classes.filter(c => c.bookedCount >= c.capacity);
  if (overfilledClasses.length > 0) {
    const avgClassRevenue = 25; // Estimated per-class drop-in or pack usage
    const potentialSlots = overfilledClasses.length * 5; // 5 additional spots per class
    recommendations.push({
      id: 'capacity-optimization',
      priority: 1,
      title: 'Capacity Expansion for High-Demand Classes',
      whyNow: `${overfilledClasses.length} classes are at full capacity. Adding slots captures waitlist demand.`,
      segmentSize: potentialSlots,
      segmentDescription: `Additional spots across ${overfilledClasses.length} overfilled classes`,
      steps: [
        'Identify top 3 overfilled time slots (e.g., Thu 6pm, Sat 9am)',
        'Add duplicate class 30-60 minutes before/after peak time',
        'Notify waitlist members first, then promote to all members',
        'Monitor fill rates and adjust schedule accordingly'
      ],
      assumedConversionRate: 0.60, // 60% of new slots will fill
      arpu: avgClassRevenue,
      projectedImpact: potentialSlots * 0.60 * avgClassRevenue * 4, // 4 weeks
      timelineDays: 7,
      confidence: 0.80,
      risk: 'May need additional coach coverage',
      mitigation: 'Start with 1-2 new slots and scale based on demand'
    });
  }
  
  const lapsedMembers = members.filter(m => {
    if (m.status !== 'cancelled') return false;
    const cancelDate = new Date(m.lastVisit);
    const daysSince = (now.getTime() - cancelDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 60 && daysSince <= 180;
  });
  
  if (lapsedMembers.length > 0) {
    recommendations.push({
      id: 'lapsed-winback',
      priority: 2,
      title: 'Lapsed Member Win-Back Campaign',
      whyNow: `${lapsedMembers.length} members cancelled 2-6 months ago. Win-back window is still open.`,
      segmentSize: lapsedMembers.length,
      segmentDescription: 'Members who cancelled 60-180 days ago',
      steps: [
        'Send "We want you back" offer with limited-time discount',
        'Highlight new classes, equipment, or improvements since they left',
        'Offer no-commitment trial week to rebuild confidence',
        'Personal outreach from coach they worked with previously'
      ],
      assumedConversionRate: 0.08, // 8% win-back rate
      arpu: avgARPU,
      projectedImpact: lapsedMembers.length * 0.08 * avgARPU,
      timelineDays: 14,
      confidence: 0.60,
      risk: 'Low conversion rate; may damage brand if too aggressive',
      mitigation: 'Keep messaging positive and value-focused, not desperate'
    });
  }
  
  const highlyEngagedMembers = members.filter(m => 
    m.status === 'active' && m.visitsLast30Days >= 8
  );
  
  if (highlyEngagedMembers.length > 0) {
    const referralConversionRate = 0.25; // 25% of referrals convert
    const avgReferralsPerMember = 1.5;
    recommendations.push({
      id: 'referral-push',
      priority: 2,
      title: 'Member Referral Campaign',
      whyNow: `${highlyEngagedMembers.length} highly engaged members (8+ visits/month) are ideal referral sources.`,
      segmentSize: highlyEngagedMembers.length,
      segmentDescription: 'Active members with 8+ visits in last 30 days',
      steps: [
        'Send referral request to top engaged members with unique code',
        'Offer incentive: $50 credit for referrer, $50 off for new member',
        'Make sharing easy with pre-written social media posts',
        'Track and celebrate top referrers publicly'
      ],
      assumedConversionRate: referralConversionRate,
      arpu: avgARPU,
      projectedImpact: highlyEngagedMembers.length * avgReferralsPerMember * referralConversionRate * avgARPU,
      timelineDays: 21,
      confidence: 0.70,
      risk: 'Incentive cost reduces net revenue',
      mitigation: 'Structure as credit (not cash) to ensure it stays in-house'
    });
  }
  
  const dropInTransactions = mtdTransactions.filter(t => 
    t.category === 'drop-in' || t.total < 30
  );
  const frequentDropIns = Math.floor(dropInTransactions.length / 3); // Estimate unique clients
  
  if (frequentDropIns > 5) {
    const packPrice = 140; // 10-pack estimate
    recommendations.push({
      id: 'classpack-upsell',
      priority: 2,
      title: 'Class Pack Upsell to Drop-In Clients',
      whyNow: `Approximately ${frequentDropIns} clients are paying per-class. Packs offer better value and commitment.`,
      segmentSize: frequentDropIns,
      segmentDescription: 'Clients with 3+ drop-in visits this month',
      steps: [
        'Identify clients with 3+ drop-in visits in last 30 days',
        'Send personalized message showing savings with pack purchase',
        'Offer limited-time bonus: Buy 10-pack, get 1 free class',
        'Train front desk to suggest packs at check-in'
      ],
      assumedConversionRate: 0.30, // 30% conversion to packs
      arpu: packPrice,
      projectedImpact: frequentDropIns * 0.30 * packPrice,
      timelineDays: 14,
      confidence: 0.65,
      risk: 'May reduce per-class revenue if they were paying more',
      mitigation: 'Target only those paying standard drop-in rates'
    });
  }
  
  const seasonalRec = getSeasonalRecommendation(currentMonth, gap, avgARPU);
  if (seasonalRec) {
    recommendations.push(seasonalRec);
  }
  
  if (gapPercentage > 20) {
    const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    if (daysLeftInMonth > 5) {
      recommendations.push({
        id: 'flash-sale',
        priority: 1,
        title: '48-Hour Flash Sale',
        whyNow: `Revenue is ${gapPercentage.toFixed(0)}% below target with ${daysLeftInMonth} days left. Flash sale creates urgency.`,
        segmentSize: members.filter(m => m.status === 'active').length,
        segmentDescription: 'All active members and recent leads',
        steps: [
          'Create 48-hour offer: 20% off class packs or PT sessions',
          'Send multi-channel blast: SMS, email, social media',
          'Add countdown timer to create urgency',
          'Staff ready to process purchases and answer questions'
        ],
        assumedConversionRate: 0.12, // 12% flash sale conversion
        arpu: 120, // Discounted pack price
        projectedImpact: members.filter(m => m.status === 'active').length * 0.12 * 120,
        timelineDays: 2,
        confidence: 0.75,
        risk: 'Discount fatigue; trains members to wait for sales',
        mitigation: 'Use sparingly (max 2-3x per year) and emphasize limited availability'
      });
    }
  }
  
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.projectedImpact - a.projectedImpact;
  });
  
  const topRecommendations = recommendations.slice(0, 5);
  
  const totalProjectedImpact = topRecommendations.reduce((sum, r) => sum + r.projectedImpact, 0);
  const executiveSummary = gap > 0
    ? `You're currently $${gap.toFixed(0)} (${gapPercentage.toFixed(0)}%) behind target. I've identified ${topRecommendations.length} high-impact actions that could generate $${totalProjectedImpact.toFixed(0)} in additional revenue, closing ${Math.min(100, (totalProjectedImpact / gap) * 100).toFixed(0)}% of the gap.`
    : `You're on track to meet your revenue target. I've identified ${topRecommendations.length} growth opportunities that could generate an additional $${totalProjectedImpact.toFixed(0)} this month.`;
  
  const seasonalContext = getSeasonalContext(currentMonth);
  
  const assumptions = [
    `Average ARPU: $${avgARPU.toFixed(0)} (based on recent transaction data)`,
    `Conversion rates based on industry benchmarks and historical performance`,
    `Projections assume actions are executed within recommended timelines`,
    `All dollar amounts are estimates; actual results may vary`,
  ];
  
  return {
    executiveSummary,
    currentRevenue,
    targetRevenue: target,
    gap,
    gapPercentage,
    recommendations: topRecommendations,
    assumptions,
    seasonalContext,
  };
}

function getSeasonalRecommendation(month: number, gap: number, avgARPU: number): RevenueRecommendation | null {
  if (month === 0) {
    return {
      id: 'seasonal-newyear',
      priority: 1,
      title: 'New Year Resolution Campaign',
      whyNow: 'January sees 40% higher conversion rates. Capitalize on peak fitness motivation.',
      segmentSize: 50, // Estimated new leads
      segmentDescription: 'New leads and trial members from holiday period',
      steps: [
        'Launch "New Year, New You" campaign with 14-day trial offer',
        'Create social media content around goal-setting and transformation',
        'Host free community workout to attract new prospects',
        'Offer founding member rates for January sign-ups'
      ],
      assumedConversionRate: 0.35, // Higher January conversion
      arpu: avgARPU,
      projectedImpact: 50 * 0.35 * avgARPU,
      timelineDays: 14,
      confidence: 0.85,
      risk: 'January members have higher churn in Feb-Mar',
      mitigation: 'Strong onboarding and 30-day check-ins to build habit'
    };
  }
  
  if (month >= 5 && month <= 7) {
    return {
      id: 'seasonal-summer',
      priority: 2,
      title: 'Summer Retention Program',
      whyNow: 'Summer sees 50% higher churn. Proactive retention prevents cancellations.',
      segmentSize: 30, // Estimated at-risk
      segmentDescription: 'Members likely to pause for summer travel',
      steps: [
        'Offer membership freeze option (1-2 months) to retain members',
        'Create outdoor/vacation workout content for traveling members',
        'Launch summer challenge with prizes to maintain engagement',
        'Flexible scheduling for summer schedules'
      ],
      assumedConversionRate: 0.60, // Retention rate
      arpu: avgARPU * 0.5, // Partial value from freeze fees
      projectedImpact: 30 * 0.60 * (avgARPU * 0.5),
      timelineDays: 30,
      confidence: 0.70,
      risk: 'Freeze fees are lower than full membership',
      mitigation: 'Better to keep members engaged than lose them entirely'
    };
  }
  
  if (month === 8) {
    return {
      id: 'seasonal-backtoschool',
      priority: 1,
      title: 'Back to Routine Campaign',
      whyNow: 'September sees 30% increase in signups as people return to routines.',
      segmentSize: 40, // Estimated new leads
      segmentDescription: 'Lapsed members and new leads post-summer',
      steps: [
        'Launch "Back to Routine" campaign with 15% off first month',
        'Target lapsed members who paused for summer',
        'Partner with local schools for corporate wellness programs',
        'Create content around establishing fall fitness habits'
      ],
      assumedConversionRate: 0.30,
      arpu: avgARPU,
      projectedImpact: 40 * 0.30 * avgARPU,
      timelineDays: 14,
      confidence: 0.80,
      risk: 'Competing with other fall activities and commitments',
      mitigation: 'Emphasize flexibility and stress-relief benefits'
    };
  }
  
  return null;
}

function getSeasonalContext(month: number): string {
  const contexts: { [key: number]: string } = {
    0: 'January: Peak season for fitness. New Year\'s resolution momentum is strong. Focus on acquisition and strong onboarding.',
    1: 'February: Post-resolution drop-off begins. Focus on retention and habit-building for January sign-ups.',
    2: 'March: Spring cleaning mindset. Good time for transformation challenges and progress check-ins.',
    3: 'April: Spring renewal energy. Promote outdoor classes and seasonal offerings.',
    4: 'May: Pre-summer push. Members motivated by beach season. Good time for challenges and body composition focus.',
    5: 'June: Summer begins. Expect increased cancellations and pauses. Focus on retention and flexible options.',
    6: 'July: Mid-summer. Maintain engagement with outdoor events and vacation-friendly programming.',
    7: 'August: Late summer. Prepare for September surge with back-to-school messaging.',
    8: 'September: Back to routine. Strong acquisition month. Target lapsed members and new leads.',
    9: 'October: Fall momentum. Good time for challenges and goal-setting before holidays.',
    10: 'November: Holiday season begins. Focus on stress-relief and maintaining routines through holidays.',
    11: 'December: Holiday season. Promote gift memberships and January specials. Retention focus for current members.',
  };
  
  return contexts[month] || 'Focus on consistent member engagement and operational excellence.';
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  reasoning: string;
  projectedImpact: string;
  confidence: number;
}

export function recommendPromotion(params: {
  currentMonth: number;
  revenueTarget: number;
  currentRevenue: number;
  historicalPromos: any[];
  recentCancellations: number;
}): Recommendation | null {
  const gap = params.revenueTarget - params.currentRevenue;
  if (gap <= 0) return null;

  const topPromo = params.historicalPromos[0];
  if (!topPromo) return null;

  return {
    priority: 'high',
    title: `Run "${topPromo.promoName}" Promotion`,
    reasoning: `This promotion historically generated $${topPromo.revenue.toFixed(0)} revenue with ${topPromo.conversions} conversions. Given current ${gap.toFixed(0)} revenue gap, this could close ${Math.min(100, (topPromo.revenue / gap) * 100).toFixed(0)}% of shortfall.`,
    projectedImpact: `$${topPromo.revenue.toFixed(0)} revenue, ${topPromo.conversions} conversions`,
    confidence: 0.75,
  };
}

export function recommendRetentionActions(params: {
  atRiskMembers: number;
  recentCancellations: any;
  avgTenure: number;
}): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (params.atRiskMembers > 10) {
    recommendations.push({
      priority: 'high',
      title: 'Launch At-Risk Member Reactivation Campaign',
      reasoning: `${params.atRiskMembers} members are at risk of churning. Early intervention can save 30-40% of at-risk members.`,
      projectedImpact: `Save ${Math.floor(params.atRiskMembers * 0.35)} members, $${(params.atRiskMembers * 0.35 * 150).toFixed(0)} retained revenue`,
      confidence: 0.70,
    });
  }

  if (params.recentCancellations.cancellationRate > 5) {
    recommendations.push({
      priority: 'medium',
      title: 'Address High Churn Rate',
      reasoning: `Churn rate of ${params.recentCancellations.cancellationRate.toFixed(1)}% is above healthy threshold of 5%. Top reason: ${params.recentCancellations.topReasons[0]?.reason || 'Unknown'}`,
      projectedImpact: `Reduce churn by 2%, save ${Math.floor(params.atRiskMembers * 0.2)} members`,
      confidence: 0.60,
    });
  }

  return recommendations;
}

export function recommendOperationalImprovements(params: {
  overduePayments: number;
  overdueAmount: number;
  lowClassPacks: number;
  overfilledClasses: number;
}): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (params.overduePayments > 5) {
    recommendations.push({
      priority: 'high',
      title: 'Process Overdue Payments',
      reasoning: `${params.overduePayments} members have overdue payments totaling ~$${params.overdueAmount.toFixed(0)}. Immediate collection improves cash flow.`,
      projectedImpact: `$${(params.overdueAmount * 0.7).toFixed(0)} collected (70% recovery rate)`,
      confidence: 0.85,
    });
  }

  if (params.lowClassPacks > 10) {
    recommendations.push({
      priority: 'medium',
      title: 'Upsell Class Pack Renewals',
      reasoning: `${params.lowClassPacks} clients have 2 or fewer classes remaining. Proactive renewal messaging increases conversion.`,
      projectedImpact: `${Math.floor(params.lowClassPacks * 0.6)} renewals, $${(params.lowClassPacks * 0.6 * 140).toFixed(0)} revenue`,
      confidence: 0.65,
    });
  }

  if (params.overfilledClasses > 3) {
    recommendations.push({
      priority: 'medium',
      title: 'Add Class Capacity for High-Demand Times',
      reasoning: `${params.overfilledClasses} classes are at or over capacity. Adding duplicate time slots captures waitlist demand.`,
      projectedImpact: `${params.overfilledClasses * 5} new spots, $${(params.overfilledClasses * 5 * 25 * 4).toFixed(0)} monthly revenue`,
      confidence: 0.70,
    });
  }

  return recommendations;
}
