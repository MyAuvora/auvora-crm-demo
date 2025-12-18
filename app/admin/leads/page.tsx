'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, Mail, Phone, Building2, Calendar, Filter, Download, Plus, X, Eye, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  business_name?: string;
  industry?: string;
  sub_category?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  created_at: string;
}

const industryLabels: Record<string, string> = {
  fitness: 'Fitness',
  education: 'Education',
  wellness: 'Wellness',
  beauty: 'Beauty',
  auxiliary: 'Auxiliary',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700', icon: Mail },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<Lead | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    industry: 'fitness',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          phone: addForm.phone || null,
          business_name: addForm.business_name || null,
          industry: addForm.industry,
          source: 'manual',
          notes: addForm.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add lead');
      }

      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', business_name: '', industry: 'fitness', notes: '' });
      fetchLeads();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchLeads();
    } catch (err) {
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus as Lead['status'] } : l));
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete lead');
      fetchLeads();
    } catch (err) {
      setLeads(leads.filter(l => l.id !== leadId));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Business', 'Industry', 'Status', 'Source', 'Created'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || '',
      lead.business_name || '',
      industryLabels[lead.industry || ''] || lead.industry || '',
      statusConfig[lead.status]?.label || lead.status,
      lead.source,
      new Date(lead.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auvora-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage demo requests and potential clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
          >
            <Plus size={20} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Leads</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-sm text-gray-500">New</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          <div className="text-sm text-gray-500">Contacted</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
          <div className="text-sm text-gray-500">Qualified</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          <div className="text-sm text-gray-500">Converted</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] bg-white"
              >
                <option value="all">All Industries</option>
                <option value="fitness">Fitness</option>
                <option value="education">Education</option>
                <option value="wellness">Wellness</option>
                <option value="beauty">Beauty</option>
                <option value="auxiliary">Auxiliary</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f5257] mx-auto" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchQuery || statusFilter !== 'all' || industryFilter !== 'all' 
              ? 'No leads match your filters' 
              : 'No leads yet. Demo form submissions will appear here.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => {
              const StatusIcon = statusConfig[lead.status]?.icon || Clock;
              return (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0f5257] to-[#0a3d41] rounded-full flex items-center justify-center text-white font-medium">
                        {lead.name?.charAt(0).toUpperCase() || 'L'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {lead.business_name && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Building2 size={14} />
                            {lead.business_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {lead.industry && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {industryLabels[lead.industry] || lead.industry}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[lead.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                            <StatusIcon size={12} />
                            {statusConfig[lead.status]?.label || lead.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f5257]"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                        <button
                          onClick={() => setShowViewModal(lead)}
                          className="p-1.5 text-gray-400 hover:text-[#0f5257] hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {lead.notes && (
                    <div className="mt-2 ml-14 text-sm text-gray-500 italic">
                      {lead.notes}
                    </div>
                  )}
                  <div className="mt-2 ml-14 flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(lead.created_at).toLocaleDateString()} via {lead.source === 'demo_form' ? 'Demo Form' : lead.source === 'manual' ? 'Manual Entry' : lead.source}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={addForm.business_name}
                  onChange={(e) => setAddForm({ ...addForm, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                  placeholder="Iron Fitness"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={addForm.industry}
                  onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                >
                  <option value="fitness">Fitness</option>
                  <option value="education">Education</option>
                  <option value="wellness">Wellness</option>
                  <option value="beauty">Beauty</option>
                  <option value="auxiliary">Auxiliary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </form>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLead}
                disabled={addLoading || !addForm.name || !addForm.email}
                className="flex-1 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Lead'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Lead Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Lead Details</h2>
              <button onClick={() => setShowViewModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0f5257] to-[#0a3d41] rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {showViewModal.name?.charAt(0).toUpperCase() || 'L'}
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{showViewModal.name}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[showViewModal.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {statusConfig[showViewModal.status]?.label || showViewModal.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <a href={`mailto:${showViewModal.email}`} className="text-[#0f5257] hover:underline">
                    {showViewModal.email}
                  </a>
                </div>
                {showViewModal.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <a href={`tel:${showViewModal.phone}`} className="text-[#0f5257] hover:underline">
                      {showViewModal.phone}
                    </a>
                  </div>
                )}
                {showViewModal.business_name && (
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-gray-400" />
                    <span>{showViewModal.business_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <span>Submitted {new Date(showViewModal.created_at).toLocaleDateString()} via {showViewModal.source === 'demo_form' ? 'Demo Form' : showViewModal.source}</span>
                </div>
              </div>

              {showViewModal.industry && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">Industry</div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {industryLabels[showViewModal.industry] || showViewModal.industry}
                    {showViewModal.sub_category && ` - ${showViewModal.sub_category}`}
                  </span>
                </div>
              )}

              {showViewModal.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">Notes</div>
                  <p className="text-gray-700">{showViewModal.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(null)}
                className="w-full px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
