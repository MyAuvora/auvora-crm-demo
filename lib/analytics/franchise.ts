import { Member, Lead, Class, Location, ClassPackClient, DropInClient, Promotion } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, subYears } from 'date-fns';

export interface LocationMetrics {
  location: Location;
  locationName: string;
  revenue: {
    mtd: number;
    ytd: number;
    lastMonth: number;
    lastYear: number;
    momGrowth: number;
    yoyGrowth: number;
  };
  members: {
    active: number;
    new: number;
    cancelled: number;
    netGrowth: number;
    retention: number;
    churn: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  classes: {
    total: number;
    averageFillRate: number;
    totalCapacity: number;
    totalBooked: number;
  };
  staff: {
    total: number;
    coaches: number;
    frontDesk: number;
  };
}

export interface FranchiseOverview {
  totalRevenue: {
    mtd: number;
    ytd: number;
    momGrowth: number;
    yoyGrowth: number;
  };
  totalMembers: {
    active: number;
    netGrowth: number;
    churn: number;
  };
  totalLeads: {
    count: number;
    conversionRate: number;
  };
  averageFillRate: number;
  locationMetrics: LocationMetrics[];
}

const LOCATION_NAMES: Record<Location, string> = {
  'athletic-club': 'Athletic Club',
  'dance-studio': 'Dance Studio',
  'all': 'All Locations'
};

export function getLocationName(location: Location): string {
  return LOCATION_NAMES[location] || location;
}

export function getRevenueByLocation(
  members: Member[],
  classPacks: ClassPackClient[],
  dropIns: DropInClient[],
  location: Location,
  dateRange: { start: Date; end: Date }
): number {
  const locationMembers = location === 'all' 
    ? members 
    : members.filter(m => m.location === location);
  
  const locationClassPacks = location === 'all'
    ? classPacks
    : classPacks.filter(c => c.location === location);
  
  const locationDropIns = location === 'all'
    ? dropIns
    : dropIns.filter(d => d.location === location);

  const membershipRevenue = locationMembers
    .filter(m => {
      const joinDate = parseISO(m.joinDate);
      return isWithinInterval(joinDate, dateRange) || joinDate < dateRange.start;
    })
    .reduce((sum, m) => {
      const price = m.membershipType === 'unlimited' ? 199 : m.membershipType === '2x-week' ? 129 : 89;
      return sum + price;
    }, 0);

  const classPackRevenue = locationClassPacks
    .filter(c => {
      const purchaseDate = parseISO(c.purchaseDate);
      return isWithinInterval(purchaseDate, dateRange);
    })
    .reduce((sum, c) => {
      const price = c.packType === '20-pack' ? 300 : c.packType === '10-pack' ? 160 : 85;
      return sum + price;
    }, 0);

  const dropInRevenue = locationDropIns
    .filter(d => {
      const lastVisit = parseISO(d.lastVisit);
      return isWithinInterval(lastVisit, dateRange);
    })
    .reduce((sum, d) => sum + (d.totalVisits * 25), 0);

  return membershipRevenue + classPackRevenue + dropInRevenue;
}

export function getActiveMembersByLocation(
  members: Member[],
  location: Location
): number {
  const locationMembers = location === 'all'
    ? members
    : members.filter(m => m.location === location);
  
  return locationMembers.filter(m => m.status === 'active').length;
}

export function getLeadConversionByLocation(
  leads: Lead[],
  location: Location
): { total: number; converted: number; conversionRate: number } {
  const locationLeads = location === 'all'
    ? leads
    : leads.filter(l => l.location === location);
  
  const total = locationLeads.length;
  const converted = locationLeads.filter(l => l.status === 'joined').length;
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;

  return { total, converted, conversionRate };
}

export function getClassFillRateByLocation(
  classes: Class[],
  location: Location
): { averageFillRate: number; totalCapacity: number; totalBooked: number } {
  const locationClasses = location === 'all'
    ? classes
    : classes.filter(c => c.location === location);
  
  const totalCapacity = locationClasses.reduce((sum, c) => sum + c.capacity, 0);
  const totalBooked = locationClasses.reduce((sum, c) => sum + c.bookedCount, 0);
  const averageFillRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

  return { averageFillRate, totalCapacity, totalBooked };
}

export function getMemberChurnByLocation(
  members: Member[],
  location: Location,
  dateRange: { start: Date; end: Date }
): { cancelled: number; churnRate: number } {
  const locationMembers = location === 'all'
    ? members
    : members.filter(m => m.location === location);
  
  const activeAtStart = locationMembers.filter(m => {
    const joinDate = parseISO(m.joinDate);
    return joinDate < dateRange.start;
  }).length;

  const cancelled = locationMembers.filter(m => m.status === 'cancelled').length;
  const churnRate = activeAtStart > 0 ? (cancelled / activeAtStart) * 100 : 0;

  return { cancelled, churnRate };
}

export function getNewMembersByLocation(
  members: Member[],
  location: Location,
  dateRange: { start: Date; end: Date }
): number {
  const locationMembers = location === 'all'
    ? members
    : members.filter(m => m.location === location);
  
  return locationMembers.filter(m => {
    const joinDate = parseISO(m.joinDate);
    return isWithinInterval(joinDate, dateRange);
  }).length;
}

export function getLocationMetrics(
  members: Member[],
  leads: Lead[],
  classes: Class[],
  classPacks: ClassPackClient[],
  dropIns: DropInClient[],
  staff: any[],
  location: Location
): LocationMetrics {
  const now = new Date();
  const mtdRange = { start: startOfMonth(now), end: now };
  const ytdRange = { start: new Date(now.getFullYear(), 0, 1), end: now };
  const lastMonthRange = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
  const lastYearRange = { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31) };

