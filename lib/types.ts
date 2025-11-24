export type Location = 'athletic-club' | 'dance-studio';

export type MembershipType = '1x-week' | '2x-week' | 'unlimited';
export type ClassPackType = '5-pack' | '10-pack' | '20-pack';

export type LeadStatus = 'new-lead' | 'trial-booked' | 'trial-showed' | 'joined' | 'trial-no-join' | 'cancelled';
export type LeadSource = 'website' | 'instagram' | 'facebook' | 'walk-in';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: MembershipType;
  status: 'active' | 'frozen' | 'cancelled';
  lastVisit: string;
  zipCode: string;
  location: Location;
  joinDate: string;
  visitsLast30Days: number;
}

export interface ClassPackClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  packType: ClassPackType;
  totalClasses: number;
  remainingClasses: number;
  zipCode: string;
  location: Location;
  purchaseDate: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  createdDate: string;
  location: Location;
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'coach' | 'front-desk' | 'instructor';
  location: Location;
  specialties?: string[];
  styles?: string[];
}

export interface Class {
  id: string;
  name: string;
  type: string;
  duration: 30 | 60;
  dayOfWeek: string;
  time: string;
  coachId: string;
  capacity: number;
  location: Location;
  bookedCount: number;
  attendees: string[];
}

export interface Promotion {
  id: string;
  name: string;
  type: string;
  status: 'planned' | 'active' | 'ended';
  startDate: string;
  endDate: string;
  signups: number;
  revenue: number;
  location: Location;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: Location;
}
