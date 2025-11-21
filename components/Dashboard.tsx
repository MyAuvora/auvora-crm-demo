'use client';

import { useApp } from '@/lib/context';
import { members, classPackClients, leads, classes } from '@/data/seedData';
import { Users, TrendingUp, Calendar, UserPlus, Lightbulb } from 'lucide-react';

export default function Dashboard() {
  const { location } = useApp();
  
  const locationMembers = members.filter(m => m.location === location);
  const locationPackClients = classPackClients.filter(c => c.location === location);
  const locationLeads = leads.filter(l => l.location === location);
  const locationClasses = classes.filter(c => c.location === location);
  
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
  
  const totalCheckIns = todayClasses.reduce((sum, c) => sum + c.bookedCount, 0);
  
  const totalActiveMembers = location === 'athletic-club' 
    ? locationMembers.length + locationPackClients.length
    : locationPackClients.length;

  const insights = [
    "Evening classes are your busiest this week.",
    "Most members live in zip codes 33602 and 33606.",
    "Weekend classes have the highest attendance rates.",
    "Instagram is your top lead source this month."
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Check-ins Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCheckIns}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Users className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Classes Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{todayClasses.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">New Leads Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{todayLeads.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserPlus className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalActiveMembers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

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
