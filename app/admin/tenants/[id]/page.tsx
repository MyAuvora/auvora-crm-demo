'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Upload, Users, Loader2, ExternalLink, FileText, CreditCard, Plus, Download, Calendar, DollarSign } from 'lucide-react';
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
  subscription_plan: string;
  billing_cycle: string;
  monthly_price: number | null;
  next_billing_date: string | null;
  payment_method: string | null;
  payment_method_last4: string | null;
  created_at: string;
}

interface Contract {
  id: string;
  name: string;
  file_url: string | null;
  file_type: string | null;
  notes: string | null;
  signed_date: string | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'contracts' | 'billing'>('details');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newContract, setNewContract] = useState({ name: '', notes: '', signed_date: '', expiry_date: '', status: 'draft' });
  const [newInvoice, setNewInvoice] = useState({ invoice_number: '', amount: '', due_date: '', status: 'pending', notes: '' });

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
      setContracts(data.contracts || []);
      setInvoices(data.invoices || []);
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

  function updateTenant(field: string, value: string | number | null) {
    if (!tenant) return;
    setTenant({ ...tenant, [field]: value });
  }

  async function handleAddContract() {
    if (!tenant || !newContract.name) return;
    
    try {
      const response = await fetch(`/api/admin/tenants/${params.id}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add contract');
      }

      setContracts([data.contract, ...contracts]);
      setNewContract({ name: '', notes: '', signed_date: '', expiry_date: '', status: 'draft' });
      setShowContractModal(false);
      setSuccess('Contract added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contract');
    }
  }

  async function handleAddInvoice() {
    if (!tenant || !newInvoice.invoice_number || !newInvoice.amount || !newInvoice.due_date) return;
    
    try {
      const response = await fetch(`/api/admin/tenants/${params.id}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvoice,
          amount: parseFloat(newInvoice.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add invoice');
      }

      setInvoices([data.invoice, ...invoices]);
      setNewInvoice({ invoice_number: '', amount: '', due_date: '', status: 'pending', notes: '' });
      setShowInvoiceModal(false);
      setSuccess('Invoice added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add invoice');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'signed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'expired':
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

      <div className="grid grid-cols-4 gap-6 mb-6">
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
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-auvora-teal" size={24} />
            <span className="text-2xl font-bold text-gray-900">{contracts.length}</span>
          </div>
          <p className="text-gray-600 text-sm">Contracts</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-auvora-teal" size={24} />
            <span className="text-2xl font-bold text-gray-900">{invoices.length}</span>
          </div>
          <p className="text-gray-600 text-sm">Invoices</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'details' ? 'bg-white text-auvora-teal shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Business Details
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'contracts' ? 'bg-white text-auvora-teal shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Contracts & Agreements
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'billing' ? 'bg-white text-auvora-teal shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Billing & Payments
        </button>
      </div>

      {activeTab === 'details' && (
      <>
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
      </>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Contracts & Agreements</h2>
              <button
                onClick={() => setShowContractModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors"
              >
                <Plus size={18} />
                Add Contract
              </button>
            </div>
            {contracts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No contracts yet</p>
                <p className="text-gray-400 text-sm mt-1">Add a contract or agreement to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <div key={contract.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-gray-500" size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{contract.name}</div>
                        <div className="text-sm text-gray-500">
                          {contract.signed_date ? `Signed: ${new Date(contract.signed_date).toLocaleDateString()}` : 'Not signed'}
                          {contract.expiry_date && ` | Expires: ${new Date(contract.expiry_date).toLocaleDateString()}`}
                        </div>
                        {contract.notes && <div className="text-sm text-gray-400 mt-1">{contract.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                      {contract.file_url && (
                        <a
                          href={contract.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-auvora-teal transition-colors"
                        >
                          <Download size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Subscription & Payment Info</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select
                  value={tenant.subscription_plan || 'starter'}
                  onChange={(e) => updateTenant('subscription_plan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="starter">Starter - $99/mo</option>
                  <option value="professional">Professional - $199/mo</option>
                  <option value="enterprise">Enterprise - $399/mo</option>
                  <option value="custom">Custom Pricing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                <select
                  value={tenant.billing_cycle || 'monthly'}
                  onChange={(e) => updateTenant('billing_cycle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (10% off)</option>
                  <option value="annual">Annual (20% off)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={tenant.monthly_price || ''}
                    onChange={(e) => updateTenant('monthly_price', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Date</label>
                <input
                  type="date"
                  value={tenant.next_billing_date || ''}
                  onChange={(e) => updateTenant('next_billing_date', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={tenant.payment_method || ''}
                  onChange={(e) => updateTenant('payment_method', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="">Not set</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="ach">ACH Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="invoice">Invoice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Last 4 Digits</label>
                <input
                  type="text"
                  value={tenant.payment_method_last4 || ''}
                  onChange={(e) => updateTenant('payment_method_last4', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Invoice History</h2>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark transition-colors"
              >
                <Plus size={18} />
                Add Invoice
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No invoices yet</p>
                <p className="text-gray-400 text-sm mt-1">Add an invoice to track payment history</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-gray-500" size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Invoice #{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                          {invoice.paid_date && ` | Paid: ${new Date(invoice.paid_date).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">${invoice.amount.toFixed(2)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Contract</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Name *</label>
                <input
                  type="text"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="Service Agreement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newContract.status}
                  onChange={(e) => setNewContract({ ...newContract, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Signature</option>
                  <option value="signed">Signed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signed Date</label>
                  <input
                    type="date"
                    value={newContract.signed_date}
                    onChange={(e) => setNewContract({ ...newContract, signed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newContract.expiry_date}
                    onChange={(e) => setNewContract({ ...newContract, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newContract.notes}
                  onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContract}
                disabled={!newContract.name}
                className="px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  value={newInvoice.invoice_number}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  placeholder="INV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-teal"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInvoice}
                disabled={!newInvoice.invoice_number || !newInvoice.amount || !newInvoice.due_date}
                className="px-4 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Invoice
              </button>
            </div>
          </div>
        </div>
      )}

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
