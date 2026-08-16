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
  { id: 'active', label: '有效', countKey: 'activeCount', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30' },
  { id: 'quota_exhausted', label: '无额', countKey: 'exhaustedCount', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/30' },
  { id: 'rate_limited', label: '限流', countKey: 'rateLimitedCount', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/30' },
  { id: 'invalid', label: '无效', countKey: 'invalidCount', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/30' },
  { id: 'duplicate', label: '重复', countKey: 'duplicateCount', color: 'text-slate-200', bg: 'bg-black/60', border: 'border-white/10' },
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
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Main Two-Column Full-Screen Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch min-h-[calc(100vh-210px)] min-h-[720px]">

        {/* ── Left Column: Config, Provider & Big Flex Textarea (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#0f1219] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl justify-between space-y-5">
          <div className="space-y-5 flex-1 flex flex-col">
            {/* Header / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display text-lg font-bold text-white tracking-tight">
                  API KEY 批量检测
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  多线程并发测活、额度嗅探、格式排重与死号清洗
                </p>
              </div>
            </div>

            {/* 1. API Provider Selector & Stream Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">
                  API 提供商
                </label>

                <div className="flex items-center gap-3">
                  {/* Stream Detection Toggle */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none font-semibold tracking-wide">
                    <span>流式检测</span>
                    <button
                      type="button"
                      onClick={() => setIsStreamCheck(!isStreamCheck)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isStreamCheck ? 'bg-[#e8895d]' : 'bg-white/15'
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
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition border border-white/10"
                    title="并发数与探针参数设置"
                  >
                    <Settings className="w-4 h-4 text-[#e8895d]" />
                  </button>
                </div>
              </div>

              {/* Provider Combobox Dropdown with Official SVG Logos */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 hover:border-white/20 transition font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ProviderIcon providerId={selectedProvider.id} className="w-5 h-5" />
                    <span className="font-semibold text-white">{selectedProvider.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProviderDropdown ? 'rotate-180 text-[#e8895d]' : ''}`} />
                </button>

                {showProviderDropdown && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl border border-white/15 bg-[#131722] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索提供商..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/50 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e8895d]"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    <div className="space-y-1">
                      {filteredProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProvider(p)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition flex items-center justify-between cursor-pointer ${
                            selectedProvider.id === p.id
                              ? 'bg-[#e8895d] text-white font-semibold shadow-sm'
                              : 'text-slate-200 hover:bg-white/10 hover:text-white'
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
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-[#e8895d] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Big Flex Textarea for API Keys with razor-sharp crisp font */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm font-semibold text-slate-200">
                  API Key 列表
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="bg-black/60 border border-white/10 px-2.5 py-1 rounded-md text-xs font-mono text-slate-200 font-medium tracking-wide shadow-sm">
                    已解析: <strong className="text-white font-bold">{parsedCount}</strong> 条
                  </span>
                  <span className="bg-black/60 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs font-mono text-slate-200 font-medium tracking-wide shadow-sm">
                    独立: <strong className="text-emerald-400 font-bold">{uniqueKeys.length}</strong>
                  </span>
                  <span className="bg-black/60 border border-amber-500/30 px-2.5 py-1 rounded-md text-xs font-mono text-slate-200 font-medium tracking-wide shadow-sm">
                    重复: <strong className="text-amber-400 font-bold">{duplicates.length}</strong>
                  </span>
                </div>
              </div>

              <textarea
                value={rawKeysText}
                onChange={(e) => setRawKeysText(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#10;sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy&#10;sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz&#10;&#10;支持直接粘贴多行，自动排重、过滤空白与注释行"
                className="flex-1 w-full min-h-[380px] resize-none bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-slate-100 leading-relaxed placeholder:text-slate-500 focus:border-[#e8895d] focus:ring-1 focus:ring-[#e8895d]/30 focus:outline-none custom-scrollbar select-text tracking-wide transition"
              />
            </div>
          </div>

          {/* 3. Start Action Button */}
          <div className="pt-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 py-3.5 text-base font-semibold text-white shadow-lg transition tracking-wide cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>停止检测 ({progress.completed}/{progress.total})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTesting}
                disabled={parsedCount === 0}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#e8895d] hover:bg-[#f09a70] active:bg-[#d6784d] py-3.5 text-base font-semibold text-white shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wide"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>开始检测</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column: Big Full-Screen Results Panel (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0f1219] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Top Status Tabs Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/20">
            {/* Status Tabs with Silky-Smooth Sliding Active Indicator */}
            <nav className="relative flex items-center p-1 rounded-xl bg-black/40 border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
              {/* Sliding Active Pill Indicator */}
              <span
                className="absolute top-1 bottom-1 rounded-lg bg-white/10 border border-white/15 shadow-sm pointer-events-none transition-all duration-300"
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
                    className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 font-medium'
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
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition disabled:opacity-40 tracking-wide shadow-sm cursor-pointer"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">已复制!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#e8895d]" />
                      <span>复制此分类 ({getFilteredItems().length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Main Results Container with Crisp Text Rendering */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto max-h-[calc(100vh-360px)] min-h-[480px] custom-scrollbar">
            {/* Empty State */}
            {!summary && !isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-28 space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-[#e8895d] shadow-inner">
                  <Inbox className="w-10 h-10 opacity-80 text-[#e8895d]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white">
                    检测结果将显示在这里
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    在左侧选择 API 提供商并粘贴 Key 列表，点击“开始检测”即可极速批量验货清洗。
                  </p>
                </div>
              </div>
            )}

            {/* Running Spinner & Live Progress */}
            {isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-28 space-y-5">
                <Loader2 className="w-10 h-10 text-[#e8895d] animate-spin" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-white">
                    并发验货检测中... ({progress.completed}/{progress.total})
                  </p>
                  <p className="text-xs text-slate-300 font-mono tracking-wide">
                    已检测 {Math.round((progress.completed / (progress.total || 1)) * 100)}% · 线程并发清洗中
                  </p>
                </div>
                <div className="w-80 h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#e8895d] to-[#f09a70] transition-all duration-200"
                    style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            {summary && !isRunning && (
              <div className="space-y-2.5">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-24 text-sm text-slate-400 font-medium">
                    当前分类下暂无匹配 Key
                  </div>
                ) : (
                  getFilteredItems().map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/10 hover:border-[#e8895d]/50 transition group"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <span className="text-xs font-mono text-slate-500 w-6 font-semibold tracking-wide">#{idx + 1}</span>
                        <span className="font-mono text-sm text-slate-100 font-medium truncate max-w-md select-all tracking-wide">
                          {item.key}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        {'latencyMs' in item && item.latencyMs !== undefined && (
                          <span className="text-xs font-mono text-emerald-300 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/20 tracking-wide shadow-sm">
                            {item.latencyMs} ms
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopySingleKey(item.key, idx)}
                          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition border border-white/10 cursor-pointer"
                          title="复制完整 Key"
                        >
                          {copiedKeyIndex === idx ? (
                            <Check className="w-4 h-4 text-emerald-400" />
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
            <div className="px-6 py-3.5 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs text-slate-300 font-mono font-medium tracking-wide">
              <span>总提交: <strong className="text-white font-bold">{summary.total}</strong></span>
              <span>有效可用率: <strong className="text-emerald-400 font-bold">{Math.round((summary.activeCount / (summary.total || 1)) * 100)}%</strong></span>
              <span>平均延迟: <strong className="text-white font-bold">{Math.round(summary.results.reduce((a, b) => a + (b.latencyMs || 0), 0) / (summary.results.length || 1))} ms</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Settings Popover Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#131722] p-7 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-[#e8895d]" />
                <span>批量检测参数设置</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-md transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  测试探针模型 (Target Model)
                </label>
                <input
                  type="text"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="gpt-4o / claude-3-7-sonnet"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8895d]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    并发请求线程数
                  </label>
                  <span className="text-xs font-mono text-[#e8895d] font-bold">
                    {concurrency} 线程
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-[#e8895d] h-2 bg-black/50 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-mono">
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
                className="px-6 py-2.5 rounded-xl bg-[#e8895d] text-sm font-semibold text-white hover:bg-[#f09a70] transition shadow-md cursor-pointer"
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
