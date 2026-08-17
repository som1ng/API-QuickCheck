import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { parseRawKeysInput, runBatchKeyTestPool } from '../../engine/batchKeys/keyPoolTester';
import { BatchKeySummary, KeyCheckResult } from '../../types/batchKeys';
import {
  exportKeysToTxt,
  exportResultsToCsv,
  exportResultsToJson,
  parseUploadedFile,
} from '../../engine/batchKeys/batchExport';
import {
  saveBatchHistory,
  getBatchHistory,
  deleteBatchHistoryItem,
  clearBatchHistory,
} from '../../engine/batchKeys/batchHistory';
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
  History,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  Trash2,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  category: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'custom', name: '中转站 / 代理 (智能自适应探针)', baseUrl: '', defaultModel: 'auto', category: '中转/自适应' },
  { id: 'openai', name: 'OpenAI (官方/兼容端点)', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', category: '官方' },
  { id: 'anthropic', name: 'Anthropic (Claude 官方)', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-7-sonnet-20250219', category: '官方' },
  { id: 'deepseek', name: 'DeepSeek (官方)', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', category: '官方' },
  { id: 'grok', name: 'xAI (Grok 官方)', baseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-2-latest', category: '官方' },
  { id: 'gemini', name: 'Google Gemini (官方)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash', category: '官方' },
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', category: '国内' },
  { id: 'openrouter', name: 'OpenRouter (全球聚合)', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini', category: '聚合' },
  { id: 'cerebras', name: 'Cerebras (超高速推理)', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b', category: '聚合加速' },
];

type FilterTabId = 'active' | 'quota_exhausted' | 'rate_limited' | 'invalid' | 'duplicate';

interface FilterTabConfig {
  id: FilterTabId;
  label: string;
  countKey: 'activeCount' | 'exhaustedCount' | 'rateLimitedCount' | 'invalidCount' | 'duplicateCount';
  badgeInactive: string;
  badgeActive: string;
}

const FILTER_TABS: FilterTabConfig[] = [
  {
    id: 'active',
    label: '有效',
    countKey: 'activeCount',
    badgeInactive: 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30',
    badgeActive: 'bg-[#5db872] text-[#141413] font-bold border border-[#5db872]',
  },
  {
    id: 'quota_exhausted',
    label: '无额',
    countKey: 'exhaustedCount',
    badgeInactive: 'bg-[#e8a55a]/15 text-[#e8a55a] border border-[#e8a55a]/30',
    badgeActive: 'bg-[#e8a55a] text-[#141413] font-bold border border-[#e8a55a]',
  },
  {
    id: 'rate_limited',
    label: '限流',
    countKey: 'rateLimitedCount',
    badgeInactive: 'bg-[#d4a017]/15 text-[#d4a017] border border-[#d4a017]/30',
    badgeActive: 'bg-[#d4a017] text-[#141413] font-bold border border-[#d4a017]',
  },
  {
    id: 'invalid',
    label: '无效',
    countKey: 'invalidCount',
    badgeInactive: 'bg-[#c64545]/15 text-[#c64545] border border-[#c64545]/30',
    badgeActive: 'bg-[#c64545] text-[#faf9f5] font-bold border border-[#c64545]',
  },
  {
    id: 'duplicate',
    label: '重复',
    countKey: 'duplicateCount',
    badgeInactive: 'bg-[#252320] text-[#a09d96] border border-[#2e2b27]',
    badgeActive: 'bg-[#36332e] text-[#faf9f5] font-bold border border-[#44403c]',
  },
];

export const QuickPingTab: React.FC = () => {
  const { state } = useApp();
  const { config } = state;

  // Check if global config has custom base URL
  const isGlobalCustom = !!(
    config.baseUrl &&
    !PROVIDER_PRESETS.slice(0, -1).some(
      (p) => p.baseUrl && config.baseUrl.trim().startsWith(p.baseUrl)
    )
  );

  // Selected Provider Preset
  const [selectedProvider, setSelectedProvider] = useState<ProviderPreset>(() => {
    try {
      const savedProviderId = localStorage.getItem('aqc_batch_provider_id');
      if (savedProviderId) {
        const found = PROVIDER_PRESETS.find((p) => p.id === savedProviderId);
        if (found) return found;
      }
    } catch {}
    if (isGlobalCustom) {
      return PROVIDER_PRESETS.find((p) => p.id === 'custom') || PROVIDER_PRESETS[0];
    }
    const matched = PROVIDER_PRESETS.find((p) => p.baseUrl && config.baseUrl?.startsWith(p.baseUrl));
    return matched || PROVIDER_PRESETS[0];
  });

  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_custom_base_url');
      if (saved) return saved;
    } catch {}
    return config.baseUrl || 'https://api.openai.com/v1';
  });

  const [testModel, setTestModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_test_model');
      if (saved) return saved;
    } catch {}
    return config.selectedModel || 'auto';
  });

  const [isStreamCheck, setIsStreamCheck] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_stream_check');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });
  const [concurrency, setConcurrency] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_concurrency');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    } catch {}
    return 5;
  });

  const [antiBanMode, setAntiBanMode] = useState<'safe' | 'balanced' | 'turbo'>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_antiban_mode');
      if (saved === 'safe' || saved === 'balanced' || saved === 'turbo') return saved;
    } catch {}
    return 'balanced';
  });

  const [requestDelayMs, setRequestDelayMs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_request_delay');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    } catch {}
    return 50;
  });

  // Search & Dropdowns
  const [showProviderDropdown, setShowProviderDropdown] = useState<boolean>(false);
  const [providerSearchQuery, setProviderSearchQuery] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<BatchKeySummary[]>([]);

  const [checkBalance, setCheckBalance] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_check_balance');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [checkModels, setCheckModels] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_check_models');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });

  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw Input & Testing State (with auto draft & summary restore)
  const [rawKeysText, setRawKeysText] = useState<string>(() => {
    try {
      return localStorage.getItem('aqc_batch_raw_keys') || '';
    } catch {
      return '';
    }
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [summary, setSummary] = useState<BatchKeySummary | null>(() => {
    try {
      const saved = localStorage.getItem('aqc_batch_last_summary');
      if (saved) {
        return JSON.parse(saved) as BatchKeySummary;
      }
    } catch {}
    return null;
  });

  const [progress, setProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTabId>('active');

  // Copy feedback
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Auto-save batch workspace state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aqc_batch_raw_keys', rawKeysText);
      localStorage.setItem('aqc_batch_custom_base_url', customBaseUrl);
      localStorage.setItem('aqc_batch_test_model', testModel);
      localStorage.setItem('aqc_batch_concurrency', String(concurrency));
      localStorage.setItem('aqc_batch_antiban_mode', antiBanMode);
      localStorage.setItem('aqc_batch_request_delay', String(requestDelayMs));
      localStorage.setItem('aqc_batch_stream_check', String(isStreamCheck));
      localStorage.setItem('aqc_batch_check_balance', String(checkBalance));
      localStorage.setItem('aqc_batch_check_models', String(checkModels));
      localStorage.setItem('aqc_batch_provider_id', selectedProvider.id);
      if (summary) {
        localStorage.setItem('aqc_batch_last_summary', JSON.stringify(summary));
      } else {
        localStorage.removeItem('aqc_batch_last_summary');
      }
    } catch {
      // ignore
    }
  }, [
    rawKeysText,
    customBaseUrl,
    testModel,
    isStreamCheck,
    concurrency,
    antiBanMode,
    requestDelayMs,
    checkBalance,
    checkModels,
    selectedProvider.id,
    summary,
  ]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setShowProviderDropdown(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleFileUpload = async (file: File) => {
    try {
      const extractedText = await parseUploadedFile(file);
      if (!extractedText.trim()) {
        alert('未能从所选文件中解析到有效的 API Key 内容');
        return;
      }
      setRawKeysText((prev) => {
        if (!prev.trim()) return extractedText;
        return `${prev.trim()}\n${extractedText}`;
      });
    } catch (err: unknown) {
      alert(`读取文件失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadHistory = () => {
    setHistoryList(getBatchHistory());
  };

  const handleLoadBatchFromHistory = (item: BatchKeySummary) => {
    setSummary(item);
    if (item.providerId) {
      const found = PROVIDER_PRESETS.find((p) => p.id === item.providerId);
      if (found) setSelectedProvider(found);
    }
    if (item.baseUrl) setCustomBaseUrl(item.baseUrl);
    if (item.testModel) setTestModel(item.testModel);
    setShowHistoryModal(false);
  };

  const handleDeleteHistoryItem = (id: string | number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    deleteBatchHistoryItem(id);
    loadHistory();
  };

  const handleClearAllHistory = () => {
    if (window.confirm('确定要清空全部批量检测历史记录吗？')) {
      clearBatchHistory();
      loadHistory();
    }
  };

  const handleStartTesting = async () => {
    const { uniqueKeys, duplicates } = parseRawKeysInput(rawKeysText);
    const totalCount = uniqueKeys.length + duplicates.length;

    if (totalCount === 0) {
      alert('请在文本框中粘贴至少一个待检测的 API Key');
      return;
    }

    const targetUrl =
      (selectedProvider.id === 'custom' ? customBaseUrl.trim() : selectedProvider.baseUrl) ||
      customBaseUrl.trim() ||
      config.baseUrl ||
      'https://api.openai.com/v1';

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
        abortRef.current.signal,
        {
          checkBalance,
          checkModels,
          providerId: selectedProvider.id,
          providerName: selectedProvider.name,
          requestDelayMs,
          antiBanMode,
        }
      );

      // Re-attach duplicates
      results.duplicates = duplicates;
      results.duplicateCount = duplicates.length;
      results.total = totalCount;
      results.testModel = testModel;

      setSummary(results);
      saveBatchHistory(results);
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
    if (activeFilterTab === 'duplicate') {
      const dups = summary ? summary.duplicates : duplicates;
      return dups.map((k) => ({
        key: k,
        status: 'duplicate' as const,
        errorMessage: '列表中存在相同 Key，已自动排重',
      }));
    }
    if (!summary) return [];
    if (activeFilterTab === 'invalid') {
      return summary.results.filter((r) => r.status === 'invalid' || r.status === 'network_error');
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
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
      {/* ── Header Title Area matching DESIGN.md Editorial Style (Compact & Crisp) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            API KEY 批量检测
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            多线程并发测活、余额穿透嗅探、模型发现与格式排重清洗，支持导出 CSV / TXT / JSON 报表。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              loadHistory();
              setShowHistoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#252320] hover:bg-[#2e2b27] border border-white/10 text-xs font-semibold text-[#faf9f5] transition smooth-btn shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-[#cc785c]" />
            <span>历史记录</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column 1.25x Proportional Workspace Grid (Viewport Optimized) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

        {/* ── Left Column: Config, Provider & Key Textarea (5 cols) ── */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#181715] p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 smooth-card min-h-[780px]">
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Header / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] shadow-sm shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#faf9f5]">
                  批量检测配置
                </h3>
                <p className="text-xs text-[#a09d96] font-medium mt-0.5">
                  输入 API 凭据与提供商
                </p>
              </div>
            </div>

            {/* 1. API Provider Selector & Settings Modal Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5]">
                  API 提供商
                </label>

                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-[#2e2b27] border border-[#2e2b27] hover:border-[#cc785c]/40 text-xs font-semibold text-[#faf9f5] transition smooth-btn shadow-sm cursor-pointer"
                  title="配置探针模型、并发数、流式检测与防封策略"
                >
                  <Settings className="w-4 h-4 text-[#cc785c]" />
                  <span>参数配置</span>
                </button>
              </div>

              {/* Provider Combobox Dropdown with Official SVG Logos */}
              <div className="relative" ref={providerDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 text-sm text-[#faf9f5] hover:border-[#cc785c]/60 transition smooth-input shadow-inner font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ProviderIcon providerId={selectedProvider.id} className="w-5 h-5" />
                    <span className="font-semibold text-[#faf9f5]">{selectedProvider.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#a09d96] transition-transform duration-200 ${showProviderDropdown ? 'rotate-180 text-[#cc785c]' : ''}`} />
                </button>

                {showProviderDropdown && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[#2e2b27] bg-[#181715] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2 animate-in fade-in duration-150">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="搜索提供商..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] pl-9 pr-3 py-2 text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:outline-none focus:border-[#cc785c] smooth-input"
                      />
                      <Search className="w-4 h-4 text-[#a09d96] absolute left-3 top-2.5" />
                    </div>

                    <div className="space-y-1 pt-1">
                      {filteredProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProvider(p)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition flex items-center justify-between cursor-pointer ${
                            selectedProvider.id === p.id
                              ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                              : 'text-[#faf9f5] hover:bg-[#252320] hover:text-white'
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
              {selectedProvider.id === 'custom' ? (
                <div className="space-y-1.5 pt-1 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-[#a09d96]">
                    <span>中转站 / 自定义 Base URL:</span>
                    {config.baseUrl && config.baseUrl !== customBaseUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomBaseUrl(config.baseUrl)}
                        className="text-[#cc785c] hover:underline cursor-pointer text-xs"
                      >
                        使用全局中转地址
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://api.your-relay.com/v1"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:outline-none smooth-input shadow-inner"
                  />
                </div>
              ) : (
                <div className="text-[11px] text-[#a09d96] flex items-center justify-between px-1">
                  <span>当前端点: <span className="font-mono text-[#faf9f5]">{selectedProvider.baseUrl}</span></span>
                  <button
                    type="button"
                    onClick={() => {
                      const customP = PROVIDER_PRESETS.find((p) => p.id === 'custom');
                      if (customP) setSelectedProvider(customP);
                    }}
                    className="text-[#cc785c] hover:underline cursor-pointer"
                  >
                    切换为自定义中转站
                  </button>
                </div>
              )}
            </div>

            {/* 2. Big Textarea for API Keys with Drag & Drop and File Upload */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <label className="text-sm sm:text-base font-bold text-[#faf9f5] tracking-normal">
                    API Key 列表
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#252320] hover:bg-[#2e2b27] border border-[#2e2b27] text-xs font-mono text-[#faf9f5] transition cursor-pointer shadow-sm"
                    title="支持直接读取并清洗 .txt / .csv / .json 格式文件"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#cc785c]" />
                    <span>导入文件</span>
                  </button>
                </div>

                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#252320] border border-[#2e2b27] rounded-lg text-xs sm:text-sm font-mono select-none shadow-sm">
                  <span className="text-[#a09d96] font-medium">已解析 <span className="font-bold text-[#faf9f5]">{parsedCount}</span></span>
                  <span className="text-[#2e2b27]">|</span>
                  <span className="inline-flex items-center gap-1.5 text-[#faf9f5]">
                    <span className="w-2 h-2 rounded-full bg-[#5db872] inline-block shrink-0"></span>
                    <span>独立</span> <span className="font-bold text-[#5db872]">{uniqueKeys.length}</span>
                  </span>
                  <span className="text-[#2e2b27]">|</span>
                  <span className="inline-flex items-center gap-1.5 text-[#faf9f5]">
                    <span className="w-2 h-2 rounded-full bg-[#e8a55a] inline-block shrink-0"></span>
                    <span>重复</span> <span className="font-bold text-[#e8a55a]">{duplicates.length}</span>
                  </span>
                </div>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex-1 flex flex-col rounded-xl transition ${
                  isDraggingFile ? 'ring-2 ring-[#cc785c] bg-[#cc785c]/5' : ''
                }`}
              >
                <textarea
                  value={rawKeysText}
                  onChange={(e) => setRawKeysText(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&#10;sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy&#10;sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz&#10;&#10;支持直接粘贴多行，或拖入 .txt / .csv / .json 文件，自动排重清洗"
                  className="flex-1 w-full rounded-xl border border-[#2e2b27] bg-[#141413] p-4 font-mono text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:ring-1 focus:ring-[#cc785c]/40 focus:outline-none transition leading-relaxed resize-none min-h-[460px] select-text shadow-inner tracking-normal smooth-input"
                />
                {isDraggingFile && (
                  <div className="absolute inset-0 rounded-xl bg-black/80 border-2 border-dashed border-[#cc785c] flex flex-col items-center justify-center text-center p-4 z-20 pointer-events-none animate-in fade-in">
                    <Upload className="w-10 h-10 text-[#cc785c] mb-2 animate-bounce" />
                    <p className="text-sm font-bold text-white">释放鼠标直接导入文件</p>
                    <p className="text-xs text-[#a09d96] mt-1">支持 .txt / .csv / .json 格式并自动提取 Key</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Start Action Button */}
          <div className="pt-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#c64545] hover:bg-[#a93a3a] py-3.5 text-base font-semibold text-white shadow-lg transition smooth-btn tracking-wide cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
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
        <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#181715] shadow-xl flex flex-col overflow-hidden min-h-[780px] smooth-card">

          {/* Top Status Tabs Bar - Claude/DESIGN.md System with Silky Smooth Sliding Segmented Control */}
          <div className="p-3 sm:p-4 border-b border-[#2e2b27] bg-[#141413]/70">
            <nav className="relative flex items-center p-1 bg-[#141413] border border-[#2e2b27] rounded-xl w-full select-none shadow-inner">
              {/* Silky Smooth Active Sliding Pill (#252320 Surface Dark Elevated) */}
              <div
                className="absolute top-1 bottom-1 left-1 rounded-lg bg-[#252320] border border-[#36332e] shadow-md transition-transform duration-300 pointer-events-none"
                style={{
                  width: 'calc((100% - 0.5rem) / 5)',
                  transform: `translateX(calc(${Math.max(0, FILTER_TABS.findIndex((t) => t.id === activeFilterTab))} * 100%))`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {FILTER_TABS.map((tab) => {
                const count = tab.id === 'duplicate' ? (summary?.duplicateCount ?? duplicates.length) : (summary?.[tab.countKey] || 0);
                const isSelected = activeFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:px-2 rounded-lg text-xs sm:text-[13px] tracking-wide transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'text-[#faf9f5] font-semibold'
                        : 'text-[#a09d96] hover:text-[#faf9f5] font-medium'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all duration-200 shadow-sm ${
                        isSelected
                          ? tab.badgeActive
                          : tab.badgeInactive
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sub-toolbar for Active Category Stats, Batch Copy & Export Menu */}
          {(summary || (activeFilterTab === 'duplicate' && duplicates.length > 0)) && !isRunning && (
            <div className="px-5 sm:px-6 py-3 border-b border-[#2e2b27] bg-[#181715] flex items-center justify-between gap-3 text-xs sm:text-[13px]">
              <div className="flex items-center gap-2 text-[#a09d96] font-sans">
                <span>当前分类：</span>
                <span className="font-semibold text-[#faf9f5]">
                  {FILTER_TABS.find((t) => t.id === activeFilterTab)?.label}
                </span>
                <span className="font-mono text-[#a09d96] font-medium">
                  ({getFilteredItems().length} 条)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getFilteredItems().length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyCurrentTabKeys}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#252320] hover:bg-[#2e2b27] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] transition tracking-wide smooth-btn shadow-sm cursor-pointer"
                  >
                    {copiedBatch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#5db872]" />
                        <span className="text-[#5db872]">已复制!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>复制此分类 ({getFilteredItems().length})</span>
                      </>
                    )}
                  </button>
                )}

                {/* Export Dropdown Menu */}
                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#252320] hover:bg-[#2e2b27] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] transition tracking-wide smooth-btn shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#cc785c]" />
                    <span>导出报表</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#a09d96] transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#2e2b27] bg-[#181715] p-1.5 shadow-2xl z-50 animate-in fade-in duration-150 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          exportKeysToTxt(getFilteredItems().map((i) => i.key), `api-keys-${activeFilterTab}`);
                          setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-[#faf9f5] hover:bg-[#252320] rounded-lg transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-[#cc785c] shrink-0" />
                        <span>导出当前分类 Key (.txt)</span>
                      </button>
                      {summary && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              exportResultsToCsv(summary.results, summary);
                              setShowExportMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-[#faf9f5] hover:bg-[#252320] rounded-lg transition cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-[#5db872] shrink-0" />
                            <span>导出完整检测报表 (.csv)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              exportResultsToJson(summary);
                              setShowExportMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-[#faf9f5] hover:bg-[#252320] rounded-lg transition cursor-pointer"
                          >
                            <FileCode className="w-4 h-4 text-[#e8a55a] shrink-0" />
                            <span>导出结构化数据 (.json)</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Results Container with Crisp Text Rendering (+200px Height) */}
          <div className="flex-1 p-6 sm:p-7 flex flex-col overflow-y-auto max-h-[700px]">
            {/* Empty State */}
            {!summary && !isRunning && !(activeFilterTab === 'duplicate' && duplicates.length > 0) && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-32 sm:py-36 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[#141413] border border-[#2e2b27] flex items-center justify-center text-[#cc785c] shadow-inner">
                  <Inbox className="w-10 h-10 opacity-80 text-[#cc785c]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#faf9f5]">
                    检测结果将显示在这里
                  </h4>
                  <p className="text-xs text-[#a09d96] max-w-xs leading-relaxed">
                    在左侧选择 API 提供商并粘贴 Key 列表或导入文件，点击“开始检测”即可极速批量验货清洗。
                  </p>
                </div>
              </div>
            )}

            {/* Running Spinner & Live Progress */}
            {isRunning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-5">
                <Loader2 className="w-10 h-10 text-[#cc785c] animate-spin" />
                <div className="space-y-2">
                  <p className="text-base font-bold text-[#faf9f5]">
                    并发验货检测中... ({progress.completed}/{progress.total})
                  </p>
                  <p className="text-xs text-[#a09d96] font-mono tracking-wide">
                    已检测 {Math.round((progress.completed / (progress.total || 1)) * 100)}% · 线程并发清洗中
                  </p>
                </div>
                <div className="w-72 h-2.5 rounded-full bg-[#141413] overflow-hidden border border-[#2e2b27]">
                  <div
                    className="h-full bg-[#cc785c] transition-all duration-200"
                    style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            {(summary || (activeFilterTab === 'duplicate' && duplicates.length > 0)) && !isRunning && (
              <div className="space-y-3">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-20 text-sm text-[#a09d96]">
                    当前分类下暂无匹配 Key
                  </div>
                ) : (
                  getFilteredItems().map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#141413] border border-[#2e2b27] hover:border-[#cc785c]/60 transition group smooth-card space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3.5 overflow-hidden">
                          <span className="text-xs font-mono text-[#a09d96] w-6 font-bold tracking-wide">#{idx + 1}</span>
                          <span className="font-mono text-sm text-[#faf9f5] font-semibold truncate max-w-md select-all tracking-wide">
                            {item.key}
                          </span>
                          <StatusBadge status={item.status} size="sm" />
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {'balance' in item && item.balance && (
                            <span className="text-xs font-mono text-[#5db872] font-semibold bg-[#5db872]/15 px-2.5 py-1 rounded-md border border-[#5db872]/30 tracking-wide shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#5db872]" />
                              <span>{item.balance}</span>
                            </span>
                          )}

                          {'latencyMs' in item && item.latencyMs !== undefined && (
                            <span className="text-xs font-mono text-[#faf9f5] font-semibold bg-[#252320] px-2.5 py-1 rounded-md border border-[#2e2b27] tracking-wide shadow-sm">
                              {item.latencyMs} ms
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopySingleKey(item.key, idx)}
                            className="p-2 rounded-lg text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#252320] transition border border-[#2e2b27] smooth-btn cursor-pointer"
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

                      {/* Available models preview (if any) */}
                      {'availableModels' in item && item.availableModels && item.availableModels.length > 0 && (
                        <div className="pt-1.5 border-t border-[#2e2b27]/60 flex items-center gap-2 flex-wrap text-xs text-[#a09d96]">
                          <span className="flex items-center gap-1 text-[#a09d96] font-medium">
                            <Layers className="w-3 h-3 text-[#cc785c]" />
                            <span>模型 ({item.availableModels.length}):</span>
                          </span>
                          {item.availableModels.slice(0, 5).map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="px-1.5 py-0.5 rounded bg-[#252320] border border-[#2e2b27] text-[11px] font-mono text-[#d5d1c8]"
                            >
                              {m}
                            </span>
                          ))}
                          {item.availableModels.length > 5 && (
                            <span className="text-[11px] font-mono text-[#6c6a64]">
                              +{item.availableModels.length - 5} 更多
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Summary Stats */}
          {summary && (
            <div className="px-7 py-4 border-t border-[#2e2b27] bg-[#141413]/70 flex items-center justify-between text-xs text-[#a09d96] font-mono font-medium tracking-wide">
              <span>总提交: <strong className="text-[#faf9f5] font-bold">{summary.total}</strong></span>
              <span>有效可用率: <strong className="text-[#5db872] font-bold">{Math.round((summary.activeCount / (summary.total || 1)) * 100)}%</strong></span>
              <span>平均延迟: <strong className="text-[#faf9f5] font-bold">{Math.round(summary.results.reduce((a, b) => a + (b.latencyMs || 0), 0) / (summary.results.length || 1))} ms</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Settings Popover Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl sm:max-w-2xl rounded-2xl border border-[#2e2b27] bg-[#181715] p-7 sm:p-8 space-y-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2e2b27] pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[#faf9f5] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] shrink-0">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#cc785c]" />
                </div>
                <span>批量检测参数配置</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#252320] transition border border-transparent hover:border-[#2e2b27] cursor-pointer"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 1. Target Probe Model */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-[#faf9f5]">
                    测试探针模型 (Target Model)
                  </label>
                  <span className="text-xs text-[#a09d96]">自适应探测或手动指定</span>
                </div>
                <input
                  type="text"
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  placeholder="auto / gpt-4o-mini / deepseek-chat"
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-2.5 text-sm text-[#faf9f5] focus:outline-none focus:border-[#cc785c] smooth-input font-mono shadow-inner"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'auto', label: 'auto (自适应)' },
                    { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
                    { id: 'deepseek-chat', label: 'deepseek-chat' },
                    { id: 'claude-3-7-sonnet-20250219', label: 'claude-3-7-sonnet' },
                    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setTestModel(chip.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition cursor-pointer ${
                        testModel === chip.id
                          ? 'bg-[#cc785c] text-white border-[#cc785c] font-semibold shadow-sm'
                          : 'bg-[#252320] text-[#a09d96] border-[#2e2b27] hover:text-[#faf9f5] hover:border-[#cc785c]/40'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Frequency & Anti-Ban Strategy */}
              <div className="space-y-3 pt-4 border-t border-[#2e2b27]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#faf9f5]">
                    频率与防封策略
                  </label>
                  <span className="text-xs font-mono text-[#cc785c] font-medium">
                    {antiBanMode === 'safe'
                      ? '安全防封 (2 线程 + 250ms 延时)'
                      : antiBanMode === 'turbo'
                      ? '极速清洗 (10+ 线程 + 0ms 延时)'
                      : '标准平衡 (5 线程 + 50ms 延时)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAntiBanMode('safe');
                      setConcurrency(2);
                      setRequestDelayMs(250);
                    }}
                    className={`p-3.5 rounded-xl border transition text-left cursor-pointer ${
                      antiBanMode === 'safe'
                        ? 'bg-[#cc785c]/15 border-[#cc785c] ring-1 ring-[#cc785c]/30'
                        : 'bg-[#141413] border-[#2e2b27] hover:bg-[#252320]'
                    }`}
                  >
                    <div className="text-[#5db872] font-bold text-sm mb-1">安全防封</div>
                    <div className="text-xs text-[#a09d96]">慢速温和 · 避开 WAF</div>
                    <div className="text-xs text-[#6c6a64] font-mono mt-1">2 线程 · 250ms 延时</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAntiBanMode('balanced');
                      setConcurrency(5);
                      setRequestDelayMs(50);
                    }}
                    className={`p-3.5 rounded-xl border transition text-left cursor-pointer ${
                      antiBanMode === 'balanced'
                        ? 'bg-[#cc785c]/15 border-[#cc785c] ring-1 ring-[#cc785c]/30'
                        : 'bg-[#141413] border-[#2e2b27] hover:bg-[#252320]'
                    }`}
                  >
                    <div className="text-[#e8a55a] font-bold text-sm mb-1">标准平衡</div>
                    <div className="text-xs text-[#a09d96]">默认推荐 · 速度与稳</div>
                    <div className="text-xs text-[#6c6a64] font-mono mt-1">5 线程 · 50ms 延时</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAntiBanMode('turbo');
                      setConcurrency(10);
                      setRequestDelayMs(0);
                    }}
                    className={`p-3.5 rounded-xl border transition text-left cursor-pointer ${
                      antiBanMode === 'turbo'
                        ? 'bg-[#cc785c]/15 border-[#cc785c] ring-1 ring-[#cc785c]/30'
                        : 'bg-[#141413] border-[#2e2b27] hover:bg-[#252320]'
                    }`}
                  >
                    <div className="text-[#cc785c] font-bold text-sm mb-1">极速清洗</div>
                    <div className="text-xs text-[#a09d96]">私有节点 · 满速狂飙</div>
                    <div className="text-xs text-[#6c6a64] font-mono mt-1">10 线程 · 0ms 延时</div>
                  </button>
                </div>
              </div>

              {/* 3. Concurrency Thread Count (1-50) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#faf9f5]">
                    并发请求线程数
                  </label>
                  <span className="text-sm font-mono text-[#cc785c] font-bold">
                    {concurrency} 线程
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-[#cc785c] h-2 bg-[#252320] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#a09d96] font-mono">
                  <span>1 线程 (极度安全)</span>
                  <span>10 线程 (标准并发)</span>
                  <span>50 线程 (满速极速)</span>
                </div>
              </div>

              {/* 4. Request Delay & Jitter Delay */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#faf9f5]">
                    请求防封间隔与随机抖动 (Jitter Delay)
                  </label>
                  <span className="text-sm font-mono text-[#cc785c] font-bold">
                    {requestDelayMs} ms (±25% 随机)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={25}
                  value={requestDelayMs}
                  onChange={(e) => setRequestDelayMs(Number(e.target.value))}
                  className="w-full accent-[#cc785c] h-2 bg-[#252320] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#a09d96] font-mono">
                  <span>0 ms (无间隔)</span>
                  <span>150 ms (防突发)</span>
                  <span>1000 ms (人类节奏)</span>
                </div>
              </div>

              {/* 5. Feature Toggles (Stream Check, Quota Sniff, Model Discovery) */}
              <div className="pt-4 border-t border-[#2e2b27] space-y-4">
                {/* Stream Check */}
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#141413] border border-[#2e2b27]">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#faf9f5]">流式响应检测 (Stream Check)</p>
                    <p className="text-xs text-[#a09d96]">启用 SSE 流式数据块实时测活，更贴近真实大模型对话调用场景</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStreamCheck(!isStreamCheck)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isStreamCheck ? 'bg-[#cc785c]' : 'bg-[#252320]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isStreamCheck ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sniff Balance */}
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#141413] border border-[#2e2b27]">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#faf9f5]">自动穿透嗅探余额/额度</p>
                    <p className="text-xs text-[#a09d96]">探测 OneAPI / NewAPI / OpenAI 等账户剩余额度与有效状态</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckBalance(!checkBalance)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      checkBalance ? 'bg-[#cc785c]' : 'bg-[#252320]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        checkBalance ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sniff Models */}
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#141413] border border-[#2e2b27]">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#faf9f5]">嗅探可用模型列表</p>
                    <p className="text-xs text-[#a09d96]">穿透探测 /v1/models 接口获取该 Key 授权的所有可用模型清单</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckModels(!checkModels)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      checkModels ? 'bg-[#cc785c]' : 'bg-[#252320]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        checkModels ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#2e2b27] flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-[#a09d96]">
                配置项将自动保存在当前浏览器本地
              </span>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] text-sm font-semibold text-white transition shadow-md smooth-btn cursor-pointer"
              >
                保存并返回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#2e2b27] bg-[#181715] p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2e2b27] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#252320] border border-[#2e2b27] text-[#cc785c]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#faf9f5]">批量检测历史记录</h3>
                  <p className="text-xs text-[#a09d96]">本地存储最近 20 批检测记录，支持随时载入回溯</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="flex items-center gap-1 text-xs text-[#c64545] hover:text-[#d95c5c] px-2.5 py-1.5 rounded-lg hover:bg-[#c64545]/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空历史</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-lg text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#252320] transition border border-transparent hover:border-[#2e2b27] cursor-pointer"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="text-center py-16 text-[#a09d96] space-y-2">
                  <Inbox className="w-10 h-10 mx-auto text-[#cc785c] opacity-60" />
                  <p className="text-sm">暂无历史检测记录</p>
                  <p className="text-xs text-[#6c6a64]">每次执行“开始检测”完毕后，将自动归档至此处</p>
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => handleLoadBatchFromHistory(item)}
                    className="p-4 rounded-xl bg-[#141413] border border-[#2e2b27] hover:border-[#cc785c]/60 transition cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#faf9f5]">
                          {item.providerName || 'API 检测批次'}
                        </span>
                        <span className="text-xs font-mono text-[#a09d96]">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {item.testModel && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#252320] text-[#faf9f5] border border-[#2e2b27]">
                            {item.testModel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-[#a09d96]">总数: <strong className="text-[#faf9f5]">{item.total}</strong></span>
                        <span className="text-[#5db872]">有效: <strong className="font-bold">{item.activeCount}</strong></span>
                        {item.exhaustedCount > 0 && <span className="text-[#e8a55a]">无额: {item.exhaustedCount}</span>}
                        {item.rateLimitedCount > 0 && <span className="text-[#d4a017]">限流: {item.rateLimitedCount}</span>}
                        {item.invalidCount > 0 && <span className="text-[#c64545]">无效: {item.invalidCount}</span>}
                        {item.duplicateCount > 0 && <span className="text-[#a09d96]">重复: {item.duplicateCount}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadBatchFromHistory(item);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-[#cc785c] text-xs font-semibold text-white transition smooth-btn shadow-sm"
                      >
                        载入大盘
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="p-1.5 rounded-lg text-[#a09d96] hover:text-[#c64545] hover:bg-[#c64545]/10 transition cursor-pointer"
                        title="删除此条记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#2e2b27] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#252320] text-xs font-semibold text-[#a09d96] hover:text-[#faf9f5] transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
