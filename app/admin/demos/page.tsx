'use client';

import { useState } from 'react';
import { ExternalLink, Dumbbell, GraduationCap, Heart, Eye, Copy, Check } from 'lucide-react';

interface DemoSite {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  status: 'live' | 'development' | 'planned';
  color: string;
  features: string[];
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
  },
];

export default function DemosPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
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
    </div>
  );
}
