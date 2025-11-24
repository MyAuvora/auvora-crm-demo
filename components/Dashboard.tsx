'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllLeads, getAllClasses, getAllBookings, getAllTransactions, getAllStaff, getAllWaitlist, getAllProducts } from '@/lib/dataStore';
import { Users, TrendingUp, UserPlus, Lightbulb, DollarSign, X } from 'lucide-react';
import { Class } from '@/lib/types';
import { Transaction } from '@/lib/dataStore';

export default function Dashboard() {
  const { location } = useApp();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
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
  
  const allTransactions = getAllTransactions().filter(t => t.location === location);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear().toString();
  
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
  
  const getMetricDetails = (metric: string) => {
    switch(metric) {
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
          items: locationMembers.map(m => `${m.name} - ${m.membershipType} (${m.status})`)
        };
      case 'mtd':
        return {
          title: "Month-to-Date Revenue Breakdown",
          items: generateRevenueBreakdown(monthTransactions),
          isRevenue: true
        };
      case 'ytd':
        return {
          title: "Year-to-Date Revenue Breakdown",
          items: generateRevenueBreakdown(yearTransactions),
          isRevenue: true
        };
      default:
        return { title: '', items: [] };
    }
  };
  
  const generateRevenueBreakdown = (transactions: Transaction[]) => {
    const allProducts = getAllProducts();
    const byDate: { [date: string]: { membership: number; classPack: number; retail: number; total: number } } = {};
    
    transactions.forEach(t => {
      const date = t.timestamp.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { membership: 0, classPack: 0, retail: 0, total: 0 };
      }
      
      t.items.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        const category = product?.category || 
          (item.productId.includes('membership') ? 'membership' : 
           item.productId.includes('pack') ? 'class-pack' : 'retail');
        
        const amount = item.price * item.quantity;
        
        if (category === 'membership') {
          byDate[date].membership += amount;
        } else if (category === 'class-pack') {
          byDate[date].classPack += amount;
        } else {
          byDate[date].retail += amount;
        }
        byDate[date].total += amount;
      });
    });
    
    const sortedDates = Object.keys(byDate).sort();
    let runningTotal = 0;
    
    return sortedDates.map(date => {
      const data = byDate[date];
      runningTotal += data.total;
      return {
        date,
        membership: data.membership,
        classPack: data.classPack,
        retail: data.retail,
        dayTotal: data.total,
        runningTotal
      };
    });
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
                getMetricDetails(selectedMetric).isRevenue ? (
                  <div className="space-y-4">
                    {(getMetricDetails(selectedMetric).items as Array<{date: string; membership: number; classPack: number; retail: number; dayTotal: number; runningTotal: number}>).map((item, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-900">{item.date}</h4>
                          <span className="text-lg font-bold text-gray-900">${item.dayTotal.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {item.membership > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Memberships:</span>
                              <span className="font-medium">${item.membership.toFixed(2)}</span>
                            </div>
                          )}
                          {item.classPack > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Class Packs:</span>
                              <span className="font-medium">${item.classPack.toFixed(2)}</span>
                            </div>
                          )}
                          {item.retail > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Retail:</span>
                              <span className="font-medium">${item.retail.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-600 text-xs pt-1 border-t border-gray-300 mt-2">
                            <span>Running Total:</span>
                            <span className="font-bold">${item.runningTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {getMetricDetails(selectedMetric).items.map((item, i) => {
                      const isClickable = getMetricDetails(selectedMetric).clickable && typeof item === 'object' && 'id' in item;
                      if (isClickable) {
                        const clickableItem = item as { id: string; text: string };
                        return (
                          <li key={i}>
                            <button
                              onClick={() => {
                                console.log('Navigate to lead:', clickableItem.id);
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
                            <li key={i} className="p-3 bg-green-50 rounded border border-green-200 text-gray-900">
                              {booking.memberName}
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
                            <li key={i} className="p-3 bg-blue-50 rounded border border-blue-200 text-gray-900">
                              {booking.memberName}
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
                            <li key={i} className="p-3 bg-yellow-50 rounded border border-yellow-200 text-gray-900">
                              {entry.memberName}
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
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">New Leads</span>
              <span className="text-2xl font-bold text-gray-900">{monthLeads.length}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">New Joins</span>
              <span className="text-2xl font-bold text-green-600">{newJoins}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Cancellations</span>
              <span className="text-2xl font-bold text-red-600">{cancellations}</span>
            </div>
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
    </div>
  );
}
