export type Location = 'all' | string;

export interface FranchiseLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  type: 'athletic-club' | 'dance-studio';
  clickable: boolean;
}

export interface FranchiseSummary {
  locationId: string;
  mtdRevenue: number;
  lastMonthRevenue: number;
  ytdRevenue: number;
  yoyGrowth: number;
  activeMembers: number;
  newMembers: number;
  cancelled: number;
  leads: number;
  conversion: number;
  avgFillRate: number;
  churnRate: number;
  totalStaff: number;
  totalClasses: number;
}

export type MembershipType = '1x-week' | '2x-week' | 'unlimited';
export type ClassPackType = '5-pack' | '10-pack' | '20-pack';
export type ClientType = 'membership' | 'class-pack' | 'drop-in';

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
  paymentStatus?: 'current' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDue?: string;
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

export interface DropInClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  lastVisit: string;
  zipCode: string;
  location: Location;
  firstVisit: string;
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
  role: 'head-coach' | 'coach' | 'front-desk' | 'instructor' | 'manager';
  location: Location;
  specialties?: string[];
  styles?: string[];
}

export interface Class {
  id: string;
  name: string;
  type: string;
  duration: number;
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

export type GoalCategory = 'weight-loss' | 'strength' | 'attendance' | 'mobility' | 'rehab' | 'other';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Goal {
  id: string;
  memberId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string;
  startValue?: string;
  targetValue?: string;
  currentValue?: string;
  units?: string;
  status: GoalStatus;
  progress: number; // 0-100
  assignedCoach: string; // staff id
  memberVisible: boolean;
  privateNotes?: string; // coach-only notes
  createdDate: string;
  updatedDate: string;
  completedDate?: string;
}

export type NoteType = 'session' | 'assessment' | 'injury' | 'nutrition' | 'general';
export type NoteVisibility = 'private' | 'team' | 'member';

export interface Note {
  id: string;
  memberId: string;
  type: NoteType;
  title: string;
  content: string;
  authorId: string; // staff id
  authorName: string;
  visibility: NoteVisibility;
  classId?: string; // if linked to a specific class
  createdDate: string;
  updatedDate: string;
}

export interface Measurement {
  id: string;
  memberId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  arms?: number;
  recordedBy: string; // staff id
  notes?: string;
}

export type SubstitutionRequestType = 'switch' | 'available';
export type SubstitutionRequestStatus = 'pending' | 'approved' | 'denied' | 'completed';

export interface SubstitutionRequest {
  id: string;
  classId: string;
  className: string;
  classDate: string;
  classTime: string;
  requestingCoachId: string;
  requestingCoachName: string;
  type: SubstitutionRequestType; // 'switch' = swap with specific coach, 'available' = anyone can take
  targetCoachId?: string; // only for 'switch' type
  targetCoachName?: string;
  substituteCoachId?: string; // who actually took the class
  substituteCoachName?: string;
  status: SubstitutionRequestStatus;
  reason?: string;
  createdDate: string;
  reviewedDate?: string;
  reviewedBy?: string; // manager id
  location: Location;
}

export type TimeOffRequestStatus = 'pending' | 'approved' | 'denied';

export interface TimeOffRequest {
  id: string;
  coachId: string;
  coachName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: TimeOffRequestStatus;
  affectedClassIds: string[]; // classes that need substitutes during this period
  createdDate: string;
  reviewedDate?: string;
  reviewedBy?: string; // manager id
  location: Location;
}

export interface CoachLeadInteraction {
  id: string;
  leadId: string;
  coachId: string;
  classId: string;
  interactionDate: string;
  interactionType: 'trial-class' | 'class-attendance';
  converted: boolean; // did the lead join as a member?
  conversionDate?: string;
  location: Location;
}

export interface StaffSettings {
  staffId: string;
  posAccess: boolean; // can this staff member access POS?
  location: Location;
}

export type ShiftTemplateType = 'front-desk' | 'event' | 'meeting' | 'other';

export interface ShiftTemplate {
  id: string;
  name: string;
  type: ShiftTemplateType;
  defaultDuration: number; // minutes
  color: string;
}

export type ShiftRecurrenceType = 'none' | 'weekly';

export interface ShiftRecurrence {
  type: ShiftRecurrenceType;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  exDates?: string[]; // YYYY-MM-DD dates to exclude
}

export type ShiftStatus = 'scheduled' | 'open' | 'canceled';

export interface StaffShift {
  id: string;
  location: Location;
  assignedStaffId?: string;
  assignedStaffName?: string;
  templateType: ShiftTemplateType;
  notes?: string;
  recurrence: ShiftRecurrence;
  date?: string; // YYYY-MM-DD for one-time shifts (when recurrence.type === 'none')
  startTime?: string; // HH:MM for one-time shifts
  endTime?: string; // HH:MM for one-time shifts
  status: ShiftStatus;
  createdBy: string;
  createdAt: string;
}

export type ShiftSwapRequestKind = 'open' | 'direct';
export type ShiftSwapRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ShiftSwapRequest {
  id: string;
  shiftId: string;
  shiftDate: string; // YYYY-MM-DD - specific date for the swap
  shiftTime: string; // Display time for UI
  requesterId: string;
  requesterName: string;
  kind: ShiftSwapRequestKind;
  targetStaffId?: string; // for 'direct' swaps
  targetStaffName?: string;
  reason: string;
  status: ShiftSwapRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  location: Location;
}

export interface StaffTimeOffRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: TimeOffRequestStatus;
  affectedShiftIds: string[]; // shifts that are affected during this period
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  location: Location;
}
