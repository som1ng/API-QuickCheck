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
  Copy,
  RotateCcw,
  Terminal,
  ArrowLeft,
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

  // Deterministic certificate serial
  const certSerial = `CERT-${new Date(report.testedAt).toISOString().slice(0, 10).replace(/-/g, '')}-${report.targetModel.slice(0, 6).toUpperCase()}-${Math.abs(report.testedAt % 100000).toString().padStart(5, '0')}`;

  const displayedProbes = report.probes.filter((p) => {
    if (probeFilter === 'passed') return p.passed;
    if (probeFilter === 'failed') return !p.passed;
    return true;
  });

  const handleCopyMarkdownReport = async () => {
    const md = `# API 验真评测报告
- 证书编号: \`${certSerial}\`
- 判定状态: ${report.level === 'genuine' ? '官方正品 (VERIFIED GENUINE)' : report.level === 'suspect_downgraded' ? '疑似降级 (SUSPECT DOWNGRADED)' : '虚假冒充 (FAKE IMPOSTER)'}
- 保真评分: **${report.overallScore} / 100**
- 测试模型: \`${report.targetModel}\`
- 检测端点: \`${baseUrl}\`
- 检测体系: \`${report.verificationProfile}\` (深度: \`${report.depth}\`)
- 首字响应 (TTFT): \`${report.firstTokenLatencyMs || 0} ms\`
- 生成速率 (TPS): \`${report.generationTps || 0} tok/s\`
- 思考耗时: \`${report.thinkingTimeMs || 0} ms\`
- 总耗时 / Token: \`${(report.totalDurationMs / 1000).toFixed(2)}s\` / \`${report.totalTokens.total} Tokens\`
- 结论: ${report.summary}

## 协议与证据
${report.signatureResult?.isApplicable ? `- Anthropic Thinking 签名: ${report.signatureResult.passed ? '官方私钥验签通过' : '签名校验失败'}\n` : ''}${report.reasoningResult?.hasReasoningStream ? `- 原生思考流协议: 捕获到 \`${report.reasoningResult.reasoningFieldUsed}\` 字段\n` : ''}

