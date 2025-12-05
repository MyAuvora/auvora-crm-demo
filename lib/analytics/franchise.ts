import { Member, Lead, Class, Location, ClassPackClient, DropInClient, Promotion, FranchiseLocation, FranchiseSummary } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, subYears } from 'date-fns';
import { getFranchiseLocations, getFranchiseSummaries } from '../dataStore';

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

export function getLocationName(location: Location): string {
  if (location === 'all') return 'All Locations';
  
  const franchiseLocations = getFranchiseLocations();
  const loc = franchiseLocations.find(l => l.id === location);
  return loc ? loc.name : location;
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
  if (location === 'athletic-club') {
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

    const locationStaff = staff.filter(s => s.location === location);
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
        total: classes.filter(c => c.location === location).length,
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
  
  const summaries = getFranchiseSummaries();
  const summary = summaries[location];
  
  if (!summary) {
    return {
      location,
      locationName: getLocationName(location),
      revenue: { mtd: 0, ytd: 0, lastMonth: 0, lastYear: 0, momGrowth: 0, yoyGrowth: 0 },
      members: { active: 0, new: 0, cancelled: 0, netGrowth: 0, retention: 100, churn: 0 },
      leads: { total: 0, converted: 0, conversionRate: 0 },
      classes: { total: 0, averageFillRate: 0, totalCapacity: 0, totalBooked: 0 },
      staff: { total: 0, coaches: 0, frontDesk: 0 }
    };
  }

  const momGrowth = summary.lastMonthRevenue > 0 
    ? ((summary.mtdRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100 
    : 0;

  return {
    location,
    locationName: getLocationName(location),
    revenue: {
      mtd: summary.mtdRevenue,
      ytd: summary.ytdRevenue,
      lastMonth: summary.lastMonthRevenue,
      lastYear: summary.ytdRevenue / 1.1,
      momGrowth,
      yoyGrowth: summary.yoyGrowth
    },
    members: {
      active: summary.activeMembers,
      new: summary.newMembers,
      cancelled: summary.cancelled,
      netGrowth: summary.newMembers - summary.cancelled,
      retention: 100 - (summary.churnRate * 100),
      churn: summary.churnRate * 100
    },
    leads: {
      total: summary.leads,
      converted: Math.floor(summary.leads * summary.conversion),
      conversionRate: summary.conversion * 100
    },
    classes: {
      total: summary.totalClasses,
      averageFillRate: summary.avgFillRate * 100,
      totalCapacity: summary.totalClasses * 20,
      totalBooked: Math.floor(summary.totalClasses * 20 * summary.avgFillRate)
    },
    staff: {
      total: summary.totalStaff,
      coaches: Math.floor(summary.totalStaff * 0.6),
      frontDesk: Math.floor(summary.totalStaff * 0.3)
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
  const franchiseLocations = getFranchiseLocations();
  const locationIds = franchiseLocations.map(loc => loc.id);
  
  const locationMetrics = locationIds.map(loc => 
    getLocationMetrics(members, leads, classes, classPacks, dropIns, staff, loc)
  );

  const totalRevenueMTD = locationMetrics.reduce((sum, m) => sum + m.revenue.mtd, 0);
  const totalRevenueYTD = locationMetrics.reduce((sum, m) => sum + m.revenue.ytd, 0);
  const totalRevenueLastMonth = locationMetrics.reduce((sum, m) => sum + m.revenue.lastMonth, 0);
  const totalRevenueLastYear = locationMetrics.reduce((sum, m) => sum + m.revenue.lastYear, 0);
  
  const momGrowth = totalRevenueLastMonth > 0 ? ((totalRevenueMTD - totalRevenueLastMonth) / totalRevenueLastMonth) * 100 : 0;
  const yoyGrowth = totalRevenueLastYear > 0 ? ((totalRevenueYTD - totalRevenueLastYear) / totalRevenueLastYear) * 100 : 0;

  const totalActiveMembers = locationMetrics.reduce((sum, m) => sum + m.members.active, 0);
  const totalNetGrowth = locationMetrics.reduce((sum, m) => sum + m.members.netGrowth, 0);
  const avgChurn = locationMetrics.reduce((sum, m) => sum + m.members.churn, 0) / locationMetrics.length;

  const totalLeads = locationMetrics.reduce((sum, m) => sum + m.leads.total, 0);
  const totalConverted = locationMetrics.reduce((sum, m) => sum + m.leads.converted, 0);
  const avgConversionRate = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;

  const avgFillRate = locationMetrics.reduce((sum, m) => sum + m.classes.averageFillRate, 0) / locationMetrics.length;

  return {
    totalRevenue: {
      mtd: totalRevenueMTD,
      ytd: totalRevenueYTD,
      momGrowth,
      yoyGrowth
    },
    totalMembers: {
      active: totalActiveMembers,
      netGrowth: totalNetGrowth,
      churn: avgChurn
    },
    totalLeads: {
      count: totalLeads,
      conversionRate: avgConversionRate
    },
    averageFillRate: avgFillRate,
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
