import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  { id: 'deepseek', name: 'DeepSeek (官方)', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', category: '官方' },
  { id: 'grok', name: 'xAI (Grok 官方)', baseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-2-latest', category: '官方' },
  { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash', category: '官方' },
  { id: 'cerebras', name: 'Cerebras (超高速)', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b', category: '聚合加速' },
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', category: '国内' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o', category: '聚合' },
  { id: 'custom', name: '自定义接口 / 代理 URL', baseUrl: '', defaultModel: 'gpt-4o', category: '自定义' },
];

type FilterTabId = 'active' | 'quota_exhausted' | 'rate_limited' | 'invalid' | 'duplicate';

interface FilterTabConfig {
  id: FilterTabId;
  label: string;
  countKey: 'activeCount' | 'exhaustedCount' | 'rateLimitedCount' | 'invalidCount' | 'duplicateCount';
  color: string;
  bg: string;
  border: string;
}

const FILTER_TABS: FilterTabConfig[] = [
  { id: 'active', label: '有效', countKey: 'activeCount', color: 'text-[#6ee7b7]', bg: 'bg-[#064e3b]', border: 'border-[#059669]' },
  { id: 'quota_exhausted', label: '无额', countKey: 'exhaustedCount', color: 'text-[#fcd34d]', bg: 'bg-[#451a03]', border: 'border-[#d97706]' },
  { id: 'rate_limited', label: '限流', countKey: 'rateLimitedCount', color: 'text-[#fcd34d]', bg: 'bg-[#451a03]', border: 'border-[#d97706]' },
  { id: 'invalid', label: '无效', countKey: 'invalidCount', color: 'text-[#fda4af]', bg: 'bg-[#4c0519]', border: 'border-[#e11d48]' },
  { id: 'duplicate', label: '重复', countKey: 'duplicateCount', color: 'text-[#faf9f5]', bg: 'bg-[#23211e]', border: 'border-[#44403c]' },
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
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTabId>('active');

  // Copy feedback
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Filter Tabs Sliding Pill Animation Ref & State
  const filterTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterPillStyle, setFilterPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateFilterPillPosition = useCallback(() => {
    const activeEl = filterTabRefs.current[activeFilterTab];
    if (activeEl) {
      setFilterPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeFilterTab]);

  useEffect(() => {
    updateFilterPillPosition();
    const raf = requestAnimationFrame(updateFilterPillPosition);
    window.addEventListener('resize', updateFilterPillPosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateFilterPillPosition);
    };
  }, [updateFilterPillPosition, summary]);

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
      const results = await runBatchKeyTestPool(
        targetUrl,
        uniqueKeys,
        testModel,
        concurrency,
        isStreamCheck,
        undefined,
        (_item: KeyCheckResult, completed: number) => {
          setProgress({ total: uniqueKeys.length, completed });
        },
        abortRef.current.signal
      );

      // Re-attach duplicates
      results.duplicates = duplicates;
      results.duplicateCount = duplicates.length;
      results.total = totalCount;

      setSummary(results);
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

        {/* ── Left Column: Config, Provider & Big Key Textarea (5 cols) ── */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#181715] p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6 min-h-[660px] smooth-card">
          <div className="space-y-5">
            {/* Header / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#064e3b] border border-[#059669] flex items-center justify-center text-[#6ee7b7] shadow-sm shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display text-xl font-semibold text-white tracking-tight">
                  API KEY 批量检测
                </h3>
                <p className="text-xs text-neutral-300 font-medium mt-0.5">
                  多线程并发测活、额度嗅探、格式排重与死号清洗
                </p>
              </div>
            </div>

            {/* 1. API Provider Selector & Stream Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API 提供商
                </label>

                <div className="flex items-center gap-3">
                  {/* Stream Detection Toggle */}
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none font-semibold tracking-wide">
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
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-[#23211e] transition border border-[#2e2b27] smooth-btn"
                    title="并发数与探针参数设置"
                  >
                    <Settings className="w-4 h-4 text-[#cc785c]" />
                  </button>
                </div>
              </div>

              {/* Provider Combobox Dropdown with Official SVG Logos */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#2e2b27] bg-[#121211] px-4 py-3 text-sm text-[#faf9f5] hover:border-[#cc785c]/60 transition smooth-input shadow-inner font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ProviderIcon providerId={selectedProvider.id} className="w-5 h-5" />
                    <span className="font-semibold text-[#faf9f5]">{selectedProvider.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${showProviderDropdown ? 'rotate-180 text-[#cc785c]' : ''}`} />
                </button>

                {showProviderDropdown && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索提供商..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-[#2e2b27] bg-[#121211] pl-9 pr-3 py-2 text-sm text-[#faf9f5] placeholder-neutral-500 focus:outline-none focus:border-[#cc785c] smooth-input"
                      />
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    </div>

                    <div className="space-y-1">
                      {filteredProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProvider(p)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition flex items-center justify-between cursor-pointer ${
                            selectedProvider.id === p.id
                              ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                              : 'text-neutral-200 hover:bg-[#23211e] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ProviderIcon providerId={p.id} className="w-5 h-5 shrink-0" />
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <span className="text-xs font-mono opacity-80">{p.category}</span>
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
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#121211] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input"
                  />
                </div>
              )}
            </div>

            {/* 2. Big Textarea for API Keys with razor-sharp crisp font */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API Key 列表
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="bg-[#23211e] border border-[#44403c] px-2.5 py-1 rounded-lg text-xs font-mono text-[#faf9f5] font-semibold tracking-wide shadow-sm">
                    已解析: <strong className="text-white font-bold text-xs font-mono">{parsedCount}</strong> 条
                  </span>
                  <span className="bg-[#064e3b] border border-[#059669] px-2.5 py-1 rounded-lg text-xs font-mono text-[#6ee7b7] font-semibold tracking-wide shadow-sm">
                    独立: <strong className="text-white font-bold text-xs font-mono">{uniqueKeys.length}</strong>
                  </span>
                  <span className="bg-[#451a03] border border-[#d97706] px-2.5 py-1 rounded-lg text-xs font-mono text-[#fcd34d] font-semibold tracking-wide shadow-sm">
                    重复: <strong className="text-white font-bold text-xs font-mono">{duplicates.length}</strong>
                  </span>
                </div>
              </div>

              <textarea
                rows={13}
                value={rawKeysText}
                onChange={(e) => setRawKeysText(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#10;sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy&#10;sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz&#10;&#10;支持直接粘贴多行，自动排重、过滤空白与注释行"
                className="w-full rounded-xl border border-[#3d3934] bg-[#121211] p-4 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c]/40 focus:outline-none transition leading-relaxed resize-none min-h-[320px] h-[340px] select-text shadow-inner tracking-wide smooth-input"
              />
            </div>
          </div>

          {/* 3. Start Action Button */}
          <div className="pt-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#c64545] hover:bg-[#a93a3a] py-3.5 text-base font-semibold text-[#faf9f5] shadow-lg transition smooth-btn tracking-wide cursor-pointer"
              >
                <Square className="w-4 h-4 fill-[#faf9f5]" />
                <span>停止检测 ({progress.completed}/{progress.total})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTesting}
                disabled={parsedCount === 0}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] py-3.5 text-base font-semibold text-white shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer smooth-btn tracking-wide"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>开始检测</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column: Big Categorized Results Panel (7 cols) ── */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#181715] shadow-xl flex flex-col overflow-hidden min-h-[660px] smooth-card">

          {/* Top Status Tabs Bar */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#121211]/80">
            {/* Status Tabs with Silky-Smooth Sliding Active Indicator */}
            <nav className="relative flex items-center p-1 rounded-xl bg-[#141413] border border-white/[0.08] shadow-inner overflow-x-auto no-scrollbar">
              {/* Sliding Active Pill Indicator */}
              <span
                className="absolute top-1 bottom-1 rounded-lg bg-[#262422] border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300"
                style={{
                  transform: `translateX(${filterPillStyle.left}px)`,
                  width: `${filterPillStyle.width}px`,
                  opacity: filterPillStyle.opacity,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#e8895d] rounded-full shadow-[0_0_8px_#e8895d]" />
              </span>

              {FILTER_TABS.map((tab) => {
                const count = tab.id === 'duplicate' ? (summary?.duplicateCount || duplicates.length || 0) : (summary?.[tab.countKey] || 0);
                const isSelected = activeFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => { filterTabRefs.current[tab.id] = el; }}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-sans font-medium transition-colors duration-200 cursor-pointer ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${tab.bg} ${tab.color} border ${tab.border} tracking-wide shadow-sm`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Batch Export / Copy Button */}
            {summary && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCurrentTabKeys}
                  disabled={getFilteredItems().length === 0}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#23211e] hover:bg-[#2b2926] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] transition disabled:opacity-40 tracking-wide smooth-btn shadow-sm cursor-pointer"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-4 h-4 text-[#6ee7b7]" />
                      <span className="text-[#6ee7b7]">已复制!</span>
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
          <div className="flex-1 p-6 sm:p-7 flex flex-col overflow-y-auto max-h-[580px]">
            {/* Empty State */}
            {!summary && !isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-24 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[#23211e] border border-[#2e2b27] flex items-center justify-center text-[#cc785c] shadow-inner">
                  <Inbox className="w-10 h-10 opacity-75 text-[#cc785c]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white">
                    检测结果将显示在这里
                  </h4>
                  <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
                    在左侧选择 API 提供商并粘贴 Key 列表，点击“开始检测”即可极速批量验货清洗。
                  </p>
                </div>
              </div>
            )}

            {/* Running Spinner & Live Progress */}
            {isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-24 space-y-5">
                <Loader2 className="w-10 h-10 text-[#cc785c] animate-spin" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-white">
                    并发验货检测中... ({progress.completed}/{progress.total})
                  </p>
                  <p className="text-xs text-neutral-300 font-mono tracking-wide">
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
                  <div className="text-center py-20 text-sm text-neutral-300">
                    当前分类下暂无匹配 Key
                  </div>
                ) : (
                  getFilteredItems().map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#23211e] border border-[#2e2b27] hover:border-[#cc785c]/60 transition group smooth-card"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <span className="text-xs font-mono text-neutral-400 w-6 font-semibold tracking-wide">#{idx + 1}</span>
                        <span className="font-mono text-sm text-[#faf9f5] font-semibold truncate max-w-sm select-all tracking-wide">
                          {item.key}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        {'latencyMs' in item && item.latencyMs !== undefined && (
                          <span className="text-xs font-mono text-[#faf9f5] font-semibold bg-white/5 px-2.5 py-1 rounded-md border border-white/10 tracking-wide shadow-sm">
                            {item.latencyMs} ms
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopySingleKey(item.key, idx)}
                          className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-[#2b2926] transition border border-[#2e2b27] smooth-btn cursor-pointer"
                          title="复制完整 Key"
                        >
                          {copiedKeyIndex === idx ? (
                            <Check className="w-4 h-4 text-[#6ee7b7]" />
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
            <div className="px-7 py-4 border-t border-[#2e2b27] bg-[#121211]/80 flex items-center justify-between text-xs text-neutral-300 font-mono font-medium tracking-wide">
              <span>总提交: <strong className="text-white font-bold">{summary.total}</strong></span>
              <span>有效可用率: <strong className="text-[#6ee7b7] font-bold">{Math.round((summary.activeCount / (summary.total || 1)) * 100)}%</strong></span>
              <span>平均延迟: <strong className="text-white font-bold">{Math.round(summary.results.reduce((a, b) => a + (b.latencyMs || 0), 0) / (summary.results.length || 1))} ms</strong></span>
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
                className="text-neutral-400 hover:text-white text-sm p-1 rounded-md transition cursor-pointer"
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
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#121211] px-4 py-2.5 text-sm text-[#faf9f5] focus:outline-none focus:border-[#cc785c] smooth-input"
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
                <div className="flex justify-between text-xs text-neutral-400 mt-1.5 font-mono">
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
                className="px-6 py-2.5 rounded-xl bg-[#cc785c] text-sm font-semibold text-white hover:bg-[#d98266] transition shadow-md smooth-btn cursor-pointer"
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
