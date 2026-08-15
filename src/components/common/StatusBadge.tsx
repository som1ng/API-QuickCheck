import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import { ModelStatus } from '../../types/scanner';
import { FidelityLevel } from '../../types/fidelity';
import { KeyHealthStatus } from '../../types/batchKeys';

type BadgeVariant = ModelStatus | FidelityLevel | KeyHealthStatus | 'supported' | 'unsupported';

interface StatusBadgeProps {
  status: BadgeVariant;
  text?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-medium' : 'px-3.5 py-1 text-sm font-semibold';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  const config: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
    // Model & Key Status
    available: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      label: '正常可用',
      icon: <span className={`${dotSize} rounded-full bg-emerald-400 shadow-sm`} />,
    },
    active: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      label: '有效',
      icon: <span className={`${dotSize} rounded-full bg-emerald-400 shadow-sm`} />,
    },
    supported: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      label: '已支持',
      icon: <CheckCircle2 className={`${iconSize} text-emerald-400`} />,
    },
    quota_exhausted: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      label: '额度不足 (402)',
      icon: <span className={`${dotSize} rounded-full bg-amber-400`} />,
    },
    rate_limited: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      label: '限流 (429)',
      icon: <AlertTriangle className={`${iconSize} text-amber-400`} />,
    },
    unauthorized: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      label: '未授权 (401)',
      icon: <span className={`${dotSize} rounded-full bg-rose-400`} />,
    },
    invalid: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      label: '无效 Key',
      icon: <XCircle className={`${iconSize} text-rose-400`} />,
    },
    not_found: {
      bg: 'bg-white/5',
      text: 'text-neutral-300',
      border: 'border-white/10',
      label: '不存在 (404)',
      icon: <HelpCircle className={`${iconSize} text-neutral-400`} />,
    },
    server_error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      label: '服务异常 (500)',
      icon: <XCircle className={`${iconSize} text-rose-400`} />,
    },
    unsupported: {
      bg: 'bg-white/5',
      text: 'text-neutral-300',
      border: 'border-white/10',
      label: '未支持',
      icon: <span className={`${dotSize} rounded-full bg-neutral-400`} />,
    },
    pending: {
      bg: 'bg-white/5',
      text: 'text-neutral-300',
      border: 'border-white/10',
      label: '待测试',
      icon: <Clock className={`${iconSize} text-neutral-400`} />,
    },
    testing: {
      bg: 'bg-[#cc785c]/10',
      text: 'text-[#cc785c]',
      border: 'border-[#cc785c]/25',
      label: '测试中',
      icon: <span className={`${dotSize} rounded-full bg-[#cc785c] animate-ping`} />,
    },
    network_error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      label: '连接错误',
      icon: <AlertTriangle className={`${iconSize} text-rose-400`} />,
    },

    // Fidelity levels
    genuine: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400 font-semibold',
      border: 'border-emerald-500/30',
      label: '官方正品',
      icon: <ShieldCheck className={`${iconSize} text-emerald-400`} />,
    },
    suspect_downgraded: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400 font-semibold',
      border: 'border-amber-500/30',
      label: '疑似降级',
      icon: <AlertTriangle className={`${iconSize} text-amber-400`} />,
    },
    fake_imposter: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400 font-semibold',
      border: 'border-rose-500/30',
      label: '虚假冒充',
      icon: <XCircle className={`${iconSize} text-rose-400`} />,
    },
    inconclusive: {
      bg: 'bg-white/5',
      text: 'text-neutral-300',
      border: 'border-white/10',
      label: '证据不充分',
      icon: <HelpCircle className={`${iconSize} text-neutral-400`} />,
    },
    error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
      label: '检测失败',
      icon: <XCircle className={`${iconSize} text-rose-400`} />,
    },
  };

  const item = config[status] || {
    bg: 'bg-white/5',
    text: 'text-neutral-300',
    border: 'border-white/10',
    label: status,
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border tracking-wide select-none ${sizeClasses} ${item.bg} ${item.text} ${item.border}`}
    >
      {item.icon}
      <span>{text || item.label}</span>
    </span>
  );
};