## 探针明细 (${report.probes.length} 项)
${report.probes.map((p, i) => `### ${i + 1}. ${p.title} [${p.passed ? 'PASS' : 'FAIL'}]
- 得分: ${p.score} / 100 | 耗时: ${p.latencyMs}ms
- 详情: ${p.details}
${p.actualOutput ? `\`\`\`\n${p.actualOutput.trim()}\n\`\`\`` : ''}
`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopySummaryBadge = async () => {
    const text = `[API-QuickCheck 验真报告] 模型: ${report.targetModel} | 评分: ${report.overallScore}/100 (${report.level === 'genuine' ? '官方正品' : report.level === 'suspect_downgraded' ? '疑似降级' : '虚假冒充'}) | TTFT: ${report.firstTokenLatencyMs || 0}ms | TPS: ${report.generationTps || 0} tok/s | 证书号: ${certSerial}`;
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
    <div className="space-y-6">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#2e2b27]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181715] hover:bg-[#252320] border border-[#2e2b27] text-xs font-mono text-[#faf9f5] transition self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>返回控制台</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>证书编号: <strong className="text-[#faf9f5] font-normal">{certSerial}</strong></span>
          <span>·</span>
          <span>时间: {new Date(report.testedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 1. Header Card */}
      <div
        className={`rounded-md border p-6 relative overflow-hidden ${
          isGenuine
            ? 'border-[#5db872]/40 bg-[#161f18]'
            : isSuspect
            ? 'border-[#e8a55a]/40 bg-[#1f1d16]'
            : 'border-[#c64545]/40 bg-[#1f1616]'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium ${
                  isGenuine
                    ? 'bg-[#5db872]/20 text-[#5db872] border border-[#5db872]/40'
                    : isSuspect
                    ? 'bg-[#e8a55a]/20 text-[#e8a55a] border border-[#e8a55a]/40'
                    : 'bg-[#c64545]/20 text-[#c64545] border border-[#c64545]/40'
                }`}
              >
                {report.level === 'genuine'
                  ? 'VERIFIED GENUINE'
                  : report.level === 'suspect_downgraded'
                  ? 'SUSPECT DOWNGRADED'
                  : 'IMPOSTER'}
              </span>

              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#181715] border border-[#2e2b27] text-neutral-300">
                {report.targetModel}
              </span>

              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#181715] border border-[#2e2b27] text-neutral-400 truncate max-w-xs" title={baseUrl}>
                {baseUrl}
              </span>
            </div>

            {/* Title & Description */}
            <h2 className="font-serif-display text-2xl md:text-3xl font-normal text-[#faf9f5] tracking-tight">
              {report.level === 'genuine'
                ? '官方正品认证'
                : report.level === 'suspect_downgraded'
                ? '存在降级风险'
                : '检测未达标'}
            </h2>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans max-w-2xl">
              {report.summary}
            </p>

            {/* Protocols summary */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {report.signatureResult?.isApplicable && (
                <span className="px-2.5 py-1 rounded font-mono bg-[#181715] border border-[#2e2b27] text-[#faf9f5]">
                  {report.signatureResult.passed
                    ? 'Anthropic 官方私钥验签通过'
                    : 'Anthropic 签名异常'}
                </span>
              )}

              {report.reasoningResult?.hasReasoningStream && (
                <span className="px-2.5 py-1 rounded font-mono bg-[#181715] border border-[#2e2b27] text-[#faf9f5]">
                  捕获原生 {report.reasoningResult.reasoningFieldUsed} 思考流
                </span>
              )}

              <span className="px-2.5 py-1 rounded font-mono bg-[#181715] border border-[#2e2b27] text-neutral-400">
                体系: {report.verificationProfile.toUpperCase()} ({report.depth})
              </span>
            </div>
          </div>

          {/* Right Stamp & Actions */}
          <div className="flex flex-col items-center lg:items-end justify-center gap-3 shrink-0">
            {/* Score Stamp Box */}
            <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-md border p-3 text-center ${
              isGenuine
                ? 'border-[#5db872]/40 bg-[#141413] text-[#5db872]'
                : isSuspect
                ? 'border-[#e8a55a]/40 bg-[#141413] text-[#e8a55a]'
                : 'border-[#c64545]/40 bg-[#141413] text-[#c64545]'
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">SCORE</span>
              <div className="flex items-baseline gap-0.5 my-0.5">
                <span className="font-mono text-3xl font-bold">{report.overallScore}</span>
                <span className="text-xs font-mono opacity-60">/100</span>
              </div>
              <span className="text-[10px] font-mono">
                {report.level === 'genuine' ? 'GENUINE' : report.level === 'suspect_downgraded' ? 'SUSPECT' : 'IMPOSTER'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdownReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181715] border border-[#2e2b27] text-xs font-mono text-white hover:bg-[#252320] transition"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#5db872]" />
                    <span className="text-[#5db872]">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#cc785c]" />
                    <span>复制报告</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopySummaryBadge}
                className="p-1.5 rounded-md bg-[#181715] border border-[#2e2b27] text-neutral-400 hover:text-white transition"
                title="复制简报"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#5db872]" /> : <Share2 className="w-3.5 h-3.5 text-[#cc785c]" />}
              </button>

              <button
                type="button"
                onClick={onReAudit}
                disabled={isRunningAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181715] border border-[#2e2b27] text-xs font-mono text-neutral-300 hover:text-white transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新测试</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: TTFT */}
        <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>TTFT</span>
            <Zap className="w-3.5 h-3.5 text-[#cc785c]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-semibold text-[#faf9f5]">
              {report.firstTokenLatencyMs || '--'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">ms</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {report.firstTokenLatencyMs && report.firstTokenLatencyMs < 800 ? 'Fast (<800ms)' : report.firstTokenLatencyMs && report.firstTokenLatencyMs < 2000 ? 'Normal' : 'Slow (>2s)'}
          </div>
        </div>

        {/* Metric 2: TPS */}
        <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>TPS</span>
            <Activity className="w-3.5 h-3.5 text-[#5db872]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-semibold text-[#faf9f5]">
              {report.generationTps || '--'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">tok/s</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {report.generationTps && report.generationTps > 30 ? 'High Throughput' : 'Streaming'}
          </div>
        </div>

        {/* Metric 3: Thinking */}
        <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Thinking</span>
            <Cpu className="w-3.5 h-3.5 text-[#e8a55a]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-semibold text-[#faf9f5]">
              {report.thinkingTimeMs || 0}
            </span>
            <span className="text-xs text-neutral-400 font-mono">ms</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {report.reasoningResult?.hasReasoningStream ? 'Reasoning Stream' : 'Standard'}
          </div>
        </div>

        {/* Metric 4: Tokens */}
        <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Tokens</span>
            <Coins className="w-3.5 h-3.5 text-[#cc785c]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-semibold text-[#faf9f5]">
              {report.totalTokens.total}
            </span>
            <span className="text-xs text-neutral-400 font-mono">tok</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            ${(report.estimatedCostUsd).toFixed(4)}
          </div>
        </div>

        {/* Metric 5: Duration */}
        <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Duration</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-semibold text-[#faf9f5]">
              {(report.totalDurationMs / 1000).toFixed(2)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">s</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {report.probes.length} Probes
          </div>
        </div>

        {/* Metric 6: Level */}
        <div className={`rounded-md border p-3.5 space-y-1 ${
          isGenuine
            ? 'border-[#5db872]/40 bg-[#161f18]'
            : isSuspect
            ? 'border-[#e8a55a]/40 bg-[#1f1d16]'
            : 'border-[#c64545]/40 bg-[#1f1616]'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
            <span>Level</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-xl font-semibold ${
              isGenuine ? 'text-[#5db872]' : isSuspect ? 'text-[#e8a55a]' : 'text-[#c64545]'
            }`}>
              {report.overallScore}
            </span>
            <span className="text-xs font-mono text-neutral-400">/100</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-300">
            {report.level === 'genuine' ? 'Genuine' : report.level === 'suspect_downgraded' ? 'Suspect' : 'Imposter'}
          </div>
        </div>
      </div>

      {/* 3. Probe Evidence List */}
      <div className="rounded-md border border-[#2e2b27] bg-[#181715] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#2e2b27] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-mono font-semibold text-[#faf9f5] uppercase tracking-wider">
              字段级探针明细 ({report.probes.length})
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setProbeFilter('all')}
              className={`px-2.5 py-1 rounded transition ${
                probeFilter === 'all'
                  ? 'bg-[#252320] text-[#faf9f5] border border-[#2e2b27]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              全部 ({report.probes.length})
            </button>
            <button
              type="button"
              onClick={() => setProbeFilter('passed')}
              className={`px-2.5 py-1 rounded transition ${
                probeFilter === 'passed'
                  ? 'bg-[#5db872]/20 text-[#5db872] border border-[#5db872]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              通过 ({report.probes.filter((p) => p.passed).length})
            </button>
            <button
              type="button"
              onClick={() => setProbeFilter('failed')}
              className={`px-2.5 py-1 rounded transition ${
                probeFilter === 'failed'
                  ? 'bg-[#c64545]/20 text-[#c64545] border border-[#c64545]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              未通过 ({report.probes.filter((p) => !p.passed).length})
            </button>
          </div>
        </div>

        {/* Probes List */}
        <div className="divide-y divide-[#2e2b27]">
          {displayedProbes.map((item, idx) => (
            <div key={idx} className="p-4 hover:bg-[#1f1e1b] transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-mono font-bold ${
                    item.passed
                      ? 'bg-[#5db872]/20 text-[#5db872] border border-[#5db872]/40'
                      : 'bg-[#c64545]/20 text-[#c64545] border border-[#c64545]/40'
                  }`}>
                    {item.passed ? 'P' : 'F'}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-[#faf9f5]">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                  <span>{item.latencyMs}ms</span>
                  <span>·</span>
                  <span>{item.tokensUsed?.total || 0} tok</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      item.passed
                        ? 'bg-[#5db872]/20 text-[#5db872]'
                        : 'bg-[#c64545]/20 text-[#c64545]'
                    }`}
                  >
                    {item.score}分
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans pl-7">
                {item.details}
              </p>

              {item.actualOutput && (
                <div className="pl-7 pt-1">
                  <div className="rounded border border-[#2e2b27] bg-[#141413] overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1 bg-[#181715] border-b border-[#2e2b27] text-[11px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-[#cc785c]" />
                        <span>响应片段</span>
                      </span>
                      <span>RAW</span>
                    </div>
                    <pre className="p-3 font-mono text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed">
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
