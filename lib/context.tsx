'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Location } from './types';

export type UserRole = 'owner' | 'manager' | 'coach' | 'front-desk';

interface AppContextType {
  location: Location;
  setLocation: (location: Location) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>('athletic-club');
  const [chatOpen, setChatOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('owner');

  return (
    <AppContext.Provider value={{ location, setLocation, chatOpen, setChatOpen, userRole, setUserRole }}>
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
