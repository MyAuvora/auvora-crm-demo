'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDashboardStats, getMembers, getLeads, getClasses, getBookings, getTransactions, getStaff } from '@/lib/services/dataService';
import { getAllMembers, getAllLeads, getAllClasses, getAllBookings, getAllTransactions, getAllStaff, getAllWaitlist, getAllProducts, getAllClassPackClients, getAllRefunds, getPendingSubstitutionRequests, getPendingTimeOffRequests } from '@/lib/dataStore';

export interface DashboardData {
  members: ReturnType<typeof getAllMembers>;
  leads: ReturnType<typeof getAllLeads>;
  classes: ReturnType<typeof getAllClasses>;
  bookings: ReturnType<typeof getAllBookings>;
  transactions: ReturnType<typeof getAllTransactions>;
  staff: ReturnType<typeof getAllStaff>;
  waitlist: ReturnType<typeof getAllWaitlist>;
  products: ReturnType<typeof getAllProducts>;
  classPackClients: ReturnType<typeof getAllClassPackClients>;
  refunds: ReturnType<typeof getAllRefunds>;
  pendingSubRequests: ReturnType<typeof getPendingSubstitutionRequests>;
  pendingTimeOffRequests: ReturnType<typeof getPendingTimeOffRequests>;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useDashboardData(location: string): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseData, setSupabaseData] = useState<{
    members: Awaited<ReturnType<typeof getMembers>>;
    leads: Awaited<ReturnType<typeof getLeads>>;
    classes: Awaited<ReturnType<typeof getClasses>>;
    bookings: Awaited<ReturnType<typeof getBookings>>;
    transactions: Awaited<ReturnType<typeof getTransactions>>;
    staff: Awaited<ReturnType<typeof getStaff>>;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        const [members, leads, classes, bookings, transactions, staff] = await Promise.all([
          getMembers(),
          getLeads(),
          getClasses(),
          getBookings(),
          getTransactions(),
          getStaff(),
        ]);
        
        if (members.length > 0 || leads.length > 0 || classes.length > 0) {
          setSupabaseData({ members, leads, classes, bookings, transactions, staff });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const demoMembers = getAllMembers().filter(m => m.location === location);
  const demoLeads = getAllLeads().filter(l => l.location === location);
  const demoClasses = getAllClasses().filter(c => c.location === location);
  const demoBookings = getAllBookings();
  const demoTransactions = getAllTransactions().filter(t => t.location === location);
  const demoStaff = getAllStaff();
  const demoWaitlist = getAllWaitlist();
  const demoProducts = getAllProducts();
  const demoClassPackClients = getAllClassPackClients().filter(c => c.location === location);
  const demoRefunds = getAllRefunds().filter(r => r.location === location);
  const demoPendingSubRequests = getPendingSubstitutionRequests(location);
  const demoPendingTimeOffRequests = getPendingTimeOffRequests(location);

  if (supabaseData && (supabaseData.members.length > 0 || supabaseData.leads.length > 0)) {
    return {
      members: demoMembers,
      leads: demoLeads,
      classes: demoClasses,
      bookings: demoBookings,
      transactions: demoTransactions,
      staff: demoStaff,
      waitlist: demoWaitlist,
      products: demoProducts,
      classPackClients: demoClassPackClients,
      refunds: demoRefunds,
      pendingSubRequests: demoPendingSubRequests,
      pendingTimeOffRequests: demoPendingTimeOffRequests,
      isLoading,
      isAuthenticated,
      error,
    };
  }

  return {
    members: demoMembers,
    leads: demoLeads,
    classes: demoClasses,
    bookings: demoBookings,
    transactions: demoTransactions,
    staff: demoStaff,
    waitlist: demoWaitlist,
    products: demoProducts,
    classPackClients: demoClassPackClients,
    refunds: demoRefunds,
    pendingSubRequests: demoPendingSubRequests,
    pendingTimeOffRequests: demoPendingTimeOffRequests,
    isLoading,
    isAuthenticated,
    error,
  };
}
