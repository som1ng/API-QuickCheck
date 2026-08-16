import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import { fetchRemoteModels, runBatchScanPool } from '../../engine/scanner/batchScanner';
import {
  FidelityReport,
  FidelityDepth,
  ModelVerificationProfile,
} from '../../types/fidelity';
import { ModelCheckItem } from '../../types/scanner';
import { StatusBadge } from '../common/StatusBadge';
import { FidelityCertificateView } from '../fidelity/FidelityCertificateView';
import {
  ShieldCheck,
  Play,
  Loader2,
  Layers,
  Gauge,
  Sliders,
  Search,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ListFilter,
  ChevronDown,
  Award,
} from 'lucide-react';

export const HomeRelayTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  // Active Mode: fidelity (模型真伪检测) vs scanner (全模型可用性检测)
  const [activeMode, setActiveMode] = useState<'fidelity' | 'scanner'>('fidelity');

  // View Mode in fidelity: 'config' (工作台配置页) vs 'certificate' (颁发的验真证书页)
  const [viewMode, setViewMode] = useState<'config' | 'certificate'>('config');

  // Input states
  const [showKey, setShowKey] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ModelVerificationProfile>('claude');
  const [selectedDepth, setSelectedDepth] = useState<FidelityDepth>('standard');

  // Model combobox dropdown open/close
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Fidelity Audit States
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [report, setReport] = useState<FidelityReport | null>(null);

  // Scanner States
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ModelCheckItem>>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-sniff models from user's relay station when baseUrl and apiKey are entered
  useEffect(() => {
    if (!config.baseUrl || !config.apiKey || config.apiKey.length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
        if (models.length > 0) {
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
          if (!config.selectedModel) {
            dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
          }
        }
      } catch {
        /* silent */
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, config.selectedModel, dispatch]);

  const handleSelectModel = (modelId: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
    setIsModelDropdownOpen(false);

    // Automatically align verification profile with selected model
    const lower = modelId.toLowerCase();
    if (lower.includes('claude') || lower.includes('fable') || lower.includes('mythos') || lower.includes('sonnet') || lower.includes('opus')) {
      setSelectedProfile('claude');
    } else if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('sol') || lower.includes('terra') || lower.includes('chatgpt')) {
      setSelectedProfile('openai');
    } else if (lower.includes('grok') || lower.includes('xai')) {
      setSelectedProfile('xai');
    } else if (lower.includes('gemini')) {
      setSelectedProfile('gemini');
    }
  };

  const handleStartFidelityAudit = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先输入接口地址 (Base URL) 和 API Key');
      return;
    }

    if (!config.selectedModel) {
      alert('请先输入或选择需要测试的目标模型');
      return;
    }

    setViewMode('config');
    setIsRunningAudit(true);
    setProgressText('正在初始化检测引擎...');
    setProgressPercent(5);

    try {
      const result = await runFidelityAudit(
        config.baseUrl,
        config.apiKey,
        config.selectedModel,
        {
          depth: selectedDepth,
          profile: selectedProfile,
          onProgress: (step, pct) => {
            setProgressText(step);
            setProgressPercent(pct);
          },
        }
      );
      setReport(result);
      // Auto transition & jump to the issued certificate view
      setViewMode('certificate');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`检测过程发生错误: ${msg}`);
    } finally {
      setIsRunningAudit(false);
      setProgressPercent(100);
    }
  };

  const handleFetchModels = async (): Promise<{ id: string; name: string }[]> => {
    if (!config.baseUrl || !config.apiKey) return [];
    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey, config.platformId);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !models.some((m) => m.id === config.selectedModel)) {
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

  const isOfficial = /openai\.com|anthropic\.com|x\.ai|googleapis\.com|google\.com/i.test(config.baseUrl);

  const filteredModels = availableModels.filter((m) => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterProvider === 'all') return true;
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('fable') || m.id.toLowerCase().includes('sonnet');
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('sol') || m.id.toLowerCase().includes('terra');
    if (filterProvider === 'xai') return m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── 1. If in Fidelity Mode & Certificate ViewMode -> Render Official Certificate View ── */}
      {activeMode === 'fidelity' && viewMode === 'certificate' && report ? (
        <FidelityCertificateView
          report={report}
          baseUrl={config.baseUrl}
          onBack={() => setViewMode('config')}
          onReAudit={handleStartFidelityAudit}
          isRunningAudit={isRunningAudit}
        />
      ) : (
        <>
          {/* ── Header & Mode Switcher ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#faf9f5] tracking-tight">
                中转站检测
              </h1>
              <p className="mt-1 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                检测 API 真实性、首字响应延迟 (TTFT) 与模型可用性，检测完成后颁发验真评测证书。
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#1b1a18] border border-[#2e2b27] self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveMode('fidelity')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all tracking-wide ${
                  activeMode === 'fidelity'
                    ? 'bg-[#cc785c] text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>模型真伪检测</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('scanner')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all tracking-wide ${
                  activeMode === 'scanner'
                    ? 'bg-[#cc785c] text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>全模型可用性检测</span>
              </button>
            </div>
          </div>

          {/* If report exists while in config mode, display a quick jump banner to certificate */}
          {activeMode === 'fidelity' && report && (
            <div className="p-4 rounded-2xl bg-[#1b1a18] border border-[#059669]/50 flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#064e3b] border border-[#059669] flex items-center justify-center text-[#6ee7b7]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">
                    已有为模型 <span className="font-mono text-[#6ee7b7]">{report.targetModel}</span> 颁发的验真证书 (评分: {report.overallScore}/100)
                  </h4>
                  <p className="text-xs text-neutral-400">检测完成时间: {new Date(report.testedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('certificate')}
                className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#059669] text-[#6ee7b7] hover:text-white text-xs font-semibold transition border border-[#059669] shadow-sm tracking-wide shrink-0"
              >
                查看验真证书 →
              </button>
            </div>
          )}

          {/* ── 2. Unified Configuration Card ── */}
          <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-8 shadow-xl space-y-6 smooth-card">
            {/* Row A: Endpoint & Key */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Base URL (7 cols) */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#cc785c]" />
                    <span>接口地址 (Base URL)</span>
                  </label>
                  {isOfficial && (
                    <span className="text-xs px-2.5 py-1 rounded-md font-semibold tracking-normal font-sans shadow-sm bg-[#064e3b] border border-[#059669] text-[#6ee7b7]">
                      官方直连
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={config.baseUrl}
                  onChange={(e) => dispatch({ type: 'SET_BASE_URL', payload: e.target.value })}
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                />
              </div>

              {/* API Key (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#cc785c]" />
                    <span>API 密钥 (Key)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-neutral-300 hover:text-white transition flex items-center gap-1 font-medium"
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
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                  />
                </div>
              </div>
            </div>

            {/* Row B: Model & Parameters (In Fidelity mode) */}
            {activeMode === 'fidelity' && (
              <div className="space-y-4 pt-4 border-t border-[#2e2b27]">
                {/* Target Model Combobox (Extracted from user's relay) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#cc785c]" />
                      <span>测试目标模型</span>
                    </label>
                    {availableModels.length > 0 ? (
                      <span className="text-xs text-[#6ee7b7] font-semibold bg-[#064e3b] border border-[#059669] px-2.5 py-1 rounded-md tracking-normal font-sans shadow-sm">
                        已提取模型: {availableModels.length} 个
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 font-mono tracking-normal">
                        填入地址与 Key 后自动提取模型
                      </span>
                    )}
                  </div>

                  {/* Integrated Combobox Component */}
                  <div className="relative" ref={modelDropdownRef}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={config.selectedModel}
                        onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                        onFocus={() => {
                          if (availableModels.length > 0) setIsModelDropdownOpen(true);
                        }}
                        placeholder={availableModels.length > 0 ? "从列表中挑选或直接输入模型 ID..." : "输入需要测试的目标模型 ID (例如: claude-3-7-sonnet-20250219 / gpt-4o)..."}
                        className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-4 pr-10 py-3 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                      />
                      {availableModels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                          className="absolute right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white transition"
                          title="展开模型列表"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180 text-[#cc785c]' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Instant Floating Dropdown Menu for Discovered Models */}
                    {isModelDropdownOpen && availableModels.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in duration-150 p-2 space-y-1">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#5db872] uppercase tracking-wider flex items-center justify-between border-b border-[#2e2b27]/60 pb-1.5 mb-1 font-mono">
                          <span>已提取模型列表 ({availableModels.length})</span>
                          <span className="text-neutral-400 font-normal">点击填入</span>
                        </div>
                        {availableModels.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono text-left transition ${
                              config.selectedModel === m.id
                                ? 'bg-[#cc785c] text-white font-semibold'
                                : 'text-[#faf9f5] hover:bg-[#23211e] hover:text-white'
                            }`}
                          >
                            <span className="font-semibold">{m.id}</span>
                            {m.name && m.name !== m.id && (
                              <span className="text-[11px] opacity-70 truncate max-w-xs">{m.name}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-parameters: Profile & Depth (Equal Title Typography) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Profile Selector (Pure AI Company Names) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#cc785c]" />
                      <span>检测体系</span>
                    </label>
                    <select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value as ModelVerificationProfile)}
                      className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] font-semibold focus:border-[#cc785c] focus:outline-none cursor-pointer smooth-input tracking-wide"
                    >
                      <option value="claude">Anthropic (Claude)</option>
                      <option value="openai">OpenAI</option>
                      <option value="xai">xAI (Grok)</option>
                      <option value="gemini">Google (Gemini)</option>
                    </select>
                  </div>

                  {/* Depth Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#cc785c]" />
                      <span>检测深度</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-[#141413] p-1.5 rounded-xl border border-[#2e2b27]">
                      {[
                        { id: 'quick', label: '快速 · 1s' },
                        { id: 'standard', label: '标准 · 4s' },
                        { id: 'deep', label: '深度 · 8s' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDepth(d.id as FidelityDepth)}
                          className={`py-2 rounded-lg text-xs font-semibold transition tracking-wide ${
                            selectedDepth === d.id
                              ? 'bg-[#cc785c] text-white shadow-sm'
                              : 'text-neutral-300 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Row C: Action & Execution CTA */}
            <div className="pt-4 border-t border-[#2e2b27] flex items-center justify-end">
              {activeMode === 'fidelity' ? (
                <button
                  type="button"
                  onClick={handleStartFidelityAudit}
                  disabled={isRunningAudit || !config.baseUrl || !config.apiKey}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-9 py-3.5 text-base font-semibold text-white shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 smooth-btn tracking-wide"
                >
                  {isRunningAudit ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>正在检测并生成证书...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white" />
                      <span>开始检测并颁发证书</span>
                    </>
                  )}
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

            {/* Progress Bar */}
            {isRunningAudit && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="flex justify-between text-xs text-neutral-200 font-medium">
                  <span className="flex items-center gap-1.5">
                    {progressText}
                  </span>
                  <span className="font-mono text-[#faf9f5] font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#23211e]">
                  <div
                    className="h-full bg-gradient-to-r from-[#cc785c] to-[#d98266] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Batch Scanner View (In scanner mode) ── */}
          {activeMode === 'scanner' && (
            <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card">
              {/* Filter and Search toolbar */}
              <div className="p-5 sm:p-6 border-b border-[#2e2b27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141413]/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `全部 (${availableModels.length})` },
                    { id: 'claude', label: 'Claude' },
                    { id: 'openai', label: 'OpenAI' },
                    { id: 'xai', label: 'xAI (Grok)' },
                    { id: 'google', label: 'Google (Gemini)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFilterProvider(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition tracking-wide ${
                        filterProvider === p.id
                          ? 'bg-[#cc785c] text-white shadow-sm'
                          : 'bg-[#23211e] text-[#faf9f5] hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="搜索模型 ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-9 pr-3 py-2 text-xs font-mono text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                  />
                </div>
              </div>

              {/* Model List Table */}
              {availableModels.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-sm space-y-2">
                  <Layers className="w-8 h-8 text-[#cc785c]/40 mx-auto" />
                  <p>暂无模型数据，请在上方输入接口地址与 Key 后点击「拉取清单」或「开始并发检测」</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#141413] border-b border-[#2e2b27] text-neutral-400 uppercase font-semibold tracking-wide">
                      <tr>
                        <th className="px-6 py-3.5">序号</th>
                        <th className="px-6 py-3.5">模型 ID</th>
                        <th className="px-6 py-3.5">状态</th>
                        <th className="px-6 py-3.5">HTTP 响应</th>
                        <th className="px-6 py-3.5">延迟</th>
                        <th className="px-6 py-3.5">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e2b27]">
                      {filteredModels.map((m, idx) => {
                        const result = scanResults[m.id];
                        return (
                          <tr key={m.id} className="hover:bg-[#23211e]/40 transition">
                            <td className="px-6 py-4 text-neutral-400 font-semibold tracking-wide">{idx + 1}</td>
                            <td className="px-6 py-4 text-[#faf9f5] font-semibold tracking-wide">{m.id}</td>
                            <td className="px-6 py-4">
                              {result ? (
                                <StatusBadge status={result.status} />
                              ) : (
                                <span className="text-neutral-400 font-mono">待检测</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[#faf9f5]">
                              {result?.httpStatus ? (
                                <span
                                  className={`px-2.5 py-1 rounded-md font-mono font-bold tracking-wide shadow-sm ${
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
                            <td className="px-6 py-4 text-[#faf9f5] font-mono tracking-wide">
                              {result?.latencyMs ? `${result.latencyMs}ms` : '--'}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => {
                                  dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id });
                                  setActiveMode('fidelity');
                                  setViewMode('config');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#23211e] hover:bg-[#cc785c] hover:text-white text-[#faf9f5] transition font-sans text-xs font-semibold tracking-wide border border-[#38342f]"
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
        </>
      )}
    </div>
  );
};
