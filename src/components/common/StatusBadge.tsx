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
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm font-medium';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  const config: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
    // Model & Key Status
    available: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '正常可用',
      icon: <span className={`${dotSize} rounded-full bg-[#5db872]`} />,
    },
    active: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '有效',
      icon: <span className={`${dotSize} rounded-full bg-[#5db872]`} />,
    },
    supported: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/20',
      label: '已支持',
      icon: <CheckCircle2 className={iconSize} />,
    },
    quota_exhausted: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a]',
      border: 'border-[#e8a55a]/20',
      label: '额度不足 (402)',
      icon: <span className={`${dotSize} rounded-full bg-[#e8a55a]`} />,
    },
    rate_limited: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a]',
      border: 'border-[#e8a55a]/20',
      label: '限流 (429)',
      icon: <AlertTriangle className={iconSize} />,
    },
    unauthorized: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '未授权 / Key无效 (401)',
      icon: <span className={`${dotSize} rounded-full bg-[#c64545]`} />,
    },
    invalid: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '无效 Key',
      icon: <XCircle className={iconSize} />,
    },
    not_found: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '模型不存在 (404)',
      icon: <HelpCircle className={iconSize} />,
    },
    server_error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '服务异常 (500)',
      icon: <XCircle className={iconSize} />,
    },
    unsupported: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '未支持',
      icon: <span className={`${dotSize} rounded-full bg-[#9c9689]`} />,
    },
    pending: {
      bg: 'bg-[#23211e]',
      text: 'text-[#9c9689]',
      border: 'border-[#2e2b27]',
      label: '待测试',
      icon: <Clock className={iconSize} />,
    },
    testing: {
      bg: 'bg-[#cc785c]/10',
      text: 'text-[#cc785c]',
      border: 'border-[#cc785c]/20',
      label: '测试中',
      icon: <span className={`${dotSize} rounded-full bg-[#cc785c] animate-ping`} />,
    },
    network_error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '连接错误',
      icon: <AlertTriangle className={iconSize} />,
    },

    // Fidelity levels
    genuine: {
      bg: 'bg-[#5db872]/10',
      text: 'text-[#5db872] font-medium',
      border: 'border-[#5db872]/30',
      label: '官方原版正品',
      icon: <ShieldCheck className={iconSize} />,
    },
    suspect_downgraded: {
      bg: 'bg-[#e8a55a]/10',
      text: 'text-[#e8a55a] font-medium',
      border: 'border-[#e8a55a]/30',
      label: '疑似降级 / 掺假',
      icon: <AlertTriangle className={iconSize} />,
    },
    fake_imposter: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545] font-medium',
      border: 'border-[#c64545]/30',
      label: '伪造 / 冒充模型',
      icon: <XCircle className={iconSize} />,
    },
    inconclusive: {
      bg: 'bg-[#23211e]',
      text: 'text-[#d4cebe]',
      border: 'border-[#2e2b27]',
      label: '证据不充分',
      icon: <HelpCircle className={iconSize} />,
    },
    error: {
      bg: 'bg-[#c64545]/10',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/20',
      label: '检测失败',
      icon: <XCircle className={iconSize} />,
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
      className={`inline-flex items-center gap-2 rounded-lg border tracking-tight ${sizeClasses} ${item.bg} ${item.text} ${item.border}`}
    >
      {item.icon}
      <span>{text || item.label}</span>
    </span>
  );
};
