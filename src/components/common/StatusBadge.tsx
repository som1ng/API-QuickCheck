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
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-medium';

  const config: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
    // Model & Key Status
    available: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '正常可用',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />,
    },
    active: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '有效',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />,
    },
    supported: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '已支持',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    quota_exhausted: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a]',
      border: 'border-[#e8a55a]/20',
      label: '额度不足 (402)',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#e8a55a]" />,
    },
    rate_limited: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a]',
      border: 'border-[#e8a55a]/20',
      label: '限流 (429)',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    unauthorized: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '未授权 / Key无效 (401)',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#c64545]" />,
    },
    invalid: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '无效 Key',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    not_found: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '模型不存在 (404)',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
    server_error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '服务异常 (500)',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    unsupported: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '未支持',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#9c9689]" />,
    },
    pending: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '待测试',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    testing: {
      bg: 'bg-[#cc785c]/10',
      text: 'text-[#cc785c]',
      border: 'border-[#cc785c]/20',
      label: '测试中',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c] animate-ping" />,
    },
    network_error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '连接错误',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },

    // Fidelity levels
    genuine: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872] font-medium',
      border: 'border-[#5db872]/30',
      label: '官方原版正品',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    suspect_downgraded: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a] font-medium',
      border: 'border-[#e8a55a]/30',
      label: '疑似降级 / 掺假',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    fake_imposter: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545] font-medium',
      border: 'border-[#c64545]/30',
      label: '伪造 / 冒充模型',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    inconclusive: {
      bg: 'bg-[#23211e]',
      text: 'text-[#d4cebe]',
      border: 'border-[#2e2b27]',
      label: '证据不充分',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
    error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '检测失败',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const item = config[status] || {
    bg: 'bg-[#23211e]',
    text: 'text-[#d4cebe]',
    border: 'border-[#2e2b27]',
    label: status,
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border tracking-tight ${sizeClasses} ${item.bg} ${item.text} ${item.border}`}
    >
      {item.icon}
      <span>{text || item.label}</span>
    </span>
  );
};
