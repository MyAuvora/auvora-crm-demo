'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, Users, Upload, Settings, LogOut, Loader2, ChevronDown, Monitor, LayoutDashboard, CreditCard, BarChart3, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: admin } = await supabase
        .from('auvora_admins')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setAdminName(admin.full_name);
      setAdminEmail(admin.email);
    }

    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

    const isActive = (path: string) => {
      if (path === '/admin/tenants') {
        return pathname === '/admin' || pathname?.startsWith('/admin/tenants');
      }
      if (path === '/admin/dashboard') {
        return pathname === '/admin/dashboard';
      }
      return pathname?.startsWith(path);
    };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Image src="/auvora-logo.png" alt="Auvora" width={64} height={64} className="mx-auto mb-4" />
          <Loader2 className="w-8 h-8 animate-spin text-[#0f5257] mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-gradient-to-r from-[#0f5257] to-[#0a3d41] text-white shadow-xl">
        <div className="px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center gap-3">
                <Image src="/auvora-logo.png" alt="Auvora" width={40} height={40} className="rounded-lg" />
                <div>
                  <span className="font-bold text-xl tracking-tight">Auvora</span>
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center font-bold text-sm">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium">{adminName}</div>
                    <div className="text-xs opacity-70">{adminEmail}</div>
                  </div>
                  <ChevronDown size={16} className="opacity-70" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] border-r border-gray-200">
                    <div className="p-4">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
                        Overview
                      </div>
                      <nav className="space-y-1">
                        <Link
                          href="/admin/dashboard"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/dashboard')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <LayoutDashboard size={20} />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <Link
                          href="/admin/analytics"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/analytics')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <BarChart3 size={20} />
                          <span className="font-medium">Analytics</span>
                        </Link>
                      </nav>

                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4 mt-6">
                        Management
                      </div>
                      <nav className="space-y-1">
                                                <Link
                                                  href="/admin"
                                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                    isActive('/admin/tenants')
                                                      ? 'bg-[#0f5257] text-white shadow-md'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                                >
                                                  <Building2 size={20} />
                                                  <span className="font-medium">Clients</span>
                                                </Link>
                        <Link
                          href="/admin/users"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/users')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Users size={20} />
                          <span className="font-medium">Users</span>
                        </Link>
                                                <Link
                                                  href="/admin/leads"
                                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                    isActive('/admin/leads')
                                                      ? 'bg-[#0f5257] text-white shadow-md'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                                >
                                                  <UserPlus size={20} />
                                                  <span className="font-medium">Leads</span>
                                                </Link>
                                                <Link
                                                  href="/admin/payments"
                                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                    isActive('/admin/payments')
                                                      ? 'bg-[#0f5257] text-white shadow-md'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                                >
                                                  <CreditCard size={20} />
                                                  <span className="font-medium">Payments</span>
                                                </Link>
                                                <Link
                                                  href="/admin/import"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/import')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Upload size={20} />
                          <span className="font-medium">Data Import</span>
                        </Link>
                        <Link
                          href="/admin/demos"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/demos')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Monitor size={20} />
                          <span className="font-medium">Demos</span>
                        </Link>
                      </nav>
            
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4 mt-6">
                        System
                      </div>
                      <nav className="space-y-1">
                        <Link
                          href="/admin/settings"
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/admin/settings')
                              ? 'bg-[#0f5257] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Settings size={20} />
                          <span className="font-medium">Settings</span>
                        </Link>
                      </nav>
                    </div>
          
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Auvora Admin Portal v1.0
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
