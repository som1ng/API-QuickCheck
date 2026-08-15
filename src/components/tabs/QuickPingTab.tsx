import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseRawKeysInput, runBatchKeyTestPool } from '../../engine/batchKeys/keyPoolTester';
import { BatchKeySummary, KeyCheckResult } from '../../types/batchKeys';
import { StatusBadge } from '../common/StatusBadge';
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
} from 'lucide-react';

interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  iconText: string;
  category: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', iconText: '🤖', category: '官方' },
  { id: 'anthropic', name: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-7-sonnet-20250219', iconText: '🧠', category: '官方' },
  { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash', iconText: '✨', category: '官方' },
  { id: 'deepseek', name: 'DeepSeek (官方)', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', iconText: '🐳', category: '官方' },
  { id: 'groq', name: 'Groq (超高速)', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', iconText: '⚡', category: '聚合加速' },
  { id: 'cerebras', name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b', iconText: '🚀', category: '聚合加速' },
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', iconText: '🌊', category: '国内' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o', iconText: '🔀', category: '聚合' },
  { id: 'custom', name: '自定义中转站 / 代理 URL', baseUrl: '', defaultModel: 'gpt-4o', iconText: '🌐', category: '自定义' },
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
      {/* ── Main Two-Column Layout (Matching user reference layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

        {/* ── Left Column: Config, Provider & Key Textarea (5 cols) ── */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* 1. API Provider Selector & Stream Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API 提供商
                </label>

                <div className="flex items-center gap-3">
                  {/* Stream Detection Toggle */}
                  <label className="flex items-center gap-2 text-xs text-[#9c9689] cursor-pointer select-none">
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
                    className="p-1.5 rounded-lg text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e] transition"
                    title="并发与高级设置"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Provider Combobox Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3 text-sm text-[#faf9f5] hover:border-[#cc785c]/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{selectedProvider.iconText}</span>
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#9c9689]" />
                </button>

                {showProviderDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-72 overflow-y-auto space-y-2">
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
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                            selectedProvider.id === p.id
                              ? 'bg-[#cc785c]/15 text-[#faf9f5] font-semibold'
                              : 'text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span>{p.iconText}</span>
                            <span>{p.name}</span>
                          </div>
                          <span className="text-xs text-[#9c9689] font-mono">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Base URL & Model input when needed */}
              {selectedProvider.id === 'custom' && (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="https://api.your-relay.com/v1"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-3.5 py-2 font-mono text-xs text-[#faf9f5] placeholder-[#9c9689] focus:border-[#cc785c] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Textarea for API Keys */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API Key 列表
                </label>
                <span className="text-xs font-mono text-[#9c9689]">
                  已识别: <span className="text-[#faf9f5] font-semibold">{parsedCount}</span> 个 (去重 {uniqueKeys.length} / 重复 {duplicates.length})
                </span>
              </div>

              <textarea
                rows={10}
                value={rawKeysText}
                onChange={(e) => setRawKeysText(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#10;sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy&#10;sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz&#10;&#10;支持直接粘贴多行，自动排重、过滤空白与注释行"
                className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] p-4 font-mono text-xs text-[#faf9f5] placeholder-[#9c9689]/50 focus:border-[#cc785c] focus:outline-none transition leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* 3. Start Action Button */}
          <div className="pt-3">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#c64545] hover:bg-[#a93a3a] py-3.5 text-sm font-semibold text-[#faf9f5] shadow-lg transition"
              >
                <Square className="w-4 h-4 fill-[#faf9f5]" />
                <span>停止检测 ({progress.completed}/{progress.total})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTesting}
                disabled={parsedCount === 0}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] py-3.5 text-sm font-semibold text-[#faf9f5] shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-[#faf9f5]" />
                <span>开始检测</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column: Categorized Results Panel (7 cols) ── */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] shadow-md flex flex-col overflow-hidden min-h-[500px]">

          {/* Top Status Tabs Bar */}
          <div className="px-6 py-4 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#141413]/50">
            {/* Status Tabs with Count Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'active', label: '有效', count: summary?.activeCount || 0, color: 'text-[#5db872]', bg: 'bg-[#5db872]/15', border: 'border-[#5db872]/30' },
                { id: 'quota_exhausted', label: '无额', count: summary?.exhaustedCount || 0, color: 'text-[#e8a55a]', bg: 'bg-[#e8a55a]/15', border: 'border-[#e8a55a]/30' },
                { id: 'rate_limited', label: '限流', count: summary?.rateLimitedCount || 0, color: 'text-[#e8a55a]', bg: 'bg-[#e8a55a]/15', border: 'border-[#e8a55a]/30' },
                { id: 'invalid', label: '无效', count: summary?.invalidCount || 0, color: 'text-[#c64545]', bg: 'bg-[#c64545]/15', border: 'border-[#c64545]/30' },
                { id: 'duplicate', label: '重复', count: summary?.duplicateCount || duplicates.length || 0, color: 'text-[#9c9689]', bg: 'bg-[#9c9689]/15', border: 'border-[#9c9689]/30' },
              ].map((tab) => {
                const isSelected = activeFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-[#23211e] border border-[#cc785c]/60 text-[#faf9f5] shadow-sm'
                        : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${tab.bg} ${tab.color} border ${tab.border}`}>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#23211e] hover:bg-[#2b2926] border border-[#2e2b27] text-xs text-[#faf9f5] transition disabled:opacity-40"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#5db872]" />
                      <span className="text-[#5db872] font-semibold">已复制!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#cc785c]" />
                      <span>复制此分类 ({getFilteredItems().length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Main Results Container */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto max-h-[520px]">
            {/* Empty State */}
            {!summary && !isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#23211e] border border-[#2e2b27] flex items-center justify-center text-[#9c9689]">
                  <Inbox className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-sm font-medium text-[#9c9689]">
                  检测结果将显示在这里
                </p>
                <p className="text-xs text-[#9c9689]/60 max-w-sm">
                  在左侧选择 API 提供商并粘贴 Key 列表，点击“开始检测”即可高速批量验货。
                </p>
              </div>
            )}

            {/* Running Spinner */}
            {isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-[#cc785c] animate-spin" />
                <p className="text-sm font-medium text-[#faf9f5]">
                  并发验货检测中... ({progress.completed}/{progress.total})
                </p>
                <div className="w-64 h-2 rounded-full bg-[#23211e] overflow-hidden">
                  <div
                    className="h-full bg-[#cc785c] transition-all duration-200"
                    style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            {summary && !isRunning && (
              <div className="space-y-3">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-12 text-sm text-[#9c9689]">
                    当前分类下暂无 Key
                  </div>
                ) : (
                  getFilteredItems().map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#23211e] border border-[#2e2b27] hover:border-[#cc785c]/30 transition group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-mono text-[#9c9689]">#{idx + 1}</span>
                        <span className="font-mono text-sm text-[#faf9f5] font-semibold truncate max-w-xs">
                          {item.key}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {'latencyMs' in item && item.latencyMs !== undefined && (
                          <span className="text-xs font-mono text-[#9c9689]">
                            {item.latencyMs} ms
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopySingleKey(item.key, idx)}
                          className="p-1.5 rounded-lg text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#2b2926] transition"
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
            <div className="px-6 py-3.5 border-t border-[#2e2b27] bg-[#141413]/40 flex items-center justify-between text-xs text-[#9c9689] font-mono">
              <span>总提交: {summary.total}</span>
              <span>有效率: {Math.round((summary.activeCount / (summary.total || 1)) * 100)}%</span>
              <span>平均延迟: {Math.round(summary.results.reduce((a, b) => a + (b.latencyMs || 0), 0) / (summary.results.length || 1))} ms</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Settings Popover Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#2e2b27] pb-3">
              <h3 className="text-base font-semibold text-[#faf9f5] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#cc785c]" />
                <span>批量检测参数设置</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-[#9c9689] hover:text-[#faf9f5] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#9c9689] mb-1.5">
                  测试探针模型 (Target Model)
                </label>
                <input
                  type="text"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="gpt-4o / claude-3-7-sonnet"
                  className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-3.5 py-2 text-sm text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9c9689] mb-1.5">
                  并发请求线程数 ({concurrency} 线程)
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-[#cc785c]"
                />
                <div className="flex justify-between text-xs text-[#9c9689] mt-1 font-mono">
                  <span>1 慢速防封</span>
                  <span>5 推荐</span>
                  <span>20 极速清洗</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-lg bg-[#cc785c] text-sm font-semibold text-[#faf9f5] hover:bg-[#d98266] transition"
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
