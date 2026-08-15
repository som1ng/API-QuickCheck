import React, { useState } from 'react';
import { GlobalConfigBar } from '../layout/GlobalConfigBar';
import { FidelityTab } from './FidelityTab';
import { BenchmarkTab } from './BenchmarkTab';
import { BatchScannerTab } from './BatchScannerTab';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

type SubTab = 'fidelity' | 'benchmark' | 'scanner';

interface SubTabItem {
  id: SubTab;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

const SUB_TABS: SubTabItem[] = [
  {
    id: 'fidelity',
    label: '真伪鉴别与掺假分析',
    subLabel: '私钥验签 · 思维链提取 · 拓扑指纹',
    icon: ShieldCheck,
  },
  {
    id: 'benchmark',
    label: 'TTFT 首字与流式测速',
    subLabel: '流式抖动 · 真实 TPS · 延迟方差',
    icon: Zap,
  },
  {
    id: 'scanner',
    label: '全模型并发可用性巡检',
    subLabel: '多路由探活 · 状态码透传 · 自动探测',
    icon: Layers,
  },
];

export const HomeRelayTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('fidelity');

  return (
    <div className="space-y-10">
      {/* ── 1. Workbench Title & Introduction ── */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b1a18] border border-[#2e2b27] text-xs font-mono text-[#cc785c]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gateway Diagnostic & Benchmark Workbench</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#faf9f5] tracking-tight">
              AI 中转站综合体检工作台
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#9c9689] max-w-3xl leading-relaxed">
              针对各大第三方 AI API 中转站与网关，提供<strong>密码学私钥验签</strong>、<strong>原生思维链 Delta 提取</strong>、<strong>流式首字测速</strong>与<strong>全量模型并发探活</strong>。
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Unified Endpoint & Model Configuration Bar ── */}
      <GlobalConfigBar />

      {/* ── 3. Spacious Sub-Navigation Switcher ── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-[#1b1a18] border border-[#2e2b27]">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex items-start gap-3.5 p-4 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#23211e] text-[#faf9f5] shadow-sm border border-[#cc785c]/40'
                    : 'text-[#9c9689] hover:text-[#d4cebe] hover:bg-[#201e1b] border border-transparent'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#cc785c] text-[#faf9f5]'
                      : 'bg-[#141413] border border-[#2e2b27] text-[#9c9689]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">
                    {tab.label}
                  </div>
                  <div className="text-xs text-[#9c9689] mt-0.5 truncate">
                    {tab.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 4. Tab Content Area ── */}
        <div className="pt-2">
          {subTab === 'fidelity' && (
            <ErrorBoundary fallbackTitle="真伪鉴别模块异常">
              <FidelityTab />
            </ErrorBoundary>
          )}
          {subTab === 'benchmark' && (
            <ErrorBoundary fallbackTitle="性能测速模块异常">
              <BenchmarkTab />
            </ErrorBoundary>
          )}
          {subTab === 'scanner' && (
            <ErrorBoundary fallbackTitle="模型巡检模块异常">
              <BatchScannerTab />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};
