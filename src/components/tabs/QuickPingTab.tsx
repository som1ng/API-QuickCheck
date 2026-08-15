import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseRawKeysInput, runBatchKeyTestPool } from '../../engine/batchKeys/keyPoolTester';
import { BatchKeySummary, KeyCheckResult } from '../../types/batchKeys';
import { StatusBadge } from '../common/StatusBadge';
import { ProviderIcon } from '../common/ProviderLogos';
import {
  Play,
  Copy,
  Check,
  Search,
  Settings,
  ChevronDown,
  Loader2,
  Inbox,
  Square,
  KeyRound,
} from 'lucide-react';

interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  category: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'openai', name: 'OpenAI (官方)', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', category: '官方' },
  { id: 'anthropic', name: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-7-sonnet-20250219', category: '官方' },
  { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash', category: '官方' },
  { id: 'deepseek', name: 'DeepSeek (官方)', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', category: '官方' },
  { id: 'groq', name: 'Groq (超高速)', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', category: '聚合加速' },
  { id: 'cerebras', name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b', category: '聚合加速' },
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', category: '国内' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o', category: '聚合' },
  { id: 'custom', name: '自定义中转站 / 代理 URL', baseUrl: '', defaultModel: 'gpt-4o', category: '自定义' },
];

export const QuickPingTab: React.FC = () => {
  const { state } = useApp();
  const { config } = state;

  // Selected Provider Preset
  const [selectedProvider, setSelectedProvider] = useState<ProviderPreset>(PROVIDER_PRESETS[0]);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(config.baseUrl || 'https://api.openai.com/v1');
  const [testModel, setTestModel] = useState<string>('gpt-4o');
  const [isStreamCheck, setIsStreamCheck] = useState<boolean>(false);
  const [concurrency, setConcurrency] = useState<number>(5);

  // Search & Dropdowns
  const [showProviderDropdown, setShowProviderDropdown] = useState<boolean>(false);
  const [providerSearchQuery, setProviderSearchQuery] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Raw Input & Testing State
  const [rawKeysText, setRawKeysText] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [summary, setSummary] = useState<BatchKeySummary | null>(null);
  const [progress, setProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [activeFilterTab, setActiveFilterTab] = useState<'active' | 'quota_exhausted' | 'rate_limited' | 'invalid' | 'duplicate'>('active');

  // Copy feedback
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleSelectProvider = (p: ProviderPreset) => {
    setSelectedProvider(p);
    if (p.baseUrl) {
      setCustomBaseUrl(p.baseUrl);
    }
    if (p.defaultModel) {
      setTestModel(p.defaultModel);
    }
    setShowProviderDropdown(false);
  };

  const handleStartTesting = async () => {
    const { uniqueKeys, duplicates } = parseRawKeysInput(rawKeysText);
    const totalCount = uniqueKeys.length + duplicates.length;

    if (totalCount === 0) {
      alert('请在文本框中粘贴至少一个待检测的 API Key');
      return;
    }

    const targetUrl = selectedProvider.id === 'custom' ? customBaseUrl : selectedProvider.baseUrl || customBaseUrl;
    if (!targetUrl) {
      alert('请输入有效的 Base URL 地址');
      return;
    }

    setIsRunning(true);
    setProgress({ total: uniqueKeys.length, completed: 0 });
    setSummary(null);

    abortRef.current = new AbortController();

    try {
      const result = await runBatchKeyTestPool(
        targetUrl,
        uniqueKeys,
        testModel,
        concurrency,
        isStreamCheck,
        undefined,
        (_item, completed) => {
          setProgress({ total: uniqueKeys.length, completed });
        },
        abortRef.current.signal
      );

      // Re-attach duplicates
      result.duplicates = duplicates;
      result.duplicateCount = duplicates.length;
      result.total = totalCount;

      setSummary(result);
      // Auto-switch to tab with items
      if (result.activeCount > 0) setActiveFilterTab('active');
      else if (result.exhaustedCount > 0) setActiveFilterTab('quota_exhausted');
      else if (result.rateLimitedCount > 0) setActiveFilterTab('rate_limited');
      else if (result.invalidCount > 0) setActiveFilterTab('invalid');
      else if (result.duplicateCount > 0) setActiveFilterTab('duplicate');
    } catch (err: unknown) {
      alert(`检测异常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsRunning(false);
    }
  };

  const getFilteredItems = (): (KeyCheckResult | { key: string; status: 'duplicate'; errorMessage: string })[] => {
    if (!summary) return [];
    if (activeFilterTab === 'duplicate') {
      return summary.duplicates.map((k) => ({
        key: k,
        status: 'duplicate' as const,
        errorMessage: '列表中存在相同 Key，已自动排重',
      }));
    }
    return summary.results.filter((r) => r.status === activeFilterTab);
  };

  const handleCopyCurrentTabKeys = async () => {
    const items = getFilteredItems();
    if (items.length === 0) return;
    const text = items.map((i) => i.key).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleCopySingleKey = async (key: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyIndex(idx);
      setTimeout(() => setCopiedKeyIndex(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const filteredProviders = PROVIDER_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
    p.category.includes(providerSearchQuery)
  );

  const { uniqueKeys, duplicates } = parseRawKeysInput(rawKeysText);
  const parsedCount = uniqueKeys.length + duplicates.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Main Two-Column Big Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── Left Column: Config, Provider & Big Key Textarea (5 cols) ── */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-7 sm:p-8 shadow-xl flex flex-col justify-between space-y-6 min-h-[640px]">
          <div className="space-y-6">
            {/* Header / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5db872]/15 border border-[#5db872]/30 flex items-center justify-center text-[#5db872]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display text-xl font-semibold text-[#faf9f5]">
                  API KEY 批量检测
                </h3>
                <p className="text-xs text-[#d4cebe]">
                  多线程并发测活、额度嗅探、格式排重与死号清洗
                </p>
              </div>
            </div>

            {/* 1. API Provider Selector & Stream Switch */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API 提供商
                </label>

                <div className="flex items-center gap-3">
                  {/* Stream Detection Toggle */}
                  <label className="flex items-center gap-2 text-xs text-[#d4cebe] cursor-pointer select-none font-medium">
                    <span>流式检测</span>
                    <button
                      type="button"
                      onClick={() => setIsStreamCheck(!isStreamCheck)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isStreamCheck ? 'bg-[#cc785c]' : 'bg-[#2e2b27]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isStreamCheck ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Settings Gear */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(!showSettingsModal)}
                    className="p-1.5 rounded-lg text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#23211e] transition border border-[#2e2b27]"
                    title="并发数与探针参数设置"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Provider Combobox Dropdown with Official SVG Logos */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3.5 text-sm text-[#faf9f5] hover:border-[#cc785c]/40 transition shadow-inner"
                >
                  <div className="flex items-center gap-3">
                    <ProviderIcon providerId={selectedProvider.id} className="w-5 h-5" />
                    <span className="font-semibold text-[#faf9f5]">{selectedProvider.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#d4cebe]" />
                </button>

                {showProviderDropdown && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索提供商..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] pl-9 pr-3 py-2 text-sm text-[#faf9f5] placeholder-[#9c9689] focus:outline-none focus:border-[#cc785c]"
                      />
                      <Search className="w-4 h-4 text-[#9c9689] absolute left-3 top-2.5" />
                    </div>

                    <div className="space-y-1">
                      {filteredProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProvider(p)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition flex items-center justify-between ${
                            selectedProvider.id === p.id
                              ? 'bg-[#cc785c]/15 text-[#faf9f5] font-semibold'
                              : 'text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ProviderIcon providerId={p.id} className="w-5 h-5 shrink-0" />
                            <span className="text-[#faf9f5] font-medium">{p.name}</span>
                          </div>
                          <span className="text-xs text-[#9c9689] font-mono">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Base URL input */}
              {selectedProvider.id === 'custom' && (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="https://api.your-relay.com/v1"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689] focus:border-[#cc785c] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Big Textarea for API Keys with razor-sharp crisp font */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API Key 列表
                </label>
                <span className="text-xs font-mono text-[#d4cebe]">
                  已解析: <strong className="text-[#faf9f5] font-bold">{parsedCount}</strong> 条 (独立 {uniqueKeys.length} / 重复 {duplicates.length})
                </span>
              </div>

              <textarea
                rows={13}
                value={rawKeysText}
                onChange={(e) => setRawKeysText(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#10;sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy&#10;sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz&#10;&#10;支持直接粘贴多行，自动排重、过滤空白与注释行"
                className="w-full rounded-xl border border-[#3d3934] bg-[#141413] p-4 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689] focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c]/40 focus:outline-none transition leading-relaxed resize-none min-h-[280px] select-text shadow-inner tracking-wide"
              />
            </div>
          </div>

          {/* 3. Start Action Button */}
          <div className="pt-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#c64545] hover:bg-[#a93a3a] py-4 text-base font-semibold text-[#faf9f5] shadow-lg transition"
              >
                <Square className="w-4 h-4 fill-[#faf9f5]" />
                <span>停止检测 ({progress.completed}/{progress.total})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTesting}
                disabled={parsedCount === 0}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] py-4 text-base font-semibold text-[#faf9f5] shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-4 h-4 fill-[#faf9f5]" />
                <span>开始检测</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column: Big Categorized Results Panel (7 cols) ── */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] shadow-xl flex flex-col overflow-hidden min-h-[640px]">

          {/* Top Status Tabs Bar */}
          <div className="px-6 py-4 sm:py-5 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#141413]/60">
            {/* Status Tabs with Count Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'active', label: '有效', count: summary?.activeCount || 0, color: 'text-[#5db872]', bg: 'bg-[#5db872]/20', border: 'border-[#5db872]/40' },
                { id: 'quota_exhausted', label: '无额', count: summary?.exhaustedCount || 0, color: 'text-[#e8a55a]', bg: 'bg-[#e8a55a]/20', border: 'border-[#e8a55a]/40' },
                { id: 'rate_limited', label: '限流', count: summary?.rateLimitedCount || 0, color: 'text-[#e8a55a]', bg: 'bg-[#e8a55a]/20', border: 'border-[#e8a55a]/40' },
                { id: 'invalid', label: '无效', count: summary?.invalidCount || 0, color: 'text-[#c64545]', bg: 'bg-[#c64545]/20', border: 'border-[#c64545]/40' },
                { id: 'duplicate', label: '重复', count: summary?.duplicateCount || duplicates.length || 0, color: 'text-[#d4cebe]', bg: 'bg-[#2e2b27]', border: 'border-[#3d3934]' },
              ].map((tab) => {
                const isSelected = activeFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                      isSelected
                        ? 'bg-[#23211e] border border-[#cc785c]/80 text-[#faf9f5] shadow-sm font-semibold'
                        : 'text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#23211e]/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${tab.bg} ${tab.color} border ${tab.border}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Batch Export / Copy Button */}
            {summary && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCurrentTabKeys}
                  disabled={getFilteredItems().length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#23211e] hover:bg-[#2b2926] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] transition disabled:opacity-40"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-4 h-4 text-[#5db872]" />
                      <span className="text-[#5db872]">已复制!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#cc785c]" />
                      <span>复制此分类 ({getFilteredItems().length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Main Results Container with Crisp Text Rendering */}
          <div className="flex-1 p-7 flex flex-col overflow-y-auto max-h-[560px]">
            {/* Empty State */}
            {!summary && !isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[#23211e] border border-[#2e2b27] flex items-center justify-center text-[#9c9689] shadow-inner">
                  <Inbox className="w-10 h-10 opacity-60 text-[#cc785c]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-[#faf9f5]">
                    检测结果将显示在这里
                  </h4>
                  <p className="text-xs text-[#d4cebe] max-w-xs">
                    在左侧选择 API 提供商并粘贴 Key 列表，点击“开始检测”即可极速批量验货清洗。
                  </p>
                </div>
              </div>
            )}

            {/* Running Spinner & Live Progress */}
            {isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-5">
                <Loader2 className="w-10 h-10 text-[#cc785c] animate-spin" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-[#faf9f5]">
                    并发验货检测中... ({progress.completed}/{progress.total})
                  </p>
                  <p className="text-xs text-[#d4cebe] font-mono">
                    已检测 {Math.round((progress.completed / (progress.total || 1)) * 100)}% · 线程并发清洗中
                  </p>
                </div>
                <div className="w-72 h-2.5 rounded-full bg-[#23211e] overflow-hidden border border-[#2e2b27]">
                  <div
                    className="h-full bg-gradient-to-r from-[#cc785c] to-[#d98266] transition-all duration-200"
                    style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            {summary && !isRunning && (
              <div className="space-y-3">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-20 text-sm text-[#d4cebe]">
                    当前分类下暂无匹配 Key
                  </div>
                ) : (
                  getFilteredItems().map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#23211e] border border-[#2e2b27] hover:border-[#cc785c]/40 transition group"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <span className="text-xs font-mono text-[#9c9689] w-6 font-semibold">#{idx + 1}</span>
                        <span className="font-mono text-sm text-[#faf9f5] font-semibold truncate max-w-sm select-all">
                          {item.key}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        {'latencyMs' in item && item.latencyMs !== undefined && (
                          <span className="text-xs font-mono text-[#faf9f5] font-semibold bg-[#1b1a18] px-2.5 py-1 rounded-md border border-[#2e2b27]">
                            {item.latencyMs} ms
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopySingleKey(item.key, idx)}
                          className="p-2 rounded-lg text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#2b2926] transition border border-[#2e2b27]"
                          title="复制完整 Key"
                        >
                          {copiedKeyIndex === idx ? (
                            <Check className="w-4 h-4 text-[#5db872]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Summary Stats */}
          {summary && (
            <div className="px-7 py-4 border-t border-[#2e2b27] bg-[#141413]/60 flex items-center justify-between text-xs text-[#d4cebe] font-mono font-medium">
              <span>总提交: <strong className="text-[#faf9f5] font-bold">{summary.total}</strong></span>
              <span>有效可用率: <strong className="text-[#5db872] font-bold">{Math.round((summary.activeCount / (summary.total || 1)) * 100)}%</strong></span>
              <span>平均延迟: <strong className="text-[#faf9f5] font-bold">{Math.round(summary.results.reduce((a, b) => a + (b.latencyMs || 0), 0) / (summary.results.length || 1))} ms</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Settings Popover Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-7 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2e2b27] pb-3.5">
              <h3 className="text-base font-semibold text-[#faf9f5] flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-[#cc785c]" />
                <span>批量检测参数设置</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-[#9c9689] hover:text-[#faf9f5] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#faf9f5] mb-2">
                  测试探针模型 (Target Model)
                </label>
                <input
                  type="text"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="gpt-4o / claude-3-7-sonnet"
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 text-sm text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#faf9f5]">
                    并发请求线程数
                  </label>
                  <span className="text-xs font-mono text-[#cc785c] font-bold">
                    {concurrency} 线程
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-[#cc785c] h-2 bg-[#23211e] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#9c9689] mt-1.5 font-mono">
                  <span>1 (慢速防封)</span>
                  <span>5 (默认推荐)</span>
                  <span>20 (极速清洗)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#cc785c] text-sm font-semibold text-[#faf9f5] hover:bg-[#d98266] transition shadow-md"
              >
                确定保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
