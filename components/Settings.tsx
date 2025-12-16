'use client';

import { useState } from 'react';
import { Building, Palette, DollarSign, Users, MessageSquare, Bell, Shield, ClipboardCheck, RefreshCw } from 'lucide-react';
import { getAllStaff, getStaffSettings, updateStaffSettings, resetData } from '@/lib/dataStore';
import { useApp } from '@/lib/context';
import StaffScheduleApprovals from './StaffScheduleApprovals';

export default function Settings() {
  const { location } = useApp();
  const [activeSection, setActiveSection] = useState<'business' | 'branding' | 'billing' | 'staff' | 'staff-requests' | 'messaging' | 'notifications' | 'security'>('business');
  const [, setRefreshTrigger] = useState(0);
  
  const [businessInfo, setBusinessInfo] = useState({
    businessName: 'Your Business',
    email: 'info@thelabtampa.com',
    phone: '(813) 555-0100',
    address: '123 Fitness St, Tampa, FL 33602',
    timezone: 'America/New_York',
    currency: 'USD',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#0f5257',
    logoUrl: '',
    accentColor: '#3B82F6',
  });

  const [billing, setBilling] = useState({
    taxRate: 7.0,
    lateFeeAmount: 10.0,
    gracePeriodDays: 3,
    autoRetryFailedPayments: true,
    retryAttempts: 3,
  });

  const [staffSettings, setStaffSettings] = useState({
    requireClockIn: true,
    allowSelfScheduling: false,
    commissionEnabled: true,
    commissionRate: 15,
  });

  const [messagingSettings, setMessagingSettings] = useState({
    smsEnabled: true,
    emailEnabled: true,
    autoResponseEnabled: false,
    businessHoursOnly: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newLeadNotifications: true,
    missedPaymentAlerts: true,
    lowAttendanceAlerts: true,
    classFullAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    auditLogEnabled: true,
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const sections = [
    { id: 'business' as const, label: 'Business Info', icon: Building },
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'billing' as const, label: 'Billing & Payments', icon: DollarSign },
    { id: 'staff' as const, label: 'Staff Settings', icon: Users },
    { id: 'staff-requests' as const, label: 'Staff Requests', icon: ClipboardCheck },
    { id: 'messaging' as const, label: 'Messaging', icon: MessageSquare },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your CRM configuration and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-gray-50 border-r border-gray-200">
            <nav className="p-3 sm:p-4 space-y-1 overflow-x-auto">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base ${
                      activeSection === section.id
                        ? 'bg-auvora-teal text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 p-4 sm:p-6">
            {activeSection === 'business' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Business Information</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Update your business details and contact information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={businessInfo.businessName}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={businessInfo.timezone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Branding</h2>
                  <p className="text-sm text-gray-600 mb-6">Customize your CRM appearance and branding</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="h-10 w-20 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="h-10 w-20 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="text"
                      value={branding.logoUrl}
                      onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Billing & Payments</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure billing settings and payment processing</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={billing.taxRate}
                      onChange={(e) => setBilling({ ...billing, taxRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee Amount ($)</label>
                    <input
                      type="number"
                      step="1"
                      value={billing.lateFeeAmount}
                      onChange={(e) => setBilling({ ...billing, lateFeeAmount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (days)</label>
                    <input
                      type="number"
                      value={billing.gracePeriodDays}
                      onChange={(e) => setBilling({ ...billing, gracePeriodDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retry Attempts</label>
                    <input
                      type="number"
                      value={billing.retryAttempts}
                      onChange={(e) => setBilling({ ...billing, retryAttempts: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billing.autoRetryFailedPayments}
                        onChange={(e) => setBilling({ ...billing, autoRetryFailedPayments: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Auto-retry failed payments</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'staff-requests' && (
          <div className="space-y-6">
            <StaffScheduleApprovals />
          </div>
        )}

        {activeSection === 'staff' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Staff Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure staff permissions and policies</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffSettings.requireClockIn}
                      onChange={(e) => setStaffSettings({ ...staffSettings, requireClockIn: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Require staff to clock in/out</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffSettings.allowSelfScheduling}
                      onChange={(e) => setStaffSettings({ ...staffSettings, allowSelfScheduling: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Allow staff to self-schedule classes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffSettings.commissionEnabled}
                      onChange={(e) => setStaffSettings({ ...staffSettings, commissionEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable commission tracking</span>
                  </label>

                  {staffSettings.commissionEnabled && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Commission Rate (%)</label>
                      <input
                        type="number"
                        value={staffSettings.commissionRate}
                        onChange={(e) => setStaffSettings({ ...staffSettings, commissionRate: parseInt(e.target.value) })}
                        className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                      />
                    </div>
                  )}
                </div>

                {/* POS Access Management */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">POS Access Control</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage which staff members can access the Point of Sale system</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {getAllStaff().filter(s => s.location === location).map(staff => {
                        const settings = getStaffSettings(staff.id);
                        const hasPOSAccess = settings?.posAccess !== false;
                        
                        return (
                          <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">{staff.name}</p>
                              <p className="text-sm text-gray-600">{staff.role.charAt(0).toUpperCase() + staff.role.slice(1)} • {staff.email}</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <span className="text-sm text-gray-700">POS Access</span>
                              <input
                                type="checkbox"
                                checked={hasPOSAccess}
                                onChange={(e) => {
                                  updateStaffSettings(staff.id, { posAccess: e.target.checked });
                                  setRefreshTrigger(prev => prev + 1);
                                }}
                                className="rounded border-gray-300 text-auvora-teal focus:ring-auvora-gold"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'messaging' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Messaging</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure messaging and communication settings</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messagingSettings.smsEnabled}
                      onChange={(e) => setMessagingSettings({ ...messagingSettings, smsEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable SMS messaging</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messagingSettings.emailEnabled}
                      onChange={(e) => setMessagingSettings({ ...messagingSettings, emailEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable email messaging</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messagingSettings.autoResponseEnabled}
                      onChange={(e) => setMessagingSettings({ ...messagingSettings, autoResponseEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable auto-responses</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messagingSettings.businessHoursOnly}
                      onChange={(e) => setMessagingSettings({ ...messagingSettings, businessHoursOnly: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Send messages during business hours only</span>
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
                  <p className="text-sm text-gray-600 mb-6">Choose which notifications you want to receive</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newLeadNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, newLeadNotifications: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">New lead notifications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.missedPaymentAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, missedPaymentAlerts: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Missed payment alerts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowAttendanceAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, lowAttendanceAlerts: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Low attendance alerts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.classFullAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, classFullAlerts: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Class full alerts</span>
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Security</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure security and access control settings</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireTwoFactor}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, requireTwoFactor: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Require two-factor authentication</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.auditLogEnabled}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, auditLogEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable audit logging</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                    <input
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: parseInt(e.target.value) })}
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Demo Data Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Reset all demo data to see the latest seed data including new staff members</p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all demo data? This will clear all changes and reload fresh seed data.')) {
                        resetData();
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Reset Demo Data
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  alert('Settings reset to defaults');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-auvora-teal text-white rounded-lg hover:bg-auvora-teal-dark font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
