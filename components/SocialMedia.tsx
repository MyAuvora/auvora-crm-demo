'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { Facebook, Instagram, Twitter, Linkedin, Calendar, Send, Image, Video, Clock, CheckCircle } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: ('facebook' | 'instagram' | 'twitter' | 'linkedin')[];
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const getSamplePosts = (): SocialPost[] => {
  const now = Date.now();
  return [
    {
      id: 'post-1',
      platform: ['facebook', 'instagram'],
      content: '💪 New class alert! Join us for High-Intensity Interval Training every Monday and Wednesday at 6 PM. First class is FREE for new members! #FitnessGoals #YourBusiness Tampa',
      mediaType: 'image',
      status: 'published',
      publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: 45,
        comments: 12,
        shares: 8
      }
    },
    {
      id: 'post-2',
      platform: ['instagram', 'facebook'],
      content: '🎉 Member spotlight! Congratulations to Sarah on completing her 100th class with us! Your dedication inspires us all. Keep crushing it! 💯 #MemberSpotlight #FitnessJourney',
      mediaType: 'image',
      status: 'published',
      publishedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: 78,
        comments: 23,
        shares: 15
      }
    },
    {
      id: 'post-3',
      platform: ['facebook', 'instagram', 'twitter'],
      content: '⚡ Flash Sale! Get 20% off all class packs this week only. Limited time offer - don\'t miss out! Book now at thelabtampa.com #FitnessSale #LimitedOffer',
      status: 'scheduled',
      scheduledFor: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

export default function SocialMedia() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'published'>('compose');
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'instagram' | 'twitter' | 'linkedin')[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [posts] = useState<SocialPost[]>(() => getSamplePosts());

  const locationName = location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio';

  const platforms = [
    { id: 'facebook' as const, name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'instagram' as const, name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'twitter' as const, name: 'Twitter', icon: Twitter, color: 'bg-sky-500' },
    { id: 'linkedin' as const, name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' }
  ];

  const togglePlatform = (platformId: 'facebook' | 'instagram' | 'twitter' | 'linkedin') => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = () => {
    if (!postContent.trim() || selectedPlatforms.length === 0) {
      alert('Please enter content and select at least one platform');
      return;
    }

    const isScheduled = scheduleDate && scheduleTime;
    const message = isScheduled
      ? `Post scheduled for ${scheduleDate} at ${scheduleTime} on ${selectedPlatforms.join(', ')}`
      : `Post published immediately to ${selectedPlatforms.join(', ')}`;

    alert(`${message}\n\nContent:\n"${postContent}"\n\nNote: This is a demo - no actual posts were made.`);
    setPostContent('');
    setSelectedPlatforms([]);
    setScheduleDate('');
    setScheduleTime('');
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published').sort((a, b) => 
    new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Social Media</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and schedule posts for {locationName}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'compose'
                  ? 'text-auvora-teal border-b-2 border-auvora-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send size={16} className="sm:w-5 sm:h-5" />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'scheduled'
                  ? 'text-auvora-teal border-b-2 border-auvora-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={16} className="sm:w-5 sm:h-5" />
              Scheduled ({scheduledPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'published'
                  ? 'text-auvora-teal border-b-2 border-auvora-teal'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle size={16} className="sm:w-5 sm:h-5" />
              Published
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'compose' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Select Platforms</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                          isSelected
                            ? `${platform.color} text-white border-transparent`
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon size={24} className="sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
                        <p className="font-medium text-center text-xs sm:text-sm">{platform.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Post Content</h3>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening at Your Business?"
                  rows={6}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-auvora-gold resize-none"
                />
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  {postContent.length} characters
                </p>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Media (Optional)</h3>
                <div className="flex gap-3 sm:gap-4">
                  <button className="flex-1 p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors min-h-[80px]">
                    <Image size={24} className="sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" aria-label="Add image" />
                    <p className="text-xs sm:text-sm text-gray-600 text-center">Add Image</p>
                  </button>
                  <button className="flex-1 p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors min-h-[80px]">
                    <Video size={24} className="sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                    <p className="text-xs sm:text-sm text-gray-600 text-center">Add Video</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Schedule (Optional)</h3>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-auvora-gold"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handlePublish}
                disabled={!postContent.trim() || selectedPlatforms.length === 0}
                className="w-full bg-auvora-teal text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base hover:bg-auvora-teal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
                {scheduleDate && scheduleTime ? 'Schedule Post' : 'Publish Now'}
              </button>
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Scheduled Posts</h3>
              {scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex gap-2 mb-3">
                        {post.platform.map((p) => {
                          const platform = platforms.find(pl => pl.id === p);
                          if (!platform) return null;
                          const Icon = platform.icon;
                          return (
                            <div key={p} className={`${platform.color} text-white px-2 py-1 rounded text-xs flex items-center gap-1`}>
                              <Icon size={12} />
                              {platform.name}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        Scheduled for: {new Date(post.scheduledFor!).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No scheduled posts</p>
              )}
            </div>
          )}

          {activeTab === 'published' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Published Posts</h3>
              {publishedPosts.length > 0 ? (
                <div className="space-y-4">
                  {publishedPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex gap-2 mb-3">
                        {post.platform.map((p) => {
                          const platform = platforms.find(pl => pl.id === p);
                          if (!platform) return null;
                          const Icon = platform.icon;
                          return (
                            <div key={p} className={`${platform.color} text-white px-2 py-1 rounded text-xs flex items-center gap-1`}>
                              <Icon size={12} />
                              {platform.name}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Published: {new Date(post.publishedAt!).toLocaleString()}
                        </div>
                        {post.engagement && (
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>❤️ {post.engagement.likes}</span>
                            <span>💬 {post.engagement.comments}</span>
                            <span>🔄 {post.engagement.shares}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No published posts yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
