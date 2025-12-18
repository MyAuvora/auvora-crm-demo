'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, Mail, Building2, Shield, UserCircle } from 'lucide-react';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">View and manage all users across tenants</p>
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
                    <div className="flex items-center gap-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColors[admin.role] || 'bg-gray-100 text-gray-700'}`}>
                        {admin.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
