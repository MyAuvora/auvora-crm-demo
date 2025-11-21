'use client';

import { useApp } from '@/lib/context';
import { members, classPackClients, leads } from '@/data/seedData';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const { location } = useApp();

  const locationMembers = members.filter(m => m.location === location);
  const locationPackClients = classPackClients.filter(c => c.location === location);
  const locationLeads = leads.filter(l => l.location === location);

  const membershipData = location === 'athletic-club' ? [
    { name: '1x/week', count: locationMembers.filter(m => m.membershipType === '1x-week').length },
    { name: '2x/week', count: locationMembers.filter(m => m.membershipType === '2x-week').length },
    { name: 'Unlimited', count: locationMembers.filter(m => m.membershipType === 'unlimited').length },
  ] : [];

  const packData = [
    { name: '5-pack', count: locationPackClients.filter(c => c.packType === '5-pack').length },
    { name: '10-pack', count: locationPackClients.filter(c => c.packType === '10-pack').length },
    { name: '20-pack', count: locationPackClients.filter(c => c.packType === '20-pack').length },
  ];

  const leadSourceData = [
    { name: 'Website', count: locationLeads.filter(l => l.source === 'website').length },
    { name: 'Instagram', count: locationLeads.filter(l => l.source === 'instagram').length },
    { name: 'Facebook', count: locationLeads.filter(l => l.source === 'facebook').length },
    { name: 'Walk-in', count: locationLeads.filter(l => l.source === 'walk-in').length },
  ];

  const zipCodeCounts: { [key: string]: number } = {};
  [...locationMembers, ...locationPackClients].forEach(m => {
    zipCodeCounts[m.zipCode] = (zipCodeCounts[m.zipCode] || 0) + 1;
  });

  const zipCodeData = Object.entries(zipCodeCounts)
    .map(([zip, count]) => ({ name: zip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7'];

  const thisMonth = new Date().toISOString().slice(0, 7);
  const cancellations = locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View business insights and metrics</p>
      </div>

      {location === 'athletic-club' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={membershipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#DC2626" name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Class Pack Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={packData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#EA580C" name="Clients" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadSourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {leadSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leads & Cancellations</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{locationLeads.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cancellations (Last 30 Days)</p>
              <p className="text-3xl font-bold text-red-600">{cancellations}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">New Leads (This Month)</p>
              <p className="text-3xl font-bold text-green-600">
                {locationLeads.filter(l => l.createdDate.startsWith(thisMonth)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Zip Codes</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={zipCodeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#16A34A" name="Members" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
