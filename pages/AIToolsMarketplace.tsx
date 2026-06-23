import React, { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ToolGrid } from '../components/ai-tools/ToolGrid';
import { ToolCategoryFilter } from '../components/ai-tools/ToolCategoryFilter';
import { Spinner } from '../components/ui/Spinner';
import type { AITool } from '../components/ai-tools/ToolCard';

export const AIToolsMarketplace: React.FC = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [filtered, setFiltered] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('ai_tools')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) {
          setTools(data);
          setFiltered(data);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = tools;
    if (category !== 'All') result = result.filter((t) => t.category === category);
    if (search) result = result.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [category, search, tools]);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm mb-4">
            <Sparkles size={14} /> AI-Powered Business Tools
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">The Caribbean Business Operating System</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">AI-powered tools to help your business get online, get discovered, get paid, and grow.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI tools..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category filter */}
        <ToolCategoryFilter activeCategory={category} onChange={setCategory} />

        {/* Tools grid */}
        <div className="mt-6 mb-12">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length > 0 ? (
            <ToolGrid tools={filtered} />
          ) : (
            <p className="text-center text-gray-500 py-12">No tools found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
