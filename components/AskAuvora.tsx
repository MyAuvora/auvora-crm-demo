'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { parseQuery, EXAMPLE_QUERIES } from '@/lib/agent/queryEngine';
import { analyzePromoPerformance, analyzeRevenue, analyzeCancellations, generateInsights } from '@/lib/agent/analytics';
import { getAllTransactions, getAllPromotions, getMembershipCancellations, getAllMembers } from '@/lib/dataStore';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Auvora, your AI business assistant. I can help you analyze your business data, answer questions about performance, and provide recommendations. Try asking me:\n\n• Which promos worked best in the past 12 months?\n• Show me all cancellations from the past 3 months\n• What is our revenue this month?\n• Why are cancellations up?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

        const now = new Date();
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (parsed.intent === 'list_promotions') {
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
        } else {
          response = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I'm not sure how to answer that. Try asking me about:\n• Promotion performance\n• Cancellations and churn\n• Revenue analysis\n• Promo recommendations",
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
