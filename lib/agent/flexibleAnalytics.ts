/**
 * Flexible Analytics Engine
 * Provides generic analytics functions that can answer arbitrary business questions
 */

import { Member, Staff, CoachLeadInteraction } from '../types';
import { Booking } from '../dataStore';

export interface BirthdayResult {
  memberId: string;
  memberName: string;
  dateOfBirth: string;
  nextBirthday: Date;
  daysUntil: number;
  age: number;
}

export interface CoachConversionStats {
  coachId: string;
  coachName: string;
  totalTrials: number;
  conversions: number;
  conversionRate: number;
  timeRange: string;
}

/**
 * Find members with upcoming birthdays
 */
export function findUpcomingBirthdays(
  members: Member[],
  daysAhead: number = 30
): BirthdayResult[] {
  const today = new Date();
  const results: BirthdayResult[] = [];

  for (const member of members) {
    if (!member.dateOfBirth) continue;

    const dob = new Date(member.dateOfBirth);
    const currentYear = today.getFullYear();
    
    let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());
    
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
    }
    
    const daysUntil = Math.floor((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= daysAhead) {
      const age = currentYear - dob.getFullYear();
      results.push({
        memberId: member.id,
        memberName: member.name,
        dateOfBirth: member.dateOfBirth,
        nextBirthday,
        daysUntil,
        age: nextBirthday.getFullYear() === currentYear ? age : age + 1,
      });
    }
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  
  return results;
}

/**
 * Calculate coach conversion rates from trial classes
 */
export function calculateCoachConversionRates(
  interactions: CoachLeadInteraction[],
  staff: Staff[],
  timeRange?: { start: Date; end: Date; description: string }
): CoachConversionStats[] {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 90); // Default: past 90 days
  
  const start = timeRange?.start || defaultStart;
  const end = timeRange?.end || now;
  const description = timeRange?.description || 'Past 90 days';

  const trialInteractions = interactions.filter(i => {
    if (i.interactionType !== 'trial-class') return false;
    const interactionDate = new Date(i.interactionDate);
    return interactionDate >= start && interactionDate <= end;
  });

  const coachStats = new Map<string, { trials: number; conversions: number }>();
  
  for (const interaction of trialInteractions) {
    const stats = coachStats.get(interaction.coachId) || { trials: 0, conversions: 0 };
    stats.trials++;
    if (interaction.converted) {
      stats.conversions++;
    }
    coachStats.set(interaction.coachId, stats);
  }

  const results: CoachConversionStats[] = [];
  
  for (const [coachId, stats] of coachStats.entries()) {
    const coach = staff.find(s => s.id === coachId);
    if (!coach) continue;
    
    results.push({
      coachId,
      coachName: coach.name,
      totalTrials: stats.trials,
      conversions: stats.conversions,
      conversionRate: stats.trials > 0 ? stats.conversions / stats.trials : 0,
      timeRange: description,
    });
  }

  results.sort((a, b) => b.conversionRate - a.conversionRate);
  
  return results;
}

/**
 * Generic query executor for simple metrics
 * Supports: count, sum, avg, min, max, top N, bottom N
 */
export interface GenericQueryParams {
  entity: 'members' | 'bookings' | 'classes' | 'transactions' | 'leads' | 'staff';
  metric: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'list';
  field?: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: 'asc' | 'desc';
  limit?: number;
  timeRange?: { start: Date; end: Date };
}

export interface GenericQueryResult {
  value: number | string | any[];
  count?: number;
  details?: string;
  data?: any[];
}

/**
 * Execute a generic query over data
 */
export function executeGenericQuery(
  params: GenericQueryParams,
  data: any[]
): GenericQueryResult {
  let filtered = [...data];

  if (params.filters) {
    filtered = filtered.filter(item => {
      for (const [key, value] of Object.entries(params.filters!)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  if (params.timeRange) {
    filtered = filtered.filter(item => {
      const dateFields = ['date', 'createdDate', 'joinDate', 'timestamp', 'bookedAt', 'interactionDate'];
      for (const field of dateFields) {
        if (item[field]) {
          const itemDate = new Date(item[field]);
          return itemDate >= params.timeRange!.start && itemDate <= params.timeRange!.end;
        }
      }
      return true;
    });
  }

  switch (params.metric) {
    case 'count':
      return { value: filtered.length, count: filtered.length };
    
    case 'sum':
      if (!params.field) throw new Error('field required for sum');
      const sum = filtered.reduce((acc, item) => acc + (Number(item[params.field!]) || 0), 0);
      return { value: sum, count: filtered.length };
    
    case 'avg':
      if (!params.field) throw new Error('field required for avg');
      const total = filtered.reduce((acc, item) => acc + (Number(item[params.field!]) || 0), 0);
      const avg = filtered.length > 0 ? total / filtered.length : 0;
      return { value: avg, count: filtered.length };
    
    case 'min':
      if (!params.field) throw new Error('field required for min');
      const min = Math.min(...filtered.map(item => Number(item[params.field!]) || 0));
      return { value: min, count: filtered.length };
    
    case 'max':
      if (!params.field) throw new Error('field required for max');
      const max = Math.max(...filtered.map(item => Number(item[params.field!]) || 0));
      return { value: max, count: filtered.length };
    
    case 'list':
      if (params.sortBy && params.field) {
        filtered.sort((a, b) => {
          const aVal = a[params.field!];
          const bVal = b[params.field!];
          if (params.sortBy === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }
      
      if (params.limit) {
        filtered = filtered.slice(0, params.limit);
      }
      
      return { value: filtered, count: filtered.length, data: filtered };
    
    default:
      return { value: 0, count: 0 };
  }
}
