'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { getAllTransactions, getAllMembers, getAllLeads, getAllBookings, getAllClasses, getAllStaff, getCommissionReport } from '@/lib/dataStore';
import { DollarSign, Users, UserPlus, Calendar, AlertCircle, TrendingUp, CreditCard } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import BookingModal from './BookingModal';
import { Class, Member } from '@/lib/types';
import { useToast } from '@/lib/useToast';

export default function FrontDeskDashboard() {
  const { location, navigateToMember, navigateToLead, userRole } = useApp();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { success: showSuccessToast } = useToast();

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const transactions = getAllTransactions();
  const members = getAllMembers();
  const leads = getAllLeads();
  const bookings = getAllBookings();
  const classes = getAllClasses();
  const staff = getAllStaff();
  
  const currentStaff = staff.find(s => s.role === userRole && s.location === location);

  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return txDate >= todayStart && txDate <= todayEnd && t.location === location;
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  const revenueByCategory = useMemo(() => {
    const categories: Record<string, number> = {
      'Memberships': 0,
      'Class Packs': 0,
      'Drop-In': 0,
      'Retail': 0,
      'Other': 0
    };

    todayTransactions.forEach(t => {
      t.items.forEach(item => {
        const productName = item.productName.toLowerCase();
        if (productName.includes('membership') || productName.includes('monthly')) {
          categories['Memberships'] += item.price * item.quantity;
        } else if (productName.includes('pack') || productName.includes('class pack')) {
          categories['Class Packs'] += item.price * item.quantity;
        } else if (productName.includes('drop-in') || productName.includes('single class')) {
          categories['Drop-In'] += item.price * item.quantity;
        } else if (productName.includes('retail') || productName.includes('merchandise') || productName.includes('apparel')) {
          categories['Retail'] += item.price * item.quantity;
        } else {
          categories['Other'] += item.price * item.quantity;
        }
      });
    });

    return categories;
  }, [todayTransactions]);

  const myRevenue = useMemo(() => {
    if (!currentStaff) return 0;
    return todayTransactions
      .filter(t => t.sellerId === currentStaff.id)
      .reduce((sum, t) => sum + t.total, 0);
  }, [todayTransactions, currentStaff]);

  const todayLeads = leads.filter(l => {
    const leadDate = new Date(l.createdDate);
    return leadDate >= todayStart && leadDate <= todayEnd && l.location === location;
  });

  const todayCheckIns = bookings.filter(b => {
    if (!b.checkedInAt) return false;
    const checkInDate = new Date(b.checkedInAt);
    return checkInDate >= todayStart && checkInDate <= todayEnd;
  }).length;

  const missedPayments = members.filter(m => 
    m.location === location && 
    m.status === 'active' && 
    m.paymentStatus === 'overdue'
  );

  const todayClasses = classes.filter(c => c.location === location);

  const todayCheckInsList = bookings.filter(b => {
    if (!b.checkedInAt) return false;
    const checkInDate = new Date(b.checkedInAt);
    return checkInDate >= todayStart && checkInDate <= todayEnd;
  });

  const handleProcessPayment = (memberId: string) => {
    setProcessingPayment(memberId);
    
    setTimeout(() => {
      const member = members.find(m => m.id === memberId);
      if (member) {
        const nextPayment = new Date();
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        
        const storedData = localStorage.getItem('auvora-crm-data');
        if (storedData) {
          const data = JSON.parse(storedData);
          const memberIndex = data.members.findIndex((m: Member) => m.id === memberId);
          if (memberIndex !== -1) {
            data.members[memberIndex].paymentStatus = 'current';
            data.members[memberIndex].lastPaymentDate = new Date().toISOString().split('T')[0];
            data.members[memberIndex].nextPaymentDue = nextPayment.toISOString().split('T')[0];
            localStorage.setItem('auvora-crm-data', JSON.stringify(data));
          }
        }
        
        showSuccessToast(`Payment processed for ${member.name}`);
        setRefreshKey(prev => prev + 1);
        window.location.reload();
      }
      setProcessingPayment(null);
    }, 1500);
  };

  const getMetricDetails = (metric: string): {
    title: string;
    items: Array<{
      id: string;
      name: string;
      detail: string;
      onClick: () => void;
      showProcessButton?: boolean;
    }>;
    breakdown?: Record<string, number>;
  } | null => {
    switch (metric) {
      case 'new-leads':
        return {
          title: "Today's New Leads",
          items: todayLeads.map(l => ({
            id: l.id,
            name: l.name,
            detail: `${l.source} • ${l.email}`,
            onClick: () => {
              setSelectedMetric(null);
              navigateToLead(l.id);
            }
          }))
        };
      case 'check-ins':
        return {
          title: "Today's Check-Ins",
          items: todayCheckInsList.map(b => {
            const cls = classes.find(c => c.id === b.classId);
            return {
              id: b.id,
              name: b.memberName,
              detail: `${cls?.name || 'Unknown Class'} • ${b.checkedInAt ? format(new Date(b.checkedInAt), 'h:mm a') : ''}`,
              onClick: () => {
                setSelectedMetric(null);
                const member = members.find(m => m.id === b.memberId);
                if (member) navigateToMember(member.id);
              }
            };
          })
        };
      case 'missed-payments':
        return {
          title: 'Missed Payments - Process Payments',
          items: missedPayments.map(m => {
            const amount = m.membershipType.includes('unlimited') ? '199' : 
                          m.membershipType.includes('2x') ? '149' : '99';
            return {
              id: m.id,
              name: m.name,
              detail: `Due: ${m.nextPaymentDue ? format(new Date(m.nextPaymentDue), 'MMM d') : 'Unknown'} • Amount: $${amount}`,
              onClick: () => {},
              showProcessButton: true
            };
          })
        };
      case 'todays-revenue':
        return {
          title: "Today's Revenue - All Sales",
          breakdown: revenueByCategory,
          items: todayTransactions.map(t => ({
            id: t.id,
            name: t.memberName || 'Guest',
            detail: `${format(new Date(t.timestamp), 'h:mm a')} • ${t.items.map(i => `${i.productName} ($${i.price})`).join(', ')} • Total: $${t.total.toFixed(2)}`,
            onClick: () => {}
          }))
        };
      case 'my-sales':
        return {
          title: "My Sales Today",
          items: todayTransactions
            .filter(t => t.sellerId === currentStaff?.id)
            .map(t => ({
              id: t.id,
              name: t.memberName || 'Guest',
              detail: `${format(new Date(t.timestamp), 'h:mm a')} • ${t.items.map(i => `${i.productName} ($${i.price})`).join(', ')} • Total: $${t.total.toFixed(2)}`,
              onClick: () => {}
            }))
        };
      default:
        return null;
    }
  };

  const details = selectedMetric ? getMetricDetails(selectedMetric) : null;

  return (
    <div className="space-y-6">
      {/* Booking Modal */}
      {selectedClass && (
        <BookingModal
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setSelectedClass(null);
          }}
        />
      )}

      {/* Metric Detail Modal */}
      {details && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{details.title}</h2>
              <button
                onClick={() => setSelectedMetric(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Breakdown Section for Revenue */}
              {details.breakdown && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown:</p>
                  <div className="space-y-2">
                    {Object.entries(details.breakdown).map(([category, amount]) => (
                      amount > 0 && (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-semibold text-gray-900">${amount.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {details.items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items found</p>
              ) : (
                <div className="space-y-2">
                  {details.items.map(item => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={item.onClick}
                          className="flex-1 text-left hover:bg-gray-100 rounded p-2 -m-2 transition-colors"
                        >
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                        </button>
                        {item.showProcessButton && (
                          <button
                            onClick={() => handleProcessPayment(item.id)}
                            disabled={processingPayment === item.id}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <CreditCard size={16} />
                            {processingPayment === item.id ? 'Processing...' : 'Process Payment'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Front Desk Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s today&apos;s overview.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Total Revenue */}
        <button
          onClick={() => setSelectedMetric('todays-revenue')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today&apos;s Revenue</h2>
              <p className="text-sm text-gray-600">All sales today</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${todayRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">
            {todayTransactions.length} transactions • Click to view details
          </p>
        </button>

        {/* My Sales Today */}
        {currentStaff && (
          <button
            onClick={() => setSelectedMetric('my-sales')}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Sales Today</h2>
                <p className="text-sm text-gray-600">{currentStaff.name}</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">${myRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-2">
              {todayTransactions.filter(t => t.sellerId === currentStaff.id).length} transactions • Click to view details
            </p>
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setSelectedMetric('new-leads')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="text-blue-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{todayLeads.length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">New Leads Today</p>
        </button>

        <button
          onClick={() => setSelectedMetric('check-ins')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-green-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{todayCheckIns}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Check-Ins Today</p>
        </button>

        <button
          onClick={() => setSelectedMetric('missed-payments')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="text-red-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{missedPayments.length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Missed Payments</p>
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Class Schedule</h2>
        {todayClasses.length === 0 ? (
          <p className="text-gray-500">No classes scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayClasses.map(cls => {
              const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
              const coach = staff.find(s => s.id === cls.coachId);
              
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-red-300 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{cls.name}</p>
                      <p className="text-sm text-gray-600">{cls.time} • {cls.duration} min • {coach?.name || 'TBD'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">
                        {classBookings.length}/{cls.capacity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {classBookings.filter(b => b.status === 'checked-in').length} checked in
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* My Commission Report */}
      {currentStaff && (() => {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const monthReport = getCommissionReport(currentStaff.id, monthStart, monthEnd);
        
        if (!monthReport) return null;
        
        return (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Commission Report - This Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Sales:</span>
                    <span className="font-bold text-gray-900">${monthReport.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-bold text-gray-900">{monthReport.transactionCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="font-bold text-gray-900">{(monthReport.commissionRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">Total Commission:</span>
                    <span className="font-bold text-green-600 text-xl">${monthReport.commissionAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Sales Breakdown:</p>
                <div className="space-y-2">
                  {monthReport.categoryBreakdown.memberships > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Memberships</span>
                      <span className="font-semibold text-gray-900">${monthReport.categoryBreakdown.memberships.toFixed(2)}</span>
                    </div>
                  )}
                  {monthReport.categoryBreakdown.classPacks > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Class Packs</span>
                      <span className="font-semibold text-gray-900">${monthReport.categoryBreakdown.classPacks.toFixed(2)}</span>
                    </div>
                  )}
                  {monthReport.categoryBreakdown.dropIn > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Drop-In</span>
                      <span className="font-semibold text-gray-900">${monthReport.categoryBreakdown.dropIn.toFixed(2)}</span>
                    </div>
                  )}
                  {monthReport.categoryBreakdown.retail > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Retail</span>
                      <span className="font-semibold text-gray-900">${monthReport.categoryBreakdown.retail.toFixed(2)}</span>
                    </div>
                  )}
                  {monthReport.categoryBreakdown.other > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Other</span>
                      <span className="font-semibold text-gray-900">${monthReport.categoryBreakdown.other.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
