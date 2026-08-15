import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subValue,
  icon,
  status = 'neutral',
  highlight = false,
}) => {
  const statusStyles = {
    success: 'text-[#5db872]',
    warning: 'text-[#e8a55a]',
    error: 'text-[#c64545]',
    neutral: 'text-[#faf9f5]',
  };

  return (
    <div
      className={`relative rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md transition-all hover:border-[#cc785c]/40 ${
        highlight ? 'ring-1 ring-[#cc785c]/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#9c9689] font-medium">{label}</span>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight font-mono ${statusStyles[status]}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-[#9c9689] font-mono">{unit}</span>}
      </div>

      {subValue && (
        <div className="mt-2 text-xs text-[#9c9689]">{subValue}</div>
      )}
    </div>
  );
};
