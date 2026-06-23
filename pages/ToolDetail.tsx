import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ArrowLeft, Wrench } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ToolStatusBadge } from '../components/ai-tools/ToolStatusBadge';

export const ToolDetail: React.FC = () => {
  const { slug } = useParams();
  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      supabase
        .from('ai_tools')
        .select('*')
        .eq('slug', slug)
        .single()
        .then(({ data, error }) => {
          if (!error) setTool(data);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!tool) return <div className="text-center py-20">Tool not found.</div>;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/ai-tools" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Back to AI Tools
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600"><Wrench size={28} /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{tool.name}</h1>
                <p className="text-gray-500">{tool.short_benefit}</p>
              </div>
            </div>
            <ToolStatusBadge status={tool.status} />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {tool.best_for?.map((tag: string) => (
              <Badge key={tag} color="blue">{tag}</Badge>
            ))}
          </div>

          <p className="text-gray-600 mb-6">{tool.description}</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Starting at</p>
                <p className="text-3xl font-bold text-gray-800">{tool.status === 'coming_soon' ? 'Coming Soon' : tool.price_monthly > 0 ? `$${tool.price_monthly}/mo` : 'Free'}</p>
              </div>
              <Button disabled={tool.status === 'coming_soon'}>
                {tool.status === 'coming_soon' ? 'Coming Soon' : 'Activate Tool'}
              </Button>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 mb-3">What's Included</h3>
          <ul className="space-y-2 mb-6">
            {['AI-powered generation', 'Save and edit outputs', 'Export and share', 'Mobile-friendly', 'Caribbean business focused'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={16} className="text-green-500" /> {f}
              </li>
            ))}
          </ul>

          <h3 className="font-semibold text-gray-800 mb-3">FAQ</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm text-gray-700">Do I need a credit card?</p>
              <p className="text-sm text-gray-500">No. Free trial requires no payment. Cash and bank transfer supported.</p>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-700">Does this work on my phone?</p>
              <p className="text-sm text-gray-500">Yes. All tools are mobile-first and work perfectly on any device.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
