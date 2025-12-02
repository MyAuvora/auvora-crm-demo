'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { getAllLeads, getAllMembers, getAllClassPackClients, getAllDropInClients, updateLeadStatus, getLeadNotes, getLeadTasks, getAllBookings, getVisitsInLastNDays } from '@/lib/dataStore';
import { Search, X, Snowflake, XCircle, Plus, MessageSquare, MoreVertical, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Member, ClassPackClient, DropInClient, Lead } from '@/lib/types';
import FreezeModal from './FreezeModal';
import CancelModal from './CancelModal';
import AddNoteModal from './AddNoteModal';
import AddTaskModal from './AddTaskModal';
import SendTextModal from './SendTextModal';
import ProfileTabs from './ProfileTabs';
import { hasPermission } from '@/lib/permissions';
import PersonStatusBadge from './PersonStatusBadge';

type Tab = 'leads' | 'members' | 'class-packs';

export default function LeadsMembers() {
  const { location, deepLink, setDeepLink, userRole } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [packTypeFilter, setPackTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Lead | Member | ClassPackClient | DropInClient | null>(null);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showSendTextModal, setShowSendTextModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  
  useEffect(() => {
    if (deepLink) {
      const handleDeepLink = () => {
        if (deepLink.type === 'member') {
          const member = getAllMembers().find(m => m.id === deepLink.id);
          const packClient = getAllClassPackClients().find(c => c.id === deepLink.id);
          const dropInClient = getAllDropInClients().find(d => d.id === deepLink.id);
          
          if (member) {
            setActiveTab('members');
            setSelectedItem(member);
          } else if (packClient) {
            setActiveTab('class-packs');
            setSelectedItem(packClient);
          } else if (dropInClient) {
            setActiveTab('members');
            setSelectedItem(dropInClient);
          }
        } else if (deepLink.type === 'lead') {
          const lead = getAllLeads().find(l => l.id === deepLink.id);
          if (lead) {
            setActiveTab('leads');
            setSelectedItem(lead);
          }
        }
        setDeepLink(null);
      };
      
      setTimeout(handleDeepLink, 0);
    }
  }, [deepLink, setDeepLink]);

  const locationLeads = getAllLeads().filter(l => l.location === location);
  const locationMembers = getAllMembers().filter(m => m.location === location);
  const locationPackClients = getAllClassPackClients().filter(c => c.location === location);
  const locationDropInClients = getAllDropInClients().filter(c => c.location === location);

  const lastVisitById = useMemo(() => {
    const bookings = getAllBookings();
    const map = new Map<string, Date>();
    
    bookings.forEach(b => {
      if (b.status === 'checked-in' && b.checkedInAt) {
        const existingDate = map.get(b.memberId);
        const currentDate = new Date(b.checkedInAt);
        if (!existingDate || currentDate > existingDate) {
          map.set(b.memberId, currentDate);
        }
      }
    });
    
    return map;
  }, []);

  const memberEngagement = useMemo(() => {
    const map = new Map<string, { visits30Days: number; isPastDue: boolean; isAtRisk: boolean }>();
    
    [...locationMembers, ...locationPackClients, ...locationDropInClients].forEach(person => {
      const visits30Days = getVisitsInLastNDays(person.id, 30);
      const isPastDue = 'paymentStatus' in person && person.paymentStatus === 'overdue';
      const isAtRisk = visits30Days < 2 || isPastDue;
      
      map.set(person.id, { visits30Days, isPastDue, isAtRisk });
    });
    
    return map;
  }, [locationMembers, locationPackClients, locationDropInClients]);

  const filteredLeads = locationLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         statusFilter === 'new' && lead.status === 'new-lead' ||
                         statusFilter === 'active' && (lead.status === 'trial-booked' || lead.status === 'trial-showed') ||
                         lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const membersWithDropIn = [
    ...locationMembers.map(m => ({ ...m, type: 'membership' as const })),
    ...locationDropInClients.map(c => ({ ...c, type: 'drop-in' as const }))
  ];

  const filteredMembers = membersWithDropIn.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMembership = membershipFilter === 'all' || 
                             (member.type === 'membership' && 'membershipType' in member && member.membershipType === membershipFilter) ||
                             (member.type === 'drop-in' && membershipFilter === 'drop-in') ||
                             (membershipFilter === 'at-risk' && memberEngagement.get(member.id)?.isAtRisk) ||
                             (membershipFilter === 'past-due' && memberEngagement.get(member.id)?.isPastDue) ||
                             (membershipFilter === 'low-attendance' && (memberEngagement.get(member.id)?.visits30Days || 0) < 4);
    return matchesSearch && matchesMembership;
  });

  const classPacksWithType = locationPackClients.map(c => ({ ...c, type: 'pack' as const }));
  
  const filteredClassPacks = classPacksWithType.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pack.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPackType = packTypeFilter === 'all' || 
                           pack.packType === packTypeFilter ||
                           (packTypeFilter === 'low-remaining' && pack.remainingClasses <= 2) ||
                           (packTypeFilter === 'needs-refill' && pack.remainingClasses === 0);
    return matchesSearch && matchesPackType;
  });

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
              Members ({membersWithDropIn.length})
            </button>
            <button
              onClick={() => { setActiveTab('class-packs'); setSelectedItem(null); }}
              className={`px-6 py-3 font-medium ${
                activeTab === 'class-packs'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Class Packs ({locationPackClients.length})
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
                  <option value="new-lead">New Lead</option>
                  <option value="trial-booked">Trial Booked</option>
                  <option value="trial-showed">Trial Showed</option>
                  <option value="joined">Joined</option>
                  <option value="trial-no-join">Trial - No Join</option>
                  <option value="cancelled">Cancelled</option>
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
                  <option value="drop-in">Drop-In</option>
                  <option value="at-risk">⚠️ At Risk</option>
                  <option value="past-due">💳 Past Due</option>
                  <option value="low-attendance">📉 Low Attendance</option>
                </select>
                {selectedRows.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedRows.size} selected</span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <MoreVertical size={16} />
                      Bulk Actions
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'class-packs' && (
              <>
                <select
                  value={packTypeFilter}
                  onChange={(e) => setPackTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Pack Types</option>
                  <option value="5-pack">5-Pack</option>
                  <option value="10-pack">10-Pack</option>
                  <option value="20-pack">20-Pack</option>
                  <option value="low-remaining">⚠️ ≤2 Classes Left</option>
                  <option value="needs-refill">🔄 Needs Refill</option>
                </select>
                {selectedRows.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedRows.size} selected</span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <MoreVertical size={16} />
                      Bulk Actions
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {showBulkActions && selectedRows.size > 0 && (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Bulk Actions ({selectedRows.size} selected)</h3>
              <div className="flex flex-wrap gap-2">
                {hasPermission(userRole, 'bulk:message') && (
                  <button
                    onClick={() => {
                      alert(`Sending message to ${selectedRows.size} people`);
                      setShowBulkActions(false);
                      setSelectedRows(new Set());
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Send Message
                  </button>
                )}
                {hasPermission(userRole, 'bulk:edit') && (
                  <>
                    <button
                      onClick={() => {
                        alert(`Adding task for ${selectedRows.size} people`);
                        setShowBulkActions(false);
                        setSelectedRows(new Set());
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                    <button
                      onClick={() => {
                        alert(`Tagging ${selectedRows.size} people`);
                        setShowBulkActions(false);
                        setSelectedRows(new Set());
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Tag
                    </button>
                  </>
                )}
                {hasPermission(userRole, 'bulk:export') && (
                  <button
                    onClick={() => {
                      const csv = 'Name,Email,Phone\n' + Array.from(selectedRows).map(id => {
                        const person = [...locationMembers, ...locationPackClients, ...locationDropInClients, ...locationLeads].find(p => p.id === id);
                        return person ? `${person.name},${person.email},${person.phone}` : '';
                      }).filter(Boolean).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'export.csv';
                      a.click();
                      setShowBulkActions(false);
                      setSelectedRows(new Set());
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <X size={16} />
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowBulkActions(false);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!selectedItem ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedRows.size > 0 && selectedRows.size === (activeTab === 'leads' ? filteredLeads.length : activeTab === 'members' ? filteredMembers.length : filteredClassPacks.length)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = activeTab === 'leads' ? filteredLeads.map(l => l.id) : activeTab === 'members' ? filteredMembers.map(m => m.id) : filteredClassPacks.map(p => p.id);
                            setSelectedRows(new Set(allIds));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    {activeTab === 'leads' ? (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Source</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                      </>
                    ) : activeTab === 'members' ? (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Visit</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pack Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Classes Left</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Visit</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeTab === 'leads' && filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 group"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(lead.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedRows);
                            if (e.target.checked) {
                              newSelected.add(lead.id);
                            } else {
                              newSelected.delete(lead.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                        onClick={() => {
                          setSelectedItem(lead);
                          setShowProfileTabs(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <PersonStatusBadge personId={lead.id} />
                          {lead.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          lead.status === 'trial-no-join' ? 'bg-yellow-100 text-yellow-700' :
                          lead.status === 'joined' ? 'bg-green-100 text-green-700' :
                          lead.status === 'trial-showed' ? 'bg-blue-100 text-blue-700' :
                          lead.status === 'trial-booked' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {lead.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{lead.source}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.createdDate}</td>
                    </tr>
                  ))}
                  {activeTab === 'members' && filteredMembers.map(member => {
                    const lastVisit = lastVisitById.get(member.id);
                    const engagement = memberEngagement.get(member.id);
                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 group"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(member.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(member.id);
                              } else {
                                newSelected.delete(member.id);
                              }
                              setSelectedRows(newSelected);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                          onClick={() => {
                            setSelectedItem(member);
                            setShowProfileTabs(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <PersonStatusBadge personId={member.id} />
                            {member.name}
                            {engagement?.isAtRisk && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ At Risk</span>
                            )}
                            {engagement?.isPastDue && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Past Due</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {member.type === 'membership' 
                            ? ('membershipType' in member ? member.membershipType : '')
                            : 'Drop-In'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            'status' in member && member.status === 'active' ? 'bg-green-100 text-green-700' :
                            'status' in member && member.status === 'frozen' ? 'bg-blue-100 text-blue-700' :
                            'status' in member && member.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {'status' in member ? member.status : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lastVisit ? format(lastVisit, 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(member);
                                setShowSendTextModal(true);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Send Text"
                            >
                              <MessageSquare size={16} className="text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Book class feature coming soon');
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Book Class"
                            >
                              <Calendar size={16} className="text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Charge feature coming soon');
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Charge"
                            >
                              <CreditCard size={16} className="text-gray-600" />
                            </button>
                            {member.type === 'membership' && 'status' in member && member.status === 'active' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(member);
                                  setShowFreezeModal(true);
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded"
                                title="Freeze"
                              >
                                <Snowflake size={16} className="text-gray-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {activeTab === 'class-packs' && filteredClassPacks.map(pack => {
                    const lastVisit = lastVisitById.get(pack.id);
                    const progressPercent = (pack.remainingClasses / pack.totalClasses) * 100;
                    return (
                      <tr
                        key={pack.id}
                        className="hover:bg-gray-50 group"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(pack.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(pack.id);
                              } else {
                                newSelected.delete(pack.id);
                              }
                              setSelectedRows(newSelected);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                          onClick={() => {
                            setSelectedItem(pack);
                            setShowProfileTabs(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <PersonStatusBadge personId={pack.id} />
                            {pack.name}
                            {pack.remainingClasses <= 2 && pack.remainingClasses > 0 && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Low</span>
                            )}
                            {pack.remainingClasses === 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🔄 Refill</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pack.packType}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  progressPercent > 50 ? 'bg-green-500' :
                                  progressPercent > 20 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {pack.remainingClasses}/{pack.totalClasses}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lastVisit ? format(lastVisit, 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(pack);
                                setShowSendTextModal(true);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Send Text"
                            >
                              <MessageSquare size={16} className="text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Book class feature coming soon');
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Book Class"
                            >
                              <Calendar size={16} className="text-gray-600" />
                            </button>
                            {pack.remainingClasses <= 2 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert('Refill pack feature coming soon');
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded bg-red-50"
                                title="Refill Pack"
                              >
                                <Plus size={16} className="text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                
                {activeTab === 'leads' && 'status' in selectedItem && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <select
                      value={selectedItem.status}
                      onChange={(e) => {
                        updateLeadStatus(selectedItem.id, e.target.value);
                        setSelectedItem(null);
                        setTimeout(() => setSelectedItem(getAllLeads().find(l => l.id === selectedItem.id) || null), 100);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="new-lead">New Lead</option>
                      <option value="trial-booked">Trial Booked</option>
                      <option value="trial-showed">Trial Showed</option>
                      <option value="joined">Joined</option>
                      <option value="trial-no-join">Trial - No Join</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setShowSendTextModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Send Text
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNoteModal(true);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Note
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTaskModal(true);
                      }}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                  </div>
                )}

                {activeTab === 'members' && 'type' in selectedItem && selectedItem.type === 'membership' && 'status' in selectedItem && selectedItem.status === 'active' && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowSendTextModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Send Text
                    </button>
                    <button
                      onClick={() => setShowFreezeModal(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Snowflake size={16} />
                      Freeze Membership
                    </button>
                    {hasPermission(userRole, 'member:cancel') && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Cancel Membership
                      </button>
                    )}
                  </div>
                )}
                
                {activeTab === 'members' && 'type' in selectedItem && (selectedItem.type === 'pack' || selectedItem.type === 'drop-in') && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowSendTextModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Send Text
                    </button>
                  </div>
                )}

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
                        <p className="text-gray-900 font-medium capitalize">{'status' in selectedItem ? selectedItem.status.replace(/-/g, ' ') : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="text-gray-900 font-medium capitalize">{'source' in selectedItem ? selectedItem.source : ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created Date</p>
                        <p className="text-gray-900 font-medium">{'createdDate' in selectedItem ? selectedItem.createdDate : ''}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-2">Notes</p>
                        <div className="space-y-2">
                          {'notes' in selectedItem && selectedItem.notes && (
                            <p className="text-gray-900 bg-white p-3 rounded border border-gray-200">{selectedItem.notes}</p>
                          )}
                          {getLeadNotes().filter(n => n.leadId === selectedItem.id).map(note => (
                            <div key={note.id} className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-gray-900">{note.note}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-2">Tasks</p>
                        <div className="space-y-2">
                          {getLeadTasks().filter(t => t.leadId === selectedItem.id).map(task => (
                            <div key={task.id} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                              <div>
                                <p className="text-gray-900">{task.description}</p>
                                <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {task.completed ? 'Done' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="text-gray-900 font-medium">
                          {'type' in selectedItem && selectedItem.type === 'membership' 
                            ? ('membershipType' in selectedItem ? selectedItem.membershipType : '')
                            : 'type' in selectedItem && selectedItem.type === 'pack'
                            ? ('packType' in selectedItem ? selectedItem.packType : '')
                            : 'Drop-In'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Zip Code</p>
                        <p className="text-gray-900 font-medium">{'zipCode' in selectedItem ? selectedItem.zipCode : ''}</p>
                      </div>
                      {'type' in selectedItem && selectedItem.type === 'membership' ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Join Date</p>
                            <p className="text-gray-900 font-medium">{'joinDate' in selectedItem ? selectedItem.joinDate : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Last Visit</p>
                            <p className="text-gray-900 font-medium">{'lastVisit' in selectedItem ? selectedItem.lastVisit : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Visits (Last 30 Days)</p>
                            <p className="text-gray-900 font-medium">{'visitsLast30Days' in selectedItem ? selectedItem.visitsLast30Days : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className="text-gray-900 font-medium capitalize">{'status' in selectedItem ? selectedItem.status : 'Active'}</p>
                          </div>
                        </>
                      ) : 'type' in selectedItem && selectedItem.type === 'pack' ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Classes Remaining</p>
                            <p className="text-gray-900 font-medium">{'remainingClasses' in selectedItem && 'totalClasses' in selectedItem ? `${selectedItem.remainingClasses} / ${selectedItem.totalClasses}` : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Purchase Date</p>
                            <p className="text-gray-900 font-medium">{'purchaseDate' in selectedItem ? selectedItem.purchaseDate : ''}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Total Visits</p>
                            <p className="text-gray-900 font-medium">{'totalVisits' in selectedItem ? selectedItem.totalVisits : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">First Visit</p>
                            <p className="text-gray-900 font-medium">{'firstVisit' in selectedItem ? selectedItem.firstVisit : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Last Visit</p>
                            <p className="text-gray-900 font-medium">{'lastVisit' in selectedItem ? selectedItem.lastVisit : ''}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {showFreezeModal && 'type' in selectedItem && selectedItem.type === 'membership' && (
                  <FreezeModal
                    memberId={selectedItem.id}
                    memberName={selectedItem.name}
                    onClose={() => setShowFreezeModal(false)}
                    onSuccess={() => {
                      setShowFreezeModal(false);
                      setSelectedItem(null);
                      setTimeout(() => setSelectedItem(getAllMembers().find(m => m.id === selectedItem.id) || null), 100);
                    }}
                  />
                )}

                {showCancelModal && 'type' in selectedItem && selectedItem.type === 'membership' && (
                  <CancelModal
                    memberId={selectedItem.id}
                    memberName={selectedItem.name}
                    onClose={() => setShowCancelModal(false)}
                    onSuccess={() => {
                      setShowCancelModal(false);
                      setSelectedItem(null);
                      setTimeout(() => setSelectedItem(getAllMembers().find(m => m.id === selectedItem.id) || null), 100);
                    }}
                  />
                )}

                {showAddNoteModal && activeTab === 'leads' && (
                  <AddNoteModal
                    leadId={selectedItem.id}
                    onClose={() => setShowAddNoteModal(false)}
                    onSuccess={() => {
                      setShowAddNoteModal(false);
                      setSelectedItem(null);
                      setTimeout(() => setSelectedItem(getAllLeads().find(l => l.id === selectedItem.id) || null), 100);
                    }}
                  />
                )}

                {showAddTaskModal && activeTab === 'leads' && (
                  <AddTaskModal
                    leadId={selectedItem.id}
                    onClose={() => setShowAddTaskModal(false)}
                    onSuccess={() => {
                      setShowAddTaskModal(false);
                      setSelectedItem(null);
                      setTimeout(() => setSelectedItem(getAllLeads().find(l => l.id === selectedItem.id) || null), 100);
                    }}
                  />
                )}

                {showSendTextModal && (
                  <SendTextModal
                    recipientName={selectedItem.name}
                    recipientPhone={selectedItem.phone}
                    onClose={() => setShowSendTextModal(false)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showProfileTabs && selectedItem && (
        <ProfileTabs
          personId={selectedItem.id}
          onClose={() => {
            setShowProfileTabs(false);
            setSelectedItem(null);
          }}
          onSendText={() => {
            setShowProfileTabs(false);
            setShowSendTextModal(true);
          }}
        />
      )}
    </div>
  );
}
