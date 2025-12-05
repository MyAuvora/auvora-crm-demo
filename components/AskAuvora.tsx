'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { parseQuery, EXAMPLE_QUERIES } from '@/lib/agent/queryEngine';
import { analyzePromoPerformance, analyzeRevenue, analyzeCancellations, generateInsights, rankCoachesByCancellations, rankMembersByActivity, computeMemberFrequency, filterMembersByFrequency } from '@/lib/agent/analytics';
import { getAllTransactions, getAllPromotions, getMembershipCancellations, getAllMembers, getAllBookings, getAllClasses, getAllStaff } from '@/lib/dataStore';
import { generateStrategicPlan, parseTimeframe } from '@/lib/agent/strategicPlanner';
import { computeRevenueRecommendations } from '@/lib/agent/recommendations';
import { useApp } from '@/lib/context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  citations?: string[];
}

interface AskAuvoraProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AskAuvora({ isOpen, onClose }: AskAuvoraProps) {
  const { location, chatQuery, setChatQuery } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Auvora, your AI business consultant (Frequency v1). I specialize in revenue optimization, member retention, and operational efficiency for fitness businesses.\n\nI can help you:\n• Generate revenue recommendations with ROI projections\n• Analyze performance metrics and identify opportunities\n• Rank coaches and members by key metrics\n• Provide strategic planning and forecasts\n• Answer specific business questions with data-driven insights\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && chatQuery && !hasAutoSentRef.current && !isProcessing) {
      hasAutoSentRef.current = true;
      setInput(chatQuery);
      setChatQuery(null);
      
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    }
  }, [isOpen, chatQuery, setChatQuery, isProcessing]);

  useEffect(() => {
    if (!isOpen) {
      hasAutoSentRef.current = false;
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    const parsed = parseQuery(input);
    
    setTimeout(() => {
      let response: Message;

      try {
        const transactions = getAllTransactions();
        const promotions = getAllPromotions();
        const cancellations = getMembershipCancellations();
        const members = getAllMembers();
        const bookings = getAllBookings();
        const classes = getAllClasses();
        const staff = getAllStaff();

        const now = new Date();
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        if (parsed.intent === 'member_frequency_analysis' && parsed.params.frequency) {
          const freq = parsed.params.frequency;
          
          const frequencyStats = computeMemberFrequency(bookings, {
            period: freq.period,
            metric: freq.metric,
            timeRange: parsed.params.timeRange
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
          
          let content = `**${result.count} members** ${metricText} ${operatorText} ${freq.value} times ${periodText} on average.\n\n`;
          
          content += `📊 **Analysis Details:**\n`;
          content += `• Timeframe: ${result.summary.timeframeDescription}\n`;
          content += `• Total members analyzed: ${result.summary.totalMembersAnalyzed}\n`;
          content += `• Based on actual ${freq.metric === 'checkins' ? 'check-ins' : 'bookings'}\n\n`;
          
          if (freq.returnList || result.count <= 10) {
            content += `**Members in this group:**\n`;
            const membersToShow = result.members.slice(0, 10);
            membersToShow.forEach((member, idx) => {
              const avg = freq.period === 'week' ? member.avgPerWeek : member.avgPerMonth;
              content += `${idx + 1}. ${member.memberName} - ${avg.toFixed(1)} ${periodText}\n`;
            });
            
            if (result.count > 10) {
              content += `\n...and ${result.count - 10} more members.\n`;
            }
          } else {
            content += `💡 **Want to see the list?** Ask me "Show me the list of members who attend ${operatorText} ${freq.value} times ${periodText}"\n`;
          }
          
          if (result.count > 0) {
            content += `\n**What you can do:**\n`;
            if (freq.operator === 'at_least' && freq.value >= 3) {
              content += `• These are your most engaged members - consider loyalty rewards\n`;
              content += `• Ask them for referrals or testimonials\n`;
              content += `• Invite them to try new classes or programs\n`;
            } else if (freq.operator === 'at_most' && freq.value <= 1) {
              content += `• These members may be at risk - consider re-engagement campaigns\n`;
              content += `• Send personalized check-in messages\n`;
              content += `• Offer incentives to increase attendance\n`;
            }
          }
          
          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: result,
            citations: ['Booking records', 'Member data'],
          };
        } else if (parsed.intent === 'list_promotions') {
          const timeRange = parsed.params.timeRange || { start: twelveMonthsAgo, end: now, description: 'Past 12 months' };
          const promoPerformance = analyzePromoPerformance(transactions, timeRange);

          if (promoPerformance.length === 0) {
            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find any promotions with tracked performance in the ${timeRange.description.toLowerCase()}.`,
            };
          } else {
            const top3 = promoPerformance.slice(0, 3);
            let content = `Here are the top performing promotions from the ${timeRange.description.toLowerCase()}:\n\n`;
            
            top3.forEach((promo, idx) => {
              content += `**${idx + 1}. ${promo.promoName}**\n`;
              content += `• Revenue: $${promo.totalRevenue.toFixed(0)}\n`;
              content += `• Transactions: ${promo.totalTransactions}\n`;
              content += `• Conversion Rate: ${(promo.conversionRate * 100).toFixed(1)}%\n`;
              content += `• ROI: ${promo.roi.toFixed(1)}x\n\n`;
            });

            content += `**Key Insight:** ${top3[0].promoName} was your best performer with $${top3[0].totalRevenue.toFixed(0)} in revenue and ${(top3[0].conversionRate * 100).toFixed(1)}% conversion rate.`;

            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content,
              data: promoPerformance,
              citations: ['Transaction history', 'Promotion records'],
            };
          }
        } else if (parsed.intent === 'list_cancellations') {
          const timeRange = parsed.params.timeRange || { start: threeMonthsAgo, end: now, description: 'Past 3 months' };
          const analysis = analyzeCancellations(
            cancellations.map(c => ({
              cancellationDate: c.cancellationDate,
              reason: c.reason || 'Not specified',
              tenure: 6, // Estimate
            })),
            members.length,
            timeRange
          );

          let content = `Found ${analysis.totalCancellations} cancellations in the ${timeRange.description.toLowerCase()}.\n\n`;
          
          if (analysis.topReasons.length > 0) {
            content += `**Top Cancellation Reasons:**\n`;
            analysis.topReasons.slice(0, 3).forEach((reason, idx) => {
              content += `${idx + 1}. ${reason.reason} (${reason.count} members, ${reason.percentage.toFixed(0)}%)\n`;
            });
            content += `\n`;
          }

          content += `**Cancellation Rate:** ${analysis.cancellationRate.toFixed(1)}%\n`;
          content += `**Average Tenure:** ${analysis.avgTenure.toFixed(1)} months\n\n`;

          if (analysis.topReasons.length > 0) {
            const topReason = analysis.topReasons[0];
            content += `**Recommendation:** Focus on addressing "${topReason.reason}" which accounts for ${topReason.percentage.toFixed(0)}% of cancellations.`;
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: analysis,
            citations: ['Cancellation records', 'Member data'],
          };
        } else if (parsed.intent === 'analyze_revenue') {
          const timeRange = parsed.params.timeRange;
          const analysis = analyzeRevenue(transactions, timeRange);

          let content = `**Revenue Analysis**\n\n`;
          content += `• Total Revenue: $${analysis.totalRevenue.toFixed(0)}\n`;
          content += `• Average Monthly: $${analysis.avgMonthlyRevenue.toFixed(0)}\n`;
          content += `• Growth Rate: ${analysis.growthRate > 0 ? '+' : ''}${analysis.growthRate.toFixed(1)}%\n`;
          content += `• Trend: ${analysis.trend === 'up' ? '📈 Growing' : analysis.trend === 'down' ? '📉 Declining' : '➡️ Stable'}\n\n`;

          if (analysis.byCategory.length > 0) {
            content += `**Revenue by Category:**\n`;
            analysis.byCategory.forEach(cat => {
              content += `• ${cat.category}: $${cat.revenue.toFixed(0)} (${cat.percentage.toFixed(0)}%)\n`;
            });
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: analysis,
            citations: ['Transaction history'],
          };
        } else if (parsed.intent === 'recommend_promo') {
          const currentMonth = now.getMonth();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          
          let content = `For ${monthNames[currentMonth]}, I recommend:\n\n`;

          if (currentMonth === 0) {
            content += `**New Year Resolution Campaign**\n`;
            content += `• Discount: 20% off first month\n`;
            content += `• Duration: 14 days\n`;
            content += `• Reasoning: January sees 40% higher conversion rates\n`;
            content += `• Projected Impact: 30-50 new members\n`;
          } else if (currentMonth >= 5 && currentMonth <= 7) {
            content += `**Summer Retention Campaign**\n`;
            content += `• Offer: Membership freeze option\n`;
            content += `• Duration: 30 days\n`;
            content += `• Reasoning: Summer has 50% higher churn\n`;
            content += `• Projected Impact: Prevent 10-15 cancellations\n`;
          } else if (currentMonth === 8) {
            content += `**Back to School Special**\n`;
            content += `• Discount: 15% off\n`;
            content += `• Duration: 14 days\n`;
            content += `• Reasoning: September sees 30% increase in signups\n`;
            content += `• Projected Impact: 20-30 new members\n`;
          } else {
            content += `**Flash Sale**\n`;
            content += `• Discount: 20% off class packs\n`;
            content += `• Duration: 7 days\n`;
            content += `• Reasoning: Flash sales have 41% conversion rate\n`;
            content += `• Projected Impact: $2,000-3,000 in revenue\n`;
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            citations: ['Historical promo performance', 'Seasonal trends'],
          };
        } else if (parsed.intent === 'strategic_plan') {
          const timeframe = parseTimeframe(input);
          const plan = generateStrategicPlan(location, timeframe);
          
          let content = `**📊 Strategic Plan**\n\n`;
          content += `${plan.summary}\n\n`;
          
          content += `**📈 Forecast for ${plan.forecast.month}**\n`;
          content += `• Revenue: $${plan.forecast.revenue.toFixed(0)}\n`;
          content += `• Confidence: ${(plan.forecast.confidence * 100).toFixed(0)}%\n`;
          content += `• Seasonality Factor: ${plan.forecast.seasonalityFactor}x\n`;
          content += `• Trend: ${plan.forecast.trend === 'up' ? '📈 Growing' : plan.forecast.trend === 'down' ? '📉 Declining' : '➡️ Stable'}\n\n`;
          
          if (plan.risks.length > 0) {
            content += `**⚠️ Key Risks**\n`;
            plan.risks.slice(0, 3).forEach((risk, idx) => {
              const icon = risk.type === 'high' ? '🔴' : risk.type === 'medium' ? '🟡' : '🟢';
              content += `${icon} **${risk.title}**\n`;
              content += `   ${risk.description}\n`;
              content += `   *Mitigation:* ${risk.mitigation}\n\n`;
            });
          }
          
          content += `**🎯 Top Recommendations**\n`;
          plan.recommendations.slice(0, 3).forEach((rec, idx) => {
            content += `**${idx + 1}. ${rec.title}** (${rec.priority} priority)\n`;
            content += `   *Why:* ${rec.reasoning}\n`;
            content += `   *Impact:* ${rec.projectedImpact}\n`;
            content += `   *Confidence:* ${(rec.confidence * 100).toFixed(0)}%\n\n`;
          });
          
          content += `**📌 Key Metrics**\n`;
          content += `• Current Revenue: $${plan.keyMetrics.currentRevenue.toFixed(0)}\n`;
          content += `• Forecast Revenue: $${plan.keyMetrics.forecastRevenue.toFixed(0)}\n`;
          content += `• Revenue Gap: $${plan.keyMetrics.revenueGap.toFixed(0)}\n`;
          content += `• At-Risk Members: ${plan.keyMetrics.atRiskMembers}\n`;
          content += `• Churn Rate: ${plan.keyMetrics.churnRate.toFixed(1)}%\n`;
          content += `• Top Promo: ${plan.keyMetrics.topPromo}\n\n`;
          
          content += `**📋 Assumptions**\n`;
          plan.forecast.assumptions.forEach(assumption => {
            content += `• ${assumption}\n`;
          });

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: plan,
            citations: plan.citations,
          };
        } else if (parsed.intent === 'revenue_recommendations') {
          const plan = computeRevenueRecommendations(
            transactions,
            members,
            bookings,
            classes,
            promotions
          );

          let content = `EXECUTIVE SUMMARY\n${plan.executiveSummary}\n\n`;
          content += `CURRENT SITUATION\n`;
          content += `• Current Revenue: $${plan.currentRevenue.toFixed(0)}\n`;
          content += `• Target Revenue: $${plan.targetRevenue.toFixed(0)}\n`;
          if (plan.gap > 0) {
            content += `• Gap: $${plan.gap.toFixed(0)} (${plan.gapPercentage.toFixed(0)}%)\n`;
          }
          content += `\n${plan.seasonalContext}\n\n`;

          content += `TOP RECOMMENDED ACTIONS\n\n`;
          plan.recommendations.forEach((rec, idx) => {
            content += `${idx + 1}. ${rec.title}\n`;
            content += `   Priority: ${'⭐'.repeat(4 - rec.priority)}\n`;
            content += `   Why Now: ${rec.whyNow}\n\n`;
            content += `   Segment: ${rec.segmentSize} ${rec.segmentDescription}\n`;
            content += `   Timeline: ${rec.timelineDays} days\n\n`;
            content += `   Steps:\n`;
            rec.steps.forEach((step, stepIdx) => {
              content += `   ${stepIdx + 1}. ${step}\n`;
            });
            content += `\n`;
            content += `   Projected Impact: $${rec.projectedImpact.toFixed(0)}\n`;
            content += `   Formula: ${rec.segmentSize} × ${(rec.assumedConversionRate * 100).toFixed(0)}% CR × $${rec.arpu.toFixed(0)} ARPU = $${rec.projectedImpact.toFixed(0)}\n`;
            content += `   Confidence: ${(rec.confidence * 100).toFixed(0)}%\n\n`;
            content += `   Risk: ${rec.risk}\n`;
            content += `   Mitigation: ${rec.mitigation}\n\n`;
          });

          const totalImpact = plan.recommendations.reduce((sum, r) => sum + r.projectedImpact, 0);
          content += `TOTAL PROJECTED IMPACT: $${totalImpact.toFixed(0)}\n\n`;

          content += `ASSUMPTIONS\n`;
          plan.assumptions.forEach(assumption => {
            content += `• ${assumption}\n`;
          });
          content += `\n`;

          content += `NEXT STEPS\n`;
          if (plan.recommendations.length > 0) {
            const topRec = plan.recommendations[0];
            content += `I recommend starting with "${topRec.title}" as it has the highest priority and can be executed in ${topRec.timelineDays} days.\n\n`;
            content += `Would you like me to help you execute this action? I can draft the messaging, identify the segment, or provide more details.`;
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: plan,
            citations: ['Transaction history', 'Member data', 'Class bookings', 'Historical performance'],
          };
        } else if (parsed.intent === 'rank_coaches_cancellations') {
          const timeRange = parsed.params.timeRange || { start: oneMonthAgo, end: now, description: 'Past month' };
          const rankings = rankCoachesByCancellations(bookings, classes, staff, timeRange);

          if (rankings.length === 0) {
            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find any coach data with cancellations in the ${timeRange.description.toLowerCase()}.`,
            };
          } else {
            const top5 = rankings.slice(0, 5);
            let content = `Here are the coaches ranked by cancellations in the ${timeRange.description.toLowerCase()}:\n\n`;
            
            top5.forEach((coach, idx) => {
              content += `**${idx + 1}. ${coach.coachName}**\n`;
              content += `• Cancellations: ${coach.cancellationCount}\n`;
              content += `• Total Bookings: ${coach.totalBookings}\n`;
              content += `• Cancellation Rate: ${coach.cancellationRate.toFixed(1)}%\n\n`;
            });

            if (rankings.length > 0) {
              const topCoach = rankings[0];
              content += `**Key Insight:** ${topCoach.coachName} has the most cancellations with ${topCoach.cancellationCount} cancelled/no-show bookings (${topCoach.cancellationRate.toFixed(1)}% rate).`;
            }

            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content,
              data: rankings,
              citations: ['Booking records', 'Class schedule', 'Staff data'],
            };
          }
        } else if (parsed.intent === 'rank_members_activity') {
          const timeRange = parsed.params.timeRange || { start: oneMonthAgo, end: now, description: 'Past month' };
          const rankings = rankMembersByActivity(bookings, members, timeRange, 'checkins');

          if (rankings.length === 0) {
            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find any member activity data in the ${timeRange.description.toLowerCase()}.`,
            };
          } else {
            const top5 = rankings.slice(0, 5);
            let content = `Here are the most active members by check-ins in the ${timeRange.description.toLowerCase()}:\n\n`;
            
            top5.forEach((member, idx) => {
              content += `**${idx + 1}. ${member.memberName}**\n`;
              content += `• Check-ins: ${member.count}\n`;
              if (member.lastActivity) {
                const lastDate = new Date(member.lastActivity);
                content += `• Last Activity: ${lastDate.toLocaleDateString()}\n`;
              }
              content += `\n`;
            });

            if (rankings.length > 0) {
              const topMember = rankings[0];
              content += `**Key Insight:** ${topMember.memberName} is the most active member with ${topMember.count} check-ins in the ${timeRange.description.toLowerCase()}.`;
            }

            response = {
              id: Date.now().toString(),
              role: 'assistant',
              content,
              data: rankings,
              citations: ['Booking records', 'Member data'],
            };
          }
        } else if (parsed.intent === 'analyze_churn') {
          const timeRange = parsed.params.timeRange || { start: threeMonthsAgo, end: now, description: 'Past 3 months' };
          const analysis = analyzeCancellations(
            cancellations.map(c => ({
              cancellationDate: c.cancellationDate,
              reason: c.reason || 'Not specified',
              tenure: 6,
            })),
            members.length,
            timeRange
          );

          let content = `**Churn Analysis for ${timeRange.description}**\n\n`;
          content += `• Total Cancellations: ${analysis.totalCancellations}\n`;
          content += `• Churn Rate: ${analysis.cancellationRate.toFixed(1)}%\n`;
          content += `• Average Tenure: ${analysis.avgTenure.toFixed(1)} months\n\n`;

          if (analysis.topReasons.length > 0) {
            content += `**Top Reasons:**\n`;
            analysis.topReasons.slice(0, 3).forEach((reason, idx) => {
              content += `${idx + 1}. ${reason.reason} (${reason.count} members, ${reason.percentage.toFixed(0)}%)\n`;
            });
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: analysis,
            citations: ['Cancellation records', 'Member data'],
          };
        } else if (parsed.intent === 'analyze_attendance') {
          const checkedInBookings = bookings.filter(b => b.status === 'checked-in');
          const totalBookings = bookings.length;
          const attendanceRate = totalBookings > 0 ? (checkedInBookings.length / totalBookings) * 100 : 0;

          const classAttendance = new Map<string, { total: number; checkedIn: number }>();
          bookings.forEach(b => {
            if (!classAttendance.has(b.classId)) {
              classAttendance.set(b.classId, { total: 0, checkedIn: 0 });
            }
            const stats = classAttendance.get(b.classId)!;
            stats.total++;
            if (b.status === 'checked-in') {
              stats.checkedIn++;
            }
          });

          const classRates = Array.from(classAttendance.entries())
            .map(([classId, stats]) => {
              const cls = classes.find(c => c.id === classId);
              return {
                className: cls?.name || 'Unknown Class',
                rate: stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0,
                total: stats.total,
                checkedIn: stats.checkedIn,
              };
            })
            .sort((a, b) => b.rate - a.rate);

          let content = `**Attendance Analysis**\n\n`;
          content += `• Overall Attendance Rate: ${attendanceRate.toFixed(1)}%\n`;
          content += `• Total Bookings: ${totalBookings}\n`;
          content += `• Check-ins: ${checkedInBookings.length}\n\n`;

          if (classRates.length > 0) {
            content += `**Top Classes by Attendance:**\n`;
            classRates.slice(0, 5).forEach((cls, idx) => {
              content += `${idx + 1}. ${cls.className}: ${cls.rate.toFixed(1)}% (${cls.checkedIn}/${cls.total})\n`;
            });
          }

          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            data: { attendanceRate, classRates },
            citations: ['Booking records', 'Class schedule'],
          };
        } else {
          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I'm not sure how to answer that specific question. Here's what I can help you with:\n\nREVENUE & GROWTH\n• Generate revenue recommendations with ROI projections\n• Analyze revenue trends and identify opportunities\n• Recommend promotions based on historical performance\n\nMEMBER INSIGHTS\n• Rank members by activity and engagement\n• Identify at-risk members and churn patterns\n• Analyze cancellation reasons and trends\n\nOPERATIONAL ANALYTICS\n• Rank coaches by performance metrics\n• Analyze class attendance and capacity\n• Strategic planning and forecasting\n\nTry asking: 'Give me revenue recommendations' or 'Which coach has the most cancellations?'",
          };
        }
      } catch (error) {
        console.error('Error processing query:', error);
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I encountered an error processing your question. Please try rephrasing it or ask something else.",
        };
      }

      setMessages(prev => [...prev, response]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#AC1305] to-[#8B0F04] text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold">Ask Auvora</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-[#AC1305] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.citations && (
                  <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-600">
                    <strong>Data sources:</strong> {message.citations.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#AC1305] border-t-transparent"></div>
                  <span className="text-gray-600">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example queries */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <div className="text-xs text-gray-600 mb-2">Try these examples:</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(0, 3).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your business..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AC1305]"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-[#AC1305] text-white rounded-lg hover:bg-[#8B0F04] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
