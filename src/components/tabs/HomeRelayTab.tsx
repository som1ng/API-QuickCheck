import React, { useState } from 'react';
import { GlobalConfigBar } from '../layout/GlobalConfigBar';
import { FidelityTab } from './FidelityTab';
import { BenchmarkTab } from './BenchmarkTab';
import { BatchScannerTab } from './BatchScannerTab';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ShieldCheck, Zap, ListFilter, Sparkles, CheckCircle2 } from 'lucide-react';

export const HomeRelayTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'fidelity' | 'benchmark' | 'scanner'>('fidelity');

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── 1. Hero Headline ── */}
      <div className="text-center sm:text-left space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#23211e] border border-[#2e2b27] text-xs font-mono text-[#cc785c]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>全能 AI API 中转站综合体检工作台</span>
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#faf9f5] tracking-tight">
          Trusted AI Gateways
        </h1>
        <p className="text-sm sm:text-base text-[#9c9689] max-w-3xl leading-relaxed">
          聚合<strong>官方私钥加密签名验真</strong>、<strong>原生思维链 Delta 提取</strong>、<strong>TTFT 首字流式测速</strong> 与 <strong>模型全量并发巡检</strong>。一站式击穿中转站套壳伪装与虚标欺诈。
        </p>
      </div>

      {/* ── 2. Unified API Configuration Card ── */}
      <GlobalConfigBar />

      {/* ── 3. Sub-Module Diagnostic Tabs Bar ── */}
      <div className="space-y-6">
        <div className="border-b border-[#2e2b27] pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 p-1 bg-[#1b1a18] rounded-xl border border-[#2e2b27]">
            <button
              type="button"
              onClick={() => setSubTab('fidelity')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                subTab === 'fidelity'
                  ? 'bg-[#cc785c] text-[#faf9f5] shadow-md'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>真伪模型与掺水鉴别</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('benchmark')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                subTab === 'benchmark'
                  ? 'bg-[#cc785c] text-[#faf9f5] shadow-md'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>TTFT 首字与流式测速</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('scanner')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                subTab === 'scanner'
                  ? 'bg-[#cc785c] text-[#faf9f5] shadow-md'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>模型全量并发巡检</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5db872] font-mono font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>内存直连 · 零数据落盘保障</span>
          </div>
        </div>

        {/* ── 4. Sub-Tab Content Rendering ── */}
        <div>
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
            <ErrorBoundary fallbackTitle="模型全量巡检模块异常">
              <BatchScannerTab />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};
