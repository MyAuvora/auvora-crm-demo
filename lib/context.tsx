'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Location } from './types';

export type UserRole = 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk';
export type Section = 'dashboard' | 'leads-members' | 'pipeline' | 'schedule' | 'staff' | 'pos' | 'reports' | 'promotions' | 'messaging' | 'social-media' | 'quickbooks' | 'settings' | 'kiosk';

export interface DeepLink {
  type: 'member' | 'lead' | 'class';
  id: string;
}

interface AppContextType {
  location: Location;
  setLocation: (location: Location) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  deepLink: DeepLink | null;
  setDeepLink: (link: DeepLink | null) => void;
  navigateToMember: (memberId: string) => void;
  navigateToLead: (leadId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>('athletic-club');
  const [chatOpen, setChatOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [deepLink, setDeepLink] = useState<DeepLink | null>(null);

  const navigateToMember = (memberId: string) => {
    setDeepLink({ type: 'member', id: memberId });
    setActiveSection('leads-members');
  };

  const navigateToLead = (leadId: string) => {
    setDeepLink({ type: 'lead', id: leadId });
    setActiveSection('leads-members');
  };

  return (
    <AppContext.Provider value={{ 
      location, 
      setLocation, 
      chatOpen, 
      setChatOpen, 
      userRole, 
      setUserRole,
      activeSection,
      setActiveSection,
      deepLink,
      setDeepLink,
      navigateToMember,
      navigateToLead
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
