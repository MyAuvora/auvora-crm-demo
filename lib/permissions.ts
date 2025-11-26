import { UserRole } from './context';

export interface Permission {
  action: string;
  allowedRoles: UserRole[];
  description: string;
}

export const permissions: Record<string, Permission> = {
  'refund:process': {
    action: 'Process Refunds',
    allowedRoles: ['owner', 'manager'],
    description: 'Process refunds for invoices and transactions',
  },
  'payment:process': {
    action: 'Process Payments',
    allowedRoles: ['owner', 'manager', 'front-desk'],
    description: 'Process member payments and charges',
  },
  'invoice:void': {
    action: 'Void Invoices',
    allowedRoles: ['owner', 'manager'],
    description: 'Void or cancel invoices',
  },
  
  'member:cancel': {
    action: 'Cancel Memberships',
    allowedRoles: ['owner', 'manager'],
    description: 'Cancel member accounts and memberships',
  },
  'member:freeze': {
    action: 'Freeze Memberships',
    allowedRoles: ['owner', 'manager', 'front-desk'],
    description: 'Freeze member accounts temporarily',
  },
  'member:edit-billing': {
    action: 'Edit Billing Info',
    allowedRoles: ['owner', 'manager'],
    description: 'Edit member billing information and payment methods',
  },
  
  'bulk:message': {
    action: 'Bulk Messaging',
    allowedRoles: ['owner', 'manager'],
    description: 'Send messages to multiple members at once',
  },
  'bulk:export': {
    action: 'Bulk Export',
    allowedRoles: ['owner', 'manager'],
    description: 'Export member data in bulk',
  },
  'bulk:edit': {
    action: 'Bulk Edit',
    allowedRoles: ['owner', 'manager'],
    description: 'Edit multiple member records at once',
  },
  
  'staff:add': {
    action: 'Add Staff',
    allowedRoles: ['owner', 'manager'],
    description: 'Add new staff members',
  },
  'staff:edit': {
    action: 'Edit Staff',
    allowedRoles: ['owner', 'manager'],
    description: 'Edit staff member details',
  },
  'staff:delete': {
    action: 'Delete Staff',
    allowedRoles: ['owner'],
    description: 'Delete staff members',
  },
  
  'promo:create': {
    action: 'Create Promotions',
    allowedRoles: ['owner', 'manager'],
    description: 'Create new promotions and promo codes',
  },
  'promo:edit': {
    action: 'Edit Promotions',
    allowedRoles: ['owner', 'manager'],
    description: 'Edit existing promotions',
  },
  'promo:delete': {
    action: 'Delete Promotions',
    allowedRoles: ['owner'],
    description: 'Delete promotions',
  },
  
  'class:add': {
    action: 'Add Classes',
    allowedRoles: ['owner', 'manager'],
    description: 'Add new classes to schedule',
  },
  'class:edit': {
    action: 'Edit Classes',
    allowedRoles: ['owner', 'manager'],
    description: 'Edit class details',
  },
  'class:delete': {
    action: 'Delete Classes',
    allowedRoles: ['owner', 'manager'],
    description: 'Delete classes from schedule',
  },
  
  'reports:financial': {
    action: 'View Financial Reports',
    allowedRoles: ['owner', 'manager'],
    description: 'View financial reports and revenue data',
  },
  'reports:export': {
    action: 'Export Reports',
    allowedRoles: ['owner', 'manager'],
    description: 'Export report data',
  },
};

export function hasPermission(userRole: UserRole, permissionKey: string): boolean {
  const permission = permissions[permissionKey];
  if (!permission) {
    console.warn(`Permission key "${permissionKey}" not found`);
    return false;
  }
  return permission.allowedRoles.includes(userRole);
}

export function getPermissionError(permissionKey: string): string {
  const permission = permissions[permissionKey];
  if (!permission) {
    return 'You do not have permission to perform this action.';
  }
  const roleNames = permission.allowedRoles.map(role => {
    switch(role) {
      case 'owner': return 'Owner/Admin';
      case 'manager': return 'Manager';
      case 'coach': return 'Coach/Trainer';
      case 'front-desk': return 'Front Desk';
      default: return role;
    }
  });
  return `${permission.action} requires ${roleNames.join(' or ')} role. Please contact your administrator.`;
}

export function requirePermission(userRole: UserRole, permissionKey: string): void {
  if (!hasPermission(userRole, permissionKey)) {
    throw new Error(getPermissionError(permissionKey));
  }
}
