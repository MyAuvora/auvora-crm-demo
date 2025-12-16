import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import {
  generateMembers,
  generateLeads,
  generateStaff,
  generateClasses,
  generateClassPackClients,
  generateDropInClients,
  generatePromotions,
  generateProducts,
  generateGoals,
  generateNotes,
  generateCoachLeadInteractions,
  generateSubstitutionRequests,
  generateTimeOffRequests,
  generateStaffSettings,
  generateStaffShifts,
  generateFranchiseLocations,
  generateFranchiseSummaries,
} from '@/data/seedData';

type Tables = Database['public']['Tables'];

export type DbMember = Tables['members']['Row'];
export type DbLead = Tables['leads']['Row'];
export type DbStaff = Tables['staff']['Row'];
export type DbClass = Tables['classes']['Row'];
export type DbBooking = Tables['bookings']['Row'];
export type DbTransaction = Tables['transactions']['Row'];
export type DbTenant = Tables['tenants']['Row'];
export type DbUser = Tables['users']['Row'];

const supabase = createClient();

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: dbUser } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single();
  
  return dbUser;
}

export async function getCurrentTenant() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', user.tenant_id)
    .single();
  
  return tenant;
}

export async function getMembers(): Promise<DbMember[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  
  return data || [];
}

export async function getMemberById(id: string): Promise<DbMember | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching member:', error);
    return null;
  }
  
  return data;
}

export async function createMember(member: Tables['members']['Insert']): Promise<DbMember | null> {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating member:', error);
    return null;
  }
  
  return data;
}

export async function updateMember(id: string, updates: Tables['members']['Update']): Promise<DbMember | null> {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating member:', error);
    return null;
  }
  
  return data;
}

export async function deleteMember(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting member:', error);
    return false;
  }
  
  return true;
}

export async function getLeads(): Promise<DbLead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  
  return data || [];
}

export async function getLeadById(id: string): Promise<DbLead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
  
  return data;
}

export async function createLead(lead: Tables['leads']['Insert']): Promise<DbLead | null> {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }
  
  return data;
}

export async function updateLead(id: string, updates: Tables['leads']['Update']): Promise<DbLead | null> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating lead:', error);
    return null;
  }
  
  return data;
}

export async function deleteLead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting lead:', error);
    return false;
  }
  
  return true;
}

export async function getStaff(): Promise<DbStaff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
  
  return data || [];
}

export async function getStaffById(id: string): Promise<DbStaff | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }
  
  return data;
}

export async function createStaffMember(staff: Tables['staff']['Insert']): Promise<DbStaff | null> {
  const { data, error } = await supabase
    .from('staff')
    .insert(staff)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating staff member:', error);
    return null;
  }
  
  return data;
}

export async function updateStaffMember(id: string, updates: Tables['staff']['Update']): Promise<DbStaff | null> {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating staff member:', error);
    return null;
  }
  
  return data;
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting staff member:', error);
    return false;
  }
  
  return true;
}

export async function getClasses(): Promise<DbClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('day_of_week', { ascending: true });
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  
  return data || [];
}

export async function getClassById(id: string): Promise<DbClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching class:', error);
    return null;
  }
  
  return data;
}

export async function createClass(classData: Tables['classes']['Insert']): Promise<DbClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating class:', error);
    return null;
  }
  
  return data;
}

export async function updateClass(id: string, updates: Tables['classes']['Update']): Promise<DbClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating class:', error);
    return null;
  }
  
  return data;
}

export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting class:', error);
    return false;
  }
  
  return true;
}

export async function getBookings(): Promise<DbBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, classes(*), members(*)')
    .order('booked_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data || [];
}

export async function getBookingsByClass(classId: string): Promise<DbBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, members(*)')
    .eq('class_id', classId)
    .order('booked_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data || [];
}

export async function createBooking(booking: Tables['bookings']['Insert']): Promise<DbBooking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating booking:', error);
    return null;
  }
  
  return data;
}

export async function updateBooking(id: string, updates: Tables['bookings']['Update']): Promise<DbBooking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating booking:', error);
    return null;
  }
  
  return data;
}

export async function getTransactions(): Promise<DbTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, members(*)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data || [];
}

export async function createTransaction(transaction: Tables['transactions']['Insert']): Promise<DbTransaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  
  return data;
}

export async function getDashboardStats() {
  const [members, leads, bookings, transactions] = await Promise.all([
    getMembers(),
    getLeads(),
    getBookings(),
    getTransactions(),
  ]);
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  const activeMembers = members.filter(m => m.status === 'active');
  const overdueMembers = members.filter(m => m.payment_status === 'overdue');
  const newLeadsToday = leads.filter(l => {
    const createdDate = new Date(l.created_at);
    return createdDate.toDateString() === today.toDateString();
  });
  
  const mtdTransactions = transactions.filter(t => {
    const createdDate = new Date(t.created_at);
    return createdDate >= startOfMonth && t.status === 'completed';
  });
  
  const ytdTransactions = transactions.filter(t => {
    const createdDate = new Date(t.created_at);
    return createdDate >= startOfYear && t.status === 'completed';
  });
  
  const mtdRevenue = mtdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const ytdRevenue = ytdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  
  const todayBookings = bookings.filter(b => {
    const bookedDate = new Date(b.booked_at);
    return bookedDate.toDateString() === today.toDateString();
  });
  
  const checkedInToday = todayBookings.filter(b => b.status === 'checked-in').length;
  
  return {
    activeMembers: activeMembers.length,
    totalMembers: members.length,
    overduePayments: overdueMembers.length,
    overdueAmount: overdueMembers.length * 150,
    newLeadsToday: newLeadsToday.length,
    totalLeads: leads.length,
    mtdRevenue,
    ytdRevenue,
    checkInsToday: checkedInToday,
    bookingsToday: todayBookings.length,
  };
}

export function useDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('auvora_demo_mode') === 'true';
}

export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auvora_demo_mode', enabled ? 'true' : 'false');
}

export const demoData = {
  getMembers: generateMembers,
  getLeads: generateLeads,
  getStaff: generateStaff,
  getClasses: generateClasses,
  getClassPackClients: generateClassPackClients,
  getDropInClients: generateDropInClients,
  getPromotions: generatePromotions,
  getProducts: generateProducts,
  getGoals: generateGoals,
  getNotes: generateNotes,
  getCoachLeadInteractions: generateCoachLeadInteractions,
  getSubstitutionRequests: generateSubstitutionRequests,
  getTimeOffRequests: generateTimeOffRequests,
  getStaffSettings: generateStaffSettings,
  getStaffShifts: generateStaffShifts,
  getFranchiseLocations: generateFranchiseLocations,
  getFranchiseSummaries: generateFranchiseSummaries,
};
