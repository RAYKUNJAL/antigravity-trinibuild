import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ToolStatusBadge } from './ToolStatusBadge';

export interface AITool {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  short_benefit: string;
  best_for: string[];
  price_monthly: number;
  status: string;
  sort_order: number;
}

interface ToolCardProps {
  tool: AITool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <Link
      to={`/ai-tools/${tool.slug}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Wrench size={22} />
        </div>
        <ToolStatusBadge status={tool.status} />
      </div>
      <h3 className="font-semibold text-gray-800 text-base mb-1">{tool.name}</h3>
      <p className="text-sm text-gray-500 mb-3">{tool.short_benefit}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tool.best_for?.slice(0, 3).map((tag) => (
          <Badge key={tag} color="blue">{tag}</Badge>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-sm font-bold text-gray-800">
          {tool.status === 'coming_soon' ? 'Coming Soon' : tool.price_monthly > 0 ? `$${tool.price_monthly}/mo` : 'Free'}
        </span>
        <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Learn more <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
};
