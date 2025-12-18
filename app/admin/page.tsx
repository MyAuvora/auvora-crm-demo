'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Building2, Users, Calendar, ChevronRight, Loader2, Briefcase, GraduationCap, Heart, Scissors, Wrench, Filter } from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  owner_name: string | null;
  owner_email: string | null;
  onboarding_status: string;
  subscription_status: string;
  industry: string;
  created_at: string;
}

const industryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  fitness: { label: 'Fitness', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  education: { label: 'Education', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  wellness: { label: 'Wellness', color: 'text-green-700', bgColor: 'bg-green-100' },
  beauty: { label: 'Beauty', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  auxiliary: { label: 'Auxiliary', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  provisioned: 'bg-blue-100 text-blue-700',
  branded: 'bg-purple-100 text-purple-700',
  imported: 'bg-yellow-100 text-yellow-700',
  testing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  live: 'bg-auvora-teal text-white',
};

const industrySubCategories: Record<string, { value: string; label: string }[]> = {
  wellness: [
    { value: 'chiropractic', label: 'Chiropractic Office' },
    { value: 'physical_therapy', label: 'Physical Therapy' },
    { value: 'massage', label: 'Massage Therapy' },
    { value: 'acupuncture', label: 'Acupuncture' },
    { value: 'mental_health', label: 'Mental Health / Counseling' },
    { value: 'other_wellness', label: 'Other Wellness' },
  ],
  beauty: [
    { value: 'hair_salon', label: 'Hair Salon' },
    { value: 'nail_salon', label: 'Nail Salon' },
    { value: 'spa', label: 'Spa' },
    { value: 'barbershop', label: 'Barbershop' },
    { value: 'med_spa', label: 'Med Spa' },
    { value: 'esthetics', label: 'Esthetics / Skincare' },
    { value: 'other_beauty', label: 'Other Beauty' },
  ],
  auxiliary: [
    { value: 'consulting', label: 'Consulting' },
    { value: 'coaching', label: 'Life / Business Coaching' },
    { value: 'photography', label: 'Photography Studio' },
    { value: 'music_lessons', label: 'Music Lessons' },
    { value: 'art_studio', label: 'Art Studio' },
    { value: 'pet_services', label: 'Pet Services' },
    { value: 'other_auxiliary', label: 'Other' },
  ],
};

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>(searchParams.get('industry') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const industry = searchParams.get('industry');
    const status = searchParams.get('status');
    if (industry) setIndustryFilter(industry);
    if (status) setStatusFilter(status);
  }, [searchParams]);

  async function fetchClients() {
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      if (data.tenants) {
        setClients(data.tenants);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }

    const filteredClients = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'all' || (client.industry || 'fitness') === industryFilter;
      const matchesStatus = statusFilter === 'all' || client.onboarding_status === statusFilter;
      return matchesSearch && matchesIndustry && matchesStatus;
    });

    const clearFilters = () => {
      setIndustryFilter('all');
      setStatusFilter('all');
      setSearchQuery('');
      router.push('/admin');
    };

  const stats = {
    total: clients.length,
    live: clients.filter(c => c.onboarding_status === 'live').length,
    onboarding: clients.filter(c => !['live', 'pending'].includes(c.onboarding_status)).length,
    pending: clients.filter(c => c.onboarding_status === 'pending').length,
  };

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-1">Manage client accounts and onboarding</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors"
          >
            <Plus size={20} />
            New Client
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{stats.live}</div>
            <div className="text-sm text-gray-600">Live</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{stats.onboarding}</div>
            <div className="text-sm text-gray-600">Onboarding</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl font-bold text-gray-400">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                      />
                    </div>
                    <select
                      value={industryFilter}
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                    >
                      <option value="all">All Industries</option>
                      <option value="fitness">Fitness</option>
                      <option value="education">Education</option>
                      <option value="wellness">Wellness</option>
                      <option value="beauty">Beauty</option>
                      <option value="auxiliary">Auxiliary</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="provisioned">Provisioned</option>
                      <option value="branded">Branded</option>
                      <option value="imported">Data Imported</option>
                      <option value="testing">Testing</option>
                      <option value="ready">Ready</option>
                      <option value="live">Live</option>
                    </select>
                    {(industryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-auvora-teal mx-auto" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || industryFilter !== 'all' ? 'No clients match your filters' : 'No clients yet. Create your first client to get started.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const industry = industryConfig[client.industry || 'fitness'] || industryConfig.fitness;
                return (
                  <Link
                    key={client.id}
                    href={`/admin/tenants/${client.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: client.primary_color }}
                      >
                        {client.logo_url ? (
                          <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          client.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">
                          {client.custom_domain || `${client.subdomain}.auvora.com`}
                        </div>
                        {client.owner_email && (
                          <div className="text-xs text-gray-400">{client.owner_email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${industry.bgColor} ${industry.color}`}>
                        {industry.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[client.onboarding_status] || statusColors.pending}`}>
                        {client.onboarding_status}
                      </span>
                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateClientModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchClients();
            }}
          />
        )}
      </div>
    );
}

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
      name: '',
      subdomain: '',
      custom_domain: '',
      industry: 'fitness',
      sub_category: '',
      owner_name: '',
      owner_email: '',
      business_phone: '',
      business_address: '',
      timezone: 'America/New_York',
      primary_color: '#0f5257',
      secondary_color: '#d4af37',
    });

    const handleIndustryChange = (industry: string) => {
      const needsSubCategory = ['wellness', 'beauty', 'auxiliary'].includes(industry);
      setFormData({ 
        ...formData, 
        industry, 
        sub_category: needsSubCategory ? '' : '' 
      });
    };

    const hasSubCategories = ['wellness', 'beauty', 'auxiliary'].includes(formData.industry);
  const [createdOwner, setCreatedOwner] = useState<{ email: string; temp_password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      setCreatedOwner(data.owner);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const subdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain });
  };

    if (createdOwner) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Client Created!</h2>
              <p className="text-gray-600 mb-6">Share these credentials with the owner:</p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <div className="mb-3">
                <div className="text-xs text-gray-500 uppercase">Email</div>
                <div className="font-mono text-sm">{createdOwner.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Temporary Password</div>
                <div className="font-mono text-sm bg-yellow-50 px-2 py-1 rounded">{createdOwner.temp_password}</div>
              </div>
            </div>

            <button
              onClick={onCreated}
              className="w-full px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Create New Client</h2>
            <p className="text-gray-600 mt-1">Set up a new client account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="Iron Fitness"
                />
              </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                              <select
                                required
                                value={formData.industry}
                                onChange={(e) => handleIndustryChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                              >
                                <option value="fitness">Fitness</option>
                                <option value="education">Education</option>
                                <option value="wellness">Wellness</option>
                                <option value="beauty">Beauty</option>
                                <option value="auxiliary">Auxiliary</option>
                              </select>
                            </div>

                            {hasSubCategories && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                                <select
                                  required
                                  value={formData.sub_category}
                                  onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                                >
                                  <option value="">Select business type...</option>
                                  {industrySubCategories[formData.industry]?.map((subCat) => (
                                    <option key={subCat.value} value={subCat.value}>
                                      {subCat.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                <div className="flex">
                  <input
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                    placeholder="ironfitness"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-sm">
                    .auvora.com
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                <input
                  type="text"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="app.ironfitness.com"
                />
              </div>
            </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Owner Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                <input
                  type="email"
                  required
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="john@ironfitness.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <input
                  type="text"
                  value={formData.business_address}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="123 Main St, Tampa, FL 33601"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Branding</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div
                className="h-20 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: formData.primary_color }}
              >
                {formData.name || 'Business Name'}
                <span
                  className="ml-2 px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: formData.secondary_color, color: formData.primary_color }}
                >
                  Accent
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                            {loading ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus size={18} />
                                Create Client
                              </>
                            )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
