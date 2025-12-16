'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { getAllClasses, getAllBookings, getAllMembers, getAllClassPackClients, getAllDropInClients } from '@/lib/dataStore';
import { Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Class } from '@/lib/types';
import BookingModal from './BookingModal';

export default function KioskMode() {
  const { location } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const now = new Date();
  const todayDayName = format(now, 'EEEE');
  
  const todayClasses = classes
    .filter(c => c.dayOfWeek === todayDayName)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center mb-3 sm:mb-4">
            <span className="text-3xl sm:text-5xl font-bold text-white">The LAB</span>
            <span className="text-2xl sm:text-3xl font-semibold text-white">Tampa</span>
          </div>
          <p className="text-lg sm:text-2xl text-gray-300 mb-2">Welcome! Check in to your class</p>
          <p className="text-2xl sm:text-4xl font-bold text-auvora-teal">{format(currentTime, 'h:mm:ss a')}</p>
          <p className="text-base sm:text-xl text-gray-400">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Booking Modal */}
        {selectedClass && (
          <BookingModal
            classData={selectedClass}
            mode="kiosk"
            onClose={() => setSelectedClass(null)}
            onSuccess={() => {
              setRefreshKey(prev => prev + 1);
              setSelectedClass(null);
              setMessage({ type: 'success', text: '✓ Check-in successful!' });
              setTimeout(() => setMessage(null), 3000);
            }}
          />
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-lg text-center text-lg sm:text-2xl font-bold ${
            message.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-auvora-teal text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Today's Classes */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-8 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Today&apos;s Classes - {todayDayName}</h2>
          
          {todayClasses.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-400 text-base sm:text-xl">
              No classes scheduled for {todayDayName}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {todayClasses.map(cls => {
                const classBookings = bookings.filter(b => b.classId === cls.id && b.status !== 'cancelled');
                const checkedIn = classBookings.filter(b => b.status === 'checked-in').length;
                const availableSpots = cls.capacity - classBookings.length;
                
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="p-4 sm:p-6 rounded-lg text-left transition-all bg-gradient-to-br from-auvora-teal to-auvora-teal-dark hover:from-auvora-teal-light hover:to-auvora-teal cursor-pointer transform hover:scale-105 min-h-[120px]"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{cls.name}</h3>
                        <div className="flex items-center gap-2 text-base sm:text-lg text-gray-200">
                          <Clock size={18} className="sm:w-5 sm:h-5" />
                          <span>{cls.time}</span>
                          <span>•</span>
                          <span>{cls.duration} min</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm sm:text-lg">
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
        <div className="mt-6 sm:mt-8 text-center text-gray-500 text-base sm:text-lg">
          <p>Need help? Please see the front desk</p>
        </div>
      </div>
    </div>
  );
}
