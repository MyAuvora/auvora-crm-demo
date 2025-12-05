'use client';

import { Member, ClassPackClient, DropInClient, Lead, Staff, Class, Promotion, Product, Goal, Note, Measurement, SubstitutionRequest, TimeOffRequest, CoachLeadInteraction, StaffSettings, StaffShift, ShiftTemplate, ShiftSwapRequest, StaffTimeOffRequest, FranchiseLocation, FranchiseSummary } from './types';
import { members as seedMembers, classPackClients as seedClassPackClients, dropInClients as seedDropInClients, leads as seedLeads, staff as seedStaff, classes as seedClasses, promotions as seedPromotions, products as seedProducts, goals as seedGoals, notes as seedNotes, coachLeadInteractions as seedCoachLeadInteractions, substitutionRequests as seedSubstitutionRequests, timeOffRequests as seedTimeOffRequests, staffSettings as seedStaffSettings, staffShifts as seedStaffShifts, franchiseLocations as seedFranchiseLocations, franchiseSummaries as seedFranchiseSummaries } from '@/data/seedData';
import { generateHistoricalData } from './historyGenerator';

const STORAGE_VERSION = 6;
const STORAGE_KEY = 'auvora-crm-data';

export interface Booking {
  id: string;
  classId: string;
  memberId: string;
  memberName: string;
  status: 'booked' | 'checked-in' | 'no-show' | 'cancelled';
  bookedAt: string;
  checkedInAt?: string;
}

export interface WaitlistEntry {
  id: string;
  classId: string;
  memberId: string;
  memberName: string;
  addedAt: string;
}

export interface Transaction {
  id: string;
  memberId?: string;
  memberName?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  promoCode?: string;
  timestamp: string;
  location: string;
  sellerId?: string;
  sellerName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userName?: string;
  details: string;
  location: string;
}

