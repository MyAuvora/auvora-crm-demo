'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { getAllClasses, getAllBookings, checkInMember, getAllMembers, getAllClassPackClients, getAllDropInClients } from '@/lib/dataStore';
import { Search, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import PersonStatusBadge from './PersonStatusBadge';

export default function KioskMode() {
  const { location } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string; type: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const classes = getAllClasses().filter(c => c.location === location);
  const bookings = getAllBookings();
  const members = getAllMembers().filter(m => m.location === location);
  const packClients = getAllClassPackClients().filter(c => c.location === location);
  const dropInClients = getAllDropInClients().filter(d => d.location === location);

  const allPeople = [
    ...members.map(m => ({ id: m.id, name: m.name, type: 'member' as const, email: m.email })),
    ...packClients.map(c => ({ id: c.id, name: c.name, type: 'pack' as const, email: c.email })),
    ...dropInClients.map(d => ({ id: d.id, name: d.name, type: 'drop-in' as const, email: d.email }))
  ];

  const filteredPeople = searchTerm.length >= 2 
    ? allPeople.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const now = new Date();
  const todayClasses = classes.filter(c => {
    return true;
  }).sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const handleCheckIn = () => {
    if (!selectedPerson) {
      setMessage({ type: 'error', text: 'Please search and select a member first' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = checkInMember(selectedPerson.id);
    
    if (result.success) {
      setMessage({ type: 'success', text: `✓ ${selectedPerson.name} checked in successfully!` });
      setSelectedPerson(null);
      setSearchTerm('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <span className="text-5xl font-bold text-white">The LAB</span>
            <span className="text-3xl font-semibold text-white">Tampa</span>
          </div>
          <p className="text-2xl text-gray-300 mb-2">Welcome! Check in to your class</p>
          <p className="text-4xl font-bold text-red-500">{format(currentTime, 'h:mm:ss a')}</p>
          <p className="text-xl text-gray-400">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-6 rounded-lg text-center text-2xl font-bold ${
            message.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 shadow-2xl">
          <div className="mb-6">
            <label className="block text-2xl font-bold text-white mb-4">
              Search Your Name or Email
            </label>
            <div className="relative">
              <Search className="absolute left-6 top-6 text-gray-400" size={32} />
              <input
                type="text"
                placeholder="Start typing your name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPerson(null);
                }}
                className="w-full pl-20 pr-6 py-6 text-2xl bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-4 focus:ring-red-600 focus:border-red-600"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="mt-4">
              {filteredPeople.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xl">
                  No members found. Please check your spelling or see the front desk.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPeople.map(person => (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className={`w-full text-left p-6 rounded-lg transition-all ${
                        selectedPerson?.id === person.id
                          ? 'bg-red-600 text-white scale-105'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PersonStatusBadge personId={person.id} />
                        <div>
                          <div className="text-2xl font-bold">{person.name}</div>
                          <div className="text-lg text-gray-300">{person.email}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedPerson && (
            <div className="mt-6 p-6 bg-green-900 rounded-lg border-2 border-green-500">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-400" size={32} />
                <div>
                  <p className="text-xl text-green-300">Selected:</p>
                  <p className="text-3xl font-bold text-white">{selectedPerson.name}</p>
                </div>
              </div>
              <p className="text-lg text-green-300">Now select your class below to check in</p>
            </div>
          )}
        </div>

        {/* Today's Classes */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">Today&apos;s Classes</h2>
          
          {todayClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xl">
              No classes scheduled for today
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayClasses.map(cls => {
                const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
                const checkedIn = classBookings.filter(b => b.status === 'checked-in').length;
                const availableSpots = cls.capacity - classBookings.length;
                
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleCheckIn(cls.id)}
                    disabled={!selectedPerson}
                    className={`p-6 rounded-lg text-left transition-all ${
                      selectedPerson
                        ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 cursor-pointer transform hover:scale-105'
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{cls.name}</h3>
                        <div className="flex items-center gap-2 text-lg text-gray-200">
                          <Clock size={20} />
                          <span>{cls.time}</span>
                          <span>•</span>
                          <span>{cls.duration} min</span>
                        </div>
                      </div>
                      {selectedPerson && (
                        <CheckCircle className="text-white" size={40} />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-lg">
                      <div className="text-gray-200">
                        <span className="font-semibold">{checkedIn}</span> checked in
                      </div>
                      <div className={`font-bold ${availableSpots > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {availableSpots > 0 ? `${availableSpots} spots left` : 'Full'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-lg">
          <p>Need help? Please see the front desk</p>
        </div>
      </div>
    </div>
  );
}
