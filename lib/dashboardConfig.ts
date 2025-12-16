// Dashboard Widget Configuration System
// Allows users to customize their dashboard layout

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  roles: string[]; // Which roles can see this widget
  category: 'metrics' | 'operations' | 'insights' | 'actions';
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // Metrics widgets
  { id: 'daily-brief', name: 'Daily Brief by Auvora', description: 'AI-powered daily summary and alerts', defaultEnabled: true, roles: ['owner', 'manager'], category: 'metrics' },
  { id: 'ops-feed', name: 'Operations Feed', description: 'Real-time alerts and notifications', defaultEnabled: true, roles: ['owner', 'manager', 'head-coach', 'front-desk'], category: 'operations' },
  { id: 'metric-cards', name: 'Key Metrics', description: 'Check-ins, leads, members, revenue', defaultEnabled: true, roles: ['owner', 'manager', 'head-coach', 'coach', 'front-desk'], category: 'metrics' },
  { id: 'todays-classes', name: "Today's Classes", description: 'Class schedule and attendance', defaultEnabled: true, roles: ['owner', 'manager', 'head-coach', 'coach', 'front-desk'], category: 'operations' },
  { id: 'this-month', name: 'This Month Stats', description: 'New leads, joins, and cancellations', defaultEnabled: true, roles: ['owner', 'manager'], category: 'metrics' },
  { id: 'ai-insights', name: 'AI Insights', description: 'Smart recommendations and trends', defaultEnabled: true, roles: ['owner', 'manager'], category: 'insights' },
  { id: 'action-playbooks', name: 'Action Playbooks', description: 'Quick actions to improve metrics', defaultEnabled: true, roles: ['owner', 'manager'], category: 'actions' },
  { id: 'predictive-insights', name: 'Predictive Insights', description: 'Churn risk and renewal opportunities', defaultEnabled: true, roles: ['owner', 'manager'], category: 'insights' },
  { id: 'pending-approvals', name: 'Pending Approvals', description: 'Staff requests needing review', defaultEnabled: true, roles: ['owner', 'manager', 'head-coach'], category: 'operations' },
];

export interface UserDashboardLayout {
  userId: string;
  dashboardKey: string; // e.g., 'owner_home', 'coach_home'
  widgetOrder: string[]; // Ordered list of widget IDs
  hiddenWidgets: string[]; // Widgets the user has hidden
  widgetConfig: Record<string, Record<string, unknown>>; // Per-widget settings
  updatedAt: string;
}

// Get default layout for a role
export function getDefaultLayout(role: string): string[] {
  const availableWidgets = DASHBOARD_WIDGETS.filter(w => w.roles.includes(role));
  return availableWidgets.filter(w => w.defaultEnabled).map(w => w.id);
}

// Get widgets available for a role
export function getAvailableWidgets(role: string): DashboardWidget[] {
  return DASHBOARD_WIDGETS.filter(w => w.roles.includes(role));
}

// Load user's dashboard layout from localStorage (will be replaced with Supabase later)
export function loadDashboardLayout(userId: string, role: string): UserDashboardLayout {
  const key = `dashboard_layout_${userId}_${role}`;
  const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid stored data, return default
    }
  }
  
  // Return default layout
  return {
    userId,
    dashboardKey: `${role}_home`,
    widgetOrder: getDefaultLayout(role),
    hiddenWidgets: [],
    widgetConfig: {},
    updatedAt: new Date().toISOString(),
  };
}

// Save user's dashboard layout to localStorage (will be replaced with Supabase later)
export function saveDashboardLayout(layout: UserDashboardLayout): void {
  const key = `dashboard_layout_${layout.userId}_${layout.dashboardKey.split('_')[0]}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(layout));
  }
}

// Reset layout to defaults
export function resetDashboardLayout(userId: string, role: string): UserDashboardLayout {
  const layout: UserDashboardLayout = {
    userId,
    dashboardKey: `${role}_home`,
    widgetOrder: getDefaultLayout(role),
    hiddenWidgets: [],
    widgetConfig: {},
    updatedAt: new Date().toISOString(),
  };
  saveDashboardLayout(layout);
  return layout;
}
