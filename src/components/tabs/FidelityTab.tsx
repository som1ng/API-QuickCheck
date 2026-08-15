import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import {
  FidelityReport,
  FidelityDepth,
  ModelVerificationProfile,
} from '../../types/fidelity';
import { StatusBadge } from '../common/StatusBadge';
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
    <div className="space-y-7">
      {/* 1. Top Controls & Diagnostic Setup Card */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-7 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
                真伪模型与降级掺假深度鉴别
              </h2>
            </div>
            <p className="mt-2 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
              自主选择目标模型、厂商专属判伪标准与检测深度，精准击穿中转站套壳伪装与思维链造假。
            </p>
          </div>

          <button
            onClick={handleStartAudit}
            disabled={isRunning || !config.baseUrl || !config.apiKey}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-7 py-3 text-sm font-semibold text-[#faf9f5] shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>鉴别中 ({progressPercent}%)</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-[#faf9f5]" />
                <span>开始全维度验真</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Interactive Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t border-[#2e2b27]">
          {/* A. Searchable Target Model Dropdown (5 cols) */}
          <div className="md:col-span-5 relative">
            <label className="block text-sm font-medium text-[#faf9f5] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-[18px] h-[18px] text-[#cc785c]" />
                <span>测试目标模型 (可下拉或手动输入)</span>
              </span>
              {availableModels.length > 0 && (
                <span className="text-xs text-[#5db872] font-mono">
                  已探测 {availableModels.length} 个
                </span>
              )}
            </label>

            <div className="relative">
              <div className="flex rounded-lg border border-[#2e2b27] bg-[#23211e] focus-within:border-[#cc785c] transition">
                <input
                  type="text"
                  value={config.selectedModel}
                  onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                  placeholder="例如: claude-3-7-sonnet-20250219"
                  className="w-full bg-transparent px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-3 text-[#9c9689] hover:text-[#faf9f5] transition border-l border-[#2e2b27]"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {showModelDropdown && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2">
                  <input
                    type="text"
                    placeholder="搜索模型..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] px-3 py-2 text-sm text-[#faf9f5] placeholder-[#9c9689] focus:outline-none focus:border-[#cc785c]"
                  />

                  {/* Hot Presets */}
                  <div>
                    <div className="text-xs uppercase font-semibold text-[#9c9689] px-2.5 py-1.5">
                      热门官方模型预设
                    </div>
                    {COMMON_PRESET_MODELS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectModel(item.id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#faf9f5] transition flex items-center justify-between font-mono"
                      >
                        <span>{item.id}</span>
                        <span className="text-xs text-[#cc785c] px-2 py-0.5 rounded bg-[#cc785c]/10">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Remote Discovered Models */}
                  {availableModels.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-semibold text-[#5db872] px-2.5 py-1.5 border-t border-[#2e2b27] mt-1 pt-2">
                        中转站已扫描可用模型 ({availableModels.length})
                      </div>
                      {filteredRemoteModels.slice(0, 30).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectModel(m.id)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#d4cebe] transition flex items-center justify-between font-mono"
                        >
                          <span className="truncate">{m.id}</span>
                          <span className="text-xs text-[#9c9689]">Remote</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* B. Model Verification Profile / Family (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-[#faf9f5] mb-2 flex items-center gap-2">
              <Sliders className="w-[18px] h-[18px] text-[#cc785c]" />
              <span>评判准则 / 厂商体系</span>
            </label>

            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as ModelVerificationProfile)}
              className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 text-sm text-[#faf9f5] focus:border-[#cc785c] focus:outline-none transition"
            >
              <option value="auto">⭐ 智能自动匹配 (推荐)</option>
              <option value="claude">Anthropic Claude (Thinking Signature 验签 + 空间几何)</option>
              <option value="deepseek">DeepSeek R1/V3 (原生 reasoning_content + 671B指纹)</option>
              <option value="openai">OpenAI o1/o3/GPT-4o (系统指纹 + 知识库截止期)</option>
              <option value="gemini">Google Gemini (原生思考流 + 搜索接地)</option>
              <option value="universal">通用大模型 (元认知冲突 + 拓扑几何)</option>
            </select>
          </div>

          {/* C. Diagnostic Rigor Depth (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-[#faf9f5] mb-2 flex items-center gap-2">
              <Gauge className="w-[18px] h-[18px] text-[#cc785c]" />
              <span>检测深度与精度</span>
            </label>

            <div className="grid grid-cols-3 gap-1 bg-[#23211e] p-1.5 rounded-lg border border-[#2e2b27]">
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
                  className={`py-2.5 rounded-md text-sm font-medium transition text-center ${
                    selectedDepth === d.id
                      ? 'bg-[#cc785c] text-[#faf9f5] font-semibold'
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
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#23211e]">
              <div
                className="h-full bg-[#cc785c] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Comprehensive Diagnostics Report */}
      {report && (
        <div className="space-y-7 animate-in fade-in duration-300">
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
              status="neutral"
              icon={<DollarSign className="w-5 h-5 text-[#5db872]" />}
            />
            <MetricCard
              label="探针通过率"
              value={`${report.probes.filter((p) => p.passed).length}/${report.probes.length}`}
              unit={`(${Math.round((report.probes.filter((p) => p.passed).length / (report.probes.length || 1)) * 100)}%)`}
              status={report.overallScore >= 80 ? 'success' : report.overallScore >= 50 ? 'warning' : 'error'}
              icon={<CheckCircle2 className="w-5 h-5 text-[#5db872]" />}
            />
          </div>

          {/* Main Verdict Card */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-7 shadow-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2e2b27]">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#9c9689] font-semibold mb-1.5">
                  体检核验综合报告 · 准则 [{report.verificationProfile.toUpperCase()}] · 深度 [{report.depth.toUpperCase()}]
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif-display text-3xl font-medium text-[#faf9f5]">
                    {report.targetModel}
                  </h3>
                  <StatusBadge status={report.level} size="md" />
                </div>
              </div>

              <div className="text-sm text-[#9c9689] font-mono flex items-center gap-2">
                <span>检测时间: {new Date(report.testedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 pt-7">
              {/* Left Column: Score Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-7 rounded-xl bg-[#23211e] border border-[#2e2b27] text-center space-y-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#2e2b27]"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={report.overallScore >= 80 ? 'text-[#5db872]' : report.overallScore >= 50 ? 'text-[#e8a55a]' : 'text-[#c64545]'}
                      strokeDasharray={`${report.overallScore}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-bold font-mono text-[#faf9f5]">
                      {report.overallScore}%
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#9c9689] mt-0.5">
                      保真指数
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#faf9f5]">
                    {report.overallScore >= 90 ? '高保真官方真品' : report.overallScore >= 70 ? '协议表现良好' : '疑似降级或掺假'}
                  </div>
                  <p className="text-xs text-[#9c9689] mt-1.5 line-clamp-2 px-2 leading-relaxed">
                    {report.summary}
                  </p>
                </div>
              </div>

              {/* Right Column: Key Verification Checklist */}
              <div className="md:col-span-8 space-y-3">
                {/* Claude Thinking Signature */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm">
                  <span className="font-medium text-[#d4cebe]">Anthropic 官方私钥加密签名 (Thinking Signature)</span>
                  {report.signatureResult?.isApplicable ? (
                    report.signatureResult.passed ? (
                      <span className="text-[#5db872] font-semibold flex items-center gap-1.5">
                        <Check className="w-[18px] h-[18px]" /> 100% 官方真品通过
                      </span>
                    ) : (
                      <span className="text-[#c64545] font-semibold flex items-center gap-1.5">
                        <XCircle className="w-[18px] h-[18px]" /> 签名缺失 (疑似套壳)
                      </span>
                    )
                  ) : (
                    <span className="text-[#9c9689]">非原生 messages 协议 (跳过验签)</span>
                  )}
                </div>

                {/* Reasoning Protocol */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm">
                  <span className="font-medium text-[#d4cebe]">原生思维链协议流 (Reasoning Stream Delta)</span>
                  {report.reasoningResult?.hasReasoningStream ? (
                    <span className="text-[#5db872] font-semibold flex items-center gap-1.5">
                      <Check className="w-[18px] h-[18px]" /> 原生思考链通过
                    </span>
                  ) : (
                    <span className="text-[#9c9689]">
                      {report.reasoningResult?.passed ? '标准文本流 (通过)' : '未捕获思维链'}
                    </span>
                  )}
                </div>

                {/* Probes List Items */}
                {report.probes.map((probe, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm">
                    <span className="text-[#d4cebe]">{probe.title}</span>
                    {probe.passed ? (
                      <span className="text-[#5db872] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-[18px] h-[18px]" /> 通过
                      </span>
                    ) : (
                      <span className="text-[#c64545] font-semibold flex items-center gap-1.5">
                        <XCircle className="w-[18px] h-[18px]" /> 未通过
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Evidence Log Table */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
            <div className="p-5 border-b border-[#2e2b27] flex items-center justify-between">
              <h4 className="font-serif-display text-xl font-medium text-[#faf9f5]">
                探针实测明细与决策证据链
              </h4>
              <span className="text-sm text-[#9c9689] font-mono">共执行 {report.probes.length} 项探针</span>
            </div>

            <div className="divide-y divide-[#2e2b27]">
              {report.probes.map((probe, idx) => (
                <div key={idx} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#23211e]/50 transition">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-mono text-[#9c9689]">#{idx + 1}</span>
                      <span className="text-sm font-medium text-[#faf9f5]">{probe.title}</span>
                      {probe.passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#5db872]/10 text-[#5db872] border border-[#5db872]/20">
                          通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[#c64545]/10 text-[#c64545] border border-[#c64545]/20">
                          未达标
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#9c9689] leading-relaxed">{probe.details}</p>
                  </div>

                  <div className="flex items-center gap-5 text-sm font-mono text-[#9c9689] shrink-0">
                    <div>
                      Token: <span className="text-[#faf9f5] font-semibold">{probe.tokensUsed?.total || '-'}</span>
                    </div>
                    <div>
                      得分: <span className="text-[#faf9f5] font-semibold">{probe.score}</span>/100
                    </div>
                    <div>
                      耗时: <span className="text-[#faf9f5]">{probe.latencyMs}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
