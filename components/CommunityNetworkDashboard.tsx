'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Award,
  MapPin,
  Store,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Star,
  CheckCircle,
  Send,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  store_name: string;
  category: string;
  location: string;
  avatar_url: string | null;
  trust_score: number;
  success_stories: number;
  joined_at: string;
  is_verified: boolean;
}

export default function CommunityNetworkDashboard() {
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'forum' | 'stories'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    // Mock data for now - will connect to real database
    const mockMembers: Member[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        store_name: 'Island Fashion Boutique',
        category: 'fashion',
        location: 'Port of Spain',
        avatar_url: null,
        trust_score: 98,
        success_stories: 3,
        joined_at: '2026-01-15',
        is_verified: true,
      },
      {
        id: '2',
        name: 'Marcus Rodriguez',
        store_name: 'Trini Tech Hub',
        category: 'electronics',
        location: 'San Fernando',
        avatar_url: null,
        trust_score: 95,
        success_stories: 2,
        joined_at: '2026-02-01',
        is_verified: true,
      },
      {
        id: '3',
        name: 'Aisha Mohammed',
        store_name: 'Doubles & More',
        category: 'food',
        location: 'Chaguanas',
        avatar_url: null,
        trust_score: 92,
        success_stories: 4,
        joined_at: '2025-12-10',
        is_verified: false,
      },
    ];
    
    setMembers(mockMembers);
    setLoading(false);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'handmade', label: 'Arts & Crafts' },
    { value: 'services', label: 'Services' },
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.store_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || member.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black font-inter bg-gradient-to-r from-trini-red to-red-700 bg-clip-text text-transparent mb-2">
                TriniBuild Community
              </h1>
              <p className="text-gray-600 font-inter">
                Connect with 2,847 Trinidad & Tobago entrepreneurs
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-black font-inter flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>2,847 Members</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'members', label: 'Members Board', icon: Users },
              { id: 'chat', label: 'Business Chat', icon: MessageCircle },
              { id: 'forum', label: 'Community Forum', icon: MessageSquare },
              { id: 'stories', label: 'Success Stories', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-full font-bold font-inter flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-trini-red text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Members Board */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members or stores..."
                  className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-3 rounded-full border-2 border-gray-200 focus:border-trini-red outline-none font-inter font-bold bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: '2,847', icon: Users, color: 'from-blue-500 to-blue-700' },
                { label: 'Active Today', value: '342', icon: TrendingUp, color: 'from-green-500 to-green-700' },
                { label: 'Success Stories', value: '128', icon: Award, color: 'from-yellow-500 to-yellow-700' },
                { label: 'Verified Stores', value: '1,204', icon: CheckCircle, color: 'from-purple-500 to-purple-700' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-100"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black font-inter mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-inter">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-trini-red transition-all"
                >
                  {/* Avatar and Verification */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-trini-red to-red-700 rounded-full flex items-center justify-center text-white font-black text-2xl font-inter">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black font-inter">{member.name}</h3>
                          {member.is_verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-inter">{member.store_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-inter">
                      <MapPin className="w-4 h-4" />
                      <span>{member.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-inter">
                      <Store className="w-4 h-4" />
                      <span className="capitalize">{member.category}</span>
                    </div>
                  </div>

                  {/* Trust Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold font-inter text-gray-700">Trust Score</span>
                      <span className="text-sm font-black font-inter text-green-600">{member.trust_score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{ width: `${member.trust_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Success Stories */}
                  {member.success_stories > 0 && (
                    <div className="flex items-center gap-2 mb-4 bg-yellow-50 rounded-lg px-3 py-2">
                      <Star className="w-4 h-4 text-yellow-600 fill-current" />
                      <span className="text-sm font-bold font-inter text-yellow-900">
                        {member.success_stories} Success {member.success_stories === 1 ? 'Story' : 'Stories'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-trini-red text-white px-4 py-2 rounded-full font-bold font-inter hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button className="px-4 py-2 border-2 border-gray-200 rounded-full hover:border-trini-red transition-colors">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Business Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-black font-inter mb-3">Messages</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 outline-none font-inter text-sm"
                    />
                  </div>
                </div>
                
                {/* Conversation Items */}
                <div>
                  {filteredMembers.slice(0, 5).map((member) => (
                    <button
                      key={member.id}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-trini-red to-red-700 rounded-full flex items-center justify-center text-white font-black font-inter">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold font-inter truncate">{member.name}</h4>
                            <span className="text-xs text-gray-500 font-inter">2h ago</span>
                          </div>
                          <p className="text-sm text-gray-600 font-inter truncate">
                            Hey! Interested in collaborating...
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-trini-red to-red-700 rounded-full flex items-center justify-center text-white font-black font-inter">
                      S
                    </div>
                    <div>
                      <h4 className="font-bold font-inter">Sarah Chen</h4>
                      <p className="text-xs text-gray-600 font-inter">Island Fashion Boutique</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 max-w-xs shadow-sm">
                        <p className="text-sm font-inter">
                          Hi! I saw you're also in Port of Spain. Would love to collaborate on a fashion event!
                        </p>
                        <span className="text-xs text-gray-500 font-inter mt-1 block">10:30 AM</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="bg-trini-red text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-xs shadow-sm">
                        <p className="text-sm font-inter">
                          That sounds great! I'm definitely interested. When are you thinking?
                        </p>
                        <span className="text-xs text-white/80 font-inter mt-1 block">10:45 AM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                    />
                    <button className="bg-trini-red text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Forum */}
        {activeTab === 'forum' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black font-inter">Recent Discussions</h2>
              <button className="bg-trini-red text-white px-6 py-3 rounded-full font-bold font-inter hover:bg-red-700 transition-colors">
                New Topic
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Best shipping partners in Trinidad?',
                  author: 'Marcus Rodriguez',
                  category: 'Logistics',
                  replies: 23,
                  views: 145,
                  time: '2 hours ago',
                },
                {
                  title: 'How to handle COD payments efficiently?',
                  author: 'Aisha Mohammed',
                  category: 'Payments',
                  replies: 18,
                  views: 92,
                  time: '5 hours ago',
                },
                {
                  title: 'Success! Hit $10K in first month',
                  author: 'Sarah Chen',
                  category: 'Success Stories',
                  replies: 45,
                  views: 312,
                  time: '1 day ago',
                },
              ].map((topic, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-trini-red transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold font-inter">
                          {topic.category}
                        </span>
                        <span className="text-sm text-gray-500 font-inter">{topic.time}</span>
                      </div>
                      <h3 className="text-lg font-black font-inter mb-2">{topic.title}</h3>
                      <p className="text-sm text-gray-600 font-inter">by {topic.author}</p>
                    </div>
                    
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-lg font-black font-inter text-trini-red">{topic.replies}</div>
                        <div className="text-xs text-gray-500 font-inter">Replies</div>
                      </div>
                      <div>
                        <div className="text-lg font-black font-inter text-gray-700">{topic.views}</div>
                        <div className="text-xs text-gray-500 font-inter">Views</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Success Stories */}
        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black font-inter mb-2">Community Success Stories</h2>
              <p className="text-gray-600 font-inter">
                Real results from Trinidad & Tobago entrepreneurs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  author: 'Sarah Chen',
                  store: 'Island Fashion Boutique',
                  achievement: 'First $10K Month',
                  story: 'Started with just 20 products in January. By focusing on quality photos and fast shipping, we hit $10K in sales by March!',
                  revenue: '$10,247',
                  timeline: '3 months',
                },
                {
                  author: 'Marcus Rodriguez',
                  store: 'Trini Tech Hub',
                  achievement: 'Quit Day Job',
                  story: 'Left my corporate job after 6 months of consistent growth. Now making 2x my old salary selling phones and accessories.',
                  revenue: '$15,000/mo',
                  timeline: '6 months',
                },
              ].map((story, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border-2 border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-trini-gold to-yellow-600 rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black font-inter text-xl">{story.achievement}</h3>
                      <p className="text-sm text-gray-600 font-inter">{story.author} • {story.store}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 font-inter mb-6 italic">
                    "{story.story}"
                  </p>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black font-inter text-green-700">{story.revenue}</div>
                      <div className="text-xs text-green-600 font-inter">Revenue</div>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black font-inter text-blue-700">{story.timeline}</div>
                      <div className="text-xs text-blue-600 font-inter">Timeline</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
