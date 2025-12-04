/**
 * Historical Data Generator
 * Generates 12+ months of realistic fitness business data with seasonality
 */

import { Member, ClassPackClient, DropInClient, Lead, Promotion } from './types';
import { Transaction } from './dataStore';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

interface HistoricalDataConfig {
  startDate: Date;
  endDate: Date;
  initialRevenue: number; // Starting monthly revenue
  revenueGrowthRate: number; // Monthly growth rate (e.g., 0.03 for 3%)
  location: 'athletic-club' | 'dance-studio';
}

interface MonthlyMetrics {
  month: string; // YYYY-MM
  revenue: number;
  newMembers: number;
  cancellations: number;
  newLeads: number;
  conversions: number;
  promotions: number;
  avgAttendance: number;
}

interface HistoricalData {
  transactions: Transaction[];
  promotions: Promotion[];
  cancellations: Array<{
    memberId: string;
    memberName: string;
    cancellationDate: string;
    reason: string;
    tenure: number; // months
  }>;
  monthlyMetrics: MonthlyMetrics[];
}

export function generateHistoricalData(config: HistoricalDataConfig): HistoricalData {
  const rng = new SeededRandom(12345);
  const transactions: Transaction[] = [];
  const promotions: Promotion[] = [];
  const cancellations: Array<{
    memberId: string;
    memberName: string;
    cancellationDate: string;
    reason: string;
    tenure: number;
  }> = [];
  const monthlyMetrics: MonthlyMetrics[] = [];

  const getSeasonalityFactor = (month: number): number => {
    const factors = [1.4, 1.3, 1.2, 1.0, 1.0, 0.7, 0.7, 0.7, 1.3, 1.0, 1.0, 0.8];
    return factors[month];
  };

  const products = [
    { id: 'membership-1x', name: '1x/Week Membership', price: 89, category: 'membership' },
    { id: 'membership-2x', name: '2x/Week Membership', price: 139, category: 'membership' },
    { id: 'membership-unlimited', name: 'Unlimited Membership', price: 189, category: 'membership' },
    { id: 'pack-5', name: '5-Class Pack', price: 75, category: 'class-pack' },
    { id: 'pack-10', name: '10-Class Pack', price: 140, category: 'class-pack' },
    { id: 'pack-20', name: '20-Class Pack', price: 260, category: 'class-pack' },
    { id: 'drop-in', name: 'Drop-In Class', price: 20, category: 'drop-in' },
    { id: 'retail-1', name: 'Protein Powder', price: 45, category: 'retail' },
    { id: 'retail-2', name: 'Water Bottle', price: 25, category: 'retail' },
    { id: 'retail-3', name: 'Workout Towel', price: 15, category: 'retail' },
    { id: 'retail-4', name: 'Resistance Bands', price: 35, category: 'retail' },
  ];

  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Drew', 'Cameron', 'Sage', 'Reese', 'Skyler', 'Dakota', 'Rowan', 'Finley', 'Hayden', 'Emerson', 'Parker'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];

  const staff = [
    { id: 'desk-1', name: 'Sam Brown' },
    { id: 'desk-2', name: 'Riley Davis' },
    { id: 'desk-3', name: 'Avery Garcia' },
    { id: 'desk-4', name: 'Jessica Chen' },
  ];

  const historicalPromos = [
    { code: 'NEWYEAR2024', name: 'New Year Resolution', discount: 0.20, months: [0, 1], conversionRate: 0.34 },
    { code: 'SPRING15', name: 'Spring Into Fitness', discount: 0.15, months: [2, 3], conversionRate: 0.22 },
    { code: 'SUMMER20', name: 'Summer Body Ready', discount: 0.20, months: [4, 5], conversionRate: 0.18 },
    { code: 'BACKTOSCHOOL', name: 'Back to School Special', discount: 0.15, months: [7, 8], conversionRate: 0.28 },
    { code: 'FALL10', name: 'Fall Fitness Challenge', discount: 0.10, months: [9, 10], conversionRate: 0.19 },
    { code: 'FRIEND50', name: 'Bring a Friend', discount: 0.0, months: [1, 4, 7, 10], conversionRate: 0.31 }, // Referral bonus
    { code: 'FLASH25', name: 'Flash Sale - 25% Off', discount: 0.25, months: [3, 6, 9], conversionRate: 0.41 },
  ];

  const cancellationReasons = [
    'Moving out of area',
    'Schedule conflicts',
    'Financial reasons',
    'Not seeing results',
    'Injury/health issues',
    'Found another gym',
    'Too busy',
    'Temporary pause needed',
  ];

  let currentDate = new Date(config.startDate);
  let memberIdCounter = 1000;
  let transactionIdCounter = 10000;
  let promoIdCounter = 100;

  const activeMembersByMonth: Map<string, Set<string>> = new Map();

  while (currentDate <= config.endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const seasonalityFactor = getSeasonalityFactor(month);
    
    const monthsFromStart = (year - config.startDate.getFullYear()) * 12 + (month - config.startDate.getMonth());
    const targetRevenue = config.initialRevenue * Math.pow(1 + config.revenueGrowthRate, monthsFromStart) * seasonalityFactor;

    let monthRevenue = 0;
    let newMembers = 0;
    let newLeads = 0;
    let conversions = 0;
    let monthCancellations = 0;

    if (!activeMembersByMonth.has(monthKey)) {
      activeMembersByMonth.set(monthKey, new Set());
    }
    const activeMembers = activeMembersByMonth.get(monthKey)!;

    const monthPromos = historicalPromos.filter(p => p.months.includes(month));
    for (const promo of monthPromos) {
      const promoStartDate = new Date(year, month, rng.nextInt(1, 7));
      const promoEndDate = new Date(year, month, rng.nextInt(20, 28));
      
      promotions.push({
        id: `promo-${promoIdCounter++}`,
        name: promo.name,
        type: 'discount',
        status: 'ended',
        startDate: formatLocalDate(promoStartDate),
        endDate: formatLocalDate(promoEndDate),
        signups: 0, // Will be calculated from transactions
        revenue: 0, // Will be calculated from transactions
        location: config.location,
      });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const targetDailyRevenue = targetRevenue / daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const transactionDate = new Date(year, month, day);
      if (transactionDate > config.endDate) break;

      const dayOfWeek = transactionDate.getDay();
      const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;

      const numTransactions = rng.nextInt(
        Math.floor(3 * dayFactor),
        Math.floor(8 * dayFactor)
      );

      for (let i = 0; i < numTransactions; i++) {
        const seller = rng.choice(staff);
        const transactionHour = rng.nextInt(6, 20);
        const transactionMinute = rng.nextInt(0, 59);
        const timestamp = new Date(year, month, day, transactionHour, transactionMinute).toISOString();

        const transactionType = rng.next();
        let items: Array<{ productId: string; productName: string; quantity: number; price: number }> = [];
        let memberId: string | undefined;
        let memberName: string | undefined;
        let promoCode: string | undefined;
        let discount = 0;

        if (transactionType < 0.50) {
          const membershipProduct = rng.choice(products.filter(p => p.category === 'membership'));
          memberId = `member-${memberIdCounter++}`;
          memberName = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;
          
          items.push({
            productId: membershipProduct.id,
            productName: membershipProduct.name,
            quantity: 1,
            price: membershipProduct.price,
          });

          activeMembers.add(memberId);
          newMembers++;

          const activePromo = monthPromos.find(p => rng.next() < p.conversionRate);
          if (activePromo) {
            promoCode = activePromo.code;
            discount = membershipProduct.price * activePromo.discount;
            conversions++;
          }
        } else if (transactionType < 0.75) {
          const packProduct = rng.choice(products.filter(p => p.category === 'class-pack'));
          memberId = `pack-${memberIdCounter++}`;
          memberName = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;
          
          items.push({
            productId: packProduct.id,
            productName: packProduct.name,
            quantity: 1,
            price: packProduct.price,
          });

          const activePromo = monthPromos.find(p => rng.next() < p.conversionRate * 0.7);
          if (activePromo) {
            promoCode = activePromo.code;
            discount = packProduct.price * activePromo.discount;
          }
        } else if (transactionType < 0.85) {
          const dropInProduct = products.find(p => p.id === 'drop-in')!;
          memberId = `dropin-${memberIdCounter++}`;
          memberName = `${rng.choice(firstNames)} ${rng.choice(lastNames)}`;
          
          items.push({
            productId: dropInProduct.id,
            productName: dropInProduct.name,
            quantity: 1,
            price: dropInProduct.price,
          });
        } else {
          const numRetailItems = rng.nextInt(1, 3);
          for (let j = 0; j < numRetailItems; j++) {
            const retailProduct = rng.choice(products.filter(p => p.category === 'retail'));
            items.push({
              productId: retailProduct.id,
              productName: retailProduct.name,
              quantity: 1,
              price: retailProduct.price,
            });
          }

          if (rng.next() < 0.6 && activeMembers.size > 0) {
            const memberIds = Array.from(activeMembers);
            memberId = rng.choice(memberIds);
            memberName = `Member ${memberId}`;
          }
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.07;
        const total = subtotal - discount + tax;

        monthRevenue += total;

        transactions.push({
          id: `txn-${transactionIdCounter++}`,
          memberId,
          memberName,
          items,
          subtotal,
          discount,
          tax,
          total,
          promoCode,
          timestamp,
          location: config.location,
          sellerId: seller.id,
          sellerName: seller.name,
        });
      }
    }

    const baseChurnRate = 0.05; // 5% monthly churn
    const seasonalChurnFactor = month >= 5 && month <= 7 ? 1.5 : 1.0; // Higher churn in summer
    const churnRate = baseChurnRate * seasonalChurnFactor;
    const numCancellations = Math.floor(activeMembers.size * churnRate);

    for (let i = 0; i < numCancellations; i++) {
      if (activeMembers.size === 0) break;
      
      const memberIds = Array.from(activeMembers);
      const memberId = rng.choice(memberIds);
      const memberName = `Member ${memberId}`;
      const cancellationDate = new Date(year, month, rng.nextInt(1, daysInMonth));
      const reason = rng.choice(cancellationReasons);
      const tenure = rng.nextInt(1, 24); // months

      cancellations.push({
        memberId,
        memberName,
        cancellationDate: formatLocalDate(cancellationDate),
        reason,
        tenure,
      });

      activeMembers.delete(memberId);
      monthCancellations++;
    }

    const baseLeadRate = 20; // leads per month
    const numLeads = Math.floor(baseLeadRate * seasonalityFactor);
    newLeads = numLeads;

    monthlyMetrics.push({
      month: monthKey,
      revenue: Math.round(monthRevenue),
      newMembers,
      cancellations: monthCancellations,
      newLeads,
      conversions,
      promotions: monthPromos.length,
      avgAttendance: Math.round(activeMembers.size * 0.7), // Assume 70% attendance rate
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  for (const promo of promotions) {
    const promoTransactions = transactions.filter(t => t.promoCode && 
      historicalPromos.find(hp => hp.code === t.promoCode)?.name === promo.name);
    promo.signups = promoTransactions.length;
    promo.revenue = promoTransactions.reduce((sum, t) => sum + t.total, 0);
  }

  return {
    transactions,
    promotions,
    cancellations,
    monthlyMetrics,
  };
}
