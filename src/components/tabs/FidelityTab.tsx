import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import {
  FidelityReport,
  FidelityDepth,
  ModelVerificationProfile,
} from '../../types/fidelity';
import { MetricCard } from '../common/MetricCard';
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
  DollarSign,
  Search,
  Fingerprint,
  Activity,
} from 'lucide-react';

const COMMON_PRESET_MODELS = [
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Thinking)', tag: 'Anthropic', family: 'claude' as ModelVerificationProfile },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (New)', tag: 'Anthropic', family: 'claude' as ModelVerificationProfile },
  { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (原生思维链)', tag: 'DeepSeek', family: 'deepseek' as ModelVerificationProfile },
  { id: 'deepseek-chat', label: 'DeepSeek-V3', tag: 'DeepSeek', family: 'deepseek' as ModelVerificationProfile },
  { id: 'gpt-4o', label: 'GPT-4o (Omni)', tag: 'OpenAI', family: 'openai' as ModelVerificationProfile },
  { id: 'o1', label: 'OpenAI o1 (Full Reasoning)', tag: 'OpenAI', family: 'openai' as ModelVerificationProfile },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tag: 'Google', family: 'gemini' as ModelVerificationProfile },
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

  const handleStartAudit = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先在顶部配置中转站 Base URL 和 API Key');
      return;
    }

    setIsRunning(true);
    setProgressText('正在初始化深度鉴别引擎...');
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

  // Filtered dropdown list
  const filteredRemoteModels = availableModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Top Controls & Diagnostic Setup Card */}
      <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-7 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#faf9f5] tracking-tight">
                  真伪模型与降级掺假深度鉴别
                </h2>
                <p className="mt-1 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
                  自主选择目标模型、厂商专属判伪标准与检测深度，精准击穿中转站套壳伪装与思维链造假。
                </p>
              </div>
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
                <span>深度验真进行中...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-[#faf9f5]" />
                <span>开始全维度验真</span>
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
                  已探测到 {availableModels.length} 个模型
                </span>
              )}
            </div>

            <div className="relative">
              <div className="flex rounded-xl border border-[#2e2b27] bg-[#23211e] focus-within:border-[#cc785c] transition">
                <input
                  type="text"
                  value={config.selectedModel}
                  onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                  placeholder="例如: claude-3-7-sonnet-20250219"
                  className="w-full bg-transparent px-4 py-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-4 text-[#9c9689] hover:text-[#faf9f5] transition border-l border-[#2e2b27]"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {showModelDropdown && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="快速搜索模型..."
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] pl-9 pr-3 py-2 text-sm text-[#faf9f5] placeholder-[#9c9689] focus:outline-none focus:border-[#cc785c]"
                    />
                    <Search className="w-4 h-4 text-[#9c9689] absolute left-3 top-2.5" />
                  </div>

                  <div>
                    <div className="text-xs uppercase font-semibold text-[#9c9689] px-2.5 py-1.5">
                      推荐旗舰模型
                    </div>
                    {COMMON_PRESET_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          handleSelectModel(m.id);
                          setSelectedProfile(m.family);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                          config.selectedModel === m.id
                            ? 'bg-[#cc785c]/15 text-[#faf9f5] font-semibold'
                            : 'text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5]'
                        }`}
                      >
                        <span className="font-mono">{m.label}</span>
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
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#d4cebe] transition font-mono truncate"
                        >
                          {m.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    title: '2025/2026 知识库时效与截断期探针 (Knowledge Horizon)',
                    desc: '用特定时间截断事件与版本迭代题，鉴别是否用旧模型或小模型冒充新旗舰。',
                    active: true,
                    tag: '时效探针',
                  },
                  {
                    title: '空间几何与反套壳拓扑探针 (Spatial Topology Probe)',
                    desc: '利用高维空间几何推理与元认知冲突，击穿中转站套壳与 System Prompt 欺骗。',
                    active: selectedDepth !== 'quick',
                    tag: '逻辑击穿',
                  },
                  {
                    title: '流式首字延迟与 Chunk 抖动方差 (TTFT & Jitter Analysis)',
                    desc: '分析首字响应耗时与分块抖动，评估中转站网关上游排队拥塞与真实度。',
                    active: selectedDepth === 'deep',
                    tag: '网络指纹',
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
                    <span>80 ~ 100 分 · 高保真正品 (Official Grade)</span>
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    官方直连或 100% 满血透传，加密签名完整无缺，原生思维链无篡改，响应延迟平稳。
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#e8a55a]/30 bg-[#e8a55a]/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#e8a55a]">
                    <span>50 ~ 79 分 · 疑似降级 / 包装异常 (Suspicious)</span>
                    <span className="text-xs font-mono font-bold">⚠️ 警示</span>
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    存在非官方伪造思考流、缺少官方数学签名、或响应延迟方差过大，但具备一定基础推理能力。
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#c64545]/30 bg-[#c64545]/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-sm text-[#c64545]">
                    <span>0 ~ 49 分 · 严重掺水冒充 (Fake / Downgraded)</span>
                    <XCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#d4cebe] leading-relaxed">
                    证据确凿的模型掉包（如使用廉价开源小模型套壳冒充顶尖模型），探针测试几乎全军覆没。
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

      {/* ── 3. Comprehensive Diagnostics Report (When report exists) ── */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <MetricCard
              label="检测总耗时"
              value={(report.totalDurationMs / 1000).toFixed(2)}
              unit="s"
              status="neutral"
              icon={<Clock className="w-5 h-5 text-[#9c9689]" />}
            />
            <MetricCard
              label="消耗 Token 总计"
              value={report.totalTokens.total}
              unit="Tokens"
              subValue={`Prompt: ${report.totalTokens.prompt} | Output: ${report.totalTokens.completion}`}
              status="neutral"
              icon={<Coins className="w-5 h-5 text-[#cc785c]" />}
            />
            <MetricCard
              label="预估花费金额"
              value={`$${report.estimatedCostUsd}`}
              subValue={`约 ¥${(report.estimatedCostUsd * 7.25).toFixed(4)}`}
              unit="USD"
              status="neutral"
              icon={<DollarSign className="w-5 h-5 text-[#5db872]" />}
            />
            <MetricCard
              label="综合保真得分"
              value={`${report.overallScore}%`}
              status={
                report.overallScore >= 80
                  ? 'success'
                  : report.overallScore >= 50
                  ? 'warning'
                  : 'error'
              }
              icon={<ShieldCheck className="w-5 h-5 text-[#cc785c]" />}
            />
          </div>

          {/* Verdict Banner Card */}
          <div
            className={`rounded-2xl border p-7 sm:p-8 shadow-xl ${
              report.overallScore >= 80
                ? 'border-[#5db872]/40 bg-[#5db872]/[0.08]'
                : report.overallScore >= 50
                ? 'border-[#e8a55a]/40 bg-[#e8a55a]/[0.08]'
                : 'border-[#c64545]/40 bg-[#c64545]/[0.08]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`p-2 rounded-xl border ${
                      report.overallScore >= 80
                        ? 'bg-[#5db872]/20 text-[#5db872] border-[#5db872]/30'
                        : report.overallScore >= 50
                        ? 'bg-[#e8a55a]/20 text-[#e8a55a] border-[#e8a55a]/30'
                        : 'bg-[#c64545]/20 text-[#c64545] border-[#c64545]/30'
                    }`}
                  >
                    {report.overallScore >= 80 ? (
                      <Check className="w-6 h-6" />
                    ) : report.overallScore >= 50 ? (
                      <span className="font-bold text-base">⚠️</span>
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </span>
                  <div>
                    <h3 className="font-serif-display text-2xl font-semibold text-[#faf9f5]">
                      {report.level === 'genuine' ? '高保真官方真品' : report.level === 'suspect_downgraded' ? '疑似模型降级 / 包装异常' : '劣质冒充 / 严重掺水'}
                    </h3>
                    <p className="text-xs text-[#9c9689] font-mono mt-0.5">
                      目标模型: {report.targetModel} · 鉴别体系: {report.verificationProfile} · 深度: {report.depth}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#d4cebe] leading-relaxed max-w-3xl pt-1">
                  {report.summary}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#1b1a18] border border-[#2e2b27] shadow-md min-w-[130px]">
                <span className="text-xs text-[#9c9689] uppercase font-semibold">保真指数</span>
                <span
                  className={`font-mono text-3xl font-bold mt-1 ${
                    report.overallScore >= 80
                      ? 'text-[#5db872]'
                      : report.overallScore >= 50
                      ? 'text-[#e8a55a]'
                      : 'text-[#c64545]'
                  }`}
                >
                  {report.overallScore}%
                </span>
                <span className="text-[10px] text-[#9c9689] mt-0.5">
                  {report.overallScore >= 80 ? '高保真正品' : report.overallScore >= 50 ? '疑似掺水' : '劣质冒充'}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Details List */}
          <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#2e2b27] flex items-center justify-between bg-[#141413]/60">
              <h4 className="font-serif-display text-lg font-semibold text-[#faf9f5]">
                鉴别探针决策详单 ({report.probes.length} 项)
              </h4>
              <span className="text-xs text-[#9c9689] font-mono">
                通过: {report.probes.filter((e) => e.passed).length} / 失败: {report.probes.filter((e) => !e.passed).length}
              </span>
            </div>

            <div className="divide-y divide-[#2e2b27]">
              {report.probes.map((item, idx) => (
                <div key={idx} className="p-5 hover:bg-[#23211e]/40 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {item.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#5db872] shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#c64545] shrink-0" />
                      )}
                      <h5 className="text-sm font-semibold text-[#faf9f5]">
                        {item.title}
                      </h5>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                        item.passed
                          ? 'bg-[#5db872]/15 text-[#5db872] border border-[#5db872]/30'
                          : 'bg-[#c64545]/15 text-[#c64545] border border-[#c64545]/30'
                      }`}
                    >
                      {item.passed ? '通过' : '未通过'}
                    </span>
                  </div>

                  <p className="text-xs text-[#d4cebe] leading-relaxed pl-7">
                    {item.details}
                  </p>

                  {item.actualOutput && (
                    <div className="pl-7 pt-1">
                      <pre className="p-3 rounded-xl bg-[#141413] border border-[#2e2b27] font-mono text-xs text-[#9c9689] overflow-x-auto whitespace-pre-wrap">
                        {item.actualOutput}
                      </pre>
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
