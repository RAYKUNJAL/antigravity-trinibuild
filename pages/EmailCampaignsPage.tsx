import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Users, BarChart3, Zap, Calendar } from 'lucide-react';

export const EmailCampaignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers' | 'templates'>('campaigns');
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: 'Welcome Series',
      status: 'active',
      subscribers: 245,
      openRate: 42,
      clickRate: 12,
      sent: 500
    },
    {
      id: 2,
      name: 'Weekly Deals',
      status: 'scheduled',
      subscribers: 1200,
      openRate: 38,
      clickRate: 8,
      sent: 0
    }
  ]);

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={item}>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Email Marketing
            </h1>
            <p className="text-xl text-gray-600">
              Build customer relationships with targeted email campaigns
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: Users, label: 'Subscribers', value: '2,445' },
            { icon: Send, label: 'Campaigns Sent', value: '12' },
            { icon: BarChart3, label: 'Avg Open Rate', value: '40%' },
            { icon: Zap, label: 'Avg Click Rate', value: '10%' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <Icon className="w-8 h-8 text-[#E61E2B] mb-3" />
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="bg-white rounded-lg shadow-sm border border-gray-200"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <div className="border-b border-gray-200 flex">
            {['campaigns', 'subscribers', 'templates'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 px-6 text-center font-bold transition ${
                  activeTab === tab
                    ? 'text-[#E61E2B] border-b-2 border-[#E61E2B]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'campaigns' && (
              <motion.div variants={container} initial="hidden" animate="visible">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Campaigns</h2>
                  <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                    + New Campaign
                  </button>
                </div>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <motion.div 
                      key={campaign.id}
                      variants={item}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">
                            {campaign.subscribers} subscribers
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Open Rate</p>
                          <p className="text-xl font-bold">{campaign.openRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Click Rate</p>
                          <p className="text-xl font-bold">{campaign.clickRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Emails Sent</p>
                          <p className="text-xl font-bold">{campaign.sent}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'subscribers' && (
              <motion.div variants={item} className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Manage Your Subscribers
                </h3>
                <p className="text-gray-600 mb-6">
                  View and manage your email subscriber list
                </p>
                <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  View Subscribers
                </button>
              </motion.div>
            )}

            {activeTab === 'templates' && (
              <motion.div variants={item} className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Email Templates
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose from professional templates or create your own
                </p>
                <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  Browse Templates
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="mt-16 grid md:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            {
              icon: Send,
              title: 'Easy Campaign Creation',
              desc: 'Drag-and-drop editor makes creating campaigns simple'
            },
            {
              icon: BarChart3,
              title: 'Real-Time Analytics',
              desc: 'Track opens, clicks, and conversions in real-time'
            },
            {
              icon: Zap,
              title: 'Automation',
              desc: 'Set up automated email sequences to convert customers'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <Icon className="w-12 h-12 text-[#E61E2B] mb-4" />
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
