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
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
    neutral: 'text-neutral-100',
  };

  return (
    <div
      className={`relative rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-sm smooth-card ${
        highlight ? 'ring-1 ring-[#cc785c]/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-300 font-semibold tracking-wide uppercase">{label}</span>
        {icon && <div className="text-neutral-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-normal font-mono ${statusStyles[status]}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-neutral-400 font-mono font-medium">{unit}</span>}
      </div>

      {subValue && (
        <div className="mt-2 text-xs text-[#faf9f5] font-mono font-medium tracking-wide bg-white/5 border border-white/10 px-2 py-0.5 rounded-md inline-block shadow-sm">
          {subValue}
        </div>
      )}
    </div>
  );
};
