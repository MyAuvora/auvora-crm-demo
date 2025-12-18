'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Palette, Globe, Mail, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'Auvora',
    supportEmail: 'support@auvora.com',
    defaultTimezone: 'America/New_York',
    defaultPrimaryColor: '#0f5257',
    defaultSecondaryColor: '#d4af37',
    emailNotifications: true,
    newTenantAlerts: true,
    importCompletionAlerts: true,
    weeklyReports: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save - in production this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your admin portal preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0f5257] rounded-lg flex items-center justify-center">
                <Globe size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">General Settings</h2>
                <p className="text-sm text-gray-500">Basic configuration options</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Timezone</label>
              <select
                value={settings.defaultTimezone}
                onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257]"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding Defaults */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center">
                <Palette size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Default Branding</h2>
                <p className="text-sm text-gray-500">Default colors for new tenants</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.defaultPrimaryColor}
                    onChange={(e) => setSettings({ ...settings, defaultPrimaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.defaultPrimaryColor}
                    onChange={(e) => setSettings({ ...settings, defaultPrimaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.defaultSecondaryColor}
                    onChange={(e) => setSettings({ ...settings, defaultSecondaryColor: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.defaultSecondaryColor}
                    onChange={(e) => setSettings({ ...settings, defaultSecondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5257] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div
                className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: settings.defaultPrimaryColor }}
              >
                Sample Tenant
                <span
                  className="ml-2 px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: settings.defaultSecondaryColor, color: '#000' }}
                >
                  Badge
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bell size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">Configure email notifications</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive notifications via email</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-[#0f5257] rounded focus:ring-[#0f5257]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">New Tenant Alerts</div>
                  <div className="text-sm text-gray-500">Get notified when a new tenant is created</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.newTenantAlerts}
                onChange={(e) => setSettings({ ...settings, newTenantAlerts: e.target.checked })}
                className="w-5 h-5 text-[#0f5257] rounded focus:ring-[#0f5257]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Import Completion Alerts</div>
                  <div className="text-sm text-gray-500">Get notified when data imports complete</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.importCompletionAlerts}
                onChange={(e) => setSettings({ ...settings, importCompletionAlerts: e.target.checked })}
                className="w-5 h-5 text-[#0f5257] rounded focus:ring-[#0f5257]"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Weekly Reports</div>
                  <div className="text-sm text-gray-500">Receive weekly summary reports</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={(e) => setSettings({ ...settings, weeklyReports: e.target.checked })}
                className="w-5 h-5 text-[#0f5257] rounded focus:ring-[#0f5257]"
              />
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Security</h2>
                <p className="text-sm text-gray-500">Security and access settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Security Settings</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Advanced security settings like two-factor authentication and session management 
                    will be available in a future update.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Settings saved!
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#0f5257] text-white rounded-lg hover:bg-[#0a3d41] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
