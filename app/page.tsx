'use client';

import { useState, useEffect } from 'react';
import { useApp, Section } from '@/lib/context';
import { Home, Users, Calendar, UserCog, ShoppingCart, TrendingUp, Tag, Menu, X, GitBranch, Monitor, MessageSquare, Share2, DollarSign, Search, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import CoachDashboard from '@/components/CoachDashboard';
import HeadCoachDashboard from '@/components/HeadCoachDashboard';
import LeadsMembers from '@/components/LeadsMembers';
import LeadPipeline from '@/components/LeadPipeline';
import Schedule from '@/components/Schedule';
import StaffSection from '@/components/StaffSection';
import POS from '@/components/POS';
import Reports from '@/components/Reports';
import Promotions from '@/components/Promotions';
import Messaging from '@/components/Messaging';
import SocialMedia from '@/components/SocialMedia';
import QuickBooksIntegration from '@/components/QuickBooksIntegration';
import Settings from '@/components/Settings';
import AuvoraChat from '@/components/AuvoraChat';
import CommandPalette from '@/components/CommandPalette';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/lib/useToast';

export default function CRMApp() {
  const { location, setLocation, userRole, setUserRole, activeSection, setActiveSection } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const { toasts, closeToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (section: string) => {
    setActiveSection(section as Section);
  };

  const locationName = location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio';
  
  const getRoleName = (role: string) => {
    switch(role) {
      case 'owner': return 'Owner/Admin';
      case 'manager': return 'Manager';
      case 'head-coach': return 'Head Coach/Trainer';
      case 'coach': return 'Coach/Trainer';
      case 'front-desk': return 'Front Desk';
      default: return 'Owner/Admin';
    }
  };

  const allNavItems = [
    { id: 'dashboard' as Section, label: 'Dashboard', icon: Home, roles: ['owner', 'manager', 'head-coach', 'coach', 'front-desk'] },
    { id: 'leads-members' as Section, label: 'Leads & Members', icon: Users, roles: ['owner', 'manager', 'front-desk'] },
    { id: 'pipeline' as Section, label: 'Lead Pipeline', icon: GitBranch, roles: ['owner', 'manager'] },
    { id: 'schedule' as Section, label: 'Schedule', icon: Calendar, roles: ['owner', 'manager', 'head-coach', 'coach', 'front-desk'] },
    { id: 'staff' as Section, label: 'Staff', icon: UserCog, roles: ['owner', 'manager'] },
    { id: 'pos' as Section, label: 'POS', icon: ShoppingCart, roles: ['owner', 'manager', 'head-coach', 'coach', 'front-desk'] },
    { id: 'reports' as Section, label: 'Reports', icon: TrendingUp, roles: ['owner', 'manager'] },
    { id: 'promotions' as Section, label: 'Promotions', icon: Tag, roles: ['owner', 'manager'] },
    { id: 'messaging' as Section, label: 'Messaging', icon: MessageSquare, roles: ['owner', 'manager', 'front-desk'] },
    { id: 'social-media' as Section, label: 'Social Media', icon: Share2, roles: ['owner', 'manager'] },
    { id: 'quickbooks' as Section, label: 'QuickBooks', icon: DollarSign, roles: ['owner', 'manager'] },
    { id: 'settings' as Section, label: 'Settings', icon: SettingsIcon, roles: ['owner'] },
    { id: 'kiosk' as Section, label: 'Kiosk Mode', icon: Monitor, roles: ['front-desk'] },
  ];
  
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold text-white">The LAB</span>
              <span className="text-lg font-semibold text-white">Tampa</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-700 flex items-center gap-2"
              title="Search (Cmd+K or Ctrl+K)"
            >
              <Search size={16} />
              <span className="hidden md:inline text-sm">Search</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs">⌘K</kbd>
            </button>
            
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as 'athletic-club' | 'dance-studio')}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="athletic-club">Athletic Club</option>
              <option value="dance-studio">Dance Studio</option>
            </select>
            
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk')}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="owner">Owner/Admin</option>
              <option value="manager">Manager</option>
              <option value="head-coach">Head Coach/Trainer</option>
              <option value="coach">Coach/Trainer</option>
              <option value="front-desk">Front Desk</option>
            </select>
            
            <div className="hidden lg:block text-sm text-gray-400">
              Logged in as: <span className="text-white font-medium">{getRoleName(userRole)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block fixed lg:sticky top-16 lg:top-16 left-0 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto z-30`}>
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">{locationName}</h2>
              <p className="text-sm text-gray-500">CRM Dashboard</p>
            </div>
            
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <main className="flex-1 p-4 lg:p-8">
          {activeSection === 'dashboard' && (
            userRole === 'head-coach' ? <HeadCoachDashboard /> :
            userRole === 'coach' ? <CoachDashboard /> : 
            <Dashboard />
          )}
          {activeSection === 'leads-members' && <LeadsMembers />}
          {activeSection === 'pipeline' && <LeadPipeline />}
          {activeSection === 'schedule' && <Schedule />}
          {activeSection === 'staff' && <StaffSection />}
          {activeSection === 'pos' && <POS />}
          {activeSection === 'reports' && <Reports />}
          {activeSection === 'promotions' && <Promotions />}
          {activeSection === 'messaging' && <Messaging />}
          {activeSection === 'social-media' && <SocialMedia />}
          {activeSection === 'quickbooks' && <QuickBooksIntegration />}
          {activeSection === 'settings' && <Settings />}
          {activeSection === 'kiosk' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Kiosk Mode</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>}
        </main>
      </div>

      <AuvoraChat />
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleNavigate}
      />
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
