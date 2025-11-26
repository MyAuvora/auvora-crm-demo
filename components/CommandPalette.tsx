'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, User, Users, Calendar, DollarSign, UserCog, X } from 'lucide-react';
import { getAllMembers, getAllLeads, getAllClassPackClients, getAllDropInClients, getAllStaff, getAllClasses, getAllInvoices } from '@/lib/dataStore';
import { useApp } from '@/lib/context';

interface SearchResult {
  id: string;
  type: 'member' | 'lead' | 'class-pack' | 'drop-in' | 'staff' | 'class' | 'invoice';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string, id?: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const { location } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  };

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    getAllMembers()
      .filter(m => m.location === location)
      .forEach(member => {
        if (
          member.name.toLowerCase().includes(lowerQuery) ||
          member.email.toLowerCase().includes(lowerQuery) ||
          member.phone.includes(lowerQuery)
        ) {
          searchResults.push({
            id: member.id,
            type: 'member',
            title: member.name,
            subtitle: `Member • ${member.membershipType} • ${member.email}`,
            icon: <User size={20} className="text-blue-600" />,
            action: () => {
              onNavigate('leads-members', member.id);
              onClose();
            },
          });
        }
      });

    getAllLeads()
      .filter(l => l.location === location)
      .forEach(lead => {
        if (
          lead.name.toLowerCase().includes(lowerQuery) ||
          lead.email.toLowerCase().includes(lowerQuery) ||
          lead.phone.includes(lowerQuery)
        ) {
          searchResults.push({
            id: lead.id,
            type: 'lead',
            title: lead.name,
            subtitle: `Lead • ${lead.status} • ${lead.email}`,
            icon: <Users size={20} className="text-green-600" />,
            action: () => {
              onNavigate('leads-members', lead.id);
              onClose();
            },
          });
        }
      });

    getAllClassPackClients()
      .filter(c => c.location === location)
      .forEach(client => {
        if (
          client.name.toLowerCase().includes(lowerQuery) ||
          client.email.toLowerCase().includes(lowerQuery) ||
          client.phone.includes(lowerQuery)
        ) {
          searchResults.push({
            id: client.id,
            type: 'class-pack',
            title: client.name,
            subtitle: `Class Pack • ${client.packType} • ${client.remainingClasses} classes left`,
            icon: <User size={20} className="text-purple-600" />,
            action: () => {
              onNavigate('leads-members', client.id);
              onClose();
            },
          });
        }
      });

    getAllDropInClients()
      .filter(d => d.location === location)
      .forEach(client => {
        if (
          client.name.toLowerCase().includes(lowerQuery) ||
          client.email.toLowerCase().includes(lowerQuery) ||
          client.phone.includes(lowerQuery)
        ) {
          searchResults.push({
            id: client.id,
            type: 'drop-in',
            title: client.name,
            subtitle: `Drop-In • ${client.totalVisits} visits • ${client.email}`,
            icon: <User size={20} className="text-blue-400" />,
            action: () => {
              onNavigate('leads-members', client.id);
              onClose();
            },
          });
        }
      });

    getAllStaff()
      .filter(s => s.location === location)
      .forEach(staff => {
        if (
          staff.name.toLowerCase().includes(lowerQuery) ||
          staff.email.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: staff.id,
            type: 'staff',
            title: staff.name,
            subtitle: `Staff • ${staff.role} • ${staff.email}`,
            icon: <UserCog size={20} className="text-orange-600" />,
            action: () => {
              onNavigate('staff');
              onClose();
            },
          });
        }
      });

    getAllClasses()
      .filter(c => c.location === location)
      .forEach(cls => {
        if (
          cls.name.toLowerCase().includes(lowerQuery) ||
          cls.dayOfWeek.toLowerCase().includes(lowerQuery) ||
          cls.time.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: cls.id,
            type: 'class',
            title: cls.name,
            subtitle: `Class • ${cls.dayOfWeek} ${cls.time} • ${cls.duration}min`,
            icon: <Calendar size={20} className="text-red-600" />,
            action: () => {
              onNavigate('schedule');
              onClose();
            },
          });
        }
      });

    getAllInvoices().forEach(invoice => {
      const invoiceNumber = `INV-${invoice.id.slice(-6).toUpperCase()}`;
      if (
        invoiceNumber.toLowerCase().includes(lowerQuery) ||
        invoice.memberName.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: invoice.id,
          type: 'invoice',
          title: invoiceNumber,
          subtitle: `Invoice • ${invoice.memberName} • $${invoice.total.toFixed(2)}`,
          icon: <DollarSign size={20} className="text-green-600" />,
          action: () => {
            onNavigate('pos');
            onClose();
          },
        });
      }
    });

    return searchResults.slice(0, 10);
  }, [query, location, onNavigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[600px] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Search members, leads, staff, classes, invoices..."
              className="flex-1 outline-none text-lg"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">Start typing to search...</p>
              <p className="text-sm">Search for members, leads, staff, classes, or invoices</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={result.action}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">{result.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{result.title}</div>
                    <div className="text-sm text-gray-600">{result.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↓</kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
              <span className="ml-1">to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
              <span className="ml-1">to close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
