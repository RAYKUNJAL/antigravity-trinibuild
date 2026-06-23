import React from 'react';
import { ToolCard, AITool } from './ToolCard';

interface ToolGridProps {
  tools: AITool[];
}

export const ToolGrid: React.FC<ToolGridProps> = ({ tools }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
};
