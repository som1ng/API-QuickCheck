import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import { ModelStatus } from '../../types/scanner';
import { FidelityLevel } from '../../types/batch';
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
      bg: 'bg-[#5db872]/15',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/30',
      label: '正常可用',
      icon: <span className={`${dotSize} rounded-full bg-[#5db872] shadow-sm`} />,
    },
    active: {
      bg: 'bg-[#5db872]/15',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/30',
      label: '有效',
      icon: <span className={`${dotSize} rounded-full bg-[#5db872] shadow-sm`} />,
    },
    supported: {
      bg: 'bg-[#5db872]/15',
      text: 'text-[#5db872]',
      border: 'border-[#5db872]/30',
      label: '已支持',
      icon: <CheckCircle2 className={`${iconSize} text-[#5db872]`} />,
    },
    quota_exhausted: {
      bg: 'bg-[#e8a55a]/15',
      text: 'text-[#e8a55a]',
      border: 'border-[#e8a55a]/30',
      label: '额度不足 (402)',
      icon: <span className={`${dotSize} rounded-full bg-[#e8a55a]`} />,
    },
    rate_limited: {
      bg: 'bg-[#d4a017]/15',
      text: 'text-[#d4a017]',
      border: 'border-[#d4a017]/30',
      label: '限流 (429)',
      icon: <AlertTriangle className={`${iconSize} text-[#d4a017]`} />,
    },
    unauthorized: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/30',
      label: '未授权 (401)',
      icon: <span className={`${dotSize} rounded-full bg-[#c64545]`} />,
    },
    invalid: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/30',
      label: '无效 Key',
      icon: <XCircle className={`${iconSize} text-[#c64545]`} />,
    },
    duplicate: {
      bg: 'bg-[#252320]',
      text: 'text-[#a09d96]',
      border: 'border-[#2e2b27]',
      label: '重复 Key',
      icon: <span className={`${dotSize} rounded-full bg-[#a09d96]`} />,
    },
    not_found: {
      bg: 'bg-[#252320]',
      text: 'text-[#a09d96]',
      border: 'border-[#2e2b27]',
      label: '不存在 (404)',
      icon: <HelpCircle className={`${iconSize} text-[#a09d96]`} />,
    },
    server_error: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/30',
      label: '服务异常 (500)',
      icon: <XCircle className={`${iconSize} text-[#c64545]`} />,
    },
    unsupported: {
      bg: 'bg-[#252320]',
      text: 'text-[#a09d96]',
      border: 'border-[#2e2b27]',
      label: '未支持',
      icon: <span className={`${dotSize} rounded-full bg-[#a09d96]`} />,
    },
    pending: {
      bg: 'bg-[#252320]',
      text: 'text-[#a09d96]',
      border: 'border-[#2e2b27]',
      label: '待测试',
      icon: <Clock className={`${iconSize} text-[#a09d96]`} />,
    },
    testing: {
      bg: 'bg-[#cc785c]/15',
      text: 'text-[#cc785c]',
      border: 'border-[#cc785c]/30',
      label: '测试中',
      icon: <span className={`${dotSize} rounded-full bg-[#cc785c] animate-ping`} />,
    },
    network_error: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/30',
      label: '连接错误',
      icon: <AlertTriangle className={`${iconSize} text-[#c64545]`} />,
    },

    // Fidelity levels
    genuine: {
      bg: 'bg-[#5db872]/15',
      text: 'text-[#5db872] font-semibold',
      border: 'border-[#5db872]/30',
      label: '官方正品',
      icon: <ShieldCheck className={`${iconSize} text-[#5db872]`} />,
    },
    suspect_downgraded: {
      bg: 'bg-[#e8a55a]/15',
      text: 'text-[#e8a55a] font-semibold',
      border: 'border-[#e8a55a]/30',
      label: '疑似降级',
      icon: <AlertTriangle className={`${iconSize} text-[#e8a55a]`} />,
    },
    fake_imposter: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545] font-semibold',
      border: 'border-[#c64545]/30',
      label: '虚假冒充',
      icon: <XCircle className={`${iconSize} text-[#c64545]`} />,
    },
    inconclusive: {
      bg: 'bg-[#252320]',
      text: 'text-[#a09d96]',
      border: 'border-[#2e2b27]',
      label: '证据不充分',
      icon: <HelpCircle className={`${iconSize} text-[#a09d96]`} />,
    },
    error: {
      bg: 'bg-[#c64545]/15',
      text: 'text-[#c64545]',
      border: 'border-[#c64545]/30',
      label: '检测失败',
      icon: <XCircle className={`${iconSize} text-[#c64545]`} />,
    },
  };

  const item = config[status] || {
    bg: 'bg-[#252320]',
    text: 'text-[#faf9f5]',
    border: 'border-[#2e2b27]',
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
