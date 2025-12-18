'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, Mail, Building2, Shield, UserCircle, Plus, X, Trash2, Edit2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
}

interface AuvoraAdmin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AuvoraAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tenants' | 'admins'>('tenants');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string; password: string } | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = createClient();
      
      // Fetch tenant users with tenant names
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          tenant_id,
          created_at,
          tenants (name)
        `)
        .order('created_at', { ascending: false });

      if (usersData) {
        setUsers(usersData.map((u: Record<string, unknown>) => ({
          ...u,
          tenant_name: (u.tenants as { name: string } | null)?.name || 'Unknown'
        })) as User[]);
      }

      // Fetch Auvora admins
      const { data: adminsData } = await supabase
        .from('auvora_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsData) {
        setAdmins(adminsData);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

    const filteredUsers = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAdmins = admins.filter(admin =>
      admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const generatePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const handleInviteAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setInviteLoading(true);
      setInviteError(null);

      try {
        const supabase = createClient();
        const tempPassword = generatePassword();

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: inviteForm.email,
          password: tempPassword,
          options: {
            data: {
              full_name: inviteForm.full_name,
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Add to auvora_admins table
        const { error: adminError } = await supabase
          .from('auvora_admins')
          .insert({
            id: authData.user.id,
            email: inviteForm.email,
            full_name: inviteForm.full_name,
            role: inviteForm.role
          });

        if (adminError) throw adminError;

        setInviteSuccess({ email: inviteForm.email, password: tempPassword });
        fetchData();
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : 'Failed to invite admin');
      } finally {
        setInviteLoading(false);
      }
    };

    const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
      if (!confirm(`Are you sure you want to remove ${adminEmail} as an admin?`)) return;

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('auvora_admins')
          .delete()
          .eq('id', adminId);

        if (error) throw error;
        fetchData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove admin');
      }
    };

    const resetInviteModal = () => {
      setShowInviteModal(false);
      setInviteForm({ email: '', full_name: '', role: 'admin' });
      setInviteError(null);
      setInviteSuccess(null);
    };

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    'head-coach': 'bg-green-100 text-green-700',
    coach: 'bg-teal-100 text-teal-700',
    instructor: 'bg-cyan-100 text-cyan-700',
    'front-desk': 'bg-orange-100 text-orange-700',
    superadmin: 'bg-red-100 text-red-700',
    admin: 'bg-yellow-100 text-yellow-700',
  };

    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">View and manage all users across tenants</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
          >
            <Plus size={20} />
            Invite Admin
          </button>
        </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tenants'
                  ? 'border-[#0f5257] text-[#0f5257]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 size={18} />
                Tenant Users
                <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {users.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'admins'
                  ? 'border-[#0f5257] text-[#0f5257]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield size={18} />
                Auvora Admins
                <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {admins.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'tenants' ? 'Search users...' : 'Search admins...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f5257] mx-auto" />
          </div>
        ) : activeTab === 'tenants' ? (
          <div className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {searchQuery ? 'No users match your search' : 'No tenant users found'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0f5257] to-[#0a3d41] rounded-full flex items-center justify-center text-white font-medium">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || 'Unknown'}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail size={14} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{user.tenant_name}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAdmins.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {searchQuery ? 'No admins match your search' : 'No Auvora admins found'}
              </div>
            ) : (
              filteredAdmins.map((admin) => (
                <div key={admin.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8962f] rounded-full flex items-center justify-center text-white font-medium">
                        {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{admin.full_name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail size={14} />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColors[admin.role] || 'bg-gray-100 text-gray-700'}`}>
                        {admin.role}
                      </span>
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove Admin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {inviteSuccess ? (
              <>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Admin Invited!</h2>
                  <button onClick={resetInviteModal} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600">Share these credentials with the new admin:</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Email</div>
                      <div className="font-mono text-sm">{inviteSuccess.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Temporary Password</div>
                      <div className="font-mono text-sm bg-yellow-50 px-2 py-1 rounded">{inviteSuccess.password}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    The admin should change their password after first login.
                  </p>
                </div>
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={resetInviteModal}
                    className="w-full px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Invite Admin</h2>
                  <button onClick={resetInviteModal} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleInviteAdmin} className="p-6 space-y-4">
                  {inviteError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {inviteError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.full_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                      placeholder="jane@myauvora.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Admins can manage clients. Super Admins can also manage other admins.
                    </p>
                  </div>
                </form>
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={resetInviteModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteAdmin}
                    disabled={inviteLoading || !inviteForm.email || !inviteForm.full_name}
                    className="flex-1 px-4 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      'Send Invite'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
