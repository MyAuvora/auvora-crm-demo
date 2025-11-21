'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { members, classPackClients, leads } from '@/data/seedData';
import { Search, Filter, X } from 'lucide-react';

type Tab = 'leads' | 'members';

export default function LeadsMembers() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [zipFilter, setZipFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const locationLeads = leads.filter(l => l.location === location);
  const locationMembers = members.filter(m => m.location === location);
  const locationPackClients = classPackClients.filter(c => c.location === location);

  const filteredLeads = locationLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const allMembers = location === 'athletic-club' 
    ? [...locationMembers.map(m => ({ ...m, type: 'membership' })), ...locationPackClients.map(c => ({ ...c, type: 'pack' }))]
    : locationPackClients.map(c => ({ ...c, type: 'pack' }));

  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMembership = membershipFilter === 'all' || 
                             (member.type === 'membership' && (member as any).membershipType === membershipFilter) ||
                             (member.type === 'pack' && membershipFilter === 'pack');
    const matchesZip = zipFilter === 'all' || member.zipCode === zipFilter;
    return matchesSearch && matchesMembership && matchesZip;
  });

  const uniqueZips = Array.from(new Set(allMembers.map(m => m.zipCode))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads & Members</h1>
        <p className="text-gray-600 mt-1">Manage your leads and member database</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('leads'); setSelectedItem(null); }}
              className={`px-6 py-3 font-medium ${
                activeTab === 'leads'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Leads ({locationLeads.length})
            </button>
            <button
              onClick={() => { setActiveTab('members'); setSelectedItem(null); }}
              className={`px-6 py-3 font-medium ${
                activeTab === 'members'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Members ({allMembers.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            
            {activeTab === 'leads' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="trial-no-join">Trial - No Join</option>
                  <option value="new-lead">New Lead</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Sources</option>
                  <option value="website">Website</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="walk-in">Walk-in</option>
                </select>
              </>
            )}

            {activeTab === 'members' && (
              <>
                <select
                  value={membershipFilter}
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Types</option>
                  {location === 'athletic-club' && (
                    <>
                      <option value="1x-week">1x/week</option>
                      <option value="2x-week">2x/week</option>
                      <option value="unlimited">Unlimited</option>
                    </>
                  )}
                  <option value="pack">Class Pack</option>
                </select>
                <select
                  value={zipFilter}
                  onChange={(e) => setZipFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Zip Codes</option>
                  {uniqueZips.map(zip => (
                    <option key={zip} value={zip}>{zip}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {!selectedItem ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    {activeTab === 'leads' ? (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Source</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Zip Code</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeTab === 'leads' && filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedItem(lead)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{lead.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          lead.status === 'trial-no-join' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {lead.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{lead.source}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.createdDate}</td>
                    </tr>
                  ))}
                  {activeTab === 'members' && filteredMembers.map(member => (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedItem(member)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {member.type === 'membership' 
                          ? (member as any).membershipType 
                          : `${(member as any).packType} (${(member as any).remainingClasses}/${(member as any).totalClasses} left)`
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.zipCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
              >
                <X size={20} />
                <span>Back to list</span>
              </button>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedItem.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900 font-medium">{selectedItem.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{selectedItem.phone}</p>
                  </div>
                  {activeTab === 'leads' ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-gray-900 font-medium capitalize">{selectedItem.status.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="text-gray-900 font-medium capitalize">{selectedItem.source}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created Date</p>
                        <p className="text-gray-900 font-medium">{selectedItem.createdDate}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-gray-900 font-medium">{selectedItem.notes}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="text-gray-900 font-medium">
                          {selectedItem.type === 'membership' 
                            ? (selectedItem as any).membershipType 
                            : `${(selectedItem as any).packType}`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Zip Code</p>
                        <p className="text-gray-900 font-medium">{selectedItem.zipCode}</p>
                      </div>
                      {selectedItem.type === 'membership' ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Join Date</p>
                            <p className="text-gray-900 font-medium">{(selectedItem as any).joinDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Last Visit</p>
                            <p className="text-gray-900 font-medium">{(selectedItem as any).lastVisit}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Visits (Last 30 Days)</p>
                            <p className="text-gray-900 font-medium">{(selectedItem as any).visitsLast30Days}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Classes Remaining</p>
                            <p className="text-gray-900 font-medium">{(selectedItem as any).remainingClasses} / {(selectedItem as any).totalClasses}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Purchase Date</p>
                            <p className="text-gray-900 font-medium">{(selectedItem as any).purchaseDate}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
