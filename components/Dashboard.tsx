'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllLeads, getAllClasses, getAllBookings, getAllTransactions, getAllStaff, getAllWaitlist, getAllProducts, getAllClassPackClients, getAllRefunds } from '@/lib/dataStore';
import { Users, TrendingUp, UserPlus, Lightbulb, DollarSign, X, AlertCircle, CreditCard, Zap, Target, MessageSquare, Package } from 'lucide-react';
import { Class } from '@/lib/types';
import { Transaction } from '@/lib/dataStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Dashboard() {
  const { location, navigateToMember, navigateToLead } = useApp();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState<Record<string, 'processing' | 'complete' | 'incomplete'>>({});
  
  const locationMembers = getAllMembers().filter(m => m.location === location);
  const locationLeads = getAllLeads().filter(l => l.location === location);
  const locationClasses = getAllClasses().filter(c => c.location === location);
  const allBookings = getAllBookings();
  const allWaitlist = getAllWaitlist();
  const allStaff = getAllStaff();
  
  const today = new Date().toISOString().split('T')[0];
  const todayLeads = locationLeads.filter(l => l.createdDate === today);
  
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthLeads = locationLeads.filter(l => l.createdDate.startsWith(thisMonth));
  const newJoins = locationMembers.filter(m => m.joinDate.startsWith(thisMonth)).length;
  const cancellations = locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth)).length;
  
  const todayClasses = locationClasses.filter(c => {
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    return c.dayOfWeek === dayOfWeek;
  });
  
  const totalCheckIns = todayClasses.reduce((sum, c) => {
    const classBookings = allBookings.filter(b => b.classId === c.id && b.status === 'checked-in');
    return sum + classBookings.length;
  }, 0);
  
  const totalActiveMembers = locationMembers.length;
  
  const missedPayments = locationMembers.filter(m => m.paymentStatus === 'overdue');
  
  const allTransactions = getAllTransactions().filter(t => t.location === location);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear().toString();

  const locationPackClients = getAllClassPackClients().filter(c => c.location === location);
  const lowPackClients = locationPackClients.filter(c => c.remainingClasses <= 2);
  
  const atRiskMembers = locationMembers.filter(m => {
    const lastVisit = m.lastVisit ? new Date(m.lastVisit) : null;
    if (!lastVisit) return false;
    const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceVisit >= 14 && m.status === 'active';
  });

  const allRefunds = getAllRefunds().filter(ref => ref.location === location);
  const thisMonthRefunds = allRefunds.filter(ref => ref.refundedAt.startsWith(currentMonth));
  const refundAmount = thisMonthRefunds.reduce((sum, ref) => sum + ref.amount, 0);
  
  const monthTransactions = allTransactions.filter(t => t.timestamp.startsWith(currentMonth));
  const yearTransactions = allTransactions.filter(t => t.timestamp.startsWith(currentYear));
  
  const monthToDateRevenue = monthTransactions.reduce((sum, t) => sum + t.total, 0);
  const yearToDateRevenue = yearTransactions.reduce((sum, t) => sum + t.total, 0);

  const insights = [
    "Evening classes are your busiest this week.",
    "Most members live in zip codes 33602 and 33606.",
    "Weekend classes have the highest attendance rates.",
    "Instagram is your top lead source this month."
  ];
  
  const handleProcessPayment = (memberId: string) => {
    setPaymentProcessing(prev => ({ ...prev, [memberId]: 'processing' }));
    
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setPaymentProcessing(prev => ({ 
        ...prev, 
        [memberId]: success ? 'complete' : 'incomplete' 
      }));
    }, 1500);
  };
  
  const getMetricDetails = (metric: string) => {
    switch(metric) {
      case 'missed-payments':
        return {
          title: "Missed Payments",
          items: missedPayments.map(m => ({ 
            id: m.id, 
            text: `${m.name} - ${m.membershipType} (Due: ${m.nextPaymentDue})`,
            hasActions: true
          })),
          clickable: true,
          isMember: true,
          hasPaymentActions: true
        };
      case 'checkins':
        const checkedInBookings = allBookings.filter(b => 
          b.status === 'checked-in' && 
          todayClasses.some(c => c.id === b.classId)
        );
        return {
          title: "Today's Check-ins",
          items: checkedInBookings.map(b => {
            const cls = todayClasses.find(c => c.id === b.classId);
            return `${b.memberName} - ${cls?.name || 'Unknown Class'}`;
          })
        };
      case 'classes':
        return {
          title: "Today's Classes",
          items: todayClasses.map(c => `${c.name} at ${c.time} (${c.capacity} capacity)`)
        };
      case 'leads':
        return {
          title: "Today's New Leads",
          items: todayLeads.map(l => ({ id: l.id, text: `${l.name} - ${l.source}` })),
          clickable: true
        };
      case 'members':
        return {
          title: "Active Members (Membership Holders Only)",
          items: locationMembers.map(m => ({ id: m.id, text: `${m.name} - ${m.membershipType} (${m.status})` })),
          clickable: true,
          isMember: true
        };
      case 'mtd':
        return {
          title: "Month-to-Date Revenue by Category",
          items: generateRevenueByCategory(monthTransactions),
          isChart: true
        };
      case 'ytd':
        return {
          title: "Year-to-Date Revenue by Category",
          items: generateRevenueByCategory(yearTransactions),
          isChart: true
        };
      case 'month-leads':
        return {
          title: "New Leads This Month",
          items: monthLeads.map(l => ({ id: l.id, text: `${l.name} - ${l.source} (${l.status})` })),
          clickable: true,
          isLead: true
        };
      case 'new-joins':
        return {
          title: "New Joins This Month",
          items: locationMembers.filter(m => m.joinDate.startsWith(thisMonth)).map(m => ({ id: m.id, text: `${m.name} - ${m.membershipType} (Joined: ${m.joinDate})` })),
          clickable: true,
          isMember: true
        };
      case 'cancellations':
        return {
          title: "Cancellations This Month",
          items: locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth)).map(l => ({ id: l.id, text: `${l.name} - ${l.source} (Cancelled)` })),
          clickable: true,
          isLead: true
        };
      default:
        return { title: '', items: [] };
    }
  };
  
  const generateRevenueByCategory = (transactions: Transaction[]) => {
    const allProducts = getAllProducts();
    const categories: { [key: string]: number } = {
      'Memberships': 0,
      'Class Packs': 0,
      'Drop-In': 0,
      'Retail': 0
    };
    
    transactions.forEach(t => {
      t.items.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        const category = product?.category || 
          (item.productId.includes('membership') ? 'membership' : 
           item.productId.includes('pack') ? 'class-pack' :
           item.productId.includes('drop-in') ? 'drop-in' : 'retail');
        
        const amount = item.price * item.quantity;
        
        if (category === 'membership') {
          categories['Memberships'] += amount;
        } else if (category === 'class-pack') {
          categories['Class Packs'] += amount;
        } else if (category === 'drop-in') {
          categories['Drop-In'] += amount;
        } else {
          categories['Retail'] += amount;
        }
      });
    });
    
    return [
      { name: 'Memberships', value: categories['Memberships'], color: '#AC1305' },
      { name: 'Class Packs', value: categories['Class Packs'], color: '#EAB308' },
      { name: 'Drop-In', value: categories['Drop-In'], color: '#3B82F6' },
      { name: 'Retail', value: categories['Retail'], color: '#10B981' }
    ].filter(item => item.value > 0);
  };
  
  const getCategoryPurchasers = (category: string, transactions: Transaction[]) => {
    const allProducts = getAllProducts();
    const purchasers: { [key: string]: { name: string; total: number; memberId?: string } } = {};
    
    transactions.forEach(t => {
      t.items.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        const itemCategory = product?.category || 
          (item.productId.includes('membership') ? 'membership' : 
           item.productId.includes('pack') ? 'class-pack' :
           item.productId.includes('drop-in') ? 'drop-in' : 'retail');
        
        let matches = false;
        if (category === 'Memberships' && itemCategory === 'membership') matches = true;
        if (category === 'Class Packs' && itemCategory === 'class-pack') matches = true;
        if (category === 'Drop-In' && itemCategory === 'drop-in') matches = true;
        if (category === 'Retail' && itemCategory === 'retail') matches = true;
        
        if (matches) {
          const key = t.memberName || 'Guest';
          if (!purchasers[key]) {
            purchasers[key] = { name: key, total: 0, memberId: t.memberId };
          }
          purchasers[key].total += item.price * item.quantity;
        }
      });
    });
    
    return Object.values(purchasers).sort((a, b) => b.total - a.total);
  };
  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={() => setSelectedMetric('checkins')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Check-ins Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCheckIns}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Users className="text-red-600" size={24} />
            </div>
          </div>
        </button>

        <button 
          onClick={() => setSelectedMetric('leads')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">New Leads Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{todayLeads.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserPlus className="text-green-600" size={24} />
            </div>
          </div>
        </button>

        <button 
          onClick={() => setSelectedMetric('members')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalActiveMembers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => setSelectedMetric('mtd')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Month-to-Date Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${monthToDateRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => setSelectedMetric('ytd')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Year-to-Date Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${yearToDateRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => setSelectedMetric('missed-payments')}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Missed Payments</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{missedPayments.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </button>
      </div>
      
      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{getMetricDetails(selectedMetric).title}</h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getMetricDetails(selectedMetric).items.length > 0 ? (
                getMetricDetails(selectedMetric).isChart ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getMetricDetails(selectedMetric).items as Array<{name: string; value: number; color: string}>}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          onClick={(data) => setSelectedCategory(data.name)}
                          style={{ cursor: 'pointer' }}
                        >
                          {(getMetricDetails(selectedMetric).items as Array<{name: string; value: number; color: string}>).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-sm text-gray-600 text-center mt-4">Click on a category to see purchasers</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {getMetricDetails(selectedMetric).items.map((item, i) => {
                      const isClickable = getMetricDetails(selectedMetric).clickable && typeof item === 'object' && 'id' in item;
                      const hasPaymentActions = getMetricDetails(selectedMetric).hasPaymentActions;
                      
                      if (isClickable) {
                        const clickableItem = item as { id: string; text: string; hasActions?: boolean };
                        const isMember = getMetricDetails(selectedMetric).isMember;
                        const isLead = getMetricDetails(selectedMetric).isLead;
                        const processingStatus = paymentProcessing[clickableItem.id];
                        
                        if (hasPaymentActions && clickableItem.hasActions) {
                          return (
                            <li key={i} className="p-3 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  onClick={() => {
                                    setSelectedMetric(null);
                                    navigateToMember(clickableItem.id);
                                  }}
                                  className="flex-1 text-left text-gray-900 hover:text-red-600 transition-colors font-medium"
                                >
                                  {clickableItem.text}
                                </button>
                                <button
                                  onClick={() => handleProcessPayment(clickableItem.id)}
                                  disabled={processingStatus === 'processing' || processingStatus === 'complete'}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 min-w-[120px] justify-center ${
                                    processingStatus === 'complete' 
                                      ? 'bg-green-600 text-white cursor-default' 
                                      : processingStatus === 'incomplete'
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : processingStatus === 'processing'
                                      ? 'bg-gray-400 text-white cursor-wait'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {processingStatus === 'processing' ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      Processing
                                    </>
                                  ) : processingStatus === 'complete' ? (
                                    <>
                                      <CreditCard size={16} />
                                      Complete
                                    </>
                                  ) : processingStatus === 'incomplete' ? (
                                    <>
                                      <AlertCircle size={16} />
                                      Incomplete
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard size={16} />
                                      Process
                                    </>
                                  )}
                                </button>
                              </div>
                            </li>
                          );
                        }
                        
                        return (
                          <li key={i}>
                            <button
                              onClick={() => {
                                setSelectedMetric(null);
                                if (isMember) {
                                  navigateToMember(clickableItem.id);
                                } else if (isLead) {
                                  navigateToLead(clickableItem.id);
                                }
                              }}
                              className="w-full text-left p-3 bg-gray-50 rounded border border-gray-200 text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              {clickableItem.text}
                            </button>
                          </li>
                        );
                      }
                      return (
                        <li key={i} className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-900">
                          {typeof item === 'string' ? item : (item as { text: string }).text}
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Classes</h2>
        {todayClasses.length > 0 ? (
          <div className="space-y-3">
            {todayClasses.map((cls) => {
              const classBookings = allBookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
              const checkedIn = classBookings.filter(b => b.status === 'checked-in').length;
              const booked = classBookings.length;
              const fillPercentage = cls.capacity > 0 ? (booked / cls.capacity) * 100 : 0;
              const coach = allStaff.find(s => s.id === cls.coachId);
              
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{cls.name} • {coach?.name || 'TBD'}</h3>
                      <p className="text-sm text-gray-600">{cls.time} • {cls.duration} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{booked} / {cls.capacity}</p>
                      <p className="text-xs text-gray-500">{checkedIn} checked in</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${fillPercentage >= 90 ? 'bg-red-600' : fillPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No classes scheduled for today</p>
        )}
      </div>
      
      {selectedCategory && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{selectedCategory} Purchasers</h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const transactions = selectedMetric === 'mtd' ? monthTransactions : yearTransactions;
                const purchasers = getCategoryPurchasers(selectedCategory, transactions);
                
                return (
                  <ul className="space-y-2">
                    {purchasers.map((purchaser, i) => (
                      <li key={i}>
                        {purchaser.memberId ? (
                          <button
                            onClick={() => {
                              setSelectedCategory(null);
                              setSelectedMetric(null);
                              navigateToMember(purchaser.memberId!);
                            }}
                            className="w-full text-left p-3 bg-gray-50 rounded border border-gray-200 text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{purchaser.name}</span>
                              <span className="text-gray-600">${purchaser.total.toFixed(2)}</span>
                            </div>
                          </button>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{purchaser.name}</span>
                              <span className="text-gray-600">${purchaser.total.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{selectedClass.name} - {selectedClass.time}</h3>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const classBookings = allBookings.filter(b => b.classId === selectedClass.id);
                const checkedInBookings = classBookings.filter(b => b.status === 'checked-in');
                const bookedNotCheckedIn = classBookings.filter(b => b.status === 'booked');
                const waitlistEntries = allWaitlist.filter(w => w.classId === selectedClass.id);
                
                return (
                  <div className="space-y-6">
                    {checkedInBookings.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Checked In ({checkedInBookings.length})</h4>
                        <ul className="space-y-2">
                          {checkedInBookings.map((booking, i) => (
                            <li key={i}>
                              <button
                                onClick={() => {
                                  setSelectedClass(null);
                                  navigateToMember(booking.memberId);
                                }}
                                className="w-full text-left p-3 bg-green-50 rounded border border-green-200 text-gray-900 hover:bg-green-100 transition-colors"
                              >
                                {booking.memberName}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {bookedNotCheckedIn.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Booked (Not Checked In) ({bookedNotCheckedIn.length})</h4>
                        <ul className="space-y-2">
                          {bookedNotCheckedIn.map((booking, i) => (
                            <li key={i}>
                              <button
                                onClick={() => {
                                  setSelectedClass(null);
                                  navigateToMember(booking.memberId);
                                }}
                                className="w-full text-left p-3 bg-blue-50 rounded border border-blue-200 text-gray-900 hover:bg-blue-100 transition-colors"
                              >
                                {booking.memberName}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {waitlistEntries.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Waitlist ({waitlistEntries.length})</h4>
                        <ul className="space-y-2">
                          {waitlistEntries.map((entry, i) => (
                            <li key={i}>
                              <button
                                onClick={() => {
                                  setSelectedClass(null);
                                  navigateToMember(entry.memberId);
                                }}
                                className="w-full text-left p-3 bg-yellow-50 rounded border border-yellow-200 text-gray-900 hover:bg-yellow-100 transition-colors"
                              >
                                {entry.memberName}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {checkedInBookings.length === 0 && bookedNotCheckedIn.length === 0 && waitlistEntries.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No bookings for this class yet</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">This Month</h2>
          <div className="space-y-4">
            <button
              onClick={() => setSelectedMetric('month-leads')}
              className="w-full flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors rounded px-2"
            >
              <span className="text-gray-600">New Leads</span>
              <span className="text-2xl font-bold text-gray-900">{monthLeads.length}</span>
            </button>
            <button
              onClick={() => setSelectedMetric('new-joins')}
              className="w-full flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors rounded px-2"
            >
              <span className="text-gray-600">New Joins</span>
              <span className="text-2xl font-bold text-green-600">{newJoins}</span>
            </button>
            <button
              onClick={() => setSelectedMetric('cancellations')}
              className="w-full flex justify-between items-center py-3 hover:bg-gray-50 transition-colors rounded px-2"
            >
              <span className="text-gray-600">Cancellations</span>
              <span className="text-2xl font-bold text-red-600">{cancellations}</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">AI Insights</h2>
          </div>
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-red-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Action Playbooks</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">Quick actions to improve your business metrics</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <CreditCard className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Recover Payments</h3>
                <p className="text-xs text-gray-600 mt-1">{missedPayments.length} overdue payments</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric('missedPayments')}
              className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Process All
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="text-orange-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Re-engage At-Risk</h3>
                <p className="text-xs text-gray-600 mt-1">{atRiskMembers.length} members inactive 14+ days</p>
              </div>
            </div>
            <button
              onClick={() => alert('Opening Messaging with at-risk segment...')}
              className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
            >
              Send Message
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Refill Class Packs</h3>
                <p className="text-xs text-gray-600 mt-1">{lowPackClients.length} clients with ≤2 classes left</p>
              </div>
            </div>
            <button
              onClick={() => alert('Opening POS with pack renewal offer...')}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Offer
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <MessageSquare className="text-purple-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Review Refunds</h3>
                <p className="text-xs text-gray-600 mt-1">${refundAmount.toFixed(0)} refunded this month</p>
              </div>
            </div>
            <button
              onClick={() => alert('Opening refund analysis...')}
              className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" size={20} />
            Predictive Insights
          </h3>
          <div className="space-y-2">
            {atRiskMembers.length > 10 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{atRiskMembers.length} members</span> haven&apos;t visited in 14+ days and may churn soon.
                  </p>
                  <button
                    onClick={() => alert('Opening re-engagement campaign...')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-1"
                  >
                    Launch re-engagement campaign →
                  </button>
                </div>
              </div>
            )}
            {lowPackClients.length > 5 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{lowPackClients.length} clients</span> are running low on class packs (≤2 remaining).
                  </p>
                  <button
                    onClick={() => alert('Creating renewal offers...')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    Create renewal offers →
                  </button>
                </div>
              </div>
            )}
            {missedPayments.length > 15 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{missedPayments.length} members</span> have overdue payments totaling ${(missedPayments.length * 150).toFixed(0)}.
                  </p>
                  <button
                    onClick={() => setSelectedMetric('missedPayments')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
                  >
                    Process all payments →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
