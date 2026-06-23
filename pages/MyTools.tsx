import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Plus } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { EmptyState } from '../components/dashboard/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export const MyTools: React.FC = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.user?.id);
      const bid = businesses?.[0]?.id;
      if (bid) {
        const { data } = await supabase
          .from('business_tool_activations')
          .select('*, ai_tools(*)')
          .eq('business_id', bid);
        setTools(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My AI Tools</h1>
      {tools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools activated yet"
          description="Browse the AI Tools marketplace and activate your first tool to get started."
          actionLabel="Browse AI Tools"
          onAction={() => window.location.hash = '#/ai-tools'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((t) => (
            <Link
              key={t.id}
              to={`/dashboard/tools/${t.ai_tools?.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Wrench size={18} /></div>
                <Badge color="green">{t.plan}</Badge>
              </div>
              <h3 className="font-semibold text-gray-800">{t.ai_tools?.name}</h3>
              <p className="text-sm text-gray-500">{t.ai_tools?.short_benefit}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
