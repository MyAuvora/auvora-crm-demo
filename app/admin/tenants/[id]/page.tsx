'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Upload, Users, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  owner_name: string | null;
  owner_email: string | null;
  business_address: string | null;
  business_phone: string | null;
  timezone: string;
  onboarding_status: string;
  subscription_status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const onboardingSteps = [
  { key: 'pending', label: 'Pending' },
  { key: 'provisioned', label: 'Provisioned' },
  { key: 'branded', label: 'Branded' },
  { key: 'imported', label: 'Data Imported' },
  { key: 'testing', label: 'Testing' },
  { key: 'ready', label: 'Ready' },
  { key: 'live', label: 'Live' },
];

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  async function fetchTenant() {
    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tenant');
      }
      
      setTenant(data.tenant);
      setUsers(data.users || []);
      setMemberCount(data.member_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenant');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!tenant) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tenant');
      }

      setTenant(data.tenant);
      setSuccess('Tenant updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tenant');
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
    }
  }

  function updateTenant(field: string, value: string | null) {
    if (!tenant) return;
    setTenant({ ...tenant, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-auvora-teal" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tenant not found</p>
        <Link href="/admin" className="text-auvora-teal hover:underline mt-2 inline-block">
          Back to tenants
        </Link>
      </div>
    );
  }

  const currentStepIndex = onboardingSteps.findIndex(s => s.key === tenant.onboarding_status);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-600">
            {tenant.custom_domain || `${tenant.subdomain}.auvora.com`}
          </p>
        </div>
        <a
          href={`https://${tenant.custom_domain || `${tenant.subdomain}.auvora.com`}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-auvora-teal border border-auvora-teal rounded-lg hover:bg-auvora-teal hover:text-white transition-colors"
        >
          <ExternalLink size={18} />
          View CRM
        </a>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Onboarding Progress</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => updateTenant('onboarding_status', step.key)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-auvora-teal text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </button>
                {index < onboardingSteps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      index < currentStepIndex ? 'bg-auvora-teal' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {onboardingSteps.map((step) => (
              <span key={step.key} className="text-center w-16">{step.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-auvora-teal" size={24} />
            <span className="text-2xl font-bold text-gray-900">{memberCount}</span>
          </div>
          <p className="text-gray-600 text-sm">Members</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-auvora-teal" size={24} />
            <span className="text-2xl font-bold text-gray-900">{users.length}</span>
          </div>
          <p className="text-gray-600 text-sm">Staff Users</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Link
            href={`/admin/import?tenant=${tenant.id}`}
            className="flex items-center gap-3 text-auvora-teal hover:text-auvora-teal-dark"
          >
            <Upload size={24} />
            <span className="font-medium">Import Data</span>
          </Link>
          <p className="text-gray-600 text-sm mt-2">Upload CSV files</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Business Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={tenant.name}
                onChange={(e) => updateTenant('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
              <div className="flex">
                <input
                  type="text"
                  value={tenant.subdomain}
                  onChange={(e) => updateTenant('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
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
                value={tenant.custom_domain || ''}
                onChange={(e) => updateTenant('custom_domain', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                placeholder="app.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
              <input
                type="tel"
                value={tenant.business_phone || ''}
                onChange={(e) => updateTenant('business_phone', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
              <input
                type="text"
                value={tenant.business_address || ''}
                onChange={(e) => updateTenant('business_address', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={tenant.timezone}
                onChange={(e) => updateTenant('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Branding</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={tenant.logo_url || ''}
                onChange={(e) => updateTenant('logo_url', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={tenant.primary_color}
                  onChange={(e) => updateTenant('primary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={tenant.primary_color}
                  onChange={(e) => updateTenant('primary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={tenant.secondary_color}
                  onChange={(e) => updateTenant('secondary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={tenant.secondary_color}
                  onChange={(e) => updateTenant('secondary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div
                className="h-24 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="h-16 object-contain" />
                ) : (
                  tenant.name
                )}
                <span
                  className="ml-3 px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: tenant.secondary_color, color: tenant.primary_color }}
                >
                  Accent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Staff Users</h2>
        </div>
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No staff users yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 size={18} />
          Delete Tenant
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
