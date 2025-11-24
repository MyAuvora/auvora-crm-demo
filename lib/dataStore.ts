'use client';

import { Member, ClassPackClient, Lead, Staff, Class, Promotion, Product } from './types';
import { members as seedMembers, classPackClients as seedClassPackClients, leads as seedLeads, staff as seedStaff, classes as seedClasses, promotions as seedPromotions, products as seedProducts } from '@/data/seedData';

const STORAGE_VERSION = 1;
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

interface DataStore {
  version: number;
  members: Member[];
  classPackClients: ClassPackClient[];
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
  weeklyUsage: Record<string, { weekStart: string; count: number }>; // memberId -> usage
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
  
  const productTypes = [
    { id: 'membership-1x', name: '1x/Week Membership', price: 99, category: 'membership' },
    { id: 'membership-2x', name: '2x/Week Membership', price: 149, category: 'membership' },
    { id: 'membership-unlimited', name: 'Unlimited Membership', price: 199, category: 'membership' },
    { id: 'pack-5', name: '5-Class Pack', price: 75, category: 'class-pack' },
    { id: 'pack-10', name: '10-Class Pack', price: 140, category: 'class-pack' },
    { id: 'pack-20', name: '20-Class Pack', price: 260, category: 'class-pack' },
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
        
        transactions.push({
          id: `txn-sample-${transactionId++}`,
          memberName: `Member ${transactionId}`,
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

function initializeStore(): DataStore {
  if (typeof window === 'undefined') {
    return {
      version: STORAGE_VERSION,
      members: seedMembers,
      classPackClients: seedClassPackClients,
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
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DataStore;
      if (parsed.version === STORAGE_VERSION) {
        if (parsed.transactions.length === 0 || !parsed.transactions.some((t: Transaction) => t.id.startsWith('txn-sample-'))) {
          parsed.transactions = [...parsed.transactions, ...generateSampleRevenue()];
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
    leads: seedLeads,
    staff: seedStaff,
    classes: seedClasses,
    promotions: seedPromotions,
    products: seedProducts,
    bookings: [],
    waitlist: [],
    transactions: generateSampleRevenue(),
    auditLog: [],
    membershipFreezes: [],
    membershipCancellations: [],
    leadTasks: [],
    leadNotes: [],
    communicationLogs: [],
    weeklyUsage: {},
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

export function resetData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    store = null;
    store = initializeStore();
  }
}
