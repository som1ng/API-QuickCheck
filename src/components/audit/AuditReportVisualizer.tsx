import React, { useState, useMemo } from 'react';
import { AuditReportV4 } from '../../types/audit';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Activity,
  ClipboardList,
  ChevronDown,
  AlertTriangle,
  Info,
  Coins,
  Timer,
} from 'lucide-react';
import { assessAuditReport } from '../../engine/audit/reportSummary';

interface AuditReportVisualizerProps {
  report: AuditReportV4;
}

export const AuditReportVisualizer: React.FC<AuditReportVisualizerProps> = ({ report }) => {
  // Collapsible state for detailed probe executions (Default: collapsed)
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Calculate overall score (0 to 100) & key statistics
  const {
    score,
    passCount,
    totalCount,
    passRate,
    maxLatency,
    totalDurationMs,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
  } = useMemo(() => {
    const total = report.protocol.length;
    const passes = report.protocol.filter((p) => p.status === 'pass').length;
    const calculatedScore = total > 0 ? Math.round((passes / total) * 100) : 0;
    
    const latencies = report.protocol
      .map((p) => p.latencyMs || 0)
      .filter((l) => l > 0);
    const maxLat = latencies.length > 0 ? Math.max(...latencies) : 0;
    const protocolSumLatency = latencies.reduce((sum, l) => sum + l, 0);

    const dur = report.runtime?.totalDurationMs ?? (protocolSumLatency > 0 ? protocolSumLatency : undefined);
    const promptTok = report.runtime?.totalPromptTokens;
    const compTok = report.runtime?.totalCompletionTokens;
    const allTok = report.runtime?.totalTokens ?? (promptTok !== undefined || compTok !== undefined ? (promptTok || 0) + (compTok || 0) : undefined);

    return {
      score: calculatedScore,
      passCount: passes,
      totalCount: total,
      passRate: calculatedScore,
      maxLatency: maxLat,
      totalDurationMs: dur,
      totalPromptTokens: promptTok,
      totalCompletionTokens: compTok,
      totalTokens: allTok,
    };
  }, [report]);

  const assessment = useMemo(() => assessAuditReport(report), [report]);

  // 2. SVG Circular Gauge Specs
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Score Color Scheme
  const scoreColor =
    score >= 90 ? '#5db872' : score >= 60 ? '#e8a55a' : '#c64545';

  return (
    <div className="rounded-2xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-2xl space-y-0 font-sans animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* ── Top Header Banner ── */}
      <div className="p-6 sm:p-7 border-b border-[#2e2b27] bg-[#141413] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 text-xs font-semibold uppercase tracking-wide font-sans shadow-sm">
              {report.target.provider}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#faf9f5] tracking-tight font-sans">
              {report.target.model}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium text-slate-200 truncate max-w-xl">
            {report.target.baseUrl}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22201d] border border-[#3e3b35] text-xs sm:text-sm font-medium text-slate-100 shadow-sm font-sans">
            <Clock className="w-4 h-4 text-[#cc785c]" />
            <span>{new Date(report.testedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Hero Score & Key Metric Cards ── */}
      <div className="p-6 sm:p-8 space-y-6 border-b border-[#2e2b27] bg-[#181715]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Dynamic Circular Score Gauge (Borderless & 1.8x Enlarged) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4 px-2 text-center relative">
            {/* Subtle atmospheric ambient glow behind the free-standing circle */}
            <div
              className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ backgroundColor: scoreColor }}
            />

            <div className="relative flex items-center justify-center">
              <svg className="w-56 h-56 sm:w-68 sm:h-68 -rotate-90 transform" viewBox="0 0 128 128">
                {/* Background track circle */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="#252320"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Animated Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={scoreColor}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
                  }}
                />
              </svg>

              {/* Inner Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-sans font-bold text-5xl sm:text-6xl text-[#faf9f5] tracking-tight">
                  {score}%
                </span>
                <span className="text-xs sm:text-sm font-sans font-semibold tracking-wider text-slate-200 uppercase mt-2">
                   协议合规率
                </span>
              </div>
            </div>
          </div>

          {/* Right: 4 High-Density Telemetry Cards */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-5 font-sans">
            {/* Card 1: 协议覆盖 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2b27] space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-sans font-semibold text-slate-200">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#cc785c]" />
                  协议覆盖
                </span>
                <span className="text-[#faf9f5] font-bold">
                  {report.coverage.executed}/{report.coverage.total} 项
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-sans font-bold text-[#faf9f5]">
                {Math.round((report.coverage.executed / Math.max(report.coverage.total, 1)) * 100)}%
              </div>
              <div className="h-2 w-full bg-[#252320] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#cc785c] rounded-full transition-all duration-500"
                  style={{ width: `${(report.coverage.executed / Math.max(report.coverage.total, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Card 2: 探针通过率 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2b27] space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-sans font-semibold text-slate-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5db872]" />
                  探针通过率
                </span>
                <span className="text-[#5db872] font-semibold bg-[#5db872]/15 border border-[#5db872]/30 px-2 py-0.5 rounded text-xs">
                  {passCount}/{totalCount} 通过
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-sans font-bold text-[#faf9f5]">
                {passRate}%
              </div>
              <div className="h-2 w-full bg-[#252320] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5db872] rounded-full transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            {/* Card 3: Token 消耗 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2b27] space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-sans font-semibold text-slate-200">
                <Coins className="w-4 h-4 text-[#e8a55a]" />
                Token 消耗
              </div>
              <div className="text-2xl sm:text-3xl font-sans font-bold text-slate-100">
                {totalTokens !== undefined ? `${totalTokens.toLocaleString()} Tokens` : '--'}
              </div>
              <div className="text-xs font-sans font-normal text-slate-300">
                输入 {totalPromptTokens !== undefined ? totalPromptTokens.toLocaleString() : 0} · 输出 {totalCompletionTokens !== undefined ? totalCompletionTokens.toLocaleString() : 0}
              </div>
            </div>

            {/* Card 4: 总执行用时 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141413] border border-[#2e2b27] space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-sans font-semibold text-slate-200">
                <Timer className="w-4 h-4 text-[#5db8a6]" />
                总执行用时
              </div>
              <div className="text-2xl sm:text-3xl font-sans font-bold text-slate-100">
                {totalDurationMs !== undefined
                  ? (totalDurationMs >= 1000 ? `${(totalDurationMs / 1000).toFixed(1)}s` : `${totalDurationMs} ms`)
                  : (maxLatency > 0 ? (maxLatency >= 1000 ? `${(maxLatency / 1000).toFixed(1)}s` : `${maxLatency} ms`) : '--')}
              </div>
              <div className="text-xs font-sans font-normal text-slate-300">
                全套探针端到端总时间
              </div>
            </div>
          </div>
        </div>

        {/* ── 检测报告结论 (Verdict Banner below Metrics) ── */}
        <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col gap-4.5 font-sans ${
          assessment.tone === 'success'
            ? 'bg-[#10251b] border-[#2f754e]'
            : assessment.tone === 'danger'
            ? 'bg-[#2a1718] border-[#7f3435]'
            : assessment.tone === 'warning'
            ? 'bg-[#2a2116] border-[#805d2e]'
            : 'bg-[#1a1c1c] border-[#3a4744]'
        }`}>
          <div className="flex items-start gap-4">
            {assessment.tone === 'success' ? (
              <CheckCircle2 className="w-7 h-7 text-[#5db872] shrink-0 mt-0.5" />
            ) : assessment.tone === 'danger' ? (
              <XCircle className="w-7 h-7 text-[#c64545] shrink-0 mt-0.5" />
            ) : assessment.tone === 'warning' ? (
              <AlertTriangle className="w-7 h-7 text-[#e8a55a] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-7 h-7 text-[#5db8a6] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-sm font-sans font-bold uppercase text-slate-100 tracking-wide">
                  检测报告结论
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-sans font-semibold uppercase border shadow-sm ${
                    assessment.tone === 'success'
                      ? 'bg-[#5db872]/20 text-[#6ee7b7] border-[#5db872]/40'
                      : assessment.tone === 'danger'
                      ? 'bg-[#c64545]/20 text-[#fda4af] border-[#c64545]/40'
                      : assessment.tone === 'warning'
                      ? 'bg-[#e8a55a]/20 text-[#fcd34d] border-[#e8a55a]/40'
                      : 'bg-[#5db8a6]/20 text-[#8ee1d1] border-[#5db8a6]/40'
                  }`}
                >
                  {assessment.title}
                </span>
              </div>
              <p className="text-sm sm:text-base font-sans font-normal text-[#faf9f5] leading-relaxed">
                {assessment.explanation}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-xs sm:text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2.5 text-slate-200">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[#cc785c]" />
              <span className="leading-relaxed"><strong className="text-[#faf9f5] font-semibold">执行证据：</strong>{assessment.evidence}</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#5db8a6]" />
              <span className="leading-relaxed"><strong className="text-[#faf9f5] font-semibold">诊断建议：</strong>{assessment.nextStep}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Latency Waterfall Spectrum (探针延迟瀑布图谱) ── */}
      <div className="p-6 sm:p-8 border-b border-[#2e2b27] space-y-6 bg-[#141413] font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#cc785c]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#faf9f5] font-sans">
              探针执行延迟瀑布图谱 (Latency Spectrum)
            </h3>
          </div>
          <span className="text-xs sm:text-sm font-sans font-medium text-slate-200">
            峰值耗时: <span className="text-[#faf9f5] font-bold">{maxLatency} ms</span>
          </span>
        </div>

        <div className="space-y-4 font-sans">
          {report.protocol.map((probe) => {
            const lat = probe.latencyMs || 0;
            const percentage = maxLatency > 0 ? Math.max(6, Math.round((lat / maxLatency) * 100)) : 10;
            const isPass = probe.status === 'pass';
            const isFail = probe.status === 'fail';

            return (
              <div key={probe.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="font-semibold text-[#faf9f5] flex items-center gap-2.5 text-xs sm:text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPass ? 'bg-[#5db872]' : isFail ? 'bg-[#c64545]' : 'bg-[#e8a55a]'}`} />
                    {probe.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-100 text-xs sm:text-sm">{lat ? `${lat} ms` : '--'}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase border shadow-sm ${
                        isPass
                          ? 'bg-[#5db872]/15 text-[#5db872] border-[#5db872]/30'
                          : isFail
                          ? 'bg-[#c64545]/15 text-[#fda4af] border-[#c64545]/30'
                          : 'bg-[#e8a55a]/15 text-[#e8a55a] border-[#e8a55a]/30'
                      }`}
                    >
                      {probe.status}
                    </span>
                  </div>
                </div>

                {/* Waterfall Bar */}
                <div className="h-3.5 w-full bg-[#1b1a18] rounded-lg overflow-hidden border border-[#2e2b27] p-0.5">
                  <div
                    className={`h-full rounded-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isPass
                        ? 'bg-gradient-to-r from-[#cc785c] via-[#e8a55a] to-[#5db872]'
                        : isFail
                        ? 'bg-[#c64545]'
                        : 'bg-[#e8a55a]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: 具体执行检测 (Accordion with Smooth Grid Transition) ── */}
      <div className="bg-[#181715] font-sans">
        {/* Accordion Trigger Header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 sm:p-7 bg-[#181715] hover:bg-[#1f1e1b] transition-colors cursor-pointer select-none text-left"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-[#cc785c]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#faf9f5] font-sans">
              具体执行检测
            </h3>
            <span className="px-2.5 py-1 rounded-md bg-[#252320] border border-[#3e3b35] text-xs font-semibold text-slate-200 shadow-sm font-sans">
              {report.protocol.length} 项探针用例
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs sm:text-sm font-sans font-medium text-slate-200">
              {isExpanded ? '收起详情' : '展开查看全部详情'}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-[#cc785c] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Animated Accordion Body */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-6 sm:p-8 pt-0 sm:pt-0">
              <div className="overflow-x-auto rounded-xl border border-[#2e2b27] bg-[#141413] shadow-inner">
                <table className="w-full min-w-[760px] text-left text-sm font-sans table-fixed">
                  <thead className="bg-[#181715] border-b border-[#2e2b27] text-slate-100 uppercase font-bold tracking-wider text-xs">
                    <tr>
                      <th className="w-[24%] px-6 py-4">探针检测项</th>
                      <th className="w-[14%] px-6 py-4">检测状态</th>
                      <th className="w-[14%] px-6 py-4">响应耗时</th>
                      <th className="w-[16%] px-6 py-4">协议分类</th>
                      <th className="w-[32%] px-6 py-4">执行详情与证据</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e2b27]">
                    {report.protocol.map((evidence) => {
                      const isPass = evidence.status === 'pass';
                      const isFail = evidence.status === 'fail';

                      return (
                        <tr key={evidence.id} className="hover:bg-[#23211e]/70 transition">
                          <td className="px-6 py-4 font-semibold text-[#faf9f5] truncate text-xs sm:text-sm">
                            {evidence.title}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-semibold text-xs uppercase shadow-sm whitespace-nowrap border ${
                                isPass
                                  ? 'bg-[#5db872]/15 text-[#5db872] border-[#5db872]/30'
                                  : isFail
                                  ? 'bg-[#c64545]/15 text-[#fda4af] border-[#c64545]/30'
                                  : 'bg-[#e8a55a]/15 text-[#e8a55a] border-[#e8a55a]/30'
                              }`}
                            >
                              {evidence.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-100 font-bold whitespace-nowrap text-xs sm:text-sm">
                            {evidence.latencyMs ? `${evidence.latencyMs} ms` : '--'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#22201d] border border-[#3e3b35] text-slate-100 text-xs font-medium whitespace-nowrap font-sans">
                              {evidence.disposition === 'not_claimed'
                                ? '未声明'
                                : evidence.disposition === 'exploratory_test'
                                ? '探索性'
                                : '标准基线'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-sans text-xs sm:text-sm font-normal break-words leading-relaxed">
                            {evidence.detail}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
