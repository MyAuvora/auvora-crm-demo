/**
 * AI Agent Query Engine
 * Parses natural language queries and converts them to structured data queries
 */

export type QueryIntent = 
  | 'list_promotions'
  | 'list_cancellations'
  | 'list_transactions'
  | 'analyze_revenue'
  | 'analyze_churn'
  | 'analyze_attendance'
  | 'compare_periods'
  | 'recommend_promo'
  | 'show_metrics'
  | 'strategic_plan'
  | 'rank_coaches_cancellations'
  | 'rank_members_activity'
  | 'revenue_recommendations'
  | 'unknown';

export interface QueryParams {
  intent: QueryIntent;
  timeRange?: {
    start: Date;
    end: Date;
    description: string;
  };
  filters?: {
    category?: string;
    status?: string;
    minValue?: number;
    maxValue?: number;
  };
  sortBy?: string;
  limit?: number;
}

export interface ParsedQuery {
  intent: QueryIntent;
  params: QueryParams;
  confidence: number;
}

function parseTimeRange(query: string): { start: Date; end: Date; description: string } | undefined {
  const now = new Date();
  const lowerQuery = query.toLowerCase();

  const monthsMatch = lowerQuery.match(/past (\d+) months?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const start = new Date(now);
    start.setMonth(start.getMonth() - months);
    return {
      start,
      end: now,
      description: `Past ${months} month${months > 1 ? 's' : ''}`,
    };
  }

  const daysMatch = lowerQuery.match(/past (\d+) days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    return {
      start,
      end: now,
      description: `Past ${days} day${days > 1 ? 's' : ''}`,
    };
  }

  if (lowerQuery.includes('this month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start,
      end: now,
      description: 'This month',
    };
  }

  if (lowerQuery.includes('last month')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start,
      end,
      description: 'Last month',
    };
  }

  if (lowerQuery.includes('this year')) {
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start,
      end: now,
      description: 'This year',
    };
  }

  if (lowerQuery.includes('past year') || lowerQuery.includes('last year')) {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return {
      start,
      end: now,
      description: 'Past 12 months',
    };
  }

  return undefined;
}

function detectIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();

  if (/(give|show|provide|need).* recommendations?/i.test(query) ||
      /(grow|increase|boost|improve).* (revenue|sales)/i.test(query) ||
      /(hit|reach|meet|achieve).* (target|goal)/i.test(query) ||
      /(close|fill).* (gap|shortfall)/i.test(query) ||
      /what should (we|i) do/i.test(query) ||
      /(more|additional) (sales|revenue|money)/i.test(query) ||
      /behind.* target/i.test(query) ||
      /need.* \$\d+/i.test(query)) {
    return 'revenue_recommendations';
  }

  if (/(which|what) (coach|trainer|instructor).* (most|highest|least|lowest).* (cancellations?|cancels|no[- ]?shows?)/i.test(query)) {
    return 'rank_coaches_cancellations';
  }

  if (/(who|which member).* (most|least|highest|lowest) (active|check[- ]?ins?|visits?|attendance)/i.test(query)) {
    return 'rank_members_activity';
  }

  const strategicKeywords = [
    'prepare', 'plan', 'planning', 'strategy', 'strategic',
    'next month', 'coming month', 'forecast', 'predict',
    'should we do', 'what to do', 'how to', 'recommend',
    'goal', 'target', 'hit', 'reach', 'achieve',
    'based on', 'last 12 months', 'past year'
  ];
  
  let strategicScore = 0;
  strategicKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) strategicScore++;
  });
  
  if (strategicScore >= 2 || 
      lowerQuery.includes('what should') || 
      lowerQuery.includes('what to do') ||
      lowerQuery.includes('how should we')) {
    return 'strategic_plan';
  }

  if ((lowerQuery.includes('promo') || lowerQuery.includes('promotion')) && 
      (lowerQuery.includes('work') || lowerQuery.includes('best') || lowerQuery.includes('perform'))) {
    return 'list_promotions';
  }

  if (lowerQuery.includes('recommend') && lowerQuery.includes('promo')) {
    return 'recommend_promo';
  }

  if (lowerQuery.includes('cancellation') || lowerQuery.includes('churn')) {
    if (lowerQuery.includes('show') || lowerQuery.includes('list') || lowerQuery.includes('all')) {
      return 'list_cancellations';
    }
    return 'analyze_churn';
  }

  if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('income')) {
    return 'analyze_revenue';
  }

  if (lowerQuery.includes('attendance') || lowerQuery.includes('occupancy') || lowerQuery.includes('class')) {
    return 'analyze_attendance';
  }

  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('versus')) {
    return 'compare_periods';
  }

  if (lowerQuery.includes('metric') || lowerQuery.includes('kpi') || lowerQuery.includes('performance')) {
    return 'show_metrics';
  }

  if (lowerQuery.includes('next month') || 
      lowerQuery.includes('this month') || 
      lowerQuery.includes('prepare')) {
    return 'strategic_plan';
  }

  return 'unknown';
}

export function parseQuery(query: string): ParsedQuery {
  const intent = detectIntent(query);
  const timeRange = parseTimeRange(query);

  const params: QueryParams = {
    intent,
    timeRange,
  };

  if (query.toLowerCase().includes('best') || query.toLowerCase().includes('top')) {
    params.sortBy = 'desc';
  } else if (query.toLowerCase().includes('worst') || query.toLowerCase().includes('bottom')) {
    params.sortBy = 'asc';
  }

  let confidence = 0.5;
  if (intent !== 'unknown') confidence += 0.3;
  if (timeRange) confidence += 0.2;

  return {
    intent,
    params,
    confidence,
  };
}

export const EXAMPLE_QUERIES = [
  'Give me revenue recommendations to hit this month\'s target',
  'We need +$7k this month—what should we do?',
  'Which coach has the most cancellations?',
  'Who is the most active member?',
  'Show me three high-ROI actions for this week',
  'What\'s our revenue analysis for this month?',
];
