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
import {
  ShieldCheck,
  Zap,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Coins,
  Layers,
  Gauge,
  Sliders,
  Search,
  Activity,
  Cpu,
  Copy,
  AlertTriangle,
  RotateCcw,
  Shield,
  Terminal,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ListFilter,
  ChevronDown,
} from 'lucide-react';

const POPULAR_MODELS = [
  // Anthropic Claude
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', family: 'claude' as const },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', family: 'claude' as const },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', family: 'claude' as const },

  // OpenAI
  { id: 'gpt-4.5-preview', label: 'GPT-4.5', family: 'openai' as const },
  { id: 'o3-mini', label: 'o3-mini', family: 'openai' as const },
  { id: 'o1', label: 'OpenAI o1', family: 'openai' as const },
  { id: 'gpt-4o', label: 'GPT-4o', family: 'openai' as const },

  // xAI
  { id: 'grok-3', label: 'Grok 3', family: 'xai' as const },
  { id: 'grok-2-latest', label: 'Grok 2', family: 'xai' as const },

  // Google Gemini
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', family: 'gemini' as const },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', family: 'gemini' as const },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', family: 'gemini' as const },
];

export const HomeRelayTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  // Active Mode: fidelity (模型真伪检测) vs scanner (全模型可用性检测)
  const [activeMode, setActiveMode] = useState<'fidelity' | 'scanner'>('fidelity');

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
  const [probeFilter, setProbeFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [copiedReport, setCopiedReport] = useState(false);

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

  // Auto-sniff models when user inputs baseUrl and apiKey
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
    }, 1200);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, config.selectedModel, dispatch]);

  const handleSelectModel = (modelId: string, family?: 'claude' | 'openai' | 'xai' | 'gemini') => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
    setIsModelDropdownOpen(false);

    // Auto align profile based on model family
    if (family) {
      setSelectedProfile(family);
    } else {
      const lower = modelId.toLowerCase();
      if (lower.includes('claude')) setSelectedProfile('claude');
      else if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3')) setSelectedProfile('openai');
      else if (lower.includes('grok') || lower.includes('xai')) setSelectedProfile('xai');
      else if (lower.includes('gemini')) setSelectedProfile('gemini');
    }
  };

  const handleStartFidelityAudit = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先输入中转站接口地址 (Base URL) 和 API Key');
      return;
    }

    setIsRunningAudit(true);
    setProgressText('正在初始化检测引擎...');
    setProgressPercent(5);

    try {
      const result = await runFidelityAudit(
        config.baseUrl,
        config.apiKey,
        config.selectedModel || 'claude-3-7-sonnet-20250219',
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

  const handleCopyMarkdownReport = async () => {
    if (!report) return;

    const md = `# API-QuickCheck 顶尖模型鉴别检测报告
- **目标模型**: \`${report.targetModel}\`
- **接口地址**: \`${config.baseUrl}\`
- **检测体系**: \`${report.verificationProfile}\` (深度: \`${report.depth}\`)
- **真实性评分**: **${report.overallScore} / 100** (${report.level === 'genuine' ? '✅ 官方正品' : report.level === 'suspect_downgraded' ? '⚠️ 疑似降级' : '❌ 虚假冒充'})
- **首字响应速度 (TTFT)**: \`${report.firstTokenLatencyMs || 0} ms\`
- **流式生成速率**: \`${report.generationTps || 0} tok/s\`
- **思考耗时**: \`${report.thinkingTimeMs || 0} ms\`
- **总耗时 / Token**: \`${(report.totalDurationMs / 1000).toFixed(2)}s\` / \`${report.totalTokens.total} Tokens\`
- **判定结论**: ${report.summary}

## 探针结果明细 (${report.probes.length} 项)
${report.probes.map((p, i) => `### ${i + 1}. ${p.title} [${p.passed ? 'PASS' : 'FAIL'}]
- **得分**: ${p.score} / 100 | **耗时**: ${p.latencyMs}ms
- **详情**: ${p.details}
${p.actualOutput ? `\`\`\`\n${p.actualOutput.trim()}\n\`\`\`` : ''}
`).join('\n')}

---
*报告生成于 API-QuickCheck (https://github.com/som1ng/API-QuickCheck)*`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // ignore
    }
  };

  const isOfficial = /openai\.com|anthropic\.com|x\.ai|googleapis\.com|google\.com/i.test(config.baseUrl);

  const displayedProbes = report
    ? report.probes.filter((p) => {
        if (probeFilter === 'passed') return p.passed;
        if (probeFilter === 'failed') return !p.passed;
        return true;
      })
    : [];

  const filteredModels = availableModels.filter((m) => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterProvider === 'all') return true;
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude');
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('chatgpt');
    if (filterProvider === 'xai') return m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── 1. Header & Mode Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#faf9f5] tracking-tight">
            中转站检测
          </h1>
          <p className="mt-1 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
            聚焦 4 家顶尖大厂（Anthropic Claude、OpenAI、xAI Grok、Google Gemini）真伪验真与首字速度 (TTFT)。
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
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-semibold tracking-normal font-sans shadow-sm ${
                  isOfficial
                    ? 'bg-[#064e3b] border border-[#059669] text-[#6ee7b7]'
                    : config.baseUrl
                    ? 'bg-[#2a1d17] border border-[#ea580c] text-[#fdba74]'
                    : 'bg-[#23211e] border border-[#44403c] text-[#faf9f5]'
                }`}
              >
                {isOfficial ? '官方直连' : config.baseUrl ? '中转节点' : '待配置'}
              </span>
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
            {/* Target Model Integrated Combobox Input + Pills */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#cc785c]" />
                  <span>测试目标模型</span>
                </label>
                {availableModels.length > 0 && (
                  <span className="text-xs text-[#6ee7b7] font-semibold bg-[#064e3b] border border-[#059669] px-2.5 py-1 rounded-md tracking-normal font-sans shadow-sm">
                    已检测到模型: {availableModels.length} 个
                  </span>
                )}
              </div>

              {/* Integrated Combobox Component with Instant Built-in Dropdown Menu */}
              <div className="relative" ref={modelDropdownRef}>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={config.selectedModel}
                    onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                    onFocus={() => setIsModelDropdownOpen(true)}
                    placeholder="输入或下拉挑选模型，例如: claude-3-7-sonnet-20250219 / gpt-4.5-preview / grok-3"
                    className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-4 pr-10 py-3 font-mono text-sm text-[#faf9f5] placeholder-neutral-500 focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="absolute right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white transition"
                    title="展开模型列表"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180 text-[#cc785c]' : ''}`} />
                  </button>
                </div>

                {/* Instant Floating Dropdown Menu */}
                {isModelDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in duration-150 divide-y divide-[#2e2b27]/60">
                    {/* Section 1: Curated Top Frontier Models */}
                    <div className="p-2">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        🔥 4 家大厂顶尖旗舰模型
                      </div>
                      <div className="space-y-1">
                        {POPULAR_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id, m.family)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-left transition ${
                              config.selectedModel === m.id
                                ? 'bg-[#cc785c] text-white font-semibold'
                                : 'text-[#faf9f5] hover:bg-[#23211e] hover:text-white'
                            }`}
                          >
                            <span>{m.id}</span>
                            <span className="text-[11px] opacity-75 font-sans font-medium">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Remote Discovered Models (if fetched) */}
                    {availableModels.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6ee7b7] uppercase tracking-wider flex items-center justify-between">
                          <span>🔍 接口端点发现模型 ({availableModels.length})</span>
                        </div>
                        <div className="space-y-1">
                          {availableModels.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModel(m.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-left transition ${
                                config.selectedModel === m.id
                                  ? 'bg-[#cc785c] text-white font-semibold'
                                  : 'text-[#faf9f5] hover:bg-[#23211e] hover:text-white'
                              }`}
                            >
                              <span>{m.id}</span>
                              {m.name && <span className="text-[11px] opacity-70 truncate max-w-xs">{m.name}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Top Arena/Agent Leaderboard Model Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-neutral-300 font-medium mr-1">快捷选择:</span>
                {POPULAR_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectModel(m.id, m.family)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border model-pill tracking-wide ${
                      config.selectedModel === m.id
                        ? 'bg-[#cc785c] border-[#cc785c] text-white font-semibold shadow-sm'
                        : 'bg-[#23211e] border-[#38342f] text-[#faf9f5] font-medium hover:text-white hover:border-[#cc785c]/60'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-parameters: Profile & Depth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Profile Selector (Explicit Choices Only) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 tracking-wide">
                  <Sliders className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>检测体系 (选择对应的测试规则)</span>
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value as ModelVerificationProfile)}
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] px-3.5 py-2.5 text-xs text-[#faf9f5] font-semibold focus:border-[#cc785c] focus:outline-none cursor-pointer"
                >
                  <option value="claude">Anthropic Claude 体系 (官方加密签名 + Thinking 思考流)</option>
                  <option value="openai">OpenAI 体系 (o1/o3/GPT-4.5 系统指纹 + 知识边界)</option>
                  <option value="xai">xAI Grok 体系 (Grok-3/Grok-2 思考流与知识库)</option>
                  <option value="gemini">Google Gemini 体系 (Gemini 2.5/2.0 原生思考流 + 搜索接地)</option>
                </select>
              </div>

              {/* Depth Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 tracking-wide">
                  <Gauge className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>检测深度</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#23211e] p-1 rounded-xl border border-[#2e2b27]">
                  {[
                    { id: 'quick', label: '快速 · 1s' },
                    { id: 'standard', label: '标准 · 4s' },
                    { id: 'deep', label: '深度 · 8s' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDepth(d.id as FidelityDepth)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition tracking-wide ${
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
                  <span>正在检测...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>开始检测</span>
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

      {/* ── 3. Diagnostic Report (Directly Renders When Report is Generated) ── */}
      {activeMode === 'fidelity' && report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Telemetry Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Metric 1: 首字响应速度 (TTFT) */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wide uppercase">
                <span>首字速度 (TTFT)</span>
                <Zap className="w-4 h-4 text-[#cc785c]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                  {report.firstTokenLatencyMs ? report.firstTokenLatencyMs : '--'}
                </span>
                <span className="text-xs text-neutral-400 font-mono">ms</span>
              </div>
              <div className="text-xs font-mono font-semibold tracking-wide">
                {report.firstTokenLatencyMs && report.firstTokenLatencyMs < 800 ? (
                  <span className="text-[#6ee7b7] bg-[#064e3b] border border-[#059669] px-2 py-0.5 rounded shadow-sm">⚡ 极速</span>
                ) : report.firstTokenLatencyMs && report.firstTokenLatencyMs < 2000 ? (
                  <span className="text-[#6ee7b7] bg-[#064e3b] border border-[#059669] px-2 py-0.5 rounded shadow-sm">🟢 正常</span>
                ) : (
                  <span className="text-[#fcd34d] bg-[#451a03] border border-[#d97706] px-2 py-0.5 rounded shadow-sm">🟡 较慢</span>
                )}
              </div>
            </div>

            {/* Metric 2: 生成速率 (TPS) */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wide uppercase">
                <span>生成速率 (TPS)</span>
                <Activity className="w-4 h-4 text-[#6ee7b7]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                  {report.generationTps ? report.generationTps : '--'}
                </span>
                <span className="text-xs text-neutral-400 font-mono">tok/s</span>
              </div>
              <div className="text-xs font-mono text-[#faf9f5] font-semibold tracking-wide">
                <span className="bg-[#23211e] border border-[#44403c] px-2 py-0.5 rounded shadow-sm">
                  {report.generationTps && report.generationTps > 30 ? '🚀 正常输出' : '流式生成'}
                </span>
              </div>
            </div>

            {/* Metric 3: 思考耗时 */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wide uppercase">
                <span>思考耗时</span>
                <Cpu className="w-4 h-4 text-[#fcd34d]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                  {report.thinkingTimeMs ? report.thinkingTimeMs : 0}
                </span>
                <span className="text-xs text-neutral-400 font-mono">ms</span>
              </div>
              <div className="text-xs font-mono text-[#faf9f5] font-semibold tracking-wide">
                <span className="bg-[#23211e] border border-[#44403c] px-2 py-0.5 rounded shadow-sm">
                  {report.reasoningResult?.hasReasoningStream ? '🧠 原生思考流' : '无思考链'}
                </span>
              </div>
            </div>

            {/* Metric 4: 消耗 Token */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wide uppercase">
                <span>消耗 Token</span>
                <Coins className="w-4 h-4 text-[#cc785c]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                  {report.totalTokens.total}
                </span>
                <span className="text-xs text-neutral-400 font-mono">tok</span>
              </div>
              <div className="text-xs font-mono text-[#faf9f5] font-semibold tracking-wide">
                <span className="bg-[#23211e] border border-[#44403c] px-2 py-0.5 rounded shadow-sm">
                  约 ${(report.estimatedCostUsd).toFixed(4)}
                </span>
              </div>
            </div>

            {/* Metric 5: 总耗时 */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wide uppercase">
                <span>检测总耗时</span>
                <Clock className="w-4 h-4 text-neutral-300" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                  {(report.totalDurationMs / 1000).toFixed(2)}
                </span>
                <span className="text-xs text-neutral-400 font-mono">s</span>
              </div>
              <div className="text-xs font-mono text-[#faf9f5] font-semibold tracking-wide">
                <span className="bg-[#23211e] border border-[#44403c] px-2 py-0.5 rounded shadow-sm">
                  {report.probes.length} 项测试项
                </span>
              </div>
            </div>

            {/* Metric 6: 评分 */}
            <div className={`rounded-xl border p-5 space-y-2 shadow-sm smooth-card ${
              report.overallScore >= 85
                ? 'border-[#059669] bg-[#064e3b]/80'
                : report.overallScore >= 50
                ? 'border-[#d97706] bg-[#451a03]/80'
                : 'border-[#e11d48] bg-[#4c0519]/80'
            }`}>
              <div className="flex items-center justify-between text-xs text-[#faf9f5] font-semibold tracking-wide uppercase">
                <span>真实性评分</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-mono text-2xl font-bold ${
                  report.overallScore >= 85
                    ? 'text-[#6ee7b7]'
                    : report.overallScore >= 50
                    ? 'text-[#fcd34d]'
                    : 'text-[#fda4af]'
                }`}>
                  {report.overallScore}
                </span>
                <span className="text-xs font-mono text-neutral-200">/100</span>
              </div>
              <div className="text-xs font-mono font-semibold tracking-wide">
                {report.level === 'genuine' ? (
                  <span className="text-[#6ee7b7]">✅ 官方正品</span>
                ) : report.level === 'suspect_downgraded' ? (
                  <span className="text-[#fcd34d]">⚠️ 疑似降级</span>
                ) : (
                  <span className="text-[#fda4af]">❌ 虚假冒充</span>
                )}
              </div>
            </div>
          </div>

          {/* Status Certificate Banner */}
          <div
            className={`rounded-2xl border p-7 sm:p-8 shadow-2xl relative overflow-hidden smooth-card ${
              report.overallScore >= 85
                ? 'border-[#059669] bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#064e3b]/40'
                : report.overallScore >= 50
                ? 'border-[#d97706] bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#451a03]/40'
                : 'border-[#e11d48] bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#4c0519]/40'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide shadow-sm ${
                      report.overallScore >= 85
                        ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                        : report.overallScore >= 50
                        ? 'bg-[#451a03] text-[#fcd34d] border border-[#d97706]'
                        : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                    }`}
                  >
                    {report.overallScore >= 85 ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : report.overallScore >= 50 ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {report.level === 'genuine'
                        ? 'VERIFIED GENUINE · 官方正品'
                        : report.level === 'suspect_downgraded'
                        ? 'SUSPECT DOWNGRADED · 疑似降级'
                        : 'FAKE IMPOSTER · 虚假冒充'}
                    </span>
                  </span>

                  <span className="text-xs text-neutral-200 font-mono tracking-wide">
                    测试模型: <strong className="text-[#faf9f5] font-semibold">{report.targetModel}</strong>
                  </span>
                  <span className="text-xs text-neutral-400 font-mono tracking-wide">
                    检测时间: {new Date(report.testedAt).toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#faf9f5] tracking-tight">
                  {report.summary}
                </h3>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {report.signatureResult?.isApplicable && (
                    <span className={`px-2.5 py-1 rounded-lg font-mono tracking-wide border flex items-center gap-1.5 shadow-sm font-semibold ${
                      report.signatureResult.passed
                        ? 'bg-[#064e3b] text-[#6ee7b7] border-[#059669]'
                        : 'bg-[#4c0519] text-[#fda4af] border-[#e11d48]'
                    }`}>
                      <Shield className="w-3.5 h-3.5" />
                      <span>{report.signatureResult.passed ? 'Anthropic 官方签名校验通过' : '签名校验失败'}</span>
                    </span>
                  )}

                  {report.reasoningResult?.hasReasoningStream && (
                    <span className="px-2.5 py-1 rounded-lg font-mono tracking-wide bg-[#23211e] border border-[#44403c] text-[#faf9f5] font-semibold flex items-center gap-1.5 shadow-sm">
                      <Cpu className="w-3.5 h-3.5 text-[#cc785c]" />
                      <span>原生 `{report.reasoningResult.reasoningFieldUsed}` 协议</span>
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-lg font-mono tracking-wide bg-[#23211e] border border-[#44403c] text-neutral-300 font-medium">
                    地址: {config.baseUrl}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyMarkdownReport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold text-white hover:bg-[#2b2926] hover:border-[#cc785c]/60 transition shadow-sm smooth-btn tracking-wide"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-4 h-4 text-[#6ee7b7]" />
                      <span className="text-[#6ee7b7]">已复制报告</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#cc785c]" />
                      <span>复制检测报告</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStartFidelityAudit}
                  disabled={isRunningAudit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141413] border border-[#2e2b27] text-xs font-semibold text-neutral-300 hover:text-white hover:border-[#cc785c]/60 transition smooth-btn tracking-wide"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重新检测</span>
                </button>
              </div>
            </div>
          </div>

          {/* Probe Details */}
          <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card">
            {/* Header with Filter Pills */}
            <div className="p-5 sm:p-6 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#141413]/60">
              <div>
                <h4 className="font-serif-display text-xl font-semibold text-[#faf9f5]">
                  探针结果明细 ({report.probes.length} 项)
                </h4>
                <p className="text-xs text-neutral-300 mt-0.5 tracking-normal">
                  各维度测试项执行结果与原始回包数据。
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold tracking-wide">
                <button
                  type="button"
                  onClick={() => setProbeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    probeFilter === 'all'
                      ? 'bg-[#cc785c] text-white shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  全部 ({report.probes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProbeFilter('passed')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    probeFilter === 'passed'
                      ? 'bg-[#059669] text-[#faf9f5] shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  通过 ({report.probes.filter((p) => p.passed).length})
                </button>
                <button
                  type="button"
                  onClick={() => setProbeFilter('failed')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    probeFilter === 'failed'
                      ? 'bg-[#e11d48] text-[#faf9f5] shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  未通过 ({report.probes.filter((p) => !p.passed).length})
                </button>
              </div>
            </div>

            {/* Probes List */}
            <div className="divide-y divide-[#2e2b27]">
              {displayedProbes.map((item, idx) => (
                <div key={idx} className="p-6 hover:bg-[#23211e]/30 transition space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.passed ? (
                        <div className="w-7 h-7 rounded-lg bg-[#064e3b] border border-[#059669] flex items-center justify-center text-[#6ee7b7] shrink-0 shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#4c0519] border border-[#e11d48] flex items-center justify-center text-[#fda4af] shrink-0 shadow-sm">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h5 className="text-sm font-semibold text-[#faf9f5]">
                          {item.title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5 tracking-wide">
                          <span>耗时: {item.latencyMs}ms</span>
                          <span>·</span>
                          <span>Token: {item.tokensUsed?.total || '--'}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-mono font-semibold tracking-wide shadow-sm ${
                        item.passed
                          ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                          : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                      }`}
                    >
                      {item.passed ? `通过 (${item.score}分)` : `未通过 (${item.score}分)`}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed pl-10 tracking-normal">
                    {item.details}
                  </p>

                  {item.actualOutput && (
                    <div className="pl-10 pt-1">
                      <div className="rounded-xl bg-[#10100f] border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1b1a18] border-b border-[#2e2b27] text-xs font-mono text-neutral-400 tracking-wide">
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-[#cc785c]" />
                            <span>模型响应片段</span>
                          </span>
                          <span>RAW OUTPUT</span>
                        </div>
                        <pre className="p-3.5 font-mono text-xs text-neutral-200 overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed tracking-wide">
                          {item.actualOutput.trim()}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Batch Scanner View (In scanner mode) ── */}
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
    </div>
  );
};
