'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Dumbbell, GraduationCap, Heart, Eye, Copy, Check, RefreshCw, Plus, Loader2 } from 'lucide-react';

interface DemoTenant {
  id: string;
  name: string;
  subdomain: string;
  demo_industry: string;
  is_demo: boolean;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

interface DemoSite {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  status: 'live' | 'development' | 'planned';
  color: string;
  features: string[];
  industry: string;
}

const demoSites: DemoSite[] = [
  {
    id: 'fitness',
    name: 'Fitness CRM',
    description: 'Complete gym and fitness studio management solution with member tracking, class scheduling, and payment processing.',
    url: 'https://auvora-crm-demo.vercel.app',
    icon: <Dumbbell size={24} />,
    status: 'live',
    color: '#0f5257',
    features: ['Member Management', 'Class Scheduling', 'Payment Processing', 'Staff Management', 'Analytics Dashboard'],
    industry: 'fitness',
  },
  {
    id: 'education',
    name: 'Education CRM',
    description: 'Student enrollment, course management, and academic tracking for tutoring centers and educational institutions.',
    url: 'https://auvora-education-demo.vercel.app',
    icon: <GraduationCap size={24} />,
    status: 'development',
    color: '#2563eb',
    features: ['Student Enrollment', 'Course Management', 'Progress Tracking', 'Parent Portal', 'Scheduling'],
    industry: 'education',
  },
  {
    id: 'wellness',
    name: 'Wellness CRM',
    description: 'Spa, salon, and wellness center management with appointment booking and client relationship tools.',
    url: 'https://auvora-wellness-demo.vercel.app',
    icon: <Heart size={24} />,
    status: 'planned',
    color: '#9333ea',
    features: ['Appointment Booking', 'Client Profiles', 'Service Catalog', 'Inventory Management', 'Marketing Tools'],
    industry: 'wellness',
  },
];

const DEMO_PASSWORD = 'Demo123!';

export default function DemosPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);
  const [demoTenants, setDemoTenants] = useState<DemoTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDemoIndustry, setNewDemoIndustry] = useState('fitness');

  useEffect(() => {
    fetchDemoTenants();
  }, []);

  async function fetchDemoTenants() {
    try {
      const response = await fetch('/api/admin/demos');
      if (response.ok) {
        const data = await response.json();
        setDemoTenants(data.demos || []);
      }
    } catch (error) {
      console.error('Error fetching demo tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetDemo(tenantId: string) {
    if (!confirm('This will delete all data in this demo and replace it with fresh sample data. Continue?')) {
      return;
    }
    
    setResetting(tenantId);
    try {
      const response = await fetch(`/api/admin/demos/${tenantId}/reset`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Demo data reset successfully!');
        fetchDemoTenants();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to reset demo data');
    } finally {
      setResetting(null);
    }
  }

  async function handleCreateDemo() {
    setCreating(true);
    try {
      const industryNames: Record<string, string> = {
        fitness: 'Fitness Demo',
        wellness: 'Wellness Demo',
        education: 'Education Demo',
      };
      
      const response = await fetch('/api/admin/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: newDemoIndustry,
          name: industryNames[newDemoIndustry] || 'Demo',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Demo created!\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`);
        setShowCreateModal(false);
        fetchDemoTenants();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create demo');
    } finally {
      setCreating(false);
    }
  }

  const copyToClipboard = (text: string, type: 'url' | 'credential' = 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } else {
      setCopiedCredential(text);
      setTimeout(() => setCopiedCredential(null), 2000);
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'fitness':
        return <Dumbbell size={20} />;
      case 'wellness':
        return <Heart size={20} />;
      case 'education':
        return <GraduationCap size={20} />;
      default:
        return <Dumbbell size={20} />;
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'fitness':
        return '#0f5257';
      case 'wellness':
        return '#9333ea';
      case 'education':
        return '#2563eb';
      default:
        return '#0f5257';
    }
  };

  const getStatusBadge = (status: DemoSite['status']) => {
    switch (status) {
      case 'live':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Live
          </span>
        );
      case 'development':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            In Development
          </span>
        );
      case 'planned':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Planned
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Demo Sites</h1>
        <p className="text-gray-600 mt-1">Preview and share Auvora CRM demo sites with potential clients</p>
      </div>

      {/* Demo Accounts Section */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Demo Accounts</h2>
            <p className="text-sm text-gray-600">Use these credentials for live demo calls. Reset data before each call.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
          >
            <Plus size={16} />
            <span>Create Demo</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : demoTenants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No demo accounts created yet.</p>
            <p className="text-sm mt-1">Click &quot;Create Demo&quot; to set up a demo account for sales calls.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demoTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: getIndustryColor(tenant.demo_industry) }}
                  >
                    {getIndustryIcon(tenant.demo_industry)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Email:</span>
                        <code className="text-xs bg-white px-2 py-0.5 rounded border">{tenant.owner_email}</code>
                        <button
                          onClick={() => copyToClipboard(tenant.owner_email, 'credential')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {copiedCredential === tenant.owner_email ? (
                            <Check size={12} className="text-green-600" />
                          ) : (
                            <Copy size={12} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Password:</span>
                        <code className="text-xs bg-white px-2 py-0.5 rounded border">{DEMO_PASSWORD}</code>
                        <button
                          onClick={() => copyToClipboard(DEMO_PASSWORD, 'credential')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {copiedCredential === DEMO_PASSWORD ? (
                            <Check size={12} className="text-green-600" />
                          ) : (
                            <Copy size={12} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetDemo(tenant.id)}
                    disabled={resetting === tenant.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    {resetting === tenant.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    <span>Reset Data</span>
                  </button>
                  <a
                    href="https://auvora-crm-demo.vercel.app/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Open Demo</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Sites Grid */}
      <div className="grid gap-6">
        {demoSites.map((demo) => (
          <div
            key={demo.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex">
              {/* Icon Section */}
              <div
                className="w-24 flex items-center justify-center"
                style={{ backgroundColor: demo.color }}
              >
                <div className="text-white">{demo.icon}</div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">{demo.name}</h2>
                      {getStatusBadge(demo.status)}
                    </div>
                    <p className="text-gray-600 mt-1">{demo.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {demo.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* URL and Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600 truncate">{demo.url}</span>
                    <button
                      onClick={() => copyToClipboard(demo.url)}
                      className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === demo.url ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                  
                  {demo.status === 'live' ? (
                    <>
                      <a
                        href={demo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </a>
                      <a
                        href={demo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink size={16} />
                        <span>Open</span>
                      </a>
                    </>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      <Eye size={16} />
                      <span>Coming Soon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Share Section */}
      <div className="mt-8 bg-gradient-to-r from-[#0f5257] to-[#0a3d41] rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Share with Potential Clients</h3>
        <p className="text-white/80 text-sm mb-4">
          Use these demo sites to showcase Auvora&apos;s capabilities during sales calls. 
          Each demo is pre-populated with sample data to demonstrate key features.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => copyToClipboard('https://auvora-crm-demo.vercel.app')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Copy size={16} />
            <span>Copy Fitness Demo Link</span>
          </button>
        </div>
      </div>

      {/* Create Demo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Demo Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={newDemoIndustry}
                  onChange={(e) => setNewDemoIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f5257] focus:border-transparent"
                >
                  <option value="fitness">Fitness</option>
                  <option value="wellness">Wellness</option>
                  <option value="education">Education</option>
                </select>
              </div>
              <p className="text-sm text-gray-500">
                This will create a demo tenant with sample data for the selected industry.
                You&apos;ll receive login credentials to use during sales calls.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDemo}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Create Demo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
