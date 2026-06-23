import React from 'react';
import { Badge } from '../ui/Badge';

interface ToolStatusBadgeProps {
  status: string;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({ status }) => {
  if (status === 'active') {
    return <Badge color="green">Active</Badge>;
  }
  return <Badge color="gray">Coming Soon</Badge>;
};
