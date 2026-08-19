import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import {
  FidelityReport,
  FidelityDepth,
  ModelVerificationProfile,
} from '../../types/fidelity';
import {
  ShieldCheck,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Sparkles,
  Coins,
  ChevronDown,
  Layers,
  Gauge,
  Sliders,
  Search,
  Fingerprint,
  Activity,
  Zap,
  Cpu,
  Copy,
  AlertTriangle,
  RotateCcw,
  Shield,
  Terminal,
} from 'lucide-react';
import { ProviderIcon } from '../common/ProviderLogos';

const COMMON_PRESET_MODELS = [
  { id: 'openai/gpt-5.6-sol', label: 'GPT-5.6 Sol (旗舰复杂推理与自主代码)', tag: 'OpenAI', family: 'openai' as ModelVerificationProfile },
  { id: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra (全能工作马)', tag: 'OpenAI', family: 'openai' as ModelVerificationProfile },
  { id: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna (极速高吞吐轻量级)', tag: 'OpenAI', family: 'openai' as ModelVerificationProfile },
  { id: 'anthropic/claude-fable-5', label: 'Claude Fable 5 (叙事与高难算法)', tag: 'Anthropic', family: 'claude' as ModelVerificationProfile },
  { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5 (复杂科研与重型工程)', tag: 'Anthropic', family: 'claude' as ModelVerificationProfile },
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (自适应思考工作马)', tag: 'Anthropic', family: 'claude' as ModelVerificationProfile },
  { id: 'google/gemini-3.7-flash', label: 'Gemini 3.7 Flash (极速原生思考)', tag: 'Google', family: 'gemini' as ModelVerificationProfile },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (超长窗口旗舰)', tag: 'Google', family: 'gemini' as ModelVerificationProfile },
  { id: 'x-ai/grok-4.6', label: 'Grok 4.6 (全模态实时 Agent)', tag: 'xAI', family: 'universal' as ModelVerificationProfile },
];

export const FidelityTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels } = state;

  // Custom Controls
  const [selectedProfile, setSelectedProfile] = useState<ModelVerificationProfile>('auto');
  const [selectedDepth, setSelectedDepth] = useState<FidelityDepth>('standard');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [report, setReport] = useState<FidelityReport | null>(null);

  // Probe Filter State
  const [probeFilter, setProbeFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [copiedReport, setCopiedReport] = useState(false);

  const handleStartAudit = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先在顶部配置中转站 Base URL 和 API Key');
      return;
    }

    setIsRunning(true);
    setProgressText('正在初始化深度鉴别与流式测速引擎...');
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`鉴别过程发生错误: ${msg}`);
    } finally {
      setIsRunning(false);
      setProgressPercent(100);
    }
  };

  const handleSelectModel = (modelId: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
    setShowModelDropdown(false);
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

  // Filtered dropdown list
  const filteredRemoteModels = availableModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const displayedProbes = report
    ? report.probes.filter((p) => {
        if (probeFilter === 'passed') return p.passed;
        if (probeFilter === 'failed') return !p.passed;
        return true;
      })
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── 1. Top Controls & Diagnostic Setup Card ── */}
      <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#faf9f5] tracking-tight">
                真伪鉴别与综合体检
              </h2>
              <p className="mt-1 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
                自动提取<strong>首字响应延迟 (TTFT)</strong>、<strong>生成吞吐 (TPS)</strong>、<strong>Anthropic 私钥验签</strong>与<strong>思维链纯净度</strong>，一键识破降级与虚标。
              </p>
            </div>
          </div>

          <button
            onClick={handleStartAudit}
            disabled={isRunning || !config.baseUrl || !config.apiKey}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-8 py-3.5 text-base font-semibold text-[#faf9f5] shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>综合验真进行中...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-[#faf9f5]" />
                <span>开始全维度体检</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Interactive Selection Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t border-[#2e2b27]">
          {/* A. Test Target Model Combobox (5 cols) */}
          <div className="md:col-span-5 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#faf9f5] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#cc785c]" />
                <span>测试目标模型</span>
              </label>
              {availableModels.length > 0 && (
                <span className="text-xs text-[#5db872] font-mono">
                  已探测 {availableModels.length} 个
                </span>
              )}
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.selectedModel}
                  onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                  placeholder="例如: claude-3-7-sonnet-20250219"
                  className="flex-1 rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/50 focus:border-[#cc785c] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-3.5 py-3 rounded-xl border border-[#2e2b27] bg-[#23211e] hover:bg-[#2b2926] text-[#9c9689] hover:text-[#faf9f5] transition flex items-center gap-1 shrink-0 cursor-pointer"
                  title="展开/收起模型选择"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      showModelDropdown ? 'rotate-180 text-[#cc785c]' : 'text-[#9c9689]'
                    }`}
                  />
                </button>
              </div>

              {/* Silky Smooth Downward Grid Dropdown Menu (Razor Sharp Text) */}
              <div
                className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-[#2e2b27] bg-[#1b1a18] shadow-2xl shadow-black/60 overflow-hidden transition-[opacity,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  showModelDropdown
                    ? 'opacity-100 pointer-events-auto border-[#cc785c]/40 ring-1 ring-[#cc785c]/20'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    showModelDropdown ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9689]" />
                        <input
                          type="text"
                          placeholder="搜索模型..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          className="w-full rounded-lg border border-[#2e2b27] bg-[#141413] pl-9 pr-3 py-2 text-xs font-mono text-[#faf9f5] focus:border-[#cc785c] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs uppercase font-semibold text-[#9c9689] px-2.5 py-1">
                          主流旗舰模型快捷选择
                        </div>
                        {COMMON_PRESET_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between cursor-pointer ${
                              config.selectedModel === m.id
                                ? 'bg-[#cc785c]/15 text-[#faf9f5] font-semibold'
                                : 'text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5]'
                            }`}
                          >
                            <span className="flex items-center gap-2 font-mono">
                              <ProviderIcon providerId={m.tag} className="w-4 h-4 flex-shrink-0" size={16} />
                              <span>{m.label}</span>
                            </span>
                            <span className="text-xs text-[#9c9689] font-mono">{m.tag}</span>
                          </button>
                        ))}
                      </div>

                      {availableModels.length > 0 && (
                        <div>
                          <div className="text-xs uppercase font-semibold text-[#5db872] px-2.5 py-1.5 border-t border-[#2e2b27] mt-1 pt-2">
                            中转站已探明模型 ({availableModels.length})
                          </div>
                          {filteredRemoteModels.slice(0, 30).map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModel(m.id)}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#d4cebe] transition font-mono truncate cursor-pointer"
                            >
                              {m.id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* B. Verification Profile / Standard Selector (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-sm font-semibold text-[#faf9f5] mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#cc785c]" />
              <span>评判准则 / 厂商体系</span>
            </label>

            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as ModelVerificationProfile)}
              className="w-full rounded-xl border border-[#2e2b27] bg-[#23211e] px-4 py-3 text-sm text-[#faf9f5] focus:border-[#cc785c] focus:outline-none transition cursor-pointer"
            >
              <option value="auto">⭐ 智能自动匹配 (推荐)</option>
              <option value="claude">Anthropic Claude (官方加密签名 + Thinking 验真)</option>
              <option value="deepseek">DeepSeek R1/V3 (原生思维链标签 + 知识库)</option>
              <option value="openai">OpenAI o1/o3/GPT-4o (系统指纹 + 知识库截止期)</option>
              <option value="gemini">Google Gemini (原生思考流 + 搜索接地)</option>
              <option value="universal">通用大模型 (元认知冲突 + 拓扑几何)</option>
            </select>
          </div>

          {/* C. Diagnostic Rigor Depth (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-[#faf9f5] mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#cc785c]" />
              <span>检测深度与精度</span>
            </label>

            <div className="grid grid-cols-3 gap-1 bg-[#23211e] p-1.5 rounded-xl border border-[#2e2b27]">
              {[
                { id: 'quick', label: '轻检', tip: '2项探针 · ~1s' },
                { id: 'standard', label: '标准', tip: '5项探针 · ~4s' },
                { id: 'deep', label: '死磕', tip: '8项探针 · ~8s' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDepth(d.id as FidelityDepth)}
                  title={d.tip}
                  className={`py-2 rounded-lg text-sm font-medium transition text-center ${
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

        {/* Progress Feedback Bar */}
        {isRunning && (
          <div className="mt-4 space-y-2.5 pt-4 border-t border-[#2e2b27] animate-in fade-in">
            <div className="flex justify-between text-sm text-[#9c9689]">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#cc785c]" />
                {progressText}
              </span>
              <span className="font-mono text-[#faf9f5] font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#23211e] border border-[#2e2b27]">
              <div
                className="h-full bg-gradient-to-r from-[#cc785c] to-[#d98266] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Pre-test Diagnostic Matrix Showcase (When !report) ── */}
      {!report && !isRunning && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in duration-300">
          {/* Active Probe Matrix (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-7 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-display text-lg font-semibold text-[#faf9f5] flex items-center gap-2.5">
                  <Fingerprint className="w-5 h-5 text-[#cc785c]" />
                  <span>就绪探针矩阵 (Active Probes Ready)</span>
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-md bg-[#23211e] border border-[#2e2b27] text-[#5db872] font-mono">
                  {selectedDepth === 'quick' ? '2 项核心探针' : selectedDepth === 'standard' ? '5 项标准探针' : '8 项全维死磕探针'}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: '首字响应速度 (TTFT) 与流式生成吞吐 (TPS)',
                    desc: '毫秒级捕获第一块 Token 到达时间，同步测量真实 token 流速与中间缓冲拦截。',
                    active: true,
                    tag: '真实流速',
                  },
                  {
                    title: 'Claude 官方私钥加密签名验真 (Thinking Signature)',
                    desc: '校验回包 signature 字段的数学密码学签名，100% 鉴别是否为 Anthropic 官方正品。',
                    active: selectedProfile === 'claude' || selectedProfile === 'auto',
                    tag: '数学防伪',
                  },
                  {
                    title: '原生流式思维链 Delta 提取 (Native Reasoning Delta)',
                    desc: '提取 thinking/reasoning_content 的 token 流式输出速率与思维链分块特征。',
                    active: true,
                    tag: '流式特征',
                  },
                  {
                    title: '空间几何与反套壳拓扑探针 (Spatial Topology Probe)',
                    desc: '利用高维空间几何推理与元认知冲突，击穿中转站套壳与 System Prompt 欺骗。',
                    active: selectedDepth !== 'quick',
                    tag: '逻辑击穿',
                  },
                  {
                    title: '2024/2025 知识库时效与截断期探针 (Knowledge Horizon)',
                    desc: '用特定时间截断事件与版本迭代题，鉴别是否用旧模型或小模型冒充新旗舰。',
                    active: true,
                    tag: '时效探针',
                  },
                ].map((probe, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition ${
                      probe.active
                        ? 'border-[#2e2b27] bg-[#23211e]/80 text-[#faf9f5]'
                        : 'border-[#2e2b27]/40 bg-[#1b1a18]/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${probe.active ? 'text-[#5db872]' : 'text-[#9c9689]'}`} />
                        <span>{probe.title}</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#1b1a18] border border-[#2e2b27] text-[#cc785c]">
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

            <div className="pt-2 flex items-center justify-between text-xs text-[#9c9689] font-mono border-t border-[#2e2b27]/60">
              <span>准备就绪 · 点击上方按钮即刻执行探针</span>
              <span className="text-[#faf9f5]">预估耗时: {selectedDepth === 'quick' ? '1~2s' : selectedDepth === 'standard' ? '3~5s' : '6~9s'}</span>
            </div>
          </div>

          {/* Diagnostic Standards & Scoring Guide (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-7 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-serif-display text-lg font-semibold text-[#faf9f5] flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-[#cc785c]" />
                <span>保真度评分标准 (Scoring Rubric)</span>
              </h3>

              <div className="space-y-3.5">
                <div className="p-4 rounded-xl border border-[#5db872]/30 bg-[#5db872]/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#5db872]">
                    <span>85 ~ 100 分 · 高保真正品 (Official Grade)</span>
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    官方直连或 100% 满血透传，加密签名完整无缺，原生思维链无篡改，首字响应迅速。
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#e8a55a]/30 bg-[#e8a55a]/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#e8a55a]">
                    <span>50 ~ 84 分 · 疑似降级 / 包装异常 (Suspicious)</span>
                    <span className="text-xs font-mono font-bold">⚠️ 警示</span>
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    存在伪造思考流、缺少官方数学签名或网关后台注入了假冒 System Prompt。
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#c64545]/30 bg-[#c64545]/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#c64545]">
                    <span>0 ~ 49 分 · 严重掺水冒充 (Fake / Downgraded)</span>
                    <XCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    证据确凿的模型掉包（如使用廉价开源小模型套壳冒充顶尖模型），探针测试全军覆没。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs text-[#9c9689] space-y-1">
              <span className="text-[#faf9f5] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#cc785c]" />
                零数据泄露原则
              </span>
              <p>所有探针请求直接从浏览器内存发起，不留存任何日志，测试完成后立即销毁数据。</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. High-Texture Statistical Diagnostics Report (When report exists) ── */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* A. Top Telemetry Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Metric 1: 首字响应速度 (TTFT) */}
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm">
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
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm">
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
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm">
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
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm">
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
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm">
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
            <div className={`rounded-xl border p-5 space-y-2 shadow-sm ${
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

          {/* B. Official Audit Certificate Banner (质感认证看板) */}
          <div
            className={`rounded-2xl border p-7 sm:p-8 shadow-2xl relative overflow-hidden ${
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

                {/* Sub features pills */}
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] hover:bg-[#2b2926] hover:border-[#cc785c]/40 transition shadow-sm"
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
                  onClick={handleStartAudit}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141413] border border-[#2e2b27] text-xs font-semibold text-[#9c9689] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重新跑一次体检</span>
                </button>
              </div>
            </div>
          </div>

          {/* C. Interactive Filterable Probe Evidence Breakdown (探针决策详单) */}
          <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0">
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
  );
};
