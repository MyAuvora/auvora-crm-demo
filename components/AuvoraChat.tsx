'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllMembers, getAllClassPackClients, getAllLeads, getAllStaff, getAllClasses, getAllBookings, getAllTransactions } from '@/lib/dataStore';
import { parseQuery } from '@/lib/agent/queryEngine';
import { computeMemberFrequency, filterMembersByFrequency } from '@/lib/agent/analytics';
import { MessageCircle, X, Send } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'auvora';
  timestamp: Date;
};

export default function AuvoraChat() {
  const { chatOpen, setChatOpen, location } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m Auvora, your AI assistant. How can I help you today?',
      sender: 'auvora',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');

  const locationMembers = getAllMembers().filter(m => m.location === location);
  const locationPackClients = getAllClassPackClients().filter(c => c.location === location);
  const locationLeads = getAllLeads().filter(l => l.location === location);
  const locationStaff = getAllStaff().filter(s => s.location === location);
  const locationClasses = getAllClasses().filter(c => c.location === location);
  const allBookings = getAllBookings();
  const allTransactions = getAllTransactions().filter(t => t.location === location);

  const examplePrompts = [
    "Generate a list of all current members.",
    "Show me all membership cancellations from the past 30 days.",
    "Which zip codes do our current members live in?",
    "How many active members does the Athletic Club have?",
    "Show me all class pack clients at the Athletic Club.",
    "Which membership type is most popular right now?",
    "How many leads do we have that never tried a class?",
    "Which coaches have the highest average class size?",
    "Show me all members with a 5-pack who have 1 or 2 classes left.",
    "What is our total number of leads right now?",
    "How many classes are scheduled today?",
    "Which zip codes have the highest concentration of our members?",
    "Show me all members who haven't visited in the last 21 days.",
    "How many new leads came from Instagram?",
    "Give me a quick summary of business health for this month.",
    "What's our total revenue this month?",
    "Show me conversion rate from trials to members.",
    "Which classes have the highest fill rates?",
    "How many transactions used promo codes?"
  ];

  const getResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();

    const parsedQuery = parseQuery(prompt);
    
    if (parsedQuery.intent === 'member_frequency_analysis' && parsedQuery.params.frequency) {
      const freq = parsedQuery.params.frequency;
      
      const frequencyStats = computeMemberFrequency(allBookings, {
        period: freq.period,
        metric: freq.metric,
        timeRange: parsedQuery.params.timeRange
      });
      
      const result = filterMembersByFrequency(frequencyStats, {
        operator: freq.operator,
        value: freq.value,
        period: freq.period
      });
      
      const operatorText = freq.operator === 'at_least' ? 'at least' :
                          freq.operator === 'at_most' ? 'at most' :
                          freq.operator === 'equal' ? 'exactly' : '';
      
      const periodText = freq.period === 'week' ? 'per week' : 'per month';
      const metricText = freq.metric === 'checkins' ? 'check in' : 'book';
      
      let response = `**${result.count} members** ${metricText} ${operatorText} ${freq.value} times ${periodText} on average.\n\n`;
      
      response += `📊 **Analysis Details:**\n`;
      response += `• Timeframe: ${result.summary.timeframeDescription}\n`;
      response += `• Total members analyzed: ${result.summary.totalMembersAnalyzed}\n`;
      response += `• Based on actual ${freq.metric === 'checkins' ? 'check-ins' : 'bookings'}\n\n`;
      
      if (freq.returnList || result.count <= 10) {
        response += `**Members in this group:**\n`;
        const membersToShow = result.members.slice(0, 10);
        membersToShow.forEach((member, idx) => {
          const avg = freq.period === 'week' ? member.avgPerWeek : member.avgPerMonth;
          response += `${idx + 1}. ${member.memberName} - ${avg.toFixed(1)} ${periodText}\n`;
        });
        
        if (result.count > 10) {
          response += `\n...and ${result.count - 10} more members.\n`;
        }
      } else {
        response += `💡 **Want to see the list?** Ask me "Show me the list of members who attend ${operatorText} ${freq.value} times ${periodText}"\n`;
      }
      
      if (result.count > 0) {
        response += `\n**What you can do:**\n`;
        if (freq.operator === 'at_least' && freq.value >= 3) {
          response += `• These are your most engaged members - consider loyalty rewards\n`;
          response += `• Ask them for referrals or testimonials\n`;
          response += `• Invite them to try new classes or programs\n`;
        } else if (freq.operator === 'at_most' && freq.value <= 1) {
          response += `• These members may be at risk - consider re-engagement campaigns\n`;
          response += `• Send personalized check-in messages\n`;
          response += `• Offer incentives to increase attendance\n`;
        }
      }
      
      return response;
    }

    if (lowerPrompt.includes('list') && lowerPrompt.includes('current members')) {
      const total = location === 'athletic-club' 
        ? locationMembers.length + locationPackClients.length
        : locationPackClients.length;
      return `You have ${total} current members at the ${location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}. This includes ${locationMembers.length} membership holders and ${locationPackClients.length} class pack clients.`;
    }

    if (lowerPrompt.includes('cancellation') && lowerPrompt.includes('30 days')) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const cancellations = locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth));
      return `There have been ${cancellations.length} membership cancellations in the past 30 days at the ${location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}.`;
    }

    if (lowerPrompt.includes('zip code')) {
      const zipCounts: { [key: string]: number } = {};
      [...locationMembers, ...locationPackClients].forEach(m => {
        zipCounts[m.zipCode] = (zipCounts[m.zipCode] || 0) + 1;
      });
      const topZips = Object.entries(zipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([zip, count]) => `${zip} (${count} members)`)
        .join(', ');
      return `The top zip codes for your members are: ${topZips}. The highest concentration is in zip codes 33602 and 33606.`;
    }

    if (lowerPrompt.includes('active members') && lowerPrompt.includes('athletic club')) {
      const allMembers = getAllMembers();
      const allPackClients = getAllClassPackClients();
      const total = allMembers.filter(m => m.location === 'athletic-club').length + 
                   allPackClients.filter(c => c.location === 'athletic-club').length;
      return `The Athletic Club has ${total} active members (${allMembers.filter(m => m.location === 'athletic-club').length} membership holders and ${allPackClients.filter(c => c.location === 'athletic-club').length} class pack clients).`;
    }

    if (lowerPrompt.includes('active members') && lowerPrompt.includes('dance studio')) {
      const allPackClients = getAllClassPackClients();
      const total = allPackClients.filter(c => c.location === 'dance-studio').length;
      return `The Dance Studio has ${total} active class pack clients.`;
    }

    if (lowerPrompt.includes('class pack') && lowerPrompt.includes('athletic club')) {
      const allPackClients = getAllClassPackClients();
      const clients = allPackClients.filter(c => c.location === 'athletic-club');
      return `The Athletic Club has ${clients.length} class pack clients. This includes ${clients.filter(c => c.packType === '5-pack').length} with 5-packs, ${clients.filter(c => c.packType === '10-pack').length} with 10-packs, and ${clients.filter(c => c.packType === '20-pack').length} with 20-packs.`;
    }

    if (lowerPrompt.includes('class pack') && lowerPrompt.includes('dance studio')) {
      const allPackClients = getAllClassPackClients();
      const clients = allPackClients.filter(c => c.location === 'dance-studio');
      return `The Dance Studio has ${clients.length} class pack clients. This includes ${clients.filter(c => c.packType === '5-pack').length} with 5-packs, ${clients.filter(c => c.packType === '10-pack').length} with 10-packs, and ${clients.filter(c => c.packType === '20-pack').length} with 20-packs.`;
    }

    if (lowerPrompt.includes('membership type') && lowerPrompt.includes('popular')) {
      const counts = {
        '1x-week': locationMembers.filter(m => m.membershipType === '1x-week').length,
        '2x-week': locationMembers.filter(m => m.membershipType === '2x-week').length,
        'unlimited': locationMembers.filter(m => m.membershipType === 'unlimited').length
      };
      const most = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return `The most popular membership type is ${most[0]} with ${most[1]} members.`;
    }

    if (lowerPrompt.includes('leads') && lowerPrompt.includes('never tried')) {
      const newLeads = locationLeads.filter(l => l.status === 'new-lead');
      return `You have ${newLeads.length} leads who have never tried a class yet.`;
    }

    if (lowerPrompt.includes('cancelled') && lowerPrompt.includes('90 days')) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cancelled = locationLeads.filter(l => l.status === 'cancelled' && new Date(l.createdDate) >= ninetyDaysAgo);
      return `${cancelled.length} former members cancelled in the last 90 days.`;
    }

    if (lowerPrompt.includes('coaches') && lowerPrompt.includes('average class size')) {
      const coaches = locationStaff.filter(s => s.role === 'coach' || s.role === 'instructor');
      const coachStats = coaches.map(coach => {
        const coachClasses = locationClasses.filter(c => c.coachId === coach.id);
        const avgSize = coachClasses.length > 0
          ? Math.round(coachClasses.reduce((sum, c) => sum + c.bookedCount, 0) / coachClasses.length)
          : 0;
        return { name: coach.name, avgSize };
      }).sort((a, b) => b.avgSize - a.avgSize);
      
      const top3 = coachStats.slice(0, 3).map(c => `${c.name} (${c.avgSize} avg)`).join(', ');
      return `The coaches with the highest average class sizes are: ${top3}.`;
    }

    if (lowerPrompt.includes('busiest') && lowerPrompt.includes('days')) {
      const dayCounts: { [key: string]: number } = {};
      locationClasses.forEach(c => {
        dayCounts[c.dayOfWeek] = (dayCounts[c.dayOfWeek] || 0) + c.bookedCount;
      });
      const busiest = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
      return `${busiest[0]} is the busiest day of the week with ${busiest[1]} total check-ins across all classes.`;
    }

    if (lowerPrompt.includes('class types') && lowerPrompt.includes('popular')) {
      const typeCounts: { [key: string]: number } = {};
      locationClasses.forEach(c => {
        typeCounts[c.type] = (typeCounts[c.type] || 0) + c.bookedCount;
      });
      const most = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      return `${most[0]} is the most popular class type with ${most[1]} total bookings.`;
    }

    if (lowerPrompt.includes('5-pack') && (lowerPrompt.includes('1 or 2') || lowerPrompt.includes('low'))) {
      const lowPack = locationPackClients.filter(c => c.packType === '5-pack' && c.remainingClasses <= 2);
      return `${lowPack.length} members with 5-packs have 1 or 2 classes remaining. These members may be good candidates for renewal outreach.`;
    }

    if (lowerPrompt.includes('total') && lowerPrompt.includes('leads')) {
      return `You currently have ${locationLeads.length} total leads at the ${location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}.`;
    }

    if (lowerPrompt.includes('promotion') && lowerPrompt.includes('performance')) {
      return `Your latest active promotion has generated 23 signups and $3,450 in revenue so far. It's performing well compared to previous campaigns.`;
    }

    if (lowerPrompt.includes('classes') && lowerPrompt.includes('today')) {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
      const todayClasses = locationClasses.filter(c => c.dayOfWeek === dayOfWeek);
      return `There are ${todayClasses.length} classes scheduled today (${dayOfWeek}) at the ${location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}.`;
    }

    if (lowerPrompt.includes('haven\'t visited') || lowerPrompt.includes('21 days')) {
      const inactive = locationMembers.filter(m => {
        const lastVisit = new Date(m.lastVisit);
        const daysSince = Math.floor((new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 21;
      });
      return `${inactive.length} members haven't visited in the last 21 days. Consider reaching out to re-engage them.`;
    }

    if (lowerPrompt.includes('zumba')) {
      const zumbaClasses = locationClasses.filter(c => c.type === 'Zumba');
      const totalAttendees = zumbaClasses.reduce((sum, c) => sum + c.bookedCount, 0);
      return `Zumba classes have had ${totalAttendees} total attendees in the past 30 days across ${zumbaClasses.length} weekly classes.`;
    }

    if (lowerPrompt.includes('instructors') && lowerPrompt.includes('most classes')) {
      const instructors = locationStaff.filter(s => s.role === 'instructor' || s.role === 'coach');
      const instructorCounts = instructors.map(i => ({
        name: i.name,
        count: locationClasses.filter(c => c.coachId === i.id).length
      })).sort((a, b) => b.count - a.count);
      
      const top = instructorCounts[0];
      return `${top.name} is teaching the most classes this week with ${top.count} scheduled sessions.`;
    }

    if (lowerPrompt.includes('instagram')) {
      const instagramLeads = locationLeads.filter(l => l.source === 'instagram');
      return `${instagramLeads.length} new leads came from Instagram. It's one of your top lead sources!`;
    }

    if (lowerPrompt.includes('business health') || lowerPrompt.includes('summary')) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const newLeads = locationLeads.filter(l => l.createdDate.startsWith(thisMonth)).length;
      const cancellations = locationLeads.filter(l => l.status === 'cancelled' && l.createdDate.startsWith(thisMonth)).length;
      const total = location === 'athletic-club' 
        ? locationMembers.length + locationPackClients.length
        : locationPackClients.length;
      
      return `Business Health Summary: You have ${total} active members, ${newLeads} new leads this month, and ${cancellations} cancellations. Overall, your business is performing well with strong lead generation and member retention.`;
    }

    if (lowerPrompt.includes('revenue') && lowerPrompt.includes('month')) {
      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.total, 0);
      return `Total revenue this month is $${totalRevenue.toFixed(2)} from ${allTransactions.length} transactions.`;
    }

    if (lowerPrompt.includes('conversion rate')) {
      const trialLeads = locationLeads.filter(l => l.status === 'trial-showed' || l.status === 'joined').length;
      const joinedLeads = locationLeads.filter(l => l.status === 'joined').length;
      const conversionRate = trialLeads > 0 ? (joinedLeads / trialLeads) * 100 : 0;
      return `Your conversion rate from trial to member is ${conversionRate.toFixed(1)}%. ${joinedLeads} members joined out of ${trialLeads} who tried a class.`;
    }

    if (lowerPrompt.includes('fill rate')) {
      const classFillRates = locationClasses.map(cls => {
        const classBookings = allBookings.filter(b => b.classId === cls.id && b.status !== 'cancelled').length;
        const fillRate = cls.capacity > 0 ? (classBookings / cls.capacity) * 100 : 0;
        return { name: `${cls.dayOfWeek} ${cls.time}`, fillRate: Math.round(fillRate) };
      }).sort((a, b) => b.fillRate - a.fillRate);
      
      const top3 = classFillRates.slice(0, 3).map(c => `${c.name} (${c.fillRate}%)`).join(', ');
      return `Classes with highest fill rates: ${top3}. These are your most popular time slots!`;
    }

    if (lowerPrompt.includes('promo code') || lowerPrompt.includes('promotion')) {
      const promoTransactions = allTransactions.filter(t => t.promoCode);
      const promoRevenue = promoTransactions.reduce((sum, t) => sum + t.total, 0);
      return `${promoTransactions.length} transactions used promo codes, generating $${promoRevenue.toFixed(2)} in revenue. Most popular codes: SAVE10, SAVE20, WELCOME.`;
    }

    return "I can help you with information about members, leads, classes, staff, and reports. Try asking me about specific metrics or use one of the suggested prompts below!";
  };

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: `user-${messages.length}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    const response = getResponse(messageText);
    const auvoraMessage: Message = {
      id: `auvora-${messages.length}`,
      text: response,
      sender: 'auvora',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage, auvoraMessage]);
    setInput('');
  };

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="bg-red-600 text-white p-3 sm:p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="sm:w-5 sm:h-5" />
          <h3 className="font-bold text-sm sm:text-base">Ask Auvora</h3>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="hover:bg-red-700 p-1 rounded"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="mb-2 sm:mb-3">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">Suggested prompts:</p>
          <div className="flex flex-wrap gap-1 max-h-16 sm:max-h-20 overflow-y-auto">
            {examplePrompts.slice(0, 6).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] sm:text-xs bg-gray-100 hover:bg-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-700"
              >
                {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-xs sm:text-sm"
          />
          <button
            onClick={() => handleSend()}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Send size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
