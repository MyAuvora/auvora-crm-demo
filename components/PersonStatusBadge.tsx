'use client';

import { getAllMembers, getAllClassPackClients, getAllDropInClients, getAllLeads, getAllBookings } from '@/lib/dataStore';

interface PersonStatusBadgeProps {
  personId: string;
  className?: string;
}

export default function PersonStatusBadge({ personId, className = '' }: PersonStatusBadgeProps) {
  const getPersonStatus = () => {
    const members = getAllMembers();
    const classPackClients = getAllClassPackClients();
    const dropInClients = getAllDropInClients();
    const leads = getAllLeads();
    const bookings = getAllBookings();

    const isMember = members.some(m => m.id === personId);
    if (isMember) {
      return { type: 'member', label: 'M', color: 'bg-green-500', textColor: 'text-white' };
    }

    const isPackHolder = classPackClients.some(c => c.id === personId);
    if (isPackHolder) {
      return { type: 'pack', label: 'P', color: 'bg-yellow-500', textColor: 'text-white' };
    }

    const isDropIn = dropInClients.some(d => d.id === personId);
    if (isDropIn) {
      return { type: 'drop-in', label: '', color: 'bg-red-500', textColor: 'text-white' };
    }

    const isLead = leads.some(l => l.id === personId);
    if (isLead) {
      const hasCompletedClass = bookings.some(b => b.memberId === personId && b.status === 'checked-in');
      
      if (hasCompletedClass) {
        return { type: 'completed-no-purchase', label: '', color: 'bg-red-500', textColor: 'text-white' };
      } else {
        return { type: 'lead', label: 'L', color: 'bg-blue-500', textColor: 'text-white' };
      }
    }

    return null;
  };

  const status = getPersonStatus();
  
  if (!status) return null;

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full ${status.color} ${status.textColor} text-[8px] sm:text-[10px] font-bold ${className}`}
      title={
        status.type === 'member' ? 'Recurring Member' :
        status.type === 'pack' ? 'Class Pack Holder' :
        status.type === 'drop-in' ? 'Drop-In Client' :
        status.type === 'completed-no-purchase' ? 'Took Class - No Purchase' :
        'New Lead'
      }
    >
      {status.label}
    </span>
  );
}
