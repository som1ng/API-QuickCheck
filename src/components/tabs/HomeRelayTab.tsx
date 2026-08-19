import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels, runBatchScanPool } from '../../engine/scanner/batchScanner';
import { runAudit } from '../../engine/audit/runner';
import { AUDIT_PRESETS, BALANCED_SUITE } from '../../engine/audit/suite';
import { ModelCheckItem } from '../../types/scanner';
import { AuditProfile, AuditProvider, AuditReportV4 } from '../../types/audit';
import { StatusBadge } from '../common/StatusBadge';
import { ProviderIcon } from '../common/ProviderLogos';
import { AuditReportVisualizer } from '../audit/AuditReportVisualizer';
import { AuditHistoryModal } from '../audit/AuditHistoryModal';
import { getAuditHistory, saveAuditHistory } from '../../engine/audit/auditHistory';
import {
  Play,
  Loader2,
  Layers,
  Search,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ListFilter,
  ChevronDown,
  SlidersHorizontal,
  ClipboardCheck,
  TriangleAlert,
  Check,
  History,
} from 'lucide-react';

const AUDIT_PROVIDER_OPTIONS: { id: AuditProvider | 'auto'; label: string; sub: string; iconKey: string }[] = [
  { id: 'auto', label: '自动识别协议', sub: '根据所选目标模型 ID 自动适配协议与端点', iconKey: 'auto' },
  { id: 'openai', label: 'OpenAI 协议', sub: '原生 Responses / ChatCompletions 接口规范', iconKey: 'openai' },
  { id: 'anthropic', label: 'Anthropic 协议', sub: '原生 Messages API 消息规范与自适应思考', iconKey: 'anthropic' },
  { id: 'gemini', label: 'Google Gemini 协议', sub: '原生 generateContent 多模态与状态机规范', iconKey: 'gemini' },
  { id: 'xai', label: 'xAI (Grok) 协议', sub: '原生 Responses 规范与工具沙箱规范', iconKey: 'xai' },
];

