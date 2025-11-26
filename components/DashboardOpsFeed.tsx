'use client';

import { AlertCircle, Calendar, CreditCard, UserPlus, CheckCircle } from 'lucide-react';
import { getAllMembers, getAllLeads, getAllClasses, getAllBookings, getAllPaymentMethods } from '@/lib/dataStore';
import { useApp } from '@/lib/context';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'missed-payment' | 'overfilled-class' | 'expiring-card' | 'uncontacted-lead';
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  onAction: () => void;
}

export default function DashboardOpsFeed() {
  const { location } = useApp();
  const [processedAlerts, setProcessedAlerts] = useState<Set<string>>(new Set());

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    const members = getAllMembers().filter(m => m.location === location);
    const overdueMembers = members.filter(m => m.paymentStatus === 'overdue');
    
    if (overdueMembers.length > 0) {
      alerts.push({
        id: 'missed-payments',
        type: 'missed-payment',
        title: `${overdueMembers.length} Missed Payments`,
        description: `${overdueMembers.length} member${overdueMembers.length > 1 ? 's have' : ' has'} overdue payments`,
        icon: <AlertCircle className="text-red-600" size={20} />,
        action: 'Process All',
        onAction: () => {
          alert(`Processing ${overdueMembers.length} overdue payments...`);
          setProcessedAlerts(prev => new Set(prev).add('missed-payments'));
        },
      });
    }

    const classes = getAllClasses().filter(c => c.location === location);
    const bookings = getAllBookings();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayClasses = classes.filter(c => c.dayOfWeek === today);
    const overfilled = todayClasses.filter(cls => {
      const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled').length;
      return classBookings > cls.capacity;
    });

    if (overfilled.length > 0) {
      alerts.push({
        id: 'overfilled-classes',
        type: 'overfilled-class',
        title: `${overfilled.length} Overfilled Class${overfilled.length > 1 ? 'es' : ''} Today`,
        description: `${overfilled.map(c => c.name).join(', ')} ${overfilled.length > 1 ? 'are' : 'is'} over capacity`,
        icon: <Calendar className="text-orange-600" size={20} />,
        action: 'View Schedule',
        onAction: () => {
          alert('Navigate to Schedule to manage capacity');
          setProcessedAlerts(prev => new Set(prev).add('overfilled-classes'));
        },
      });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const allPaymentMethods = getAllPaymentMethods();
    const expiringCards = allPaymentMethods.filter(pm => {
      const isThisMonth = pm.expMonth === currentMonth && pm.expYear === currentYear;
      const isNextMonth = pm.expMonth === nextMonth && pm.expYear === nextMonthYear;
      return isThisMonth || isNextMonth;
    });

    if (expiringCards.length > 0) {
      alerts.push({
        id: 'expiring-cards',
        type: 'expiring-card',
        title: `${expiringCards.length} Expiring Card${expiringCards.length > 1 ? 's' : ''}`,
        description: `${expiringCards.length} payment method${expiringCards.length > 1 ? 's' : ''} expiring soon`,
        icon: <CreditCard className="text-yellow-600" size={20} />,
        action: 'Send Reminders',
        onAction: () => {
          alert(`Sending card update reminders to ${expiringCards.length} member${expiringCards.length > 1 ? 's' : ''}...`);
          setProcessedAlerts(prev => new Set(prev).add('expiring-cards'));
        },
      });
    }

    const leads = getAllLeads().filter(l => l.location === location);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const uncontactedLeads = leads.filter(lead => {
      const createdDate = new Date(lead.createdDate);
      return createdDate >= threeDaysAgo && lead.status === 'new-lead';
    });

    if (uncontactedLeads.length > 0) {
      alerts.push({
        id: 'uncontacted-leads',
        type: 'uncontacted-lead',
        title: `${uncontactedLeads.length} Uncontacted Lead${uncontactedLeads.length > 1 ? 's' : ''}`,
        description: `${uncontactedLeads.length} new lead${uncontactedLeads.length > 1 ? 's' : ''} from last 3 days not yet contacted`,
        icon: <UserPlus className="text-blue-600" size={20} />,
        action: 'Send Welcome',
        onAction: () => {
          alert(`Sending welcome messages to ${uncontactedLeads.length} lead${uncontactedLeads.length > 1 ? 's' : ''}...`);
          setProcessedAlerts(prev => new Set(prev).add('uncontacted-leads'));
        },
      });
    }

    return alerts.filter(alert => !processedAlerts.has(alert.id));
  };

  const alerts = generateAlerts();

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Operations Feed</h2>
        </div>
        <p className="text-gray-600">All clear! No urgent actions needed right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="text-red-600" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Operations Feed</h2>
        <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
          {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">{alert.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                <p className="text-sm text-gray-600">{alert.description}</p>
              </div>
            </div>
            <button
              onClick={alert.onAction}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium whitespace-nowrap"
            >
              {alert.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
