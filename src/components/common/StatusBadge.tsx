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
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-semibold' : 'px-3.5 py-1 text-sm font-semibold';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  const config: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
    // Model & Key Status
    available: {
      bg: 'bg-[#064e3b]',
      text: 'text-[#6ee7b7]',
      border: 'border-[#059669]',
      label: '正常可用',
      icon: <span className={`${dotSize} rounded-full bg-[#6ee7b7] shadow-sm`} />,
    },
    active: {
      bg: 'bg-[#064e3b]',
      text: 'text-[#6ee7b7]',
      border: 'border-[#059669]',
      label: '有效',
      icon: <span className={`${dotSize} rounded-full bg-[#6ee7b7] shadow-sm`} />,
    },
    supported: {
      bg: 'bg-[#064e3b]',
      text: 'text-[#6ee7b7]',
      border: 'border-[#059669]',
      label: '已支持',
      icon: <CheckCircle2 className={`${iconSize} text-[#6ee7b7]`} />,
    },
    quota_exhausted: {
      bg: 'bg-[#451a03]',
      text: 'text-[#fcd34d]',
      border: 'border-[#d97706]',
      label: '额度不足 (402)',
      icon: <span className={`${dotSize} rounded-full bg-[#fcd34d]`} />,
    },
    rate_limited: {
      bg: 'bg-[#451a03]',
      text: 'text-[#fcd34d]',
      border: 'border-[#d97706]',
      label: '限流 (429)',
      icon: <AlertTriangle className={`${iconSize} text-[#fcd34d]`} />,
    },
    unauthorized: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af]',
      border: 'border-[#e11d48]',
      label: '未授权 (401)',
      icon: <span className={`${dotSize} rounded-full bg-[#fda4af]`} />,
    },
    invalid: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af]',
      border: 'border-[#e11d48]',
      label: '无效 Key',
      icon: <XCircle className={`${iconSize} text-[#fda4af]`} />,
    },
    not_found: {
      bg: 'bg-[#23211e]',
      text: 'text-[#faf9f5]',
      border: 'border-[#44403c]',
      label: '不存在 (404)',
      icon: <HelpCircle className={`${iconSize} text-[#faf9f5]`} />,
    },
    server_error: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af]',
      border: 'border-[#e11d48]',
      label: '服务异常 (500)',
      icon: <XCircle className={`${iconSize} text-[#fda4af]`} />,
    },
    unsupported: {
      bg: 'bg-[#23211e]',
      text: 'text-[#faf9f5]',
      border: 'border-[#44403c]',
      label: '未支持',
      icon: <span className={`${dotSize} rounded-full bg-[#faf9f5]`} />,
    },
    pending: {
      bg: 'bg-[#23211e]',
      text: 'text-[#faf9f5]',
      border: 'border-[#44403c]',
      label: '待测试',
      icon: <Clock className={`${iconSize} text-[#faf9f5]`} />,
    },
    testing: {
      bg: 'bg-[#431407]',
      text: 'text-[#fdba74]',
      border: 'border-[#ea580c]',
      label: '测试中',
      icon: <span className={`${dotSize} rounded-full bg-[#fdba74] animate-ping`} />,
    },
    network_error: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af]',
      border: 'border-[#e11d48]',
      label: '连接错误',
      icon: <AlertTriangle className={`${iconSize} text-[#fda4af]`} />,
    },

    // Fidelity levels
    genuine: {
      bg: 'bg-[#064e3b]',
      text: 'text-[#6ee7b7] font-semibold',
      border: 'border-[#059669]',
      label: '官方正品',
      icon: <ShieldCheck className={`${iconSize} text-[#6ee7b7]`} />,
    },
    suspect_downgraded: {
      bg: 'bg-[#451a03]',
      text: 'text-[#fcd34d] font-semibold',
      border: 'border-[#d97706]',
      label: '疑似降级',
      icon: <AlertTriangle className={`${iconSize} text-[#fcd34d]`} />,
    },
    fake_imposter: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af] font-semibold',
      border: 'border-[#e11d48]',
      label: '虚假冒充',
      icon: <XCircle className={`${iconSize} text-[#fda4af]`} />,
    },
    inconclusive: {
      bg: 'bg-[#23211e]',
      text: 'text-[#faf9f5]',
      border: 'border-[#44403c]',
      label: '证据不充分',
      icon: <HelpCircle className={`${iconSize} text-[#faf9f5]`} />,
    },
    error: {
      bg: 'bg-[#4c0519]',
      text: 'text-[#fda4af]',
      border: 'border-[#e11d48]',
      label: '检测失败',
      icon: <XCircle className={`${iconSize} text-[#fda4af]`} />,
    },
  };

  const item = config[status] || {
    bg: 'bg-[#23211e]',
    text: 'text-[#faf9f5]',
    border: 'border-[#44403c]',
    label: status,
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border tracking-wide select-none shadow-sm ${sizeClasses} ${item.bg} ${item.text} ${item.border}`}
    >
      {item.icon}
      <span>{text || item.label}</span>
    </span>
  );
};
