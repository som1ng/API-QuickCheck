import React, { useState } from 'react';
import { FidelityReport } from '../../types/fidelity';
import {
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Coins,
  Clock,
  Check,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RotateCcw,
  Shield,
  Terminal,
  ArrowLeft,
  Award,
  Globe,
  Layers,
  Sparkles,
  Share2,
} from 'lucide-react';

interface FidelityCertificateViewProps {
  report: FidelityReport;
  baseUrl: string;
  onBack: () => void;
  onReAudit: () => void;
  isRunningAudit: boolean;
}

export const FidelityCertificateView: React.FC<FidelityCertificateViewProps> = ({
  report,
  baseUrl,
  onBack,
  onReAudit,
  isRunningAudit,
}) => {
  const [probeFilter, setProbeFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Generate deterministic certificate serial ID based on timestamp and model
  const certSerial = `CERT-${new Date(report.testedAt).toISOString().slice(0, 10).replace(/-/g, '')}-${report.targetModel.slice(0, 6).toUpperCase()}-${Math.abs(report.testedAt % 100000).toString().padStart(5, '0')}`;

  const displayedProbes = report.probes.filter((p) => {
    if (probeFilter === 'passed') return p.passed;
    if (probeFilter === 'failed') return !p.passed;
    return true;
  });

  const handleCopyMarkdownReport = async () => {
    const md = `# API 验真评测证书 (Verification Certificate)
- **证书编号**: \`${certSerial}\`
- **颁发状态**: ${report.level === 'genuine' ? '⭐ 官方正品认证 (VERIFIED GENUINE)' : report.level === 'suspect_downgraded' ? '⚠️ 疑似降级/包装异常 (SUSPECT DOWNGRADED)' : '❌ 虚假冒充/未达标 (FAKE IMPOSTER)'}
- **真实性评分**: **${report.overallScore} / 100**
- **测试模型**: \`${report.targetModel}\`
- **检测端点**: \`${baseUrl}\`
- **检测体系**: \`${report.verificationProfile}\` (深度: \`${report.depth}\`)
- **首字响应速度 (TTFT)**: \`${report.firstTokenLatencyMs || 0} ms\`
- **流式生成速率 (TPS)**: \`${report.generationTps || 0} tok/s\`
- **思考耗时**: \`${report.thinkingTimeMs || 0} ms\`
- **总耗时 / Token**: \`${(report.totalDurationMs / 1000).toFixed(2)}s\` / \`${report.totalTokens.total} Tokens\`
- **评测判定结论**: ${report.summary}

## 核心协议验真证据
${report.signatureResult?.isApplicable ? `- **Anthropic Thinking 签名**: ${report.signatureResult.passed ? '✅ 官方加密私钥验签通过' : '❌ 签名校验失败'}\n` : ''}${report.reasoningResult?.hasReasoningStream ? `- **原生思考流协议**: ✅ 捕获到 \`${report.reasoningResult.reasoningFieldUsed}\` 原生字段\n` : ''}

## 字段级探针证据明细 (${report.probes.length} 项)
${report.probes.map((p, i) => `### ${i + 1}. ${p.title} [${p.passed ? 'PASS' : 'FAIL'}]
- **得分**: ${p.score} / 100 | **耗时**: ${p.latencyMs}ms
- **详情**: ${p.details}
${p.actualOutput ? `\`\`\`\n${p.actualOutput.trim()}\n\`\`\`` : ''}
`).join('\n')}

---
*本证书由 API-QuickCheck 自动化真伪鉴别引擎颁发 (https://github.com/som1ng/API-QuickCheck)*`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopySummaryBadge = async () => {
    const text = `🏆 【API-QuickCheck 验真证书】\n模型: ${report.targetModel}\n评分: ${report.overallScore}/100 (${report.level === 'genuine' ? '官方正品' : report.level === 'suspect_downgraded' ? '疑似降级' : '虚假冒充'})\n首字延迟: ${report.firstTokenLatencyMs || 0}ms | 生成速率: ${report.generationTps || 0} tok/s\n证书号: ${certSerial}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // ignore
    }
  };

  const isGenuine = report.overallScore >= 85;
  const isSuspect = report.overallScore >= 50 && report.overallScore < 85;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2e2b27]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#23211e] hover:bg-[#2b2926] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] transition self-start shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#cc785c]" />
          <span>返回检测工作台</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
          <span>证书编号: <strong className="text-[#faf9f5] font-semibold">{certSerial}</strong></span>
          <span>·</span>
          <span>时间: {new Date(report.testedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── 1. Official Verification Certificate Header Banner ── */}
      <div
        className={`rounded-3xl border p-8 sm:p-10 shadow-2xl relative overflow-hidden smooth-card ${
          isGenuine
            ? 'border-[#059669] bg-gradient-to-br from-[#1b1a18] via-[#16271e] to-[#064e3b]/30'
            : isSuspect
            ? 'border-[#d97706] bg-gradient-to-br from-[#1b1a18] via-[#291e13] to-[#451a03]/30'
            : 'border-[#e11d48] bg-gradient-to-br from-[#1b1a18] via-[#291319] to-[#4c0519]/30'
        }`}
      >
        {/* Certificate Decorative Watermark Stamp Background */}
        <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none select-none">
          <Award className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wide shadow-md ${
                  isGenuine
                    ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                    : isSuspect
                    ? 'bg-[#451a03] text-[#fcd34d] border border-[#d97706]'
                    : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                }`}
              >
                {isGenuine ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isSuspect ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>
                  {report.level === 'genuine'
                    ? 'VERIDROP / API-QC VERIFIED · 官方正品证书'
                    : report.level === 'suspect_downgraded'
                    ? 'SUSPECT DOWNGRADED · 疑似降级/包装异常'
                    : 'FAKE IMPOSTER · 虚假冒充判定'}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#23211e] border border-[#44403c] text-xs font-mono text-neutral-300">
                <Layers className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>目标模型: <strong className="text-[#faf9f5] font-semibold">{report.targetModel}</strong></span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#23211e] border border-[#44403c] text-xs font-mono text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-[#cc785c]" />
                <span className="truncate max-w-[200px]">{baseUrl}</span>
              </span>
            </div>

            {/* Verdict Headline */}
            <div>
              <h2 className="font-serif-display text-2xl sm:text-4xl font-semibold text-[#faf9f5] tracking-tight leading-snug">
                {report.summary}
              </h2>
            </div>

            {/* Cryptographic & Protocol Evidence Pill Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {report.signatureResult?.isApplicable && (
                <span className={`px-3 py-1.5 rounded-xl font-mono tracking-wide border flex items-center gap-2 shadow-sm font-semibold ${
                  report.signatureResult.passed
                    ? 'bg-[#064e3b] text-[#6ee7b7] border-[#059669]'
                    : 'bg-[#4c0519] text-[#fda4af] border-[#e11d48]'
                }`}>
                  <Shield className="w-4 h-4" />
                  <span>{report.signatureResult.passed ? 'Anthropic 官方私钥加密签名验签通过' : '官方私钥签名校验失败'}</span>
                </span>
              )}

              {report.reasoningResult?.hasReasoningStream && (
                <span className="px-3 py-1.5 rounded-xl font-mono tracking-wide bg-[#23211e] border border-[#44403c] text-[#faf9f5] font-semibold flex items-center gap-2 shadow-sm">
                  <Cpu className="w-4 h-4 text-[#cc785c]" />
                  <span>捕获原生 `{report.reasoningResult.reasoningFieldUsed}` 思考流协议</span>
                </span>
              )}

              <span className="px-3 py-1.5 rounded-xl font-mono tracking-wide bg-[#23211e] border border-[#44403c] text-neutral-300 font-medium">
                检测体系: {report.verificationProfile.toUpperCase()} (深度: {report.depth})
              </span>
            </div>
          </div>

          {/* Right Stamp & Action Buttons */}
          <div className="flex flex-col items-center lg:items-end justify-center gap-4 shrink-0">
            {/* Score Stamp Box */}
            <div className={`flex flex-col items-center justify-center w-36 h-36 rounded-3xl border-2 shadow-2xl p-4 text-center ${
              isGenuine
                ? 'border-[#059669] bg-[#064e3b]/80 text-[#6ee7b7]'
                : isSuspect
                ? 'border-[#d97706] bg-[#451a03]/80 text-[#fcd34d]'
                : 'border-[#e11d48] bg-[#4c0519]/80 text-[#fda4af]'
            }`}>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-300">验真评分</span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-mono text-4xl font-bold tracking-tight">{report.overallScore}</span>
                <span className="text-xs font-mono opacity-75">/100</span>
              </div>
              <span className="text-[11px] font-mono font-bold tracking-wide">
                {report.level === 'genuine' ? '⭐ 官方正品' : report.level === 'suspect_downgraded' ? '⚠️ 存在风险' : '❌ 虚假冒充'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMarkdownReport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold text-white hover:bg-[#2b2926] hover:border-[#cc785c]/60 transition shadow-sm smooth-btn tracking-wide"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-4 h-4 text-[#6ee7b7]" />
                    <span className="text-[#6ee7b7]">已复制报告</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#cc785c]" />
                    <span>复制 Markdown 报告</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopySummaryBadge}
                className="p-2.5 rounded-xl bg-[#23211e] border border-[#2e2b27] text-neutral-300 hover:text-white hover:border-[#cc785c]/60 transition shadow-sm"
                title="复制证书简报"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-[#6ee7b7]" /> : <Share2 className="w-4 h-4 text-[#cc785c]" />}
              </button>

              <button
                type="button"
                onClick={onReAudit}
                disabled={isRunningAudit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] border border-[#2e2b27] text-xs font-semibold text-neutral-300 hover:text-white hover:border-[#cc785c]/60 transition smooth-btn tracking-wide"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新测试</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Telemetry Metrics Cards Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: 首字响应速度 (TTFT) */}
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
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
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
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
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
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
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
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
        <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-5 space-y-2 shadow-sm smooth-card">
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

        {/* Metric 6: 评定等级 */}
        <div className={`rounded-2xl border p-5 space-y-2 shadow-sm smooth-card ${
          isGenuine
            ? 'border-[#059669] bg-[#064e3b]/80'
            : isSuspect
            ? 'border-[#d97706] bg-[#451a03]/80'
            : 'border-[#e11d48] bg-[#4c0519]/80'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#faf9f5] font-semibold tracking-wide uppercase">
            <span>认证判定</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-2xl font-bold ${
              isGenuine
                ? 'text-[#6ee7b7]'
                : isSuspect
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

      {/* ── 3. Field-Level Itemized Diagnostic Evidence List ── */}
      <div className="rounded-3xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-xl space-y-0 smooth-card">
        {/* Header with Filter Pills */}
        <div className="p-6 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-4 bg-[#141413]/60">
          <div>
            <h3 className="font-serif-display text-xl font-semibold text-[#faf9f5] flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#cc785c]" />
              <span>字段级探针证据明细 ({report.probes.length} 项)</span>
            </h3>
            <p className="text-xs text-neutral-300 mt-0.5 tracking-normal">
              多维度探针测试执行结果与原始回包数据证据。
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#23211e] border border-[#2e2b27] text-xs font-semibold tracking-wide">
            <button
              type="button"
              onClick={() => setProbeFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
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
              className={`px-3.5 py-1.5 rounded-lg transition ${
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
              className={`px-3.5 py-1.5 rounded-lg transition ${
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
            <div key={idx} className="p-6 hover:bg-[#23211e]/40 transition space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {item.passed ? (
                    <div className="w-8 h-8 rounded-xl bg-[#064e3b] border border-[#059669] flex items-center justify-center text-[#6ee7b7] shrink-0 shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#4c0519] border border-[#e11d48] flex items-center justify-center text-[#fda4af] shrink-0 shadow-sm">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-[#faf9f5]">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5 tracking-wide">
                      <span>耗时: {item.latencyMs}ms</span>
                      <span>·</span>
                      <span>Token: {item.tokensUsed?.total || '--'}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs px-3.5 py-1 rounded-full font-mono font-semibold tracking-wide shadow-sm ${
                    item.passed
                      ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                      : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                  }`}
                >
                  {item.passed ? `通过 (${item.score}分)` : `未通过 (${item.score}分)`}
                </span>
              </div>

              <p className="text-xs text-neutral-200 leading-relaxed pl-11 tracking-normal font-medium">
                {item.details}
              </p>

              {item.actualOutput && (
                <div className="pl-11 pt-1">
                  <div className="rounded-xl bg-[#10100f] border border-white/10 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1b1a18] border-b border-[#2e2b27] text-xs font-mono text-neutral-400 tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>模型原始响应回包片段</span>
                      </span>
                      <span>RAW EVIDENCE</span>
                    </div>
                    <pre className="p-3.5 font-mono text-xs text-neutral-200 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed tracking-wide">
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
  );
};
