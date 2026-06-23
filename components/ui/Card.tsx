import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header, footer, hover }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${hover ? 'transition-shadow hover:shadow-md' : ''} ${className}`}>
      {header && <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">{header}</div>}
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">{footer}</div>}
    </div>
  );
};