  const revenueMTD = getRevenueByLocation(members, classPacks, dropIns, location, mtdRange);
  const revenueYTD = getRevenueByLocation(members, classPacks, dropIns, location, ytdRange);
  const revenueLastMonth = getRevenueByLocation(members, classPacks, dropIns, location, lastMonthRange);
  const revenueLastYear = getRevenueByLocation(members, classPacks, dropIns, location, lastYearRange);
  const momGrowth = revenueLastMonth > 0 ? ((revenueMTD - revenueLastMonth) / revenueLastMonth) * 100 : 0;
  const yoyGrowth = revenueLastYear > 0 ? ((revenueYTD - revenueLastYear) / revenueLastYear) * 100 : 0;

  const activeMembers = getActiveMembersByLocation(members, location);
  const newMembers = getNewMembersByLocation(members, location, mtdRange);
  const { cancelled, churnRate } = getMemberChurnByLocation(members, location, mtdRange);
  const netGrowth = newMembers - cancelled;
  const retention = 100 - churnRate;

  const leadStats = getLeadConversionByLocation(leads, location);

  const classStats = getClassFillRateByLocation(classes, location);

  const locationStaff = location === 'all' ? staff : staff.filter(s => s.location === location);
  const coaches = locationStaff.filter(s => s.role === 'coach' || s.role === 'head-coach').length;
  const frontDesk = locationStaff.filter(s => s.role === 'front-desk').length;

  return {
    location,
    locationName: getLocationName(location),
    revenue: {
      mtd: revenueMTD,
      ytd: revenueYTD,
      lastMonth: revenueLastMonth,
      lastYear: revenueLastYear,
      momGrowth,
      yoyGrowth
    },
    members: {
      active: activeMembers,
      new: newMembers,
      cancelled,
      netGrowth,
      retention,
      churn: churnRate
    },
    leads: {
      total: leadStats.total,
      converted: leadStats.converted,
      conversionRate: leadStats.conversionRate
    },
    classes: {
      total: classStats.totalCapacity > 0 ? (location === 'all' ? classes.length : classes.filter(c => c.location === location).length) : 0,
      averageFillRate: classStats.averageFillRate,
      totalCapacity: classStats.totalCapacity,
      totalBooked: classStats.totalBooked
    },
    staff: {
      total: locationStaff.length,
      coaches,
      frontDesk
    }
  };
}

export function getFranchiseOverview(
  members: Member[],
  leads: Lead[],
  classes: Class[],
  classPacks: ClassPackClient[],
  dropIns: DropInClient[],
  staff: any[]
): FranchiseOverview {
  const locations: Location[] = ['athletic-club', 'dance-studio'];
  
  const allMetrics = getLocationMetrics(members, leads, classes, classPacks, dropIns, staff, 'all');
  
  const locationMetrics = locations.map(loc => 
    getLocationMetrics(members, leads, classes, classPacks, dropIns, staff, loc)
  );

  return {
    totalRevenue: {
      mtd: allMetrics.revenue.mtd,
      ytd: allMetrics.revenue.ytd,
      momGrowth: allMetrics.revenue.momGrowth,
      yoyGrowth: allMetrics.revenue.yoyGrowth
    },
    totalMembers: {
      active: allMetrics.members.active,
      netGrowth: allMetrics.members.netGrowth,
      churn: allMetrics.members.churn
    },
    totalLeads: {
      count: allMetrics.leads.total,
      conversionRate: allMetrics.leads.conversionRate
    },
    averageFillRate: allMetrics.classes.averageFillRate,
    locationMetrics
  };
}

export function rankLocationsByMetric(
  locationMetrics: LocationMetrics[],
  metric: 'revenue' | 'members' | 'conversion' | 'fillRate'
): LocationMetrics[] {
  return [...locationMetrics].sort((a, b) => {
    switch (metric) {
      case 'revenue':
        return b.revenue.mtd - a.revenue.mtd;
      case 'members':
        return b.members.active - a.members.active;
      case 'conversion':
        return b.leads.conversionRate - a.leads.conversionRate;
      case 'fillRate':
        return b.classes.averageFillRate - a.classes.averageFillRate;
      default:
        return 0;
    }
  });
}

export function computeRoyalty(
  revenue: number,
  royaltyPercent: number = 7,
  brandFundPercent: number = 2
): { royalty: number; brandFund: number; total: number } {
  const royalty = revenue * (royaltyPercent / 100);
  const brandFund = revenue * (brandFundPercent / 100);
  const total = royalty + brandFund;

  return { royalty, brandFund, total };
}
