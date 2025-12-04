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
  'Which promos worked best in the past 12 months?',
  'Show me all cancellations from the past 3 months',
  'What is our revenue this month?',
  'Which promo should we run in July?',
  'Why are cancellations up this month?',
  'Show me our best performing coaches',
  'What changed this week vs last week?',
];
