import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, FileText, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { StatCard } from '../components/dashboard/StatCard';
import { UpgradeCTA } from '../components/dashboard/UpgradeCTA';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({ tools: 0, generations: 0, profile: 'Pending' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) { setLoading(false); return; }

      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.user.id);
      const businessId = businesses?.[0]?.id;

      const { count: toolCount } = await supabase.from('business_tool_activations').select('*', { count: 'exact', head: true }).eq('business_id', businessId || '');
      const { count: genCount } = await supabase.from('ai_generations').select('*', { count: 'exact', head: true }).eq('business_id', businessId || '');

      setStats({
        tools: toolCount || 0,
        generations: genCount || 0,
        profile: businessId ? 'Complete' : 'Pending',
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back to your Caribbean Business OS.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wrench} label="Active AI Tools" value={stats.tools} />
        <StatCard icon={FileText} label="AI Generations" value={stats.generations} color="text-teal-600" />
        <StatCard icon={Building2} label="Business Profile" value={stats.profile} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/ai-tools"><Button variant="secondary" fullWidth>Browse AI Tools</Button></Link>
            <Link to="/dashboard/business/new"><Button variant="ghost" fullWidth>Create Business Profile</Button></Link>
            <Link to="/dashboard/tools"><Button variant="ghost" fullWidth>View My Tools</Button></Link>
          </div>
        </div>
        <UpgradeCTA />
      </div>
    </div>
  );
};
