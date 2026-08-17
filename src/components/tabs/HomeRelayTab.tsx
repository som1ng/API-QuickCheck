import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import { fetchRemoteModels, runBatchScanPool } from '../../engine/scanner/batchScanner';
import { runAudit } from '../../engine/audit/runner';
import { FRONTIER_MODELS } from '../../config/frontierModels';
import { AUDIT_PRESETS, BALANCED_SUITE } from '../../engine/audit/suite';
import { createBaselineSnapshot, saveBaselineSnapshot, validateBaselineSnapshot } from '../../engine/audit/baseline';
import {
  FidelityReport,
  FidelityDepth,
  ModelVerificationProfile,
} from '../../types/fidelity';
import { ModelCheckItem } from '../../types/scanner';
import { AuditProfile, AuditProvider, AuditReportV4 } from '../../types/audit';
import { StatusBadge } from '../common/StatusBadge';
import { FidelityCertificateView } from '../fidelity/FidelityCertificateView';
import {
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
  ClipboardCheck,
  TriangleAlert,
  Upload,
  Save,
} from 'lucide-react';
import {
  ClaudeLogo,
  OpenAILogo,
  GeminiLogo,
  GrokLogo,
} from '../common/ProviderLogos';

const PROFILES: {
  id: ModelVerificationProfile;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  {
    id: 'claude',
    label: 'Anthropic',
    icon: ClaudeLogo,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    icon: OpenAILogo,
  },
  {
    id: 'gemini',
    label: 'Google',
    icon: GeminiLogo,
  },
  {
    id: 'xai',
    label: 'xAI',
    icon: GrokLogo,
  },
];

