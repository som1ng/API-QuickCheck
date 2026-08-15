import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Coins,
  Layers,
  Gauge,
  Sliders,
  Search,
  Fingerprint,
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
} from 'lucide-react';

const COMMON_PRESETS = [
  { label: 'OpenAI 官方', url: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { label: 'Claude 官方', url: 'https://api.anthropic.com/v1', model: 'claude-3-7-sonnet-20250219' },
  { label: 'DeepSeek 官方', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { label: 'xAI (Grok)', url: 'https://api.x.ai/v1', model: 'grok-2-latest' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o' },
  { label: '硅基流动', url: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
];

const POPULAR_MODELS = [
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', family: 'claude' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', family: 'claude' },
  { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (思维链)', family: 'deepseek' },
  { id: 'deepseek-chat', label: 'DeepSeek-V3', family: 'deepseek' },
  { id: 'gpt-4o', label: 'GPT-4o (Omni)', family: 'openai' },
  { id: 'o1', label: 'OpenAI o1', family: 'openai' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', family: 'gemini' },
];

export const HomeRelayTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  // Active Mode: fidelity (真伪与降级体检) vs scanner (全模型并发巡检)
  const [activeMode, setActiveMode] = useState<'fidelity' | 'scanner'>('fidelity');

  // Input states
  const [showKey, setShowKey] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ModelVerificationProfile>('auto');
  const [selectedDepth, setSelectedDepth] = useState<FidelityDepth>('standard');

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

  // Auto-sniff models when user inputs baseUrl and apiKey
  useEffect(() => {
    if (!config.baseUrl || !config.apiKey || config.apiKey.length < 8) return;
    const timer = setTimeout(async () => {
      try {
        const models = await fetchRemoteModels(config.baseUrl, config.apiKey);
        if (models.length > 0) {
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
          if (!models.some((m) => m.id === config.selectedModel)) {
            dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
          }
        }
      } catch {
        /* silent */
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [config.baseUrl, config.apiKey, dispatch]);

  const handleApplyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    dispatch({ type: 'SET_BASE_URL', payload: preset.url });
    if (preset.model) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: preset.model });
    }
  };

  const handleStartFidelityAudit = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先输入中转站接口地址 (Base URL) 和 API Key');
      return;
    }

    setIsRunningAudit(true);
    setProgressText('正在初始化深度鉴别与流式测速引擎...');
    setProgressPercent(5);

    try {
      const result = await runFidelityAudit(
        config.baseUrl,
        config.apiKey,
        config.selectedModel || 'gpt-4o',
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
      alert(`鉴别过程发生错误: ${msg}`);
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
      alert(`批量巡检异常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyMarkdownReport = async () => {
    if (!report) return;

    const md = `# API-QuickCheck 综合体检与真伪鉴别报告
- **目标模型**: \`${report.targetModel}\`
- **中转地址**: \`${config.baseUrl}\`
- **鉴别体系**: \`${report.verificationProfile}\` (深度: \`${report.depth}\`)
- **保真度评分**: **${report.overallScore} / 100** (${report.level === 'genuine' ? '✅ 官方正品' : report.level === 'suspect_downgraded' ? '⚠️ 疑似降级/换皮' : '❌ 假冒冒充'})
- **首字响应速度 (TTFT)**: \`${report.firstTokenLatencyMs || 0} ms\`
- **流式生成吞吐**: \`${report.generationTps || 0} tok/s\`
- **思考链纯耗时**: \`${report.thinkingTimeMs || 0} ms\`
- **总耗时 / Token**: \`${(report.totalDurationMs / 1000).toFixed(2)}s\` / \`${report.totalTokens.total} Tokens\`
- **综合判定结论**: ${report.summary}

## 探针决策详单 (${report.probes.length} 项)
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

  const isOfficial = /openai\.com|anthropic\.com|deepseek\.com|googleapis\.com|x\.ai/i.test(config.baseUrl);

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
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3');
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude');
    if (filterProvider === 'deepseek') return m.id.toLowerCase().includes('deepseek');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── 1. Clean Top Header & Mode Pill Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#faf9f5] tracking-tight">
            中转站体检工作台
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[#9c9689] max-w-2xl leading-relaxed">
            一键深度鉴别 AI 接口真伪、流式首字速度 (TTFT) 与降级掺水，击穿套壳伪装。
          </p>
        </div>

        {/* Mode Switcher Pill */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#1b1a18] border border-[#2e2b27] self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('fidelity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeMode === 'fidelity'
                ? 'bg-[#cc785c] text-[#faf9f5] shadow-sm'
                : 'text-[#9c9689] hover:text-[#faf9f5]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>真伪与降级体检</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('scanner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeMode === 'scanner'
                ? 'bg-[#cc785c] text-[#faf9f5] shadow-sm'
                : 'text-[#9c9689] hover:text-[#faf9f5]'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>全模型并发巡检</span>
          </button>
        </div>
      </div>

      {/* ── 2. Unified All-In-One API & Model Configuration Card ── */}
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
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                  isOfficial
                    ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                    : config.baseUrl
                    ? 'bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30'
                    : 'text-[#9c9689]'
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
              className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none smooth-input"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-[#9c9689] mr-1">快捷填入:</span>
              {COMMON_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-2.5 py-1 rounded-md text-xs transition border model-pill ${
                    config.baseUrl === p.url
                      ? 'bg-[#cc785c]/20 border-[#cc785c] text-[#faf9f5] font-semibold'
                      : 'bg-[#23211e] border-[#2e2b27] text-[#9c9689] hover:text-[#faf9f5]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
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
                className="text-xs text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1"
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
                className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none smooth-input"
              />
            </div>

            <div className="flex items-center justify-between pt-0.5 text-xs text-[#9c9689]">
              <span>零数据上云 · 内存直连</span>
              {config.apiKey.length > 5 && (
                <span className="text-[#5db872] font-mono font-medium">已就绪 ({config.apiKey.length} 位)</span>
              )}
            </div>
          </div>
        </div>

        {/* Row B: Model & Parameters (Only in Fidelity mode) */}
        {activeMode === 'fidelity' && (
          <div className="space-y-4 pt-4 border-t border-[#2e2b27]">
            {/* Target Model Input + Pills */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#cc785c]" />
                  <span>测试目标模型</span>
                </label>
                {availableModels.length > 0 && (
                  <span className="text-xs text-[#5db872] font-mono">
                    已探测可用模型: {availableModels.length} 个
                  </span>
                )}
              </div>

              {/* Model input + Quick selector */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={config.selectedModel}
                  onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                  placeholder="例如: claude-3-7-sonnet-20250219 / gpt-4o / deepseek-reasoner"
                  className="flex-1 rounded-xl border border-[#2e2b27] bg-[#141413] px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/40 focus:border-[#cc785c] focus:outline-none smooth-input"
                />

                {availableModels.length > 0 && (
                  <select
                    value={availableModels.some((m) => m.id === config.selectedModel) ? config.selectedModel : ''}
                    onChange={(e) => e.target.value && dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                    className="sm:w-64 rounded-xl border border-[#2e2b27] bg-[#23211e] px-3.5 py-2.5 font-mono text-xs text-[#faf9f5] focus:border-[#cc785c] focus:outline-none cursor-pointer"
                  >
                    <option value="">从已探测列表中挑选...</option>
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Popular Model Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-[#9c9689] mr-1">热门模型:</span>
                {POPULAR_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border model-pill ${
                      config.selectedModel === m.id
                        ? 'bg-[#cc785c]/25 border-[#cc785c] text-[#faf9f5] font-semibold'
                        : 'bg-[#23211e] border-[#2e2b27] text-[#9c9689] hover:text-[#faf9f5]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-parameters: Profile & Depth Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Profile Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#9c9689] mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>评判体系</span>
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value as ModelVerificationProfile)}
                  className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] px-3.5 py-2.5 text-xs text-[#faf9f5] focus:border-[#cc785c] focus:outline-none cursor-pointer"
                >
                  <option value="auto">⭐ 智能自动匹配 (推荐)</option>
                  <option value="claude">Anthropic Claude (官方私钥签名 + Thinking)</option>
                  <option value="deepseek">DeepSeek R1/V3 (原生思维链 + 知识库)</option>
                  <option value="openai">OpenAI o1/o3/GPT-4o (系统指纹 + 截止期)</option>
                  <option value="gemini">Google Gemini (原生思考流 + 搜索接地)</option>
                  <option value="universal">通用大模型 (元认知冲突 + 拓扑几何)</option>
                </select>
              </div>

              {/* Depth Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#9c9689] mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>检测深度</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#23211e] p-1 rounded-xl border border-[#2e2b27]">
                  {[
                    { id: 'quick', label: '轻检 · 1s' },
                    { id: 'standard', label: '标准 · 4s' },
                    { id: 'deep', label: '死磕 · 8s' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDepth(d.id as FidelityDepth)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition ${
                        selectedDepth === d.id
                          ? 'bg-[#cc785c] text-[#faf9f5] font-semibold shadow-sm'
                          : 'text-[#9c9689] hover:text-[#faf9f5]'
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
        <div className="pt-4 border-t border-[#2e2b27] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[#9c9689] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc785c]" />
            <span>
              {activeMode === 'fidelity'
                ? '自动测算首字速度 (TTFT)、生成 TPS、思考链纯净度与私钥防伪'
                : '5 线程高并发探活，快速识别 200 可用 / 401 鉴权失败 / 404 空壳'}
            </span>
          </div>

          {activeMode === 'fidelity' ? (
            <button
              type="button"
              onClick={handleStartFidelityAudit}
              disabled={isRunningAudit || !config.baseUrl || !config.apiKey}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#faf9f5] shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 smooth-btn"
            >
              {isRunningAudit ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>全维体检中...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-[#faf9f5]" />
                  <span>开始全维度体检</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels || isScanning}
                className="inline-flex items-center gap-2 rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3 text-xs font-semibold text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] transition disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span>{availableModels.length > 0 ? `已拉取 (${availableModels.length})` : '拉取清单'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartBatchScan}
                disabled={isScanning || (!config.baseUrl || !config.apiKey)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-6 py-3 text-xs sm:text-sm font-semibold text-[#faf9f5] shadow-md transition disabled:opacity-50 smooth-btn"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>巡检中 ({scanProgress.completed}/{scanProgress.total})</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-[#faf9f5]" />
                    <span>开始并发巡检</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar (When running) */}
        {isRunningAudit && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <div className="flex justify-between text-xs text-[#9c9689]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
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

      {/* ── 3. Diagnostic Report & Probe Showcase ── */}
      {activeMode === 'fidelity' && (
        <div className="space-y-8">
          {/* Pre-test Probe Matrix (When !report) */}
          {!report && !isRunningAudit && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-in fade-in duration-300">
              {/* Ready Probes Matrix (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-7 shadow-lg space-y-5 flex flex-col justify-between smooth-card">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif-display text-lg font-semibold text-[#faf9f5] flex items-center gap-2.5">
                      <Fingerprint className="w-5 h-5 text-[#cc785c]" />
                      <span>就绪探针矩阵 (Active Probes Ready)</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#23211e] border border-[#2e2b27] text-[#5db872] font-mono">
                      {selectedDepth === 'quick' ? '2 项核心探针' : selectedDepth === 'standard' ? '5 项标准探针' : '8 项全维死磕探针'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        title: '首字响应速度 (TTFT) 与流式生成吞吐 (TPS)',
                        desc: '毫秒级捕获第一块 Token 到达时间，同步测量真实 token 流速与中间缓冲拦截。',
                        tag: '真实流速',
                      },
                      {
                        title: 'Claude 官方私钥加密签名验真 (Thinking Signature)',
                        desc: '校验回包 signature 字段的数学密码学签名，100% 鉴别是否为 Anthropic 官方正品。',
                        tag: '数学防伪',
                      },
                      {
                        title: '原生流式思维链 Delta 提取 (Native Reasoning Delta)',
                        desc: '提取 thinking/reasoning_content 的 token 流式输出速率与思维链分块特征。',
                        tag: '流式特征',
                      },
                      {
                        title: '空间几何与反套壳拓扑探针 (Spatial Topology Probe)',
                        desc: '利用高维空间几何推理与元认知冲突，击穿中转站套壳与 System Prompt 欺骗。',
                        tag: '逻辑击穿',
                      },
                      {
                        title: '2024/2025 知识库时效与截断期探针 (Knowledge Horizon)',
                        desc: '用特定时间截断事件与版本迭代题，鉴别是否用旧模型或小模型冒充新旗舰。',
                        tag: '时效探针',
                      },
                    ].map((probe, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-[#2e2b27] bg-[#23211e]/60 hover:bg-[#23211e] transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#5db872]" />
                            <span>{probe.title}</span>
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#141413] border border-[#2e2b27] text-[#cc785c]">
                            {probe.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#9c9689] pl-6 leading-relaxed">
                          {probe.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs text-[#9c9689] font-mono border-t border-[#2e2b27]/60">
                  <span>点击上方按钮即刻执行探针</span>
                  <span className="text-[#faf9f5]">预估耗时: {selectedDepth === 'quick' ? '1~2s' : selectedDepth === 'standard' ? '3~5s' : '6~9s'}</span>
                </div>
              </div>

              {/* Scoring Rubric (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-7 shadow-lg space-y-5 flex flex-col justify-between smooth-card">
                <div className="space-y-3.5">
                  <h3 className="font-serif-display text-lg font-semibold text-[#faf9f5] flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-[#cc785c]" />
                    <span>保真度评分标准 (Scoring Rubric)</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border border-[#5db872]/30 bg-[#5db872]/[0.08] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-sm text-[#5db872]">
                        <span>85 ~ 100 分 · 高保真正品</span>
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-[#d4cebe] leading-relaxed">
                        官方直连或 100% 满血透传，加密签名完整无缺，原生思维链无篡改，首字响应迅速。
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#e8a55a]/30 bg-[#e8a55a]/[0.08] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-sm text-[#e8a55a]">
                        <span>50 ~ 84 分 · 疑似降级 / 包装异常</span>
                        <span className="text-xs font-mono font-bold">⚠️ 警示</span>
                      </div>
                      <p className="text-xs text-[#d4cebe] leading-relaxed">
                        存在伪造思考流、缺少官方数学签名或网关后台注入了假冒 System Prompt。
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#c64545]/30 bg-[#c64545]/[0.08] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-sm text-[#c64545]">
                        <span>0 ~ 49 分 · 严重掺水冒充</span>
                        <XCircle className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-[#d4cebe] leading-relaxed">
                        证据确凿的模型掉包（如使用廉价开源小模型套壳冒充顶尖模型），探针测试全军覆没。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs text-[#9c9689] space-y-1">
                  <span className="text-[#faf9f5] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#cc785c]" />
                    零数据泄露原则
                  </span>
                  <p>所有探针请求直接从浏览器内存发起，不留存任何日志，测试完成后立即销毁数据。</p>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Report (When report exists) */}
          {report && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Telemetry Metrics Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Metric 1: 首字响应速度 (TTFT) */}
                <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
                  <div className="flex items-center justify-between text-xs text-[#9c9689]">
                    <span>首字速度 (TTFT)</span>
                    <Zap className="w-4 h-4 text-[#cc785c]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                      {report.firstTokenLatencyMs ? report.firstTokenLatencyMs : '--'}
                    </span>
                    <span className="text-xs text-[#9c9689] font-mono">ms</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#5db872]">
                    {report.firstTokenLatencyMs && report.firstTokenLatencyMs < 800
                      ? '⚡ 响应极速'
                      : report.firstTokenLatencyMs && report.firstTokenLatencyMs < 2000
                      ? '🟢 延迟正常'
                      : '🟡 排队较长'}
                  </div>
                </div>

                {/* Metric 2: 生成速率 (TPS) */}
                <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
                  <div className="flex items-center justify-between text-xs text-[#9c9689]">
                    <span>生成速率 (TPS)</span>
                    <Activity className="w-4 h-4 text-[#5db872]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                      {report.generationTps ? report.generationTps : '--'}
                    </span>
                    <span className="text-xs text-[#9c9689] font-mono">tok/s</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9c9689]">
                    {report.generationTps && report.generationTps > 30 ? '🚀 满血输出' : '流式生成'}
                  </div>
                </div>

                {/* Metric 3: 思考链耗时 */}
                <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
                  <div className="flex items-center justify-between text-xs text-[#9c9689]">
                    <span>思考链耗时</span>
                    <Cpu className="w-4 h-4 text-[#e8a55a]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                      {report.thinkingTimeMs ? report.thinkingTimeMs : 0}
                    </span>
                    <span className="text-xs text-[#9c9689] font-mono">ms</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9c9689]">
                    {report.reasoningResult?.hasReasoningStream ? '🧠 原生思考流' : '无思考链'}
                  </div>
                </div>

                {/* Metric 4: 消耗 Token */}
                <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
                  <div className="flex items-center justify-between text-xs text-[#9c9689]">
                    <span>消耗 Token</span>
                    <Coins className="w-4 h-4 text-[#cc785c]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                      {report.totalTokens.total}
                    </span>
                    <span className="text-xs text-[#9c9689] font-mono">tok</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9c9689]">
                    约 ${(report.estimatedCostUsd).toFixed(4)}
                  </div>
                </div>

                {/* Metric 5: 总检测耗时 */}
                <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
                  <div className="flex items-center justify-between text-xs text-[#9c9689]">
                    <span>总耗时</span>
                    <Clock className="w-4 h-4 text-[#9c9689]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-[#faf9f5]">
                      {(report.totalDurationMs / 1000).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#9c9689] font-mono">s</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9c9689]">
                    {report.probes.length} 项探针并发
                  </div>
                </div>

                {/* Metric 6: 综合保真得分 */}
                <div className={`rounded-xl border p-5 space-y-2 shadow-sm smooth-card ${
                  report.overallScore >= 85
                    ? 'border-[#5db872]/40 bg-[#5db872]/10'
                    : report.overallScore >= 50
                    ? 'border-[#e8a55a]/40 bg-[#e8a55a]/10'
                    : 'border-[#c64545]/40 bg-[#c64545]/10'
                }`}>
                  <div className="flex items-center justify-between text-xs text-[#faf9f5] font-semibold">
                    <span>保真指数</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-mono text-2xl font-bold ${
                      report.overallScore >= 85
                        ? 'text-[#5db872]'
                        : report.overallScore >= 50
                        ? 'text-[#e8a55a]'
                        : 'text-[#c64545]'
                    }`}>
                      {report.overallScore}
                    </span>
                    <span className="text-xs font-mono opacity-80">/100</span>
                  </div>
                  <div className="text-[11px] font-mono font-semibold">
                    {report.level === 'genuine' ? '✅ 官方正品' : report.level === 'suspect_downgraded' ? '⚠️ 疑似降级' : '❌ 虚假冒充'}
                  </div>
                </div>
              </div>

              {/* Official Audit Certificate Banner */}
              <div
                className={`rounded-2xl border p-7 sm:p-8 shadow-2xl relative overflow-hidden smooth-card ${
                  report.overallScore >= 85
                    ? 'border-[#5db872]/30 bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#5db872]/[0.06]'
                    : report.overallScore >= 50
                    ? 'border-[#e8a55a]/30 bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#e8a55a]/[0.06]'
                    : 'border-[#c64545]/30 bg-gradient-to-br from-[#1b1a18] via-[#1b1a18] to-[#c64545]/[0.06]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                          report.overallScore >= 85
                            ? 'bg-[#5db872]/20 text-[#5db872] border border-[#5db872]/40'
                            : report.overallScore >= 50
                            ? 'bg-[#e8a55a]/20 text-[#e8a55a] border border-[#e8a55a]/40'
                            : 'bg-[#c64545]/20 text-[#c64545] border border-[#c64545]/40'
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
                            ? 'VERIFIED GENUINE · 官方满血认证'
                            : report.level === 'suspect_downgraded'
                            ? 'SUSPECT DOWNGRADED · 疑似降级套壳'
                            : 'FAKE IMPOSTER · 虚假冒充伪造'}
                        </span>
                      </span>

                      <span className="text-xs text-[#9c9689] font-mono">
                        测试模型: <strong className="text-[#faf9f5]">{report.targetModel}</strong>
                      </span>
                      <span className="text-xs text-[#9c9689] font-mono">
                        检测时间: {new Date(report.testedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#faf9f5] tracking-tight">
                      {report.summary}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {report.signatureResult?.isApplicable && (
                        <span className={`px-2.5 py-1 rounded-md font-mono border flex items-center gap-1.5 ${
                          report.signatureResult.passed
                            ? 'bg-[#5db872]/15 text-[#5db872] border-[#5db872]/30'
                            : 'bg-[#c64545]/15 text-[#c64545] border-[#c64545]/30'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>{report.signatureResult.passed ? 'Anthropic 官方私钥验签通过' : '私钥验签失败'}</span>
                        </span>
                      )}

                      {report.reasoningResult?.hasReasoningStream && (
                        <span className="px-2.5 py-1 rounded-md font-mono bg-[#23211e] border border-[#2e2b27] text-[#d4cebe] flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#cc785c]" />
                          <span>原生 `{report.reasoningResult.reasoningFieldUsed}` 协议</span>
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-md font-mono bg-[#23211e] border border-[#2e2b27] text-[#9c9689]">
                        端点: {config.baseUrl}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyMarkdownReport}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] hover:bg-[#2b2926] hover:border-[#cc785c]/40 transition shadow-sm smooth-btn"
                    >
                      {copiedReport ? (
                        <>
                          <Check className="w-4 h-4 text-[#5db872]" />
                          <span className="text-[#5db872]">已复制 Markdown 报告</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#cc785c]" />
                          <span>复制体检报告 (用于维权)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleStartFidelityAudit}
                      disabled={isRunningAudit}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141413] border border-[#2e2b27] text-xs font-semibold text-[#9c9689] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition smooth-btn"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>重新跑一次体检</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Filterable Probe Evidence Breakdown */}
              <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card">
                {/* Header with Filter Pills */}
                <div className="p-5 sm:p-6 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#141413]/60">
                  <div>
                    <h4 className="font-serif-display text-xl font-semibold text-[#faf9f5]">
                      鉴别探针决策详单 ({report.probes.length} 项)
                    </h4>
                    <p className="text-xs text-[#9c9689] mt-0.5">
                      逐项拆解模型在元认知注入、高维拓扑、数学思维链与厂商安全对齐的实际表现。
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setProbeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        probeFilter === 'all'
                          ? 'bg-[#cc785c] text-[#faf9f5]'
                          : 'text-[#9c9689] hover:text-[#faf9f5]'
                      }`}
                    >
                      全部 ({report.probes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProbeFilter('passed')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        probeFilter === 'passed'
                          ? 'bg-[#5db872] text-[#faf9f5]'
                          : 'text-[#9c9689] hover:text-[#faf9f5]'
                      }`}
                    >
                      通过 ({report.probes.filter((p) => p.passed).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProbeFilter('failed')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        probeFilter === 'failed'
                          ? 'bg-[#c64545] text-[#faf9f5]'
                          : 'text-[#9c9689] hover:text-[#faf9f5]'
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
                            <div className="w-7 h-7 rounded-lg bg-[#5db872]/15 border border-[#5db872]/30 flex items-center justify-center text-[#5db872] shrink-0">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-[#c64545]/15 border border-[#c64545]/30 flex items-center justify-center text-[#c64545] shrink-0">
                              <XCircle className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <h5 className="text-sm font-semibold text-[#faf9f5]">
                              {item.title}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-[#9c9689] font-mono mt-0.5">
                              <span>耗时: {item.latencyMs}ms</span>
                              <span>·</span>
                              <span>Token: {item.tokensUsed?.total || '--'}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-mono font-semibold ${
                            item.passed
                              ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                              : 'bg-[#c64545]/15 text-[#c64545] border border-[#c64545]/30'
                          }`}
                        >
                          {item.passed ? `通过 (${item.score}分)` : `拦截/未达标 (${item.score}分)`}
                        </span>
                      </div>

                      <p className="text-xs text-[#d4cebe] leading-relaxed pl-10">
                        {item.details}
                      </p>

                      {item.actualOutput && (
                        <div className="pl-10 pt-1">
                          <div className="rounded-xl bg-[#141413] border border-[#2e2b27] overflow-hidden">
                            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1b1a18] border-b border-[#2e2b27] text-[11px] font-mono text-[#9c9689]">
                              <span className="flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-[#cc785c]" />
                                <span>模型实际回包片段</span>
                              </span>
                              <span>RAW OUTPUT</span>
                            </div>
                            <pre className="p-3.5 font-mono text-xs text-[#d4cebe] overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed">
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
        </div>
      )}

      {/* ── 4. Batch Scanner View (When activeMode === 'scanner') ── */}
      {activeMode === 'scanner' && (
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card">
          {/* Filter and Search toolbar */}
          <div className="p-5 sm:p-6 border-b border-[#2e2b27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141413]/60">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `全部 (${availableModels.length})` },
                { id: 'openai', label: 'OpenAI' },
                { id: 'claude', label: 'Claude' },
                { id: 'deepseek', label: 'DeepSeek' },
                { id: 'google', label: 'Google' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterProvider(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterProvider === p.id
                      ? 'bg-[#cc785c] text-[#faf9f5]'
                      : 'bg-[#23211e] text-[#9c9689] hover:text-[#faf9f5]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9689]" />
              <input
                type="text"
                placeholder="搜索模型 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-9 pr-3 py-2 text-xs font-mono text-[#faf9f5] focus:border-[#cc785c] focus:outline-none smooth-input"
              />
            </div>
          </div>

          {/* Model List Table */}
          {availableModels.length === 0 ? (
            <div className="p-12 text-center text-[#9c9689] text-sm space-y-2">
              <Layers className="w-8 h-8 text-[#cc785c]/40 mx-auto" />
              <p>暂无已发现模型数据，请在上方输入中转地址与 Key 后点击「拉取清单」或「开始并发巡检」</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141413] border-b border-[#2e2b27] text-[#9c9689] uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">序号</th>
                    <th className="px-6 py-3.5">模型 ID</th>
                    <th className="px-6 py-3.5">可用性状态</th>
                    <th className="px-6 py-3.5">HTTP 响应</th>
                    <th className="px-6 py-3.5">响应延迟</th>
                    <th className="px-6 py-3.5">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2b27]">
                  {filteredModels.map((m, idx) => {
                    const result = scanResults[m.id];
                    return (
                      <tr key={m.id} className="hover:bg-[#23211e]/40 transition">
                        <td className="px-6 py-4 text-[#9c9689]">{idx + 1}</td>
                        <td className="px-6 py-4 text-[#faf9f5] font-semibold">{m.id}</td>
                        <td className="px-6 py-4">
                          {result ? (
                            <StatusBadge status={result.status} />
                          ) : (
                            <span className="text-[#9c9689]">待检测</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#9c9689]">
                          {result?.httpStatus ? (
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold ${
                                result.httpStatus === 200
                                  ? 'bg-[#5db872]/15 text-[#5db872]'
                                  : 'bg-[#c64545]/15 text-[#c64545]'
                              }`}
                            >
                              {result.httpStatus}
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#9c9689]">
                          {result?.latencyMs ? `${result.latencyMs}ms` : '--'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id });
                              setActiveMode('fidelity');
                            }}
                            className="px-3 py-1 rounded-md bg-[#23211e] hover:bg-[#cc785c] hover:text-[#faf9f5] text-[#9c9689] transition font-sans text-xs font-semibold"
                          >
                            体检此模型
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