export const HomeRelayTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  // Active Mode: audit (基线协议审计) vs scanner (全模型可用性检测)
  const [activeMode, setActiveMode] = useState<'audit' | 'scanner'>('audit');

  // Input states
  const [showKey, setShowKey] = useState(false);

  // Dropdown states & refs
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const auditReportRef = useRef<HTMLDivElement>(null);
  const scannerTableRef = useRef<HTMLDivElement>(null);

  // Audit States
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [auditReport, setAuditReport] = useState<AuditReportV4 | null>(() => {
    try {
      const saved = localStorage.getItem('apiqc_last_audit_report');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [auditProfile, setAuditProfile] = useState<AuditProfile>('quick');
  const [auditProvider, setAuditProvider] = useState<AuditProvider | 'auto'>('auto');
  const [selectedAuditProbeIds, setSelectedAuditProbeIds] = useState<string[]>(AUDIT_PRESETS.quick.probeIds);
  const [isCustomAuditSelection, setIsCustomAuditSelection] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(() => getAuditHistory().length);

  const handleSelectHistoryReport = (report: AuditReportV4) => {
    setAuditReport(report);
    setActiveMode('audit');
    if (report.target?.model) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: report.target.model });
    }
    if (report.target?.baseUrl) {
      dispatch({ type: 'SET_BASE_URL', payload: report.target.baseUrl });
    }
  };

  // Scanner States
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ModelCheckItem>>(() => {
    try {
      const saved = localStorage.getItem('apiqc_last_scan_results');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });

  // Persist auditReport and scanResults to localStorage
  useEffect(() => {
    if (auditReport) {
      try {
        localStorage.setItem('apiqc_last_audit_report', JSON.stringify(auditReport));
      } catch (e) {
        console.warn('Failed to persist auditReport to localStorage', e);
      }
    }
  }, [auditReport]);

  useEffect(() => {
    if (Object.keys(scanResults).length > 0) {
      try {
        localStorage.setItem('apiqc_last_scan_results', JSON.stringify(scanResults));
      } catch (e) {
        console.warn('Failed to persist scanResults to localStorage', e);
      }
    }
  }, [scanResults]);

  // Smooth scroll to audit report when generated
  useEffect(() => {
    if (auditReport && auditReportRef.current) {
      const timer = setTimeout(() => {
        auditReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [auditReport]);

  // Smooth scroll to scanner table when scan starts
  useEffect(() => {
    if (isScanning && scannerTableRef.current) {
      const timer = setTimeout(() => {
        scannerTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setIsProviderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = (modelId: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
    setIsModelDropdownOpen(false);
  };

  const handleFetchModels = async (): Promise<{ id: string; name: string }[]> => {
    if (!config.baseUrl || !config.apiKey) return [];
    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey, config.platformId);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !config.selectedModel) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
      return models;
    } catch (err: unknown) {
      alert(`拉取模型失败: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING_MODELS', payload: false });
    }
  };

  const handleStartBatchScan = async () => {
    const models = availableModels.length > 0 ? availableModels : await handleFetchModels();
    if (models.length === 0) return;

    setIsScanning(true);
    setScanProgress({ total: models.length, completed: 0 });
    const resultsMap: Record<string, ModelCheckItem> = {};

    try {
      await runBatchScanPool(
        config.baseUrl,
        config.apiKey,
        models,
        5,
        (item, completed) => {
          resultsMap[item.id] = item;
          setScanResults({ ...resultsMap });
          setScanProgress({ total: models.length, completed });
        }
      );
    } catch (err: unknown) {
      alert(`批量检测异常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStartProtocolAudit = async () => {
    if (!config.apiKey || !config.baseUrl || !config.selectedModel) {
      alert('请先输入 Base URL、API Key 和目标模型');
      return;
    }
    setIsRunningAudit(true);
    setProgressText('正在初始化协议审计...');
    setProgressPercent(0);
    try {
      const result = await runAudit({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.selectedModel,
        provider: auditProvider,
        profile: auditProfile,
        selectedProbeIds: selectedAuditProbeIds,
        onProgress: (completed, total, label) => {
          setProgressText(label);
          setProgressPercent(Math.round((completed / Math.max(total, 1)) * 100));
        },
      });
      setAuditReport(result);
      saveAuditHistory(result);
      setHistoryCount(getAuditHistory().length);
    } catch (err: unknown) {
      alert(`协议审计失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleAuditPresetChange = (profile: AuditProfile) => {
    setAuditProfile(profile);
    setSelectedAuditProbeIds(AUDIT_PRESETS[profile].probeIds);
    setIsCustomAuditSelection(false);
    setAuditReport(null);
  };

  const handleToggleAuditProbe = (probeId: string) => {
    setSelectedAuditProbeIds((current) => current.includes(probeId)
      ? current.filter((id) => id !== probeId)
      : [...current, probeId]);
    setIsCustomAuditSelection(true);
    setAuditReport(null);
  };

  const isOfficial = /openai\.com|anthropic\.com|x\.ai|googleapis\.com|google\.com/i.test(config.baseUrl);
  const filteredModels = availableModels.filter((m) => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterProvider === 'all') return true;
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('sol') || m.id.toLowerCase().includes('terra') || m.id.toLowerCase().includes('luna') || m.id.toLowerCase().includes('openai') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('codex');
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('fable') || m.id.toLowerCase().includes('opus') || m.id.toLowerCase().includes('sonnet') || m.id.toLowerCase().includes('anthropic');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma') || m.id.toLowerCase().includes('google');
    if (filterProvider === 'xai') return m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai') || m.id.toLowerCase().includes('x-ai');
    return true;
  });

  const getProviderModelCount = (providerId: string) => {
    if (providerId === 'all') return availableModels.length;
    if (providerId === 'openai') return availableModels.filter((m) => m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('sol') || m.id.toLowerCase().includes('terra') || m.id.toLowerCase().includes('luna') || m.id.toLowerCase().includes('openai') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('codex')).length;
    if (providerId === 'claude') return availableModels.filter((m) => m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('fable') || m.id.toLowerCase().includes('opus') || m.id.toLowerCase().includes('sonnet') || m.id.toLowerCase().includes('anthropic')).length;
    if (providerId === 'google') return availableModels.filter((m) => m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma') || m.id.toLowerCase().includes('google')).length;
    if (providerId === 'xai') return availableModels.filter((m) => m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai') || m.id.toLowerCase().includes('x-ai')).length;
    return 0;
  };

  // Dynamic Regex-Filtered Models for Target Model Combobox Dropdown
  const filteredDropdownModels = useMemo(() => {
    const query = config.selectedModel.trim();
    if (!query) return availableModels;

    try {
      const regex = new RegExp(query, 'i');
      return availableModels.filter((m) => regex.test(m.id) || (m.name && regex.test(m.name)));
    } catch {
      // Graceful fallback for incomplete/typing regex patterns (e.g. typing [ or ( or *)
      const lower = query.toLowerCase();
      return availableModels.filter(
        (m) => m.id.toLowerCase().includes(lower) || (m.name && m.name.toLowerCase().includes(lower))
      );
    }
  }, [availableModels, config.selectedModel]);

  return (
    <div className="space-y-10 sm:space-y-12 animate-in fade-in duration-300 font-sans">
      {/* ── Header & 2-Tab Mode Switcher ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#faf9f5] tracking-tight font-sans">
            中转站检测
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed font-sans">
            支持 <span className="text-[#faf9f5] font-semibold">OpenAI GPT-5.6</span>、<span className="text-[#faf9f5] font-semibold">Anthropic Claude 5</span>、<span className="text-[#faf9f5] font-semibold">Google Gemini 3</span>、<span className="text-[#faf9f5] font-semibold">xAI Grok 4.6</span> 等 2026 前沿旗舰及任意兼容模型。
          </p>
        </div>

        {/* Right side controls: Mode Switcher + History Records Button */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0 flex-wrap">
          {/* 2-Tab Sliding Mode Switcher */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-[#1b1a18] border border-[#2e2b27] select-none min-w-[260px] sm:min-w-[300px]">
            {/* Dynamic sliding highlight pill */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#cc785c] shadow-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [transform:translateZ(0)]"
              style={{
                transform: activeMode === 'audit' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))',
              }}
            />

            <button
              type="button"
              onClick={() => setActiveMode('audit')}
              className="relative z-10 flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 tracking-wide cursor-pointer font-sans"
            >
              <ClipboardCheck className={`w-4 h-4 transition-colors ${activeMode === 'audit' ? 'text-white' : 'text-neutral-400'}`} />
              <span className={`transition-colors ${activeMode === 'audit' ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'}`}>
                基线审计
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('scanner')}
              className="relative z-10 flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 tracking-wide cursor-pointer font-sans"
            >
              <ListFilter className={`w-4 h-4 transition-colors ${activeMode === 'scanner' ? 'text-white' : 'text-neutral-400'}`} />
              <span className={`transition-colors ${activeMode === 'scanner' ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'}`}>
                全模型可用性检测
              </span>
            </button>
          </div>

          {/* History Records Button (Strictly No Emoji) */}
          <button
            type="button"
            onClick={() => {
              setHistoryCount(getAuditHistory().length);
              setIsHistoryModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#2e2b27] bg-[#1b1a18] hover:bg-[#22201d] hover:border-[#cc785c]/40 text-xs sm:text-sm font-semibold text-[#faf9f5] transition cursor-pointer shadow-sm font-sans"
            title="查看历史协议基线检测记录"
          >
            <History className="w-4 h-4 text-[#cc785c]" />
            <span>历史记录</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#cc785c]/20 text-[#cc785c] border border-[#cc785c]/30 text-xs font-bold font-sans">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Unified Configuration Card ── */}
      <div className="rounded-2xl border border-[#2e2b27] bg-[#181715] p-6 sm:p-8 shadow-xl space-y-6 smooth-card">
            {/* Row A: Endpoint & Key */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Base URL (7 cols) */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-[15px] font-bold text-[#faf9f5] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#cc785c]" />
                    <span>接口地址 (Base URL)</span>
                  </label>
                  {isOfficial && (
                    <span className="text-xs px-2.5 py-1 rounded-md font-semibold tracking-normal font-sans shadow-sm bg-[#5db872]/15 border border-[#5db872]/30 text-[#5db872]">
                      官方直连
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={config.baseUrl}
                  onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                />
              </div>

              {/* API Key (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-[15px] font-bold text-[#faf9f5] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#cc785c]" />
                    <span>API 密钥 (Key)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-[#a09d96] hover:text-[#faf9f5] transition flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showKey ? '隐藏' : '显示'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.apiKey}
                    onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                  />
                </div>
              </div>
            </div>

            {/* Row B: Target Model Selection (In Audit mode) */}
            {activeMode === 'audit' && (
              <div className="space-y-4 pt-4 border-t border-[#2e2b27]">
                {/* Target Model Combobox (Extracted from user's relay) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm sm:text-[15px] font-bold text-[#faf9f5] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#cc785c]" />
                      <span>测试目标模型</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {availableModels.length > 0 && (
                        <span className="text-xs text-[#5db872] font-semibold bg-[#5db872]/15 border border-[#5db872]/30 px-2.5 py-1 rounded-md tracking-normal font-sans shadow-sm">
                          已提取 {availableModels.length} 个模型
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFetchModels()}
                        disabled={isLoadingModels || !config.baseUrl || !config.apiKey}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3e3b35] bg-[#22201d] hover:bg-[#2e2b27] text-xs font-medium text-[#faf9f5] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                        title="从当前中转站拉取可用模型列表"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${isLoadingModels ? 'animate-spin' : ''}`} />
                        <span>{isLoadingModels ? '正在拉取...' : availableModels.length > 0 ? '重新拉取' : '拉取模型列表'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Integrated Combobox Component */}
                  <div className="relative" ref={modelDropdownRef}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={config.selectedModel}
                        onChange={(e) => {
                          dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value });
                          if (availableModels.length > 0) setIsModelDropdownOpen(true);
                        }}
                        onFocus={() => {
                          if (availableModels.length > 0) setIsModelDropdownOpen(true);
                        }}
                        placeholder={availableModels.length > 0 ? "支持正则/关键词实时筛选或手动输入模型 ID..." : "输入需要测试的目标模型 ID (如 gpt-4o, claude-3-7-sonnet)..."}
                        className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-4 pr-10 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                      />
                      {availableModels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                          className="absolute right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
                          title="展开/收起模型列表"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isModelDropdownOpen ? 'rotate-180 text-[#cc785c]' : 'text-[#a09d96]'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Silky Smooth Downward Grid Dropdown Menu for Discovered Models (Razor Sharp Text) */}
                    <div
                      className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl shadow-black/60 overflow-hidden transition-[opacity,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isModelDropdownOpen && availableModels.length > 0
                          ? 'opacity-100 pointer-events-auto border-[#cc785c]/40 ring-1 ring-[#cc785c]/20'
                          : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isModelDropdownOpen && availableModels.length > 0
                            ? 'grid-rows-[1fr]'
                            : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="p-2 space-y-1 max-h-72 overflow-y-auto font-sans">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5db872] uppercase tracking-wider flex items-center justify-between border-b border-[#2e2b27]/60 pb-1.5 mb-1 font-mono">
                              <span>
                                {config.selectedModel.trim()
                                  ? `正则匹配 (${filteredDropdownModels.length}/${availableModels.length})`
                                  : `已提取模型列表 (${availableModels.length})`}
                              </span>
                              <span className="text-neutral-400 font-normal">
                                {filteredDropdownModels.length > 0 ? '点击填入' : '无匹配结果'}
                              </span>
                            </div>
                            {filteredDropdownModels.length > 0 ? (
                              filteredDropdownModels.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectModel(m.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono text-left transition-colors duration-150 cursor-pointer ${
                                    config.selectedModel === m.id
                                      ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                                      : 'text-[#faf9f5] hover:bg-[#252320] hover:text-[#e8a55a]'
                                  }`}
                                >
                                  <span className="font-semibold">{m.id}</span>
                                  {m.name && m.name !== m.id && (
                                    <span className="text-[11px] opacity-70 truncate max-w-xs">{m.name}</span>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="py-6 text-center text-xs text-neutral-400 font-mono space-y-1">
                                <div>未找到匹配当前输入/正则的模型</div>
                                <div className="text-[10px] text-neutral-400 opacity-80">
                                  可直接按回车或保留当前自定义模型 ID
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row B.2: Dynamic Provider Adapter Dropdown (Under Target Model, Above Test Parameters) */}
                {(() => {
                  const currentProviderOpt = AUDIT_PROVIDER_OPTIONS.find((o) => o.id === auditProvider) || AUDIT_PROVIDER_OPTIONS[0];
                  return (
                    <div className="space-y-2 pt-4 border-t border-[#2e2b27]">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm sm:text-[15px] font-bold text-[#faf9f5] flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#cc785c]" />
                          <span>供应商适配器</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3e3b35] bg-[#22201d] text-xs font-medium text-[#faf9f5] shadow-sm">
                            <span className="text-neutral-400">当前协议：</span>
                            <span className="text-[#faf9f5] font-semibold">{currentProviderOpt.label}</span>
                          </span>
                        </div>
                      </div>

                      <div className="relative" ref={providerDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#2e2b27] bg-[#141413] hover:border-[#3e3b35] transition-colors duration-150 cursor-pointer shadow-sm group select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#22201d] border border-[#3e3b35] flex items-center justify-center shrink-0">
                              <ProviderIcon providerId={currentProviderOpt.iconKey} size={16} />
                            </div>
                            <div className="flex flex-col items-start text-left min-w-0">
                              <span className="text-sm font-semibold text-[#faf9f5]">
                                {currentProviderOpt.label}
                              </span>
                              <span className="text-xs text-neutral-400 truncate">
                                {currentProviderOpt.sub}
                              </span>
                            </div>
                          </div>

                          <ChevronDown
                            className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                              isProviderDropdownOpen ? 'rotate-180 text-[#cc785c]' : 'group-hover:text-[#faf9f5]'
                            }`}
                          />
                        </button>

                        {/* Dynamic Downward Expanding Menu */}
                        <div
                          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl shadow-black/80 overflow-hidden transition-[opacity,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isProviderDropdownOpen
                              ? 'opacity-100 pointer-events-auto border-[#cc785c]/40 ring-1 ring-[#cc785c]/20'
                              : 'opacity-0 pointer-events-none'
                          }`}
                        >
                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isProviderDropdownOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
                                <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-[#2e2b27]/60 pb-1 mb-1 font-mono">
                                  <span>选择协议解析规范</span>
                                  <span className="text-[10px] text-neutral-500 font-normal">点击切换</span>
                                </div>
                                {AUDIT_PROVIDER_OPTIONS.map((opt) => {
                                  const isSelected = auditProvider === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setAuditProvider(opt.id);
                                        setIsProviderDropdownOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#cc785c]/15 border border-[#cc785c]/40 text-white shadow-sm'
                                          : 'text-[#faf9f5] hover:bg-[#252320] hover:text-[#faf9f5]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                          isSelected ? 'bg-[#cc785c]/25 text-white' : 'bg-[#22201d] border border-[#3e3b35]'
                                        }`}>
                                          <ProviderIcon providerId={opt.iconKey} size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-[#cc785c]' : 'text-[#faf9f5]'}`}>
                                            {opt.label}
                                          </span>
                                          <span className="text-[11px] text-neutral-400 truncate">
                                            {opt.sub}
                                          </span>
                                        </div>
                                      </div>

                                      {isSelected && (
                                        <Check className="w-4 h-4 text-[#cc785c] shrink-0 ml-2" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Row B.3: Test Parameter Tiers (快速 / 标准 / 深度) */}
                <div className="space-y-2.5 pt-4 border-t border-[#2e2b27]">
                  <label className="text-sm sm:text-[15px] font-bold text-[#faf9f5] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#cc785c]" />
                    <span>测试参数</span>
                  </label>

                  {/* 3-Gear Dynamic Sliding Segmented Container */}
                  <div className="relative flex p-1.5 rounded-2xl bg-[#141413] border border-[#2e2b27] select-none shadow-inner">
                    {/* Dynamic sliding highlight indicator pill */}
                    <div
                      className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/3)] rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-transform z-0"
                      style={{
                        transform:
                          auditProfile === 'quick'
                            ? 'translate3d(0, 0, 0)'
                            : auditProfile === 'balanced'
                            ? 'translate3d(100%, 0, 0)'
                            : 'translate3d(200%, 0, 0)',
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-xl transition-colors duration-200 ${
                          isCustomAuditSelection
                            ? 'bg-[#22201d] border border-[#cc785c]/40'
                            : 'bg-[#cc785c] shadow-lg shadow-[#cc785c]/25'
                        }`}
                      />
                    </div>

                    {[
                      { id: 'quick' as const, label: '快速', desc: '预估 ~15s' },
                      { id: 'balanced' as const, label: '标准 (推荐)', desc: '预估 ~30s' },
                      { id: 'deep' as const, label: '全量', desc: '预估 ~50s' },
                    ].map((tier) => {
                      const isSelected = !isCustomAuditSelection && auditProfile === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => handleAuditPresetChange(tier.id)}
                          className="relative z-10 flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl cursor-pointer text-center"
                        >
                          <span
                            className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isSelected ? 'text-white font-bold' : 'text-[#faf9f5] hover:text-white'
                            }`}
                          >
                            {tier.label}
                          </span>
                          <span
                            className={`mt-1 text-xs font-medium transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isSelected ? 'text-white/95' : 'text-[#a09d96]'
                            }`}
                          >
                            {tier.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Audit Parameters — collapsible in-card panel */}
                <div className="pt-4 border-t border-[#2e2b27]">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    aria-expanded={isAdvancedOpen}
                     className="group w-full flex items-center justify-between gap-3 cursor-pointer select-none rounded-lg px-2 py-1.5 -mx-2 hover:bg-[#1f1e1b] transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm sm:text-[15px] font-bold text-[#faf9f5]">
                      <SlidersHorizontal className="w-4 h-4 text-[#cc785c]" />
                      <span>高级测试参数</span>
                    </span>
                    <span className="flex items-center gap-2.5">
                       <span className="inline-flex items-center gap-2 rounded-lg border border-[#3e3b35] bg-[#22201d] px-3 py-1.5 text-xs font-medium text-[#faf9f5] shadow-sm">
                         <span className={`h-1.5 w-1.5 rounded-full ${selectedAuditProbeIds.length > 0 ? 'bg-[#cc785c] shadow-[0_0_7px_rgba(204,120,92,0.65)]' : 'bg-[#6c6a64]'}`} />
                         <span>{isCustomAuditSelection ? '自定义' : AUDIT_PRESETS[auditProfile]?.label || '标准'} · {selectedAuditProbeIds.length}/{BALANCED_SUITE.length}</span>
                       </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isAdvancedOpen ? 'rotate-180 text-[#cc785c]' : 'text-neutral-400 group-hover:text-[#faf9f5]'
                        }`}
                      />
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isAdvancedOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div
                      className={`overflow-hidden transition-[visibility] duration-300 ${
                        isAdvancedOpen ? 'visible' : 'invisible'
                      }`}
                    >
                      <div className="pt-4 space-y-4">
                        {/* Probe selection with clean subordinate hierarchy */}
                           <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2e2b27] bg-[#181715] px-3 py-2">
                             <span className="text-xs text-neutral-400">探针用例清单</span>
                             <div className="flex items-center gap-3 text-xs">
                               <button type="button" onClick={() => { setSelectedAuditProbeIds([]); setIsCustomAuditSelection(true); setAuditReport(null); }} className="text-[#8e8b82] hover:text-[#faf9f5] transition cursor-pointer">清空</button>
                               <span className="h-3.5 w-px bg-[#3a3732]" />
                               <button type="button" onClick={() => handleAuditPresetChange(auditProfile)} className="text-[#cc785c] hover:text-[#d98266] transition cursor-pointer font-medium">恢复档位</button>
                             </div>
                           </div>

                          {selectedAuditProbeIds.some((id) => id.startsWith('p2-context-')) && (
                            <p className="flex items-start gap-1.5 text-xs text-[#e8a55a] bg-[#e8a55a]/10 border border-[#e8a55a]/25 p-2 rounded-lg">
                              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>已选择长上下文测试：每项最多发送约 64K tokens，真实 API 会产生费用；只在确实需要验证上下文窗口时运行。</span>
                            </p>
                          )}

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                             {(['P0', 'P1', 'P2', 'P3'] as const).map((layer) => (
                               <div key={layer} className="group/section rounded-lg border border-[#302d29] bg-[#181715] p-3.5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                                 <div className="flex items-center justify-between border-b border-[#2b2925] pb-2.5">
                                   <div className="flex items-center gap-2.5">
                                     <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[#cc785c]/35 bg-[#cc785c]/10 px-1.5 text-[11px] font-mono font-bold tracking-wide text-[#d98266]">{layer}</span>
                                     <span className="text-xs font-medium text-[#faf9f5]">{layer === 'P0' ? '协议基线' : layer === 'P1' ? '状态与工具' : layer === 'P2' ? '能力夹具' : '稳定性样本'}</span>
                                   </div>
                                   <span className="text-[10px] font-mono text-[#6c6a64]">{BALANCED_SUITE.filter((probe) => probe.layer === layer && selectedAuditProbeIds.includes(probe.id)).length}/{BALANCED_SUITE.filter((probe) => probe.layer === layer).length}</span>
                                 </div>
                                 <div className="space-y-1">
                                   {BALANCED_SUITE.filter((probe) => probe.layer === layer).map((probe) => {
                                     const checked = selectedAuditProbeIds.includes(probe.id);
                                     return (
                                       <label key={probe.id} className={`group/item relative flex min-h-[48px] items-center gap-3 rounded-md border px-2.5 py-2 cursor-pointer transition-all duration-150 ${checked ? 'border-[#cc785c]/35 bg-[#cc785c]/[0.09] shadow-[inset_2px_0_0_#cc785c]' : 'border-transparent hover:border-[#3a3732] hover:bg-[#1f1e1b]'}`}>
                                         <input type="checkbox" checked={checked} onChange={() => handleToggleAuditProbe(probe.id)} className="peer sr-only" />
                                         <span aria-hidden="true" className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border transition-all ${checked ? 'border-[#cc785c] bg-[#cc785c] text-white shadow-[0_0_0_3px_rgba(204,120,92,0.12)]' : 'border-[#5a554d] bg-[#141413] text-transparent group-hover/item:border-[#a09d96]'}`}>
                                           <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2.2 6.2 2.3 2.2 5.3-5" /></svg>
                                         </span>
                                         <span className="min-w-0 flex-1">
                                           <span className={`block text-xs leading-snug transition-colors ${checked ? 'font-medium text-[#faf9f5]' : 'text-[#d5d1c8] group-hover/item:text-[#faf9f5]'}`}>{probe.title}</span>
                                           <span className={`mt-1 block truncate text-[10px] font-mono ${checked ? 'text-[#b6afa5]' : 'text-[#6c6a64]'}`}>{probe.id} <span className="text-[#4e4a44]">·</span> {probe.domains.join(' / ')}</span>
                                         </span>
                                         {checked && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c] shadow-[0_0_8px_rgba(204,120,92,0.65)]" />}
                                       </label>
                                     );
                                   })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Row C: Action & Execution CTA */}
            <div className="pt-4 border-t border-[#2e2b27] flex items-center justify-end">
              {activeMode === 'audit' ? (
                <button
                  type="button"
                  onClick={handleStartProtocolAudit}
                  disabled={isRunningAudit || !config.baseUrl || !config.apiKey || !config.selectedModel || selectedAuditProbeIds.length === 0}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 smooth-btn tracking-wide cursor-pointer"
                >
                  {isRunningAudit ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                  <span>{isRunningAudit ? '协议审计中...' : '运行浏览器协议审计'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={isLoadingModels || isScanning}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3 text-xs font-semibold text-[#faf9f5] hover:bg-[#2b2926] hover:text-white transition disabled:opacity-40 tracking-wide shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    <span>{availableModels.length > 0 ? `已拉取 (${availableModels.length})` : '拉取清单'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartBatchScan}
                    disabled={isScanning || (!config.baseUrl || !config.apiKey)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition disabled:opacity-50 smooth-btn tracking-wide"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>检测中 ({scanProgress.completed}/{scanProgress.total})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>开始并发检测</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar (Enlarged and Crisp) */}
            {isRunningAudit && (
              <div className="space-y-2.5 pt-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm sm:text-[15px] font-semibold text-[#faf9f5]">
                    <Loader2 className="w-4 h-4 text-[#cc785c] animate-spin shrink-0" />
                    <span>{progressText}</span>
                  </span>
                  <span className="font-mono text-sm sm:text-[15px] font-bold text-[#cc785c] ml-3 shrink-0">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#23211e] border border-[#2e2b27]">
                  <div
                    className="h-full bg-gradient-to-r from-[#cc785c] via-[#d98266] to-[#e8a55a] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(204,120,92,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {activeMode === 'audit' && auditReport && (
            <div ref={auditReportRef} className="scroll-mt-6">
              <AuditReportVisualizer report={auditReport} />
            </div>
          )}

          {/* ── 3. Batch Scanner View (In scanner mode) ── */}
          {activeMode === 'scanner' && (
            <div
              ref={scannerTableRef}
              className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card scroll-mt-6 animate-in fade-in duration-300"
            >
              {/* Filter and Search toolbar */}
              <div className="p-4 sm:p-6 border-b border-[#2e2b27] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#141413]/90">
                {(() => {
                  const tabs = [
                    { id: 'all', label: '全部', icon: <Layers className="w-4 h-4" /> },
                    { id: 'openai', label: 'OpenAI', icon: <ProviderIcon providerId="openai" size={16} className="w-4 h-4 shrink-0" /> },
                    { id: 'claude', label: 'Claude', icon: <ProviderIcon providerId="claude" size={16} className="w-4 h-4 shrink-0" /> },
                    { id: 'google', label: 'Gemini', icon: <ProviderIcon providerId="google" size={16} className="w-4 h-4 shrink-0" /> },
                    { id: 'xai', label: 'Grok', icon: <ProviderIcon providerId="xai" size={16} className="w-4 h-4 shrink-0" /> },
                  ];
                  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === filterProvider));
                  return (
                    <div className="relative grid grid-cols-5 p-1.5 rounded-2xl bg-[#141413] border border-[#2e2b27] select-none shadow-inner w-full sm:w-[620px] overflow-hidden">
                      {/* Dynamic sliding highlight indicator pill */}
                      <div
                        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-transform z-0"
                        style={{
                          width: `calc((100% - 12px) / ${tabs.length})`,
                          transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
                        }}
                      >
                        <div className="w-full h-full rounded-xl bg-[#cc785c] shadow-lg shadow-[#cc785c]/25 border border-[#cc785c]" />
                      </div>

                      {tabs.map((tab) => {
                        const count = getProviderModelCount(tab.id);
                        const isSelected = filterProvider === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFilterProvider(tab.id)}
                            className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl cursor-pointer select-none transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          >
                            <span className={isSelected ? 'text-white' : 'text-[#d5d1c8] hover:text-white transition-colors'}>
                              {tab.icon}
                            </span>
                            <span className={`text-sm tracking-normal transition-colors duration-300 ${isSelected ? 'text-white font-bold' : 'text-[#faf9f5] font-bold'}`}>
                              {tab.label}
                            </span>
                            <span
                              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md transition-all duration-300 ${
                                isSelected
                                  ? 'bg-black/35 border border-white/20 text-white shadow-sm'
                                  : 'bg-[#22201d] border border-[#3e3b35] text-slate-200'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    placeholder="搜索模型 ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-10 pr-4 py-2.5 text-sm font-mono text-[#faf9f5] placeholder-[#8e8b82] focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                  />
                </div>
              </div>

              {/* Model List Table */}
              {availableModels.length === 0 ? (
                <div className="p-14 text-center text-slate-300 space-y-2.5">
                  <Layers className="w-9 h-9 text-[#cc785c] mx-auto" />
                  <p className="font-semibold text-base text-slate-200">暂无模型数据，请在上方输入接口地址与 Key 后点击「拉取清单」或「开始并发检测」</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-[#181715] border-b border-[#2e2b27] text-slate-100 uppercase font-mono font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-xs sm:text-sm">序号</th>
                        <th className="px-6 py-4 text-xs sm:text-sm">模型 ID</th>
                        <th className="px-6 py-4 text-xs sm:text-sm">状态</th>
                        <th className="px-6 py-4 text-xs sm:text-sm">HTTP 响应</th>
                        <th className="px-6 py-4 text-xs sm:text-sm">延迟</th>
                        <th className="px-6 py-4 text-xs sm:text-sm">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e2b27]">
                      {filteredModels.map((m, idx) => {
                        const result = scanResults[m.id];
                        return (
                          <tr key={m.id} className="hover:bg-[#23211e]/60 transition">
                            <td className="px-6 py-4 text-slate-200 font-mono font-bold tracking-wide">#{idx + 1}</td>
                            <td className="px-6 py-4 text-[#faf9f5] font-mono font-bold tracking-wide text-sm">{m.id}</td>
                            <td className="px-6 py-4">
                              {result ? (
                                <StatusBadge status={result.status} />
                              ) : (
                                <span className="text-slate-300 font-mono font-semibold text-xs sm:text-sm">待检测</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[#faf9f5]">
                              {result?.httpStatus ? (
                                <span
                                  className={`px-3 py-1 rounded-md font-mono font-bold tracking-wide text-xs sm:text-sm shadow-sm ${
                                    result.httpStatus === 200
                                      ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                                      : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                                  }`}
                                >
                                  {result.httpStatus}
                                </span>
                              ) : (
                                '--'
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-100 font-mono font-bold tracking-wide text-sm">
                              {result?.latencyMs ? `${result.latencyMs}ms` : '--'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => {
                                  dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id });
                                  setActiveMode('audit');
                                }}
                                className="px-4 py-2 rounded-xl bg-[#22201d] hover:bg-[#cc785c] hover:text-white text-[#faf9f5] transition font-sans text-xs sm:text-sm font-bold tracking-wide border border-[#3e3b35] cursor-pointer shadow-sm active:scale-95"
                              >
                                检测此模型
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit History Modal (Strictly No Emojis) */}
          <AuditHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            onSelectReport={handleSelectHistoryReport}
          />
        </div>
      );
    };