export const HomeRelayTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  // Active Mode: fidelity (模型真伪检测) vs scanner (全模型可用性检测)
  const [activeMode, setActiveMode] = useState<'fidelity' | 'scanner' | 'audit'>('audit');

  // View Mode in fidelity: 'config' (工作台配置页) vs 'certificate' (颁发的验真证书页)
  const [viewMode, setViewMode] = useState<'config' | 'certificate'>('config');

  // Input states
  const [showKey, setShowKey] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ModelVerificationProfile>('claude');
  const [selectedDepth, setSelectedDepth] = useState<FidelityDepth>('standard');

  // Dropdown states & refs
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const baselineFileInputRef = useRef<HTMLInputElement>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fidelity Audit States
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [report, setReport] = useState<FidelityReport | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReportV4 | null>(null);
  const [auditProfile, setAuditProfile] = useState<AuditProfile>('quick');
  const [auditProvider, setAuditProvider] = useState<AuditProvider | 'auto'>('auto');
  const [selectedAuditProbeIds, setSelectedAuditProbeIds] = useState<string[]>(AUDIT_PRESETS.quick.probeIds);
  const [isCustomAuditSelection, setIsCustomAuditSelection] = useState(false);
  const [baselineMessage, setBaselineMessage] = useState('');

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
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
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
    } catch (err: unknown) {
      alert(`协议审计失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleImportBaseline = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!validateBaselineSnapshot(parsed)) throw new Error('文件不是有效的 API-QuickCheck baseline 快照。');
      saveBaselineSnapshot(parsed);
      setBaselineMessage(`已导入 ${parsed.source === 'official' ? '官方' : '用户'}基线：${parsed.id}`);
    } catch (error: unknown) {
      setBaselineMessage(`基线导入失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSaveUserBaseline = () => {
    if (!auditReport) return;
    const surface = auditReport.target.provider === 'anthropic' ? 'messages' : auditReport.target.provider === 'gemini' ? 'interactions' : 'responses';
    const snapshot = createBaselineSnapshot({
      id: `user-${auditReport.target.provider}-${Date.now()}`,
      provider: auditReport.target.provider,
      model: auditReport.target.model,
      surface,
      region: 'browser',
      serviceTier: 'user-captured',
      report: auditReport,
      source: 'user',
    });
    saveBaselineSnapshot(snapshot);
    setBaselineMessage(`已保存用户基线：${snapshot.id}；下次运行同一模型时会自动加载。`);
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
                检查中转站的协议保真、模型可用性和运行质量；没有足够基线证据时只报告证据不足。
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#1b1a18] border border-[#2e2b27] self-start sm:self-auto shrink-0">
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

              <button
                type="button"
                onClick={() => setActiveMode('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all tracking-wide ${
                  activeMode === 'audit'
                    ? 'bg-[#cc785c] text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>基线审计</span>
              </button>
            </div>
          </div>

          {/* If report exists while in config mode, display a quick jump banner to certificate */}
          {activeMode === 'fidelity' && report && (
            <div className="p-4 rounded-2xl bg-[#181715] border border-[#5db872]/40 flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#5db872]/15 border border-[#5db872]/30 flex items-center justify-center text-[#5db872]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">
                    已有为模型 <span className="font-mono text-[#5db872]">{report.targetModel}</span> 颁发的验真证书 (评分: {report.overallScore}/100)
                  </h4>
                  <p className="text-xs text-[#a09d96]">检测完成时间: {new Date(report.testedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('certificate')}
                className="px-4 py-2 rounded-xl bg-[#5db872]/20 hover:bg-[#5db872]/30 text-[#5db872] hover:text-white text-xs font-semibold transition border border-[#5db872]/40 shadow-sm tracking-wide shrink-0 cursor-pointer"
              >
                查看验真证书 →
              </button>
            </div>
          )}

          {/* ── 2. Unified Configuration Card ── */}
          <div className="rounded-2xl border border-[#2e2b27] bg-[#181715] p-6 sm:p-8 shadow-xl space-y-6 smooth-card">
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
                  <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
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

            {/* Row B: Model & Parameters (In Fidelity mode) */}
            {(activeMode === 'fidelity' || activeMode === 'audit') && (
              <div className="space-y-4 pt-4 border-t border-[#2e2b27]">
                {/* Target Model Combobox (Extracted from user's relay) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#cc785c]" />
                      <span>测试目标模型</span>
                    </label>
                    {availableModels.length > 0 ? (
                      <span className="text-xs text-[#5db872] font-semibold bg-[#5db872]/15 border border-[#5db872]/30 px-2.5 py-1 rounded-md tracking-normal font-sans shadow-sm">
                        已提取模型: {availableModels.length} 个
                      </span>
                    ) : (
                      <span className="text-xs text-[#a09d96] font-mono tracking-normal">
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
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
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
                                ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
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
                  {/* Profile Selector with HD Company SVG Logos & Dynamic Flip */}
                  <div className="space-y-2" ref={profileDropdownRef}>
                    <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#cc785c]" />
                      <span>检测体系</span>
                    </label>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 text-sm text-[#faf9f5] font-semibold focus:border-[#cc785c] focus:outline-none transition smooth-input tracking-wide cursor-pointer hover:border-[#cc785c]/60"
                      >
                        <div className="flex items-center gap-3">
                          {React.createElement(
                            PROFILES.find((p) => p.id === selectedProfile)?.icon || ClaudeLogo,
                            { className: 'w-4 h-4 shrink-0' }
                          )}
                          <span className="font-sans font-medium">{PROFILES.find((p) => p.id === selectedProfile)?.label || 'Anthropic'}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                            isProfileDropdownOpen ? 'rotate-180 text-[#cc785c]' : ''
                          }`}
                        />
                      </button>

                      {/* Dynamic Flip Floating Menu */}
                      {isProfileDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-0.5">
                          {PROFILES.map((p) => {
                            const Icon = p.icon;
                            const isSelected = selectedProfile === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProfile(p.id);
                                  setIsProfileDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-sans text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                                    : 'text-[#faf9f5] hover:bg-[#23211e] hover:text-white'
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="font-medium text-sm">{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
              ) : activeMode === 'audit' ? (
                <button
                  type="button"
                  onClick={handleStartProtocolAudit}
                  disabled={isRunningAudit || !config.baseUrl || !config.apiKey || !config.selectedModel || selectedAuditProbeIds.length === 0}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 smooth-btn tracking-wide"
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

          {activeMode === 'audit' && (
            <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#faf9f5]">原生协议与基线审计</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-300">
                    浏览器阶段只检查低成本协议证据。没有官方快照时，结果只会显示“证据不足”，不会推断模型身份或输出“假冒”结论。
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                  <label className="space-y-1.5">
                    <span className="text-xs text-neutral-400">供应商适配器</span>
                    <select
                      value={auditProvider}
                      onChange={(event) => setAuditProvider(event.target.value as AuditProvider | 'auto')}
                      className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] px-3 py-2 text-sm text-[#faf9f5] focus:border-[#cc785c] focus:outline-none"
                    >
                      <option value="auto">自动识别</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Gemini</option>
                      <option value="xai">xAI</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-neutral-400">执行档位</span>
                    <select
                      value={isCustomAuditSelection ? 'custom' : auditProfile}
                      onChange={(event) => {
                        if (event.target.value !== 'custom') handleAuditPresetChange(event.target.value as AuditProfile);
                      }}
                      className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] px-3 py-2 text-sm text-[#faf9f5] focus:border-[#cc785c] focus:outline-none"
                    >
                      <option value="quick">快速核心</option>
                      <option value="balanced">平衡 24 项声明</option>
                      <option value="deep">深度全量预留</option>
                      <option value="custom">自定义组合</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[#2e2b27] pt-5">
                <span className="text-xs text-neutral-400">9 型号目录：</span>
                {FRONTIER_MODELS.map((frontierModel) => (
                  <button
                    key={frontierModel.id}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_SELECTED_MODEL', payload: frontierModel.id })}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-mono transition ${
                      config.selectedModel === frontierModel.id
                        ? 'border-[#cc785c] bg-[#cc785c]/15 text-[#faf9f5]'
                        : 'border-[#2e2b27] bg-[#141413] text-neutral-400 hover:border-[#cc785c]/50 hover:text-[#faf9f5]'
                    }`}
                  >
                    {frontierModel.displayName}
                  </button>
                ))}
              </div>

              <div className="space-y-4 border-t border-[#2e2b27] pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#faf9f5]">测试参数</h3>
                  <p className="mt-1 text-xs text-neutral-400">选择要发送的测试组合；未实现的项目会保留为 unavailable，不会伪造通过结果。</p>
                  {selectedAuditProbeIds.some((id) => id.startsWith('p2-context-')) && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-[#e8a55a]">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>已选择长上下文测试：每项最多发送约 64K tokens，真实 API 会产生费用；只在确实需要验证上下文窗口时运行。</span>
                    </p>
                  )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-[#cc785c]">已选 {selectedAuditProbeIds.length}/{BALANCED_SUITE.length}</span>
                    <button type="button" onClick={() => { setSelectedAuditProbeIds([]); setIsCustomAuditSelection(true); setAuditReport(null); }} className="text-neutral-400 hover:text-[#faf9f5] transition">清空</button>
                    <button type="button" onClick={() => handleAuditPresetChange(auditProfile)} className="text-[#cc785c] hover:text-[#d98266] transition">恢复档位</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {(['P0', 'P1', 'P2', 'P3'] as const).map((layer) => (
                    <div key={layer} className="rounded-lg border border-[#2e2b27] bg-[#141413] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold tracking-wider text-[#e8a55a]">{layer}</span>
                        <span className="text-[11px] text-neutral-500">{layer === 'P0' || layer === 'P1' ? '浏览器协议' : '本地任务预留'}</span>
                      </div>
                      <div className="space-y-1.5">
                        {BALANCED_SUITE.filter((probe) => probe.layer === layer).map((probe) => {
                          const checked = selectedAuditProbeIds.includes(probe.id);
                          return (
                            <label key={probe.id} className={`flex items-start gap-2.5 rounded-md px-2 py-1.5 cursor-pointer transition ${checked ? 'bg-[#cc785c]/10' : 'hover:bg-[#1f1e1b]'}`}>
                              <input type="checkbox" checked={checked} onChange={() => handleToggleAuditProbe(probe.id)} className="mt-0.5 h-3.5 w-3.5 accent-[#cc785c]" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs text-[#faf9f5]">{probe.title}</span>
                                <span className="block mt-0.5 text-[11px] font-mono text-neutral-500">{probe.id} · {probe.domains.join(' / ')}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {auditReport && (
                <div className="space-y-4 border-t border-[#2e2b27] pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[#faf9f5]">基线快照</div>
                      <div className="mt-1 text-xs text-neutral-400">只加载经过结构校验的 JSON；用户快照不会被标记为官方证据。</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={baselineFileInputRef} type="file" accept="application/json,.json" onChange={handleImportBaseline} className="hidden" />
                      <button type="button" onClick={() => baselineFileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2b27] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#cc785c] hover:text-[#faf9f5]">
                        <Upload className="h-3.5 w-3.5" /> 导入 JSON
                      </button>
                      <button type="button" onClick={handleSaveUserBaseline} className="inline-flex items-center gap-1.5 rounded-lg bg-[#cc785c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d98266]">
                        <Save className="h-3.5 w-3.5" /> 保存为用户基线
                      </button>
                    </div>
                  </div>
                  {baselineMessage && <div className="rounded-lg border border-[#5db8a6]/30 bg-[#5db8a6]/10 px-3 py-2 text-xs text-[#b8e2d8]">{baselineMessage}</div>}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-[#2e2b27] bg-[#141413] p-3"><div className="text-xs text-neutral-400">结论</div><div className="mt-1 text-sm font-semibold text-[#e8a55a]">{auditReport.conclusion === 'inconclusive' ? '证据不足' : auditReport.conclusion === 'consistent' ? '符合基线' : '疑似能力降级'}</div></div>
                    <div className="rounded-lg border border-[#2e2b27] bg-[#141413] p-3"><div className="text-xs text-neutral-400">协议覆盖</div><div className="mt-1 text-sm font-semibold text-[#faf9f5]">{auditReport.coverage.executed}/{auditReport.coverage.total}</div></div>
                    <div className="rounded-lg border border-[#2e2b27] bg-[#141413] p-3"><div className="text-xs text-neutral-400">成功率</div><div className="mt-1 text-sm font-semibold text-[#faf9f5]">{Math.round(auditReport.runtime.successRate * 100)}%</div></div>
                    <div className="rounded-lg border border-[#2e2b27] bg-[#141413] p-3"><div className="text-xs text-neutral-400">基线</div><div className="mt-1 text-sm font-semibold text-[#e8a55a]">{auditReport.baselineId || '未提供'}</div></div>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-300">{auditReport.summary} 未声明跳过 {auditReport.coverage.notClaimed || 0} 项，探索性执行 {auditReport.coverage.exploratory || 0} 项。</p>
                  <div className="overflow-x-auto rounded-lg border border-[#2e2b27]">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead className="border-b border-[#2e2b27] bg-[#141413] text-neutral-400"><tr><th className="px-3 py-2">检查项</th><th className="px-3 py-2">状态</th><th className="px-3 py-2">路由</th><th className="px-3 py-2">说明</th><th className="px-3 py-2">延迟</th></tr></thead>
                      <tbody className="divide-y divide-[#2e2b27]">
                        {auditReport.protocol.map((evidence) => (
                          <tr key={evidence.id}><td className="px-3 py-2 font-mono text-[#faf9f5]">{evidence.title}</td><td className={`px-3 py-2 font-semibold ${evidence.status === 'pass' ? 'text-[#5db872]' : evidence.status === 'fail' ? 'text-[#c64545]' : 'text-[#e8a55a]'}`}>{evidence.status}</td><td className="px-3 py-2 text-neutral-400">{evidence.disposition === 'not_claimed' ? '未声明' : evidence.disposition === 'exploratory_test' ? '探索性' : '标准'}</td><td className="px-3 py-2 text-neutral-300">{evidence.detail}</td><td className="px-3 py-2 font-mono text-neutral-400">{evidence.latencyMs ? `${evidence.latencyMs} ms` : '-'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
                                   setActiveMode('audit');
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