export interface MembershipFreeze {
  memberId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface MembershipCancellation {
  memberId: string;
  cancellationDate: string;
  effectiveDate: string;
  reason?: string;
}

export interface LeadTask {
  id: string;
  leadId: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  note: string;
  createdAt: string;
  createdBy?: string;
}

export interface CommunicationLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'lead' | 'member';
  type: 'email' | 'sms';
  template: string;
  subject?: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface Invoice {
  id: string;
  memberId?: string;
  memberName: string;
  accountId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountRefunded: number;
  status: 'paid' | 'refunded' | 'partial' | 'due' | 'overdue';
  promoCode?: string;
  timestamp: string;
  dueDate?: string;
  location: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Refund {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;
  refundedAt: string;
  refundedBy?: string;
  location: string;
}

export interface PaymentMethod {
  id: string;
  memberId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  addedAt: string;
}

export interface PaymentPlan {
  id: string;
  memberId: string;
  invoiceId: string;
  totalAmount: number;
  installments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  amountPaid: number;
  nextDue: string;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: string;
}

interface DataStore {
  version: number;
  members: Member[];
  classPackClients: ClassPackClient[];
  dropInClients: DropInClient[];
  leads: Lead[];
  staff: Staff[];
  classes: Class[];
  promotions: Promotion[];
  products: Product[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  transactions: Transaction[];
  auditLog: AuditLogEntry[];
  membershipFreezes: MembershipFreeze[];
  membershipCancellations: MembershipCancellation[];
  leadTasks: LeadTask[];
  leadNotes: LeadNote[];
  communicationLogs: CommunicationLog[];
  weeklyUsage: Record<string, { weekStart: string; count: number }>;
  invoices: Invoice[];
  refunds: Refund[];
  paymentMethods: PaymentMethod[];
  paymentPlans: PaymentPlan[];
  goals: Goal[];
  notes: Note[];
  measurements: Measurement[];
  substitutionRequests: SubstitutionRequest[];
  timeOffRequests: TimeOffRequest[];
  coachLeadInteractions: CoachLeadInteraction[];
  staffSettings: StaffSettings[];
  staffShifts: StaffShift[];
  shiftTemplates: ShiftTemplate[];
  shiftSwapRequests: ShiftSwapRequest[];
  staffTimeOffRequests: StaffTimeOffRequest[];
}

let store: DataStore | null = null;

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function generateSampleRevenue(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const allMembers = seedMembers;
  const allPackClients = seedClassPackClients;
  const allDropInClients = seedDropInClients;
  const allLeads = seedLeads;
  const allStaff = seedStaff;
  
  const productTypes = [
    { id: 'membership-1x', name: '1x/Week Membership', price: 99, category: 'membership' },
    { id: 'membership-2x', name: '2x/Week Membership', price: 149, category: 'membership' },
    { id: 'membership-unlimited', name: 'Unlimited Membership', price: 199, category: 'membership' },
    { id: 'pack-5', name: '5-Class Pack', price: 75, category: 'class-pack' },
    { id: 'pack-10', name: '10-Class Pack', price: 140, category: 'class-pack' },
    { id: 'pack-20', name: '20-Class Pack', price: 260, category: 'class-pack' },
    { id: 'drop-in', name: 'Drop-In Class', price: 20, category: 'drop-in' },
    { id: 'retail-water', name: 'Water Bottle', price: 3, category: 'retail' },
    { id: 'retail-shirt', name: 'T-Shirt', price: 25, category: 'retail' },
  ];
  
  let transactionId = 1;
  
  for (let monthOffset = 0; monthOffset <= currentMonth; monthOffset++) {
    const month = monthOffset;
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const isCurrentMonth = month === currentMonth;
    const maxDay = isCurrentMonth ? now.getDate() : daysInMonth;
    
    for (let day = 1; day <= maxDay; day++) {
      const numTransactions = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numTransactions; i++) {
        const location = Math.random() > 0.5 ? 'athletic-club' : 'dance-studio';
        const product = productTypes[Math.floor(Math.random() * productTypes.length)];
        const quantity = product.category === 'retail' ? Math.floor(Math.random() * 3) + 1 : 1;
        const subtotal = product.price * quantity;
        const discount = Math.random() > 0.8 ? subtotal * 0.1 : 0;
        const tax = (subtotal - discount) * 0.07;
        const total = subtotal - discount + tax;
        
        const timestamp = new Date(currentYear, month, day, Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60)).toISOString();
        
        const locationPeople = [
          ...allMembers.filter(m => m.location === location),
          ...allPackClients.filter(c => c.location === location),
          ...allDropInClients.filter(d => d.location === location),
          ...allLeads.filter(l => l.location === location)
        ];
        
        const hasPerson = Math.random() > 0.2 && locationPeople.length > 0;
        const person = hasPerson ? locationPeople[Math.floor(Math.random() * locationPeople.length)] : null;
        
        const locationStaff = allStaff.filter(s => s.location === location && s.role === 'front-desk');
        const seller = locationStaff.length > 0 ? locationStaff[Math.floor(Math.random() * locationStaff.length)] : null;
        
        transactions.push({
          id: `txn-sample-${transactionId++}`,
          memberId: person?.id,
          memberName: person?.name || 'Guest',
          sellerId: seller?.id,
          items: [{
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price,
          }],
          subtotal,
          discount,
          tax,
          total,
          timestamp,
          location,
        });
      }
    }
  }
  
  return transactions;
}

function generateSampleBookings(): Booking[] {
  const bookings: Booking[] = [];
  const classes = seedClasses;
  const members = seedMembers;
  const packClients = seedClassPackClients;
  const dropInClients = seedDropInClients;
  const leads = seedLeads;
  const allClients = [...members, ...packClients, ...dropInClients];
  
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  classes.forEach(cls => {
    const isToday = cls.dayOfWeek === dayOfWeek;
    const isPastClass = !isToday;
    
    const fillRate = 0.4 + Math.random() * 0.3;
    const numBookings = Math.floor(cls.capacity * fillRate);
    
    const locationClients = allClients.filter(c => c.location === cls.location);
    const locationLeads = leads.filter(l => l.location === cls.location && (l.status === 'trial-booked' || l.status === 'trial-showed'));
    
    const numLeadBookings = Math.floor(numBookings * 0.15);
    const numMemberBookings = numBookings - numLeadBookings;
    
    const shuffledClients = [...locationClients].sort(() => Math.random() - 0.5);
    const shuffledLeads = [...locationLeads].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numMemberBookings && i < shuffledClients.length; i++) {
      const client = shuffledClients[i];
      const isCheckedIn = isToday ? Math.random() > 0.6 : (isPastClass ? Math.random() > 0.2 : false);
      
      bookings.push({
        id: `booking-${cls.id}-m-${i}`,
        classId: cls.id,
        memberId: client.id,
        memberName: client.name,
        status: isCheckedIn ? 'checked-in' : 'booked',
        bookedAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        checkedInAt: isCheckedIn ? new Date(today.getTime() - Math.random() * 3 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }
    
    for (let i = 0; i < numLeadBookings && i < shuffledLeads.length; i++) {
      const lead = shuffledLeads[i];
      const isCheckedIn = isToday ? Math.random() > 0.7 : (isPastClass ? Math.random() > 0.3 : false);
      
      bookings.push({
        id: `booking-${cls.id}-l-${i}`,
        classId: cls.id,
        memberId: lead.id,
        memberName: lead.name,
        status: isCheckedIn ? 'checked-in' : 'booked',
        bookedAt: new Date(today.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        checkedInAt: isCheckedIn ? new Date(today.getTime() - Math.random() * 2 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }
  });
  
  return bookings;
}

function migratePaymentFields(members: Member[]): Member[] {
  const now = new Date();
  
  return members.map(m => {
    if (m.paymentStatus && m.lastPaymentDate && m.nextPaymentDue) {
      return m;
    }
    
    const joinDate = new Date(m.joinDate);
    const monthsSinceJoin = Math.max(0, Math.floor((now.getTime() - joinDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    
    const lastPaymentDate = new Date(joinDate);
    lastPaymentDate.setMonth(joinDate.getMonth() + monthsSinceJoin);
    
    const nextPaymentDue = new Date(lastPaymentDate);
    nextPaymentDue.setMonth(lastPaymentDate.getMonth() + 1);
    
    const memberIdNum = parseInt(m.id.replace(/\D/g, '')) || 0;
    const isOverdue = (memberIdNum % 100) < 15;
    
    if (isOverdue) {
      const daysOverdue = 5 + ((memberIdNum * 7) % 30);
      nextPaymentDue.setDate(nextPaymentDue.getDate() - daysOverdue);
    }
    
    return {
      ...m,
      paymentStatus: isOverdue ? 'overdue' : 'current',
      lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
      nextPaymentDue: nextPaymentDue.toISOString().split('T')[0]
    };
  });
}

function migrateTransactionNames(transactions: Transaction[]): Transaction[] {
  const allMembers = seedMembers;
  const allPackClients = seedClassPackClients;
  const allDropInClients = seedDropInClients;
  const allLeads = seedLeads;
  const allStaff = seedStaff;
  
  return transactions.map(t => {
    const isSampleTransaction = t.id.startsWith('txn-sample-');
    const hasPlaceholderName = t.memberName && /^Member\s+\d+$/.test(t.memberName);
    const needsFixing = isSampleTransaction && (hasPlaceholderName || !t.memberId);
    
    if (!needsFixing) {
      if (hasPlaceholderName && t.memberId) {
        const personData = getPersonById(t.memberId);
        if (personData) {
          return {
            ...t,
            memberName: personData.person.name
          };
        }
      }
      return t;
    }
    
    const locationPeople = [
      ...allMembers.filter(m => m.location === t.location),
      ...allPackClients.filter(c => c.location === t.location),
      ...allDropInClients.filter(d => d.location === t.location),
      ...allLeads.filter(l => l.location === t.location)
    ];
    
    const shouldHavePerson = Math.random() > 0.2 && locationPeople.length > 0;
    const person = shouldHavePerson ? locationPeople[Math.floor(Math.random() * locationPeople.length)] : null;
    
    let sellerId = t.sellerId;
    if (!sellerId) {
      const locationStaff = allStaff.filter(s => s.location === t.location && s.role === 'front-desk');
      const seller = locationStaff.length > 0 ? locationStaff[Math.floor(Math.random() * locationStaff.length)] : null;
      sellerId = seller?.id;
    }
    
    return {
      ...t,
      memberId: person?.id || t.memberId,
      memberName: person?.name || 'Guest',
      sellerId
    };
  });
}

function initializeStore(): DataStore {
  if (typeof window === 'undefined') {
    return {
      version: STORAGE_VERSION,
      members: seedMembers,
      classPackClients: seedClassPackClients,
      dropInClients: seedDropInClients,
      leads: seedLeads,
      staff: seedStaff,
      classes: seedClasses,
      promotions: seedPromotions,
      products: seedProducts,
      bookings: [],
      waitlist: [],
      transactions: [],
      auditLog: [],
      membershipFreezes: [],
      membershipCancellations: [],
      leadTasks: [],
      leadNotes: [],
      communicationLogs: [],
      weeklyUsage: {},
      invoices: [],
      refunds: [],
      paymentMethods: [],
      paymentPlans: [],
      goals: [],
      notes: [],
      measurements: [],
      substitutionRequests: [],
      timeOffRequests: [],
      coachLeadInteractions: [],
      staffSettings: [],
      staffShifts: [],
      shiftTemplates: [],
      shiftSwapRequests: [],
      staffTimeOffRequests: [],
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DataStore;
      
      if (parsed.version < STORAGE_VERSION) {
        console.log('Upgrading to version', STORAGE_VERSION, '- generating historical data...');
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setMonth(startDate.getMonth() - 1); // 13 months total
        
        const historicalData = generateHistoricalData({
          startDate,
          endDate,
          initialRevenue: 40000,
          revenueGrowthRate: 0.03,
          location: 'athletic-club',
        });
        
        parsed.transactions = [...historicalData.transactions, ...parsed.transactions.filter(t => !t.id.startsWith('txn-'))];
        parsed.promotions = [...historicalData.promotions, ...parsed.promotions];
        parsed.membershipCancellations = [
          ...parsed.membershipCancellations,
          ...historicalData.cancellations.map(c => ({
            memberId: c.memberId,
            cancellationDate: c.cancellationDate,
            effectiveDate: c.cancellationDate,
            reason: c.reason,
          }))
        ];
        
        parsed.version = STORAGE_VERSION;
        saveStore(parsed);
        return parsed;
      }
      
      if (!parsed.invoices) parsed.invoices = [];
      if (!parsed.refunds) parsed.refunds = [];
      if (!parsed.paymentMethods) parsed.paymentMethods = [];
      if (!parsed.paymentPlans) parsed.paymentPlans = [];
      if (!parsed.goals) parsed.goals = [];
      if (!parsed.notes) parsed.notes = [];
      if (!parsed.measurements) parsed.measurements = [];
      if (!parsed.substitutionRequests) parsed.substitutionRequests = [];
      if (!parsed.timeOffRequests) parsed.timeOffRequests = [];
      if (!parsed.coachLeadInteractions) parsed.coachLeadInteractions = [];
      if (!parsed.staffSettings) parsed.staffSettings = [];
      if (!parsed.staffShifts) parsed.staffShifts = [];
      if (!parsed.shiftTemplates) parsed.shiftTemplates = [];
      if (!parsed.shiftSwapRequests) parsed.shiftSwapRequests = [];
      if (!parsed.staffTimeOffRequests) parsed.staffTimeOffRequests = [];
      
      if (parsed.version === STORAGE_VERSION) {
        let needsSave = false;
        
        if (parsed.transactions.length === 0 || !parsed.transactions.some((t: Transaction) => t.id.startsWith('txn-sample-'))) {
          parsed.transactions = [...parsed.transactions, ...generateSampleRevenue()];
          needsSave = true;
        } else {
          const hasDropInTransactions = parsed.transactions.some((t: Transaction) => 
            t.items.some(item => item.productId.includes('drop-in'))
          );
          
          if (!hasDropInTransactions) {
            parsed.transactions = parsed.transactions.filter((t: Transaction) => !t.id.startsWith('txn-sample-'));
            parsed.transactions = [...parsed.transactions, ...generateSampleRevenue()];
            needsSave = true;
          }
        }
        
        if (parsed.bookings.length === 0 || !parsed.bookings.some((b: Booking) => b.id.startsWith('booking-sample-'))) {
          parsed.bookings = [...parsed.bookings, ...generateSampleBookings()];
          needsSave = true;
        }
        
        const migratedMembers = migratePaymentFields(parsed.members);
        if (migratedMembers.some((m, i) => m !== parsed.members[i])) {
          parsed.members = migratedMembers;
          needsSave = true;
        }
        
        const migratedTransactions = migrateTransactionNames(parsed.transactions);
        if (migratedTransactions.some((t, i) => t.memberName !== parsed.transactions[i].memberName)) {
          parsed.transactions = migratedTransactions;
          needsSave = true;
        }
        
        if (!parsed.dropInClients || parsed.dropInClients.length === 0) {
          parsed.dropInClients = seedDropInClients;
          needsSave = true;
        }
        
        if (!parsed.staff.some((s: Staff) => s.id === 'desk-4')) {
          const jessicaChen: Staff = {
            id: 'desk-4',
            name: 'Jessica Chen',
            role: 'front-desk',
            email: 'jessica.chen@thelabfitness.com',
            location: 'athletic-club'
          };
          parsed.staff.push(jessicaChen);
          needsSave = true;
        }
        
        if (needsSave) {
          saveStore(parsed);
        }
        
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }

  const initialStore: DataStore = {
    version: STORAGE_VERSION,
    members: seedMembers,
    classPackClients: seedClassPackClients,
    dropInClients: seedDropInClients,
    leads: seedLeads,
    staff: seedStaff,
    classes: seedClasses,
    promotions: seedPromotions,
    products: seedProducts,
    bookings: generateSampleBookings(),
    waitlist: [],
    transactions: generateSampleRevenue(),
    auditLog: [],
    membershipFreezes: [],
    membershipCancellations: [],
    leadTasks: [],
    leadNotes: [],
    communicationLogs: [],
    weeklyUsage: {},
    invoices: [],
    refunds: [],
    paymentMethods: [],
    paymentPlans: [],
    goals: seedGoals,
    notes: seedNotes,
    measurements: [],
    substitutionRequests: seedSubstitutionRequests,
    timeOffRequests: seedTimeOffRequests,
    coachLeadInteractions: seedCoachLeadInteractions,
    staffSettings: seedStaffSettings,
    staffShifts: seedStaffShifts,
    shiftTemplates: [],
    shiftSwapRequests: [],
    staffTimeOffRequests: [],
  };

  saveStore(initialStore);
  return initialStore;
}

function saveStore(data: DataStore) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }
}

function getStore(): DataStore {
  if (!store) {
    store = initializeStore();
  }
  return store;
}

function addAuditLog(action: string, entityType: string, entityId: string, details: string, location: string) {
  const store = getStore();
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    details,
    location,
  };
  store.auditLog.push(entry);
  saveStore(store);
}

export function getAllMembers() {
  return getStore().members;
}

export function getAllClassPackClients() {
  return getStore().classPackClients;
}

export function getAllDropInClients() {
  return getStore().dropInClients;
}

export function getAllLeads() {
  return getStore().leads;
}

export function getAllStaff() {
  return getStore().staff;
}

export function getAllClasses() {
  return getStore().classes;
}

export function getAllPromotions() {
  return getStore().promotions;
}

export function getAllProducts() {
  return getStore().products;
}

export function getAllBookings() {
  return getStore().bookings;
}

export function getAllWaitlist() {
  return getStore().waitlist;
}

export function getAllTransactions() {
  return getStore().transactions;
}

export function getAllAuditLog() {
  return getStore().auditLog;
}

export interface CommissionReport {
  sellerId: string;
  sellerName: string;
  sellerRole: string;
  totalSales: number;
  transactionCount: number;
  categoryBreakdown: {
    memberships: number;
    classPacks: number;
    dropIn: number;
    retail: number;
    other: number;
  };
  commissionRate: number;
  commissionAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export function getCommissionReport(
  sellerId: string,
  startDate?: Date,
  endDate?: Date
): CommissionReport | null {
  const store = getStore();
  const seller = store.staff.find(s => s.id === sellerId);
  
  if (!seller) return null;
  
  const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate || new Date(new Date().setHours(23, 59, 59, 999));
  
  const sellerTransactions = store.transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return t.sellerId === sellerId && txDate >= start && txDate <= end;
  });
  
  const totalSales = sellerTransactions.reduce((sum, t) => sum + t.total, 0);
  const transactionCount = sellerTransactions.length;
  
  const categoryBreakdown = {
    memberships: 0,
    classPacks: 0,
    dropIn: 0,
    retail: 0,
    other: 0
  };
  
  sellerTransactions.forEach(t => {
    t.items.forEach(item => {
      const productName = item.productName.toLowerCase();
      const itemTotal = item.price * item.quantity;
      
      if (productName.includes('membership') || productName.includes('monthly')) {
        categoryBreakdown.memberships += itemTotal;
      } else if (productName.includes('pack') || productName.includes('class pack')) {
        categoryBreakdown.classPacks += itemTotal;
      } else if (productName.includes('drop-in') || productName.includes('single class')) {
        categoryBreakdown.dropIn += itemTotal;
      } else if (productName.includes('retail') || productName.includes('merchandise') || productName.includes('apparel')) {
        categoryBreakdown.retail += itemTotal;
      } else {
        categoryBreakdown.other += itemTotal;
      }
    });
  });
  
  const commissionRate = seller.role === 'front-desk' ? 0.10 : seller.role === 'coach' ? 0.05 : 0;
  const commissionAmount = totalSales * commissionRate;
  
  return {
    sellerId: seller.id,
    sellerName: seller.name,
    sellerRole: seller.role,
    totalSales,
    transactionCount,
    categoryBreakdown,
    commissionRate,
    commissionAmount,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  };
}

export function getAllCommissionReports(
  location: string,
  startDate?: Date,
  endDate?: Date
): CommissionReport[] {
  const store = getStore();
  const locationStaff = store.staff.filter(s => s.location === location);
  
  const reports: CommissionReport[] = [];
  
  locationStaff.forEach(staff => {
    const report = getCommissionReport(staff.id, startDate, endDate);
    if (report && report.totalSales > 0) {
      reports.push(report);
    }
  });
  
  return reports.sort((a, b) => b.totalSales - a.totalSales);
}

export function getMembershipFreezes() {
  return getStore().membershipFreezes;
}

export function getMembershipCancellations() {
  return getStore().membershipCancellations;
}

export function getLeadTasks() {
  return getStore().leadTasks;
}

export function getLeadNotes() {
  return getStore().leadNotes;
}

export function getCommunicationLogs() {
  return getStore().communicationLogs;
}

export function getWeeklyUsage() {
  return getStore().weeklyUsage;
}

export function bookClass(classId: string, memberId: string, memberName: string): { success: boolean; message: string; booking?: Booking } {
  const store = getStore();
  const classData = store.classes.find(c => c.id === classId);
  
  if (!classData) {
    return { success: false, message: 'Class not found' };
  }

  const existingBooking = store.bookings.find(b => b.classId === classId && b.memberId === memberId && b.status !== 'cancelled');
  if (existingBooking) {
    return { success: false, message: 'Already booked for this class' };
  }

  const currentBookings = store.bookings.filter(b => b.classId === classId && b.status !== 'cancelled').length;
  if (currentBookings >= classData.capacity) {
    return { success: false, message: 'Class is full. Added to waitlist instead.' };
  }

  const booking: Booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classId,
    memberId,
    memberName,
    status: 'booked',
    bookedAt: new Date().toISOString(),
  };

  store.bookings.push(booking);
  classData.bookedCount = currentBookings + 1;
  
  addAuditLog('book_class', 'booking', booking.id, `${memberName} booked ${classData.name}`, classData.location);
  saveStore(store);

  return { success: true, message: 'Class booked successfully', booking };
}

export function addToWaitlist(classId: string, memberId: string, memberName: string): { success: boolean; message: string } {
  const store = getStore();
  const classData = store.classes.find(c => c.id === classId);
  
  if (!classData) {
    return { success: false, message: 'Class not found' };
  }

  const existingEntry = store.waitlist.find(w => w.classId === classId && w.memberId === memberId);
  if (existingEntry) {
    return { success: false, message: 'Already on waitlist' };
  }

  const entry: WaitlistEntry = {
    id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classId,
    memberId,
    memberName,
    addedAt: new Date().toISOString(),
  };

  store.waitlist.push(entry);
  addAuditLog('add_to_waitlist', 'waitlist', entry.id, `${memberName} added to waitlist for ${classData.name}`, classData.location);
  saveStore(store);

  return { success: true, message: 'Added to waitlist' };
}

export function checkInMember(bookingId: string): { success: boolean; message: string } {
  const store = getStore();
  const booking = store.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  if (booking.status === 'checked-in') {
    return { success: false, message: 'Already checked in' };
  }

  booking.status = 'checked-in';
  booking.checkedInAt = new Date().toISOString();

  const member = store.members.find(m => m.id === booking.memberId);
  const packClient = store.classPackClients.find(c => c.id === booking.memberId);
  const classData = store.classes.find(c => c.id === booking.classId);

  if (packClient && packClient.remainingClasses > 0) {
    packClient.remainingClasses -= 1;
  } else if (member) {
    const weekStart = getWeekStart();
    const usageKey = `${member.id}-${weekStart}`;
    if (!store.weeklyUsage[usageKey]) {
      store.weeklyUsage[usageKey] = { weekStart, count: 0 };
    }
    store.weeklyUsage[usageKey].count += 1;
  }

  addAuditLog('check_in', 'booking', bookingId, `${booking.memberName} checked in to ${classData?.name}`, classData?.location || '');
  saveStore(store);

  return { success: true, message: 'Checked in successfully' };
}

export function cancelBooking(bookingId: string): { success: boolean; message: string } {
  const store = getStore();
  const booking = store.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return { success: false, message: 'Booking not found' };
  }

  booking.status = 'cancelled';
  
  const classData = store.classes.find(c => c.id === booking.classId);
  if (classData) {
    classData.bookedCount = Math.max(0, classData.bookedCount - 1);
    
    const waitlistEntry = store.waitlist.find(w => w.classId === booking.classId);
    if (waitlistEntry) {
      bookClass(waitlistEntry.classId, waitlistEntry.memberId, waitlistEntry.memberName);
      store.waitlist = store.waitlist.filter(w => w.id !== waitlistEntry.id);
    }
  }

  addAuditLog('cancel_booking', 'booking', bookingId, `${booking.memberName} cancelled booking`, classData?.location || '');
  saveStore(store);

  return { success: true, message: 'Booking cancelled' };
}

export function createTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const store = getStore();
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  store.transactions.push(newTransaction);
  
  transaction.items.forEach(item => {
    const product = store.products.find(p => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  });

  addAuditLog('create_transaction', 'transaction', newTransaction.id, `Transaction for ${transaction.memberName || 'Guest'}: $${transaction.total.toFixed(2)}`, transaction.location);
  saveStore(store);

  return newTransaction;
}

export function updateLeadStatus(leadId: string, newStatus: string): { success: boolean; message: string } {
  const store = getStore();
  const lead = store.leads.find(l => l.id === leadId);
  
  if (!lead) {
    return { success: false, message: 'Lead not found' };
  }

  const oldStatus = lead.status;
  lead.status = newStatus as Lead['status'];

  addAuditLog('update_lead_status', 'lead', leadId, `Status changed from ${oldStatus} to ${newStatus}`, lead.location);
  saveStore(store);

  return { success: true, message: 'Lead status updated' };
}

export function addLeadTask(leadId: string, description: string, dueDate: string): LeadTask {
  const store = getStore();
  const task: LeadTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leadId,
    description,
    dueDate,
    completed: false,
  };

  store.leadTasks.push(task);
  saveStore(store);

  return task;
}

export function addLeadNote(leadId: string, note: string): LeadNote {
  const store = getStore();
  const newNote: LeadNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leadId,
    note,
    createdAt: new Date().toISOString(),
  };

  store.leadNotes.push(newNote);
  saveStore(store);

  return newNote;
}

export function freezeMembership(memberId: string, startDate: string, endDate: string, reason?: string): { success: boolean; message: string } {
  const store = getStore();
  const member = store.members.find(m => m.id === memberId);
  
  if (!member) {
    return { success: false, message: 'Member not found' };
  }

  const freeze: MembershipFreeze = {
    memberId,
    startDate,
    endDate,
    reason,
  };

  store.membershipFreezes.push(freeze);
  addAuditLog('freeze_membership', 'member', memberId, `Membership frozen from ${startDate} to ${endDate}`, member.location);
  saveStore(store);

  return { success: true, message: 'Membership frozen' };
}

export function cancelMembership(memberId: string, cancellationDate: string, effectiveDate: string, reason?: string): { success: boolean; message: string } {
  const store = getStore();
  const member = store.members.find(m => m.id === memberId);
  
  if (!member) {
    return { success: false, message: 'Member not found' };
  }

  const cancellation: MembershipCancellation = {
    memberId,
    cancellationDate,
    effectiveDate,
    reason,
  };

  store.membershipCancellations.push(cancellation);
  addAuditLog('cancel_membership', 'member', memberId, `Membership cancelled, effective ${effectiveDate}`, member.location);
  saveStore(store);

  return { success: true, message: 'Membership cancelled' };
}

export function logCommunication(log: Omit<CommunicationLog, 'id' | 'sentAt'>): CommunicationLog {
  const store = getStore();
  const newLog: CommunicationLog = {
    ...log,
    id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sentAt: new Date().toISOString(),
  };

  store.communicationLogs.push(newLog);
  saveStore(store);

  return newLog;
}

export function getLastVisitForPerson(personId: string): Date | null {
  const bookings = getAllBookings();
  const checkedInBookings = bookings.filter(
    b => b.memberId === personId && b.status === 'checked-in' && b.checkedInAt
  );
  
  if (checkedInBookings.length === 0) return null;
  
  const sortedBookings = checkedInBookings.sort((a, b) => {
    const dateA = new Date(a.checkedInAt!).getTime();
    const dateB = new Date(b.checkedInAt!).getTime();
    return dateB - dateA;
  });
  
  return new Date(sortedBookings[0].checkedInAt!);
}

export function getVisitsInLastNDays(personId: string, days: number): number {
  const bookings = getAllBookings();
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  return bookings.filter(
    b => b.memberId === personId && 
         b.status === 'checked-in' && 
         b.checkedInAt &&
         new Date(b.checkedInAt) >= cutoffDate
  ).length;
}

export function getPersonById(personId: string): { person: Member | ClassPackClient | DropInClient | Lead; type: 'member' | 'class-pack' | 'drop-in' | 'lead' } | null {
  const member = getAllMembers().find(m => m.id === personId);
  if (member) return { person: member, type: 'member' };
  
  const packClient = getAllClassPackClients().find(c => c.id === personId);
  if (packClient) return { person: packClient, type: 'class-pack' };
  
  const dropInClient = getAllDropInClients().find(d => d.id === personId);
  if (dropInClient) return { person: dropInClient, type: 'drop-in' };
  
  const lead = getAllLeads().find(l => l.id === personId);
  if (lead) return { person: lead, type: 'lead' };
  
  return null;
}

export function getPersonTransactions(personId: string): Transaction[] {
  const transactions = getAllTransactions();
  const personData = getPersonById(personId);
  
  if (!personData) return [];
  
  return transactions.filter(t => 
    t.memberId === personId || 
    (t.memberName && t.memberName === personData.person.name)
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPersonBookings(personId: string): Booking[] {
  const bookings = getAllBookings();
  return bookings.filter(b => b.memberId === personId)
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
}

export function getPersonCommunications(personId: string): CommunicationLog[] {
  const comms = getCommunicationLogs();
  return comms.filter(c => c.recipientId === personId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export function getPersonTimeline(personId: string): Array<{
  id: string;
  timestamp: string;
  type: 'booking' | 'check-in' | 'transaction' | 'note' | 'task' | 'communication' | 'audit';
  title: string;
  description: string;
  icon?: string;
}> {
  const events: Array<{
    id: string;
    timestamp: string;
    type: 'booking' | 'check-in' | 'transaction' | 'note' | 'task' | 'communication' | 'audit';
    title: string;
    description: string;
    icon?: string;
  }> = [];
  
  const bookings = getPersonBookings(personId);
  bookings.forEach(b => {
    if (b.status === 'checked-in' && b.checkedInAt) {
      events.push({
        id: `checkin-${b.id}`,
        timestamp: b.checkedInAt,
        type: 'check-in',
        title: 'Checked in to class',
        description: b.memberName,
        icon: '✓'
      });
    } else if (b.status === 'booked') {
      events.push({
        id: `booking-${b.id}`,
        timestamp: b.bookedAt,
        type: 'booking',
        title: 'Booked class',
        description: b.memberName,
        icon: '📅'
      });
    }
  });
  
  const transactions = getPersonTransactions(personId);
  transactions.forEach(t => {
    events.push({
      id: `txn-${t.id}`,
      timestamp: t.timestamp,
      type: 'transaction',
      title: 'Purchase',
      description: t.items.map(i => i.productName).join(', '),
      icon: '💳'
    });
  });
  
  const comms = getPersonCommunications(personId);
  comms.forEach(c => {
    events.push({
      id: `comm-${c.id}`,
      timestamp: c.sentAt,
      type: 'communication',
      title: c.type === 'sms' ? 'Text message sent' : 'Email sent',
      description: c.template,
      icon: '💬'
    });
  });
  
  const notes = getLeadNotes().filter(n => n.leadId === personId);
  notes.forEach(n => {
    events.push({
      id: `note-${n.id}`,
      timestamp: n.createdAt,
      type: 'note',
      title: 'Note added',
      description: n.note,
      icon: '📝'
    });
  });
  
  const tasks = getLeadTasks().filter(t => t.leadId === personId);
  tasks.forEach(t => {
    events.push({
      id: `task-${t.id}`,
      timestamp: t.completedAt || t.dueDate,
      type: 'task',
      title: t.completed ? 'Task completed' : 'Task created',
      description: t.description,
      icon: t.completed ? '✅' : '📋'
    });
  });
  
  const auditLogs = getAllAuditLog().filter(a => a.entityId === personId);
  auditLogs.forEach(a => {
    events.push({
      id: `audit-${a.id}`,
      timestamp: a.timestamp,
      type: 'audit',
      title: a.action,
      description: a.details,
      icon: '🔔'
    });
  });
  
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function resetData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    store = null;
    store = initializeStore();
  }
}

export function getAllInvoices(): Invoice[] {
  return getStore().invoices;
}

export function getAllRefunds(): Refund[] {
  return getStore().refunds;
}

export function getAllPaymentMethods(): PaymentMethod[] {
  return getStore().paymentMethods;
}

export function getAllPaymentPlans(): PaymentPlan[] {
  return getStore().paymentPlans;
}

export function createInvoice(data: Omit<Invoice, 'id'>): Invoice {
  const s = getStore();
  const newInvoice: Invoice = {
    ...data,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  s.invoices.push(newInvoice);
  saveStore(s);
  
  addAuditLog(
    'Invoice Created',
    'invoice',
    newInvoice.id,
    `Invoice ${newInvoice.id} created for ${newInvoice.memberName} - $${newInvoice.total.toFixed(2)}`,
    newInvoice.location
  );
  
  return newInvoice;
}

export function getInvoicesByMember(memberId: string): Invoice[] {
  return getAllInvoices().filter(inv => inv.memberId === memberId);
}

export function getInvoiceById(invoiceId: string): Invoice | undefined {
  return getAllInvoices().find(inv => inv.id === invoiceId);
}

export function refundInvoice(invoiceId: string, amount: number, reason: string, refundedBy?: string): Refund {
  const s = getStore();
  const invoice = s.invoices.find(inv => inv.id === invoiceId);
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  const refund: Refund = {
    id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    invoiceId,
    amount,
    reason,
    refundedAt: new Date().toISOString(),
    refundedBy,
    location: invoice.location,
  };
  
  s.refunds.push(refund);
  
  invoice.amountRefunded += amount;
  if (invoice.amountRefunded >= invoice.total) {
    invoice.status = 'refunded';
  } else if (invoice.amountRefunded > 0) {
    invoice.status = 'partial';
  }
  
  saveStore(s);
  
  addAuditLog(
    'Invoice Refunded',
    'invoice',
    invoiceId,
    `Refund of $${amount.toFixed(2)} issued for invoice ${invoiceId}. Reason: ${reason}`,
    invoice.location
  );
  
  return refund;
}

export function getRefundsByInvoice(invoiceId: string): Refund[] {
  return getAllRefunds().filter(ref => ref.invoiceId === invoiceId);
}

export function addPaymentMethod(data: Omit<PaymentMethod, 'id'>): PaymentMethod {
  const s = getStore();
  
  if (data.isDefault) {
    s.paymentMethods.forEach(pm => {
      if (pm.memberId === data.memberId) {
        pm.isDefault = false;
      }
    });
  }
  
  const newMethod: PaymentMethod = {
    ...data,
    id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  s.paymentMethods.push(newMethod);
  saveStore(s);
  
  return newMethod;
}

export function getPaymentMethodsByMember(memberId: string): PaymentMethod[] {
  return getAllPaymentMethods().filter(pm => pm.memberId === memberId);
}

export function createPaymentPlan(data: Omit<PaymentPlan, 'id'>): PaymentPlan {
  const s = getStore();
  const newPlan: PaymentPlan = {
    ...data,
    id: `pp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  s.paymentPlans.push(newPlan);
  saveStore(s);
  
  return newPlan;
}

export function getPaymentPlansByMember(memberId: string): PaymentPlan[] {
  return getAllPaymentPlans().filter(pp => pp.memberId === memberId);
}

export interface CohortData {
  cohortMonth: string;
  memberCount: number;
  retention1Month: number;
  retention3Month: number;
  retention6Month: number;
  totalRevenue: number;
}

export function getCohortAnalysis(location: string): CohortData[] {
  const members = getAllMembers().filter(m => m.location === location);
  const invoices = getAllInvoices().filter(inv => inv.location === location);
  
  const cohortMap = new Map<string, { members: typeof members; revenue: number }>();
  
  members.forEach(member => {
    const joinDate = new Date(member.joinDate);
    const cohortKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, { members: [], revenue: 0 });
    }
    
    cohortMap.get(cohortKey)!.members.push(member);
  });
  
  invoices.forEach(invoice => {
    if (invoice.memberId) {
      const member = members.find(m => m.id === invoice.memberId);
      if (member) {
        const joinDate = new Date(member.joinDate);
        const cohortKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (cohortMap.has(cohortKey)) {
          cohortMap.get(cohortKey)!.revenue += invoice.total - invoice.amountRefunded;
        }
      }
    }
  });
  
  const now = new Date();
  const cohorts: CohortData[] = [];
  
  cohortMap.forEach((data, cohortMonth) => {
    const [year, month] = cohortMonth.split('-').map(Number);
    
    const monthsSinceCohort = (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1));
    
    const activeAfter1Month = monthsSinceCohort >= 1 ? 
      data.members.filter(m => m.status === 'active' || new Date(m.joinDate).getTime() > new Date(year, month, 1).getTime()).length : 
      data.members.length;
    
    const activeAfter3Months = monthsSinceCohort >= 3 ?
      data.members.filter(m => m.status === 'active' || new Date(m.joinDate).getTime() > new Date(year, month + 2, 1).getTime()).length :
      data.members.length;
    
    const activeAfter6Months = monthsSinceCohort >= 6 ?
      data.members.filter(m => m.status === 'active' || new Date(m.joinDate).getTime() > new Date(year, month + 5, 1).getTime()).length :
      data.members.length;
    
    cohorts.push({
      cohortMonth,
      memberCount: data.members.length,
      retention1Month: data.members.length > 0 ? (activeAfter1Month / data.members.length) * 100 : 0,
      retention3Month: data.members.length > 0 ? (activeAfter3Months / data.members.length) * 100 : 0,
      retention6Month: data.members.length > 0 ? (activeAfter6Months / data.members.length) * 100 : 0,
      totalRevenue: data.revenue,
    });
  });
  
  return cohorts.sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));
}

export function updateBillingAddress(personId: string, address: { street: string; city: string; state: string; zip: string }): boolean {
  const s = getStore();
  
  let person: (Member | ClassPackClient | DropInClient | Lead) | undefined = s.members.find(m => m.id === personId);
  if (!person) {
    person = s.classPackClients.find(c => c.id === personId);
  }
  if (!person) {
    person = s.dropInClients.find(d => d.id === personId);
  }
  if (!person) {
    person = s.leads.find(l => l.id === personId);
  }
  
  if (person) {
    (person as Member & { billingAddress?: typeof address }).billingAddress = address;
    saveStore(s);
    const location = 'location' in person ? person.location : 'unknown';
    addAuditLog('update_billing_address', 'person', personId, `Updated billing address`, location);
    return true;
  }
  
  return false;
}

export function addClass(classData: Omit<Class, 'id' | 'bookedCount' | 'attendees'>): Class {
  const s = getStore();
  const newClass: Class = {
    ...classData,
    id: `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bookedCount: 0,
    attendees: [],
  };
  s.classes.push(newClass);
  saveStore(s);
  addAuditLog('add_class', 'class', newClass.id, `Created class: ${newClass.name}`, newClass.location);
  return newClass;
}

export function updateClass(classId: string, updates: Partial<Omit<Class, 'id' | 'bookedCount'>>): boolean {
  const s = getStore();
  const classIndex = s.classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    s.classes[classIndex] = {
      ...s.classes[classIndex],
      ...updates,
    };
    saveStore(s);
    addAuditLog('update_class', 'class', classId, `Updated class: ${s.classes[classIndex].name}`, s.classes[classIndex].location);
    return true;
  }
  
  return false;
}

export function deleteClass(classId: string): boolean {
  const s = getStore();
  const classIndex = s.classes.findIndex(c => c.id === classId);
  
  if (classIndex !== -1) {
    const className = s.classes[classIndex].name;
    const location = s.classes[classIndex].location;
    s.classes.splice(classIndex, 1);
    
    s.bookings = s.bookings.filter(b => b.classId !== classId);
    s.waitlist = s.waitlist.filter(w => w.classId !== classId);
    
    saveStore(s);
    addAuditLog('delete_class', 'class', classId, `Deleted class: ${className}`, location);
    return true;
  }
  
  return false;
}

export function addStaff(staffData: Omit<Staff, 'id'>): Staff {
  const s = getStore();
  const newStaff: Staff = {
    ...staffData,
    id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  s.staff.push(newStaff);
  saveStore(s);
  addAuditLog('add_staff', 'staff', newStaff.id, `Added staff: ${newStaff.name}`, newStaff.location);
  return newStaff;
}

export function updateStaff(staffId: string, updates: Partial<Omit<Staff, 'id'>>): boolean {
  const s = getStore();
  const staffIndex = s.staff.findIndex(st => st.id === staffId);
  
  if (staffIndex !== -1) {
    s.staff[staffIndex] = {
      ...s.staff[staffIndex],
      ...updates,
    };
    saveStore(s);
    addAuditLog('update_staff', 'staff', staffId, `Updated staff: ${s.staff[staffIndex].name}`, s.staff[staffIndex].location);
    return true;
  }
  
  return false;
}

export function deleteStaff(staffId: string): boolean {
  const s = getStore();
  const staffIndex = s.staff.findIndex(st => st.id === staffId);
  
  if (staffIndex !== -1) {
    const staffName = s.staff[staffIndex].name;
    const location = s.staff[staffIndex].location;
    s.staff.splice(staffIndex, 1);
    saveStore(s);
    addAuditLog('delete_staff', 'staff', staffId, `Deleted staff: ${staffName}`, location);
    return true;
  }
  
  return false;
}

export function getAllGoals() {
  return getStore().goals;
}

export function getGoalsByMember(memberId: string) {
  return getStore().goals.filter(g => g.memberId === memberId);
}

export function createGoal(goal: Omit<Goal, 'id' | 'createdDate' | 'updatedDate'>) {
  const store = getStore();
  const newGoal: Goal = {
    ...goal,
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };
  
  store.goals.push(newGoal);
  
  const member = store.members.find(m => m.id === goal.memberId);
  if (member) {
    addAuditLog('create_goal', 'goal', newGoal.id, `Goal created: ${goal.title}`, member.location);
  }
  
  saveStore(store);
  return { success: true, goal: newGoal };
}

export function updateGoal(goalId: string, updates: Partial<Goal>) {
  const store = getStore();
  const goal = store.goals.find(g => g.id === goalId);
  
  if (!goal) {
    return { success: false, message: 'Goal not found' };
  }
  
  Object.assign(goal, updates, { updatedDate: new Date().toISOString() });
  
  if (updates.status === 'completed' && !goal.completedDate) {
    goal.completedDate = new Date().toISOString();
  }
  
  const member = store.members.find(m => m.id === goal.memberId);
  if (member) {
    addAuditLog('update_goal', 'goal', goalId, `Goal updated: ${goal.title}`, member.location);
  }
  
  saveStore(store);
  return { success: true, goal };
}

export function deleteGoal(goalId: string) {
  const store = getStore();
  const goalIndex = store.goals.findIndex(g => g.id === goalId);
  
  if (goalIndex === -1) {
    return { success: false, message: 'Goal not found' };
  }
  
  const goal = store.goals[goalIndex];
  const member = store.members.find(m => m.id === goal.memberId);
  
  store.goals.splice(goalIndex, 1);
  
  if (member) {
    addAuditLog('delete_goal', 'goal', goalId, `Goal deleted: ${goal.title}`, member.location);
  }
  
  saveStore(store);
  return { success: true };
}

export function getAllNotes() {
  return getStore().notes;
}

export function getNotesByMember(memberId: string) {
  return getStore().notes.filter(n => n.memberId === memberId);
}

export function createNote(note: Omit<Note, 'id' | 'createdDate' | 'updatedDate'>) {
  const store = getStore();
  const newNote: Note = {
    ...note,
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };
  
  store.notes.push(newNote);
  
  const member = store.members.find(m => m.id === note.memberId);
  if (member) {
    addAuditLog('create_note', 'note', newNote.id, `${note.type} note added by ${note.authorName}`, member.location);
  }
  
  saveStore(store);
  return { success: true, note: newNote };
}

export function updateNote(noteId: string, updates: Partial<Note>) {
  const store = getStore();
  const note = store.notes.find(n => n.id === noteId);
  
  if (!note) {
    return { success: false, message: 'Note not found' };
  }
  
  Object.assign(note, updates, { updatedDate: new Date().toISOString() });
  
  const member = store.members.find(m => m.id === note.memberId);
  if (member) {
    addAuditLog('update_note', 'note', noteId, `Note updated by ${note.authorName}`, member.location);
  }
  
  saveStore(store);
  return { success: true, note };
}

export function deleteNote(noteId: string) {
  const store = getStore();
  const noteIndex = store.notes.findIndex(n => n.id === noteId);
  
  if (noteIndex === -1) {
    return { success: false, message: 'Note not found' };
  }
  
  const note = store.notes[noteIndex];
  const member = store.members.find(m => m.id === note.memberId);
  
  store.notes.splice(noteIndex, 1);
  
  if (member) {
    addAuditLog('delete_note', 'note', noteId, `Note deleted by ${note.authorName}`, member.location);
  }
  
  saveStore(store);
  return { success: true };
}

export function getAllMeasurements() {
  return getStore().measurements;
}

export function getMeasurementsByMember(memberId: string) {
  return getStore().measurements.filter(m => m.memberId === memberId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function createMeasurement(measurement: Omit<Measurement, 'id'>) {
  const store = getStore();
  const newMeasurement: Measurement = {
    ...measurement,
    id: `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  store.measurements.push(newMeasurement);
  
  const member = store.members.find(m => m.id === measurement.memberId);
  if (member) {
    addAuditLog('create_measurement', 'measurement', newMeasurement.id, `Measurements recorded`, member.location);
  }
  
  saveStore(store);
  return { success: true, measurement: newMeasurement };
}

export function updateMeasurement(measurementId: string, updates: Partial<Measurement>) {
  const store = getStore();
  const measurement = store.measurements.find(m => m.id === measurementId);
  
  if (!measurement) {
    return { success: false, message: 'Measurement not found' };
  }
  
  Object.assign(measurement, updates);
  
  const member = store.members.find(m => m.id === measurement.memberId);
  if (member) {
    addAuditLog('update_measurement', 'measurement', measurementId, `Measurements updated`, member.location);
  }
  
  saveStore(store);
  return { success: true, measurement };
}

export function deleteMeasurement(measurementId: string) {
  const store = getStore();
  const measurementIndex = store.measurements.findIndex(m => m.id === measurementId);
  
  if (measurementIndex === -1) {
    return { success: false, message: 'Measurement not found' };
  }
  
  const measurement = store.measurements[measurementIndex];
  const member = store.members.find(m => m.id === measurement.memberId);
  
  store.measurements.splice(measurementIndex, 1);
  
  if (member) {
    addAuditLog('delete_measurement', 'measurement', measurementId, `Measurements deleted`, member.location);
  }
  
  saveStore(store);
  return { success: true };
}

export function getAllSubstitutionRequests() {
  return getStore().substitutionRequests;
}

export function getSubstitutionRequestsByCoach(coachId: string) {
  return getStore().substitutionRequests.filter(r => r.requestingCoachId === coachId || r.targetCoachId === coachId);
}

export function getPendingSubstitutionRequests(location?: string) {
  const requests = getStore().substitutionRequests.filter(r => r.status === 'pending');
  return location ? requests.filter(r => r.location === location) : requests;
}

export function createSubstitutionRequest(data: Omit<SubstitutionRequest, 'id' | 'createdDate' | 'status'>) {
  const store = getStore();
  const newRequest: SubstitutionRequest = {
    ...data,
    id: `sub-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdDate: new Date().toISOString(),
  };
  
  store.substitutionRequests.push(newRequest);
  addAuditLog('create_substitution_request', 'substitution_request', newRequest.id, 
    `${data.requestingCoachName} requested ${data.type === 'switch' ? 'switch' : 'substitute'} for ${data.className}`, data.location);
  saveStore(store);
  return { success: true, request: newRequest };
}

export function updateSubstitutionRequest(requestId: string, updates: Partial<SubstitutionRequest>) {
  const store = getStore();
  const request = store.substitutionRequests.find(r => r.id === requestId);
  
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  
  Object.assign(request, updates);
  
  if (updates.status) {
    request.reviewedDate = new Date().toISOString();
  }
  
  addAuditLog('update_substitution_request', 'substitution_request', requestId, 
    `Substitution request ${updates.status || 'updated'}`, request.location);
  saveStore(store);
  return { success: true, request };
}

export function deleteSubstitutionRequest(requestId: string) {
  const store = getStore();
  const index = store.substitutionRequests.findIndex(r => r.id === requestId);
  
  if (index === -1) {
    return { success: false, message: 'Request not found' };
  }
  
  const request = store.substitutionRequests[index];
  store.substitutionRequests.splice(index, 1);
  addAuditLog('delete_substitution_request', 'substitution_request', requestId, 
    `Substitution request deleted`, request.location);
  saveStore(store);
  return { success: true };
}

export function getAllTimeOffRequests() {
  return getStore().timeOffRequests;
}

export function getTimeOffRequestsByCoach(coachId: string) {
  return getStore().timeOffRequests.filter(r => r.coachId === coachId);
}

export function getPendingTimeOffRequests(location?: string) {
  const requests = getStore().timeOffRequests.filter(r => r.status === 'pending');
  return location ? requests.filter(r => r.location === location) : requests;
}

export function createTimeOffRequest(data: Omit<TimeOffRequest, 'id' | 'createdDate' | 'status'>) {
  const store = getStore();
  const newRequest: TimeOffRequest = {
    ...data,
    id: `time-off-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdDate: new Date().toISOString(),
  };
  
  store.timeOffRequests.push(newRequest);
  addAuditLog('create_time_off_request', 'time_off_request', newRequest.id, 
    `${data.coachName} requested time off from ${data.startDate} to ${data.endDate}`, data.location);
  saveStore(store);
  return { success: true, request: newRequest };
}

export function updateTimeOffRequest(requestId: string, updates: Partial<TimeOffRequest>) {
  const store = getStore();
  const request = store.timeOffRequests.find(r => r.id === requestId);
  
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  
  Object.assign(request, updates);
  
  if (updates.status) {
    request.reviewedDate = new Date().toISOString();
  }
  
  addAuditLog('update_time_off_request', 'time_off_request', requestId, 
    `Time off request ${updates.status || 'updated'}`, request.location);
  saveStore(store);
  return { success: true, request };
}

export function deleteTimeOffRequest(requestId: string) {
  const store = getStore();
  const index = store.timeOffRequests.findIndex(r => r.id === requestId);
  
  if (index === -1) {
    return { success: false, message: 'Request not found' };
  }
  
  const request = store.timeOffRequests[index];
  store.timeOffRequests.splice(index, 1);
  addAuditLog('delete_time_off_request', 'time_off_request', requestId, 
    `Time off request deleted`, request.location);
  saveStore(store);
  return { success: true };
}

export function getAllCoachLeadInteractions() {
  return getStore().coachLeadInteractions;
}

export function getCoachLeadInteractionsByCoach(coachId: string) {
  return getStore().coachLeadInteractions.filter(i => i.coachId === coachId);
}

export function getCoachLeadInteractionsByLead(leadId: string) {
  return getStore().coachLeadInteractions.filter(i => i.leadId === leadId);
}

export function createCoachLeadInteraction(data: Omit<CoachLeadInteraction, 'id'>) {
  const store = getStore();
  const newInteraction: CoachLeadInteraction = {
    ...data,
    id: `coach-lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  store.coachLeadInteractions.push(newInteraction);
  saveStore(store);
  return { success: true, interaction: newInteraction };
}

export function updateCoachLeadInteraction(interactionId: string, updates: Partial<CoachLeadInteraction>) {
  const store = getStore();
  const interaction = store.coachLeadInteractions.find(i => i.id === interactionId);
  
  if (!interaction) {
    return { success: false, message: 'Interaction not found' };
  }
  
  Object.assign(interaction, updates);
  saveStore(store);
  return { success: true, interaction };
}

export function getCoachConversionStats(coachId: string, startDate: string, endDate: string) {
  const interactions = getStore().coachLeadInteractions.filter(i => 
    i.coachId === coachId && 
    i.interactionDate >= startDate && 
    i.interactionDate <= endDate
  );
  
  const uniqueLeads = new Set(interactions.map(i => i.leadId));
  const convertedLeads = new Set(interactions.filter(i => i.converted).map(i => i.leadId));
  
  return {
    totalLeads: uniqueLeads.size,
    convertedLeads: convertedLeads.size,
    conversionRate: uniqueLeads.size > 0 ? (convertedLeads.size / uniqueLeads.size) * 100 : 0,
  };
}

export function getAllStaffSettings() {
  return getStore().staffSettings;
}

export function getStaffSettings(staffId: string) {
  return getStore().staffSettings.find(s => s.staffId === staffId);
}

export function updateStaffSettings(staffId: string, settings: Partial<Omit<StaffSettings, 'staffId'>>) {
  const store = getStore();
  let staffSettings = store.staffSettings.find(s => s.staffId === staffId);
  
  if (!staffSettings) {
    const staff = store.staff.find(s => s.id === staffId);
    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }
    
    staffSettings = {
      staffId,
      posAccess: true, // default to true
      location: staff.location,
    };
    store.staffSettings.push(staffSettings);
  }
  
  Object.assign(staffSettings, settings);
  saveStore(store);
  return { success: true, settings: staffSettings };
}

export function getCoachAverageClassSize(coachId: string, startDate: string, endDate: string) {
  const store = getStore();
  const coachClasses = store.classes.filter(c => c.coachId === coachId);
  
  if (coachClasses.length === 0) {
    return { averageSize: 0, totalClasses: 0, totalBookings: 0 };
  }
  
  let totalBookings = 0;
  let classCount = 0;
  
  coachClasses.forEach(cls => {
    const classBookings = store.bookings.filter(b => 
      b.classId === cls.id && 
      b.status !== 'cancelled' &&
      b.bookedAt >= startDate &&
      b.bookedAt <= endDate
    );
    
    if (classBookings.length > 0 || new Date(startDate) <= new Date() && new Date() <= new Date(endDate)) {
      totalBookings += classBookings.length;
      classCount++;
    }
  });
  
  return {
    averageSize: classCount > 0 ? totalBookings / classCount : 0,
    totalClasses: classCount,
    totalBookings,
  };
}

export function getOverallAverageClassSize(location: Location, startDate: string, endDate: string) {
  const store = getStore();
  // @ts-expect-error - TypeScript incorrectly infers location comparison type
  const locationClasses = store.classes.filter(c => c.location === location);
  
  if (locationClasses.length === 0) {
    return { averageSize: 0, totalClasses: 0, totalBookings: 0 };
  }
  
  let totalBookings = 0;
  let classCount = 0;
  
  locationClasses.forEach(cls => {
    const classBookings = store.bookings.filter(b => 
      b.classId === cls.id && 
      b.status !== 'cancelled' &&
      b.bookedAt >= startDate &&
      b.bookedAt <= endDate
    );
    
    if (classBookings.length > 0 || new Date(startDate) <= new Date() && new Date() <= new Date(endDate)) {
      totalBookings += classBookings.length;
      classCount++;
    }
  });
  
  return {
    averageSize: classCount > 0 ? totalBookings / classCount : 0,
    totalClasses: classCount,
    totalBookings,
  };
}

export function getTeamConversionStats(location: Location, startDate: string, endDate: string) {
  const store = getStore();
  const locationInteractions = store.coachLeadInteractions.filter(i => 
    // @ts-expect-error - TypeScript incorrectly infers location comparison type
    i.location === location &&
    i.interactionDate >= startDate && 
    i.interactionDate <= endDate
  );
  
  const uniqueLeads = new Set(locationInteractions.map(i => i.leadId));
  const convertedLeads = new Set(locationInteractions.filter(i => i.converted).map(i => i.leadId));
  
  return {
    totalLeads: uniqueLeads.size,
    convertedLeads: convertedLeads.size,
    conversionRate: uniqueLeads.size > 0 ? (convertedLeads.size / uniqueLeads.size) * 100 : 0,
  };
}

export function getAllCoachStats(location: Location, startDate: string, endDate: string) {
  const store = getStore();
  // @ts-expect-error - TypeScript incorrectly infers location comparison type
  const coaches = store.staff.filter(s => (s.role === 'coach' || s.role === 'head-coach') && s.location === location);
  
  return coaches.map(coach => {
    const conversionStats = getCoachConversionStats(coach.id, startDate, endDate);
    const classSizeStats = getCoachAverageClassSize(coach.id, startDate, endDate);
    
    return {
      coachId: coach.id,
      coachName: coach.name,
      conversionRate: conversionStats.conversionRate,
      totalLeads: conversionStats.totalLeads,
      convertedLeads: conversionStats.convertedLeads,
      averageClassSize: classSizeStats.averageSize,
      totalClasses: classSizeStats.totalClasses,
      totalBookings: classSizeStats.totalBookings,
    };
  });
}

export function getAllStaffShifts() {
  return getStore().staffShifts;
}

export function getAllShiftTemplates() {
  return getStore().shiftTemplates || [];
}

export function createShiftTemplate(data: { name: string; type: 'front-desk' | 'event' | 'meeting' | 'other'; defaultDuration: number; color: string }) {
  const store = getStore();
  const newTemplate: ShiftTemplate = {
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    type: data.type,
    defaultDuration: data.defaultDuration,
    color: data.color,
  };
  if (!store.shiftTemplates) {
    store.shiftTemplates = [];
  }
  store.shiftTemplates.push(newTemplate);
  saveStore(store);
  addAuditLog('create', 'shift-template', newTemplate.id, `Created shift template: ${newTemplate.name}`, 'athletic-club');
  return { success: true, template: newTemplate };
}

export function updateShiftTemplate(templateId: string, data: { name?: string; type?: 'front-desk' | 'event' | 'meeting' | 'other'; defaultDuration?: number; color?: string }) {
  const store = getStore();
  const template = store.shiftTemplates?.find(t => t.id === templateId);
  if (!template) {
    return { success: false, message: 'Template not found' };
  }
  if (data.name !== undefined) template.name = data.name;
  if (data.type !== undefined) template.type = data.type;
  if (data.defaultDuration !== undefined) template.defaultDuration = data.defaultDuration;
  if (data.color !== undefined) template.color = data.color;
  saveStore(store);
  addAuditLog('update', 'shift-template', templateId, `Updated shift template: ${template.name}`, 'athletic-club');
  return { success: true, template };
}

export function deleteShiftTemplate(templateId: string) {
  const store = getStore();
  const index = store.shiftTemplates?.findIndex(t => t.id === templateId);
  if (index === undefined || index === -1) {
    return { success: false, message: 'Template not found' };
  }
  const template = store.shiftTemplates![index];
  store.shiftTemplates!.splice(index, 1);
  saveStore(store);
  addAuditLog('delete', 'shift-template', templateId, `Deleted shift template: ${template.name}`, 'athletic-club');
  return { success: true };
}


export function getAllShiftSwapRequests() {
  return getStore().shiftSwapRequests;
}

export function getAllStaffTimeOffRequests() {
  return getStore().staffTimeOffRequests;
}

export function createStaffShift(shift: Omit<StaffShift, 'id' | 'createdAt'>) {
  const store = getStore();
  const newShift: StaffShift = {
    ...shift,
    id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  store.staffShifts.push(newShift);
  saveStore(store);
  addAuditLog('create', 'staff-shift', newShift.id, `Created shift for ${newShift.assignedStaffName || 'unassigned'}`, newShift.location);
  return { success: true, shift: newShift };
}

export function updateStaffShift(shiftId: string, updates: Partial<Omit<StaffShift, 'id' | 'createdAt' | 'createdBy'>>) {
  const store = getStore();
  const shift = store.staffShifts.find(s => s.id === shiftId);
  if (!shift) {
    return { success: false, message: 'Shift not found' };
  }
  Object.assign(shift, updates);
  saveStore(store);
  addAuditLog('update', 'staff-shift', shiftId, `Updated shift for ${shift.assignedStaffName || 'unassigned'}`, shift.location);
  return { success: true, shift };
}

export function deleteStaffShift(shiftId: string) {
  const store = getStore();
  const index = store.staffShifts.findIndex(s => s.id === shiftId);
  if (index === -1) {
    return { success: false, message: 'Shift not found' };
  }
  const shift = store.staffShifts[index];
  store.staffShifts.splice(index, 1);
  saveStore(store);
  addAuditLog('delete', 'staff-shift', shiftId, `Deleted shift for ${shift.assignedStaffName || 'unassigned'}`, shift.location);
  return { success: true };
}

export function createShiftSwapRequest(request: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'status'>) {
  const store = getStore();
  const newRequest: ShiftSwapRequest = {
    ...request,
    id: `swap-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.shiftSwapRequests.push(newRequest);
  saveStore(store);
  addAuditLog('create', 'shift-swap-request', newRequest.id, `${newRequest.requesterName} requested shift swap`, newRequest.location);
  return { success: true, request: newRequest };
}

export function approveShiftSwapRequest(requestId: string, reviewerId: string) {
  const store = getStore();
  const request = store.shiftSwapRequests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  request.status = 'approved';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date().toISOString();
  
  const shift = store.staffShifts.find(s => s.id === request.shiftId);
  if (shift) {
    if (request.kind === 'open') {
      shift.status = 'open';
      shift.assignedStaffId = undefined;
      shift.assignedStaffName = undefined;
    } else if (request.kind === 'direct' && request.targetStaffId && request.targetStaffName) {
      if (shift.recurrence.type === 'weekly') {
        if (!shift.recurrence.exDates) {
          shift.recurrence.exDates = [];
        }
        if (!shift.recurrence.exDates.includes(request.shiftDate)) {
          shift.recurrence.exDates.push(request.shiftDate);
        }
        
        const newShift: StaffShift = {
          id: `shift-swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          location: shift.location,
          assignedStaffId: request.targetStaffId,
          assignedStaffName: request.targetStaffName,
          templateType: shift.templateType,
          notes: `Swapped from ${request.requesterName}`,
          recurrence: { type: 'none' },
          date: request.shiftDate,
          startTime: shift.recurrence.startTime,
          endTime: shift.recurrence.endTime,
          status: 'scheduled',
          createdBy: reviewerId,
          createdAt: new Date().toISOString(),
        };
        store.staffShifts.push(newShift);
      } else {
        shift.assignedStaffId = request.targetStaffId;
        shift.assignedStaffName = request.targetStaffName;
        shift.notes = `Swapped from ${request.requesterName}`;
      }
    }
  }
  
  saveStore(store);
  addAuditLog('update', 'shift-swap-request', requestId, `Approved shift swap request from ${request.requesterName}`, request.location);
  return { success: true, request };
}

export function rejectShiftSwapRequest(requestId: string, reviewerId: string) {
  const store = getStore();
  const request = store.shiftSwapRequests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  request.status = 'rejected';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date().toISOString();
  saveStore(store);
  addAuditLog('update', 'shift-swap-request', requestId, `Rejected shift swap request from ${request.requesterName}`, request.location);
  return { success: true, request };
}

export function createStaffTimeOffRequest(request: Omit<StaffTimeOffRequest, 'id' | 'createdAt' | 'status'>) {
  const store = getStore();
  const newRequest: StaffTimeOffRequest = {
    ...request,
    id: `timeoff-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.staffTimeOffRequests.push(newRequest);
  saveStore(store);
  addAuditLog('create', 'staff-timeoff-request', newRequest.id, `${newRequest.staffName} requested time off`, newRequest.location);
  return { success: true, request: newRequest };
}

export function approveStaffTimeOffRequest(requestId: string, reviewerId: string) {
  const store = getStore();
  const request = store.staffTimeOffRequests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  request.status = 'approved';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date().toISOString();
  
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  
  request.affectedShiftIds.forEach(shiftId => {
    const shift = store.staffShifts.find(s => s.id === shiftId);
    if (shift && shift.assignedStaffId === request.staffId) {
      if (shift.recurrence.type === 'weekly') {
        if (!shift.recurrence.exDates) {
          shift.recurrence.exDates = [];
        }
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (shift.recurrence.dayOfWeek === dayOfWeek) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!shift.recurrence.exDates.includes(dateStr)) {
              shift.recurrence.exDates.push(dateStr);
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (shift.date) {
        const shiftDate = new Date(shift.date);
        if (shiftDate >= startDate && shiftDate <= endDate) {
          shift.status = 'open';
          shift.assignedStaffId = undefined;
          shift.assignedStaffName = undefined;
        }
      }
    }
  });
  
  saveStore(store);
  addAuditLog('update', 'staff-timeoff-request', requestId, `Approved time off request from ${request.staffName}`, request.location);
  return { success: true, request };
}

export function rejectStaffTimeOffRequest(requestId: string, reviewerId: string) {
  const store = getStore();
  const request = store.staffTimeOffRequests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  request.status = 'denied';
  request.reviewedBy = reviewerId;
  request.reviewedAt = new Date().toISOString();
  saveStore(store);
  addAuditLog('update', 'staff-timeoff-request', requestId, `Denied time off request from ${request.staffName}`, request.location);
  return { success: true, request };
}

// Franchise Location Getters
export function getFranchiseLocations(): FranchiseLocation[] {
  return seedFranchiseLocations;
}

export function getFranchiseSummaries(): Record<string, FranchiseSummary> {
  return seedFranchiseSummaries;
}
