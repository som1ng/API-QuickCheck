import React, { useState } from 'react';
import { GlobalConfigBar } from '../layout/GlobalConfigBar';
import { FidelityTab } from './FidelityTab';
import { BatchScannerTab } from './BatchScannerTab';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ShieldCheck, Layers, Sparkles } from 'lucide-react';

type SubTab = 'fidelity' | 'scanner';

interface SubTabItem {
  id: SubTab;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

const SUB_TABS: SubTabItem[] = [
  {
    id: 'fidelity',
    label: '真伪鉴别与全维体检',
    subLabel: '首字响应速度 (TTFT) · 原生思维链 · 私钥验签 · 掺假击穿',
    icon: ShieldCheck,
  },
  {
    id: 'scanner',
    label: '全模型并发可用性巡检',
    subLabel: '5 线程并发探活 · 真实状态码透传 · 异常路由捕获',
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
          <span>AI Gateway Comprehensive Diagnostic Workbench</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-medium text-[#faf9f5] tracking-tight">
              AI 中转站综合体检工作台
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#9c9689] max-w-3xl leading-relaxed">
              针对各大第三方 AI API 中转站，一站式聚合<strong>首字速度 (TTFT) 测速</strong>、<strong>密码学私钥验签</strong>、<strong>原生思维链 Delta 提取</strong>与<strong>全量模型并发巡检</strong>。
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Unified Endpoint & Model Configuration Bar ── */}
      <GlobalConfigBar />

      {/* ── 3. 2-Card Spacious Sub-Navigation Switcher ── */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1.5 rounded-2xl bg-[#1b1a18] border border-[#2e2b27]">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex items-start gap-4 p-5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#23211e] text-[#faf9f5] shadow-md border border-[#cc785c]/40'
                    : 'text-[#9c9689] hover:text-[#d4cebe] hover:bg-[#201e1b] border border-transparent'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#cc785c] text-[#faf9f5] shadow-sm'
                      : 'bg-[#141413] border border-[#2e2b27] text-[#9c9689]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-semibold truncate">
                    {tab.label}
                  </div>
                  <div className="text-xs sm:text-sm text-[#9c9689] mt-0.5 truncate">
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
