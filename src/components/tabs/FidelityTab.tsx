import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runFidelityAudit } from '../../engine/fidelity/fidelityScorer';
import { FidelityReport } from '../../types/fidelity';
import { StatusBadge } from '../common/StatusBadge';
import { ShieldCheck, Play, Loader2, CheckCircle2, XCircle, Clock, Check, Sparkles } from 'lucide-react';

export const FidelityTab: React.FC = () => {
  const { config } = useApp().state;

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
    setProgressText('正在初始化 Claude / OpenAI 深度鉴别引擎...');
    setProgressPercent(5);

    try {
      const result = await runFidelityAudit(
        config.baseUrl,
        config.apiKey,
        config.selectedModel,
        (step, pct) => {
          setProgressText(step);
          setProgressPercent(pct);
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

  return (
    <div className="space-y-6">
      {/* Top Action Card in Claude Warm Aesthetic */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-serif-display text-xl font-medium text-[#faf9f5] tracking-tight">
                真伪模型与降级掺假深度鉴别
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-[#9c9689] max-w-2xl leading-relaxed">
              基于 Anthropic 官方服务端私钥签名 (Thinking Signature)、DeepSeek/o1 原生思维链协议与元认知冲突探针，深度穿透中转站真实身份。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-[#9c9689] bg-[#23211e] px-3.5 py-2 rounded-lg border border-[#2e2b27]">
              目标: <span className="text-[#faf9f5] font-semibold">{config.selectedModel}</span>
            </div>

            <button
              onClick={handleStartAudit}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-4 py-2 text-xs font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>鉴别中 ({progressPercent}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-[#faf9f5]" />
                  <span>开始真伪鉴别</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mt-5 space-y-2 pt-4 border-t border-[#2e2b27]">
            <div className="flex justify-between text-xs text-[#9c9689]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#cc785c]" />
                {progressText}
              </span>
              <span className="font-mono text-[#faf9f5]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#23211e]">
              <div
                className="h-full bg-[#cc785c] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Dashboard */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Verdict Card with Veridrop/Claude Split Layout */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
            {/* Header Title & Tags */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#2e2b27]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#9c9689] font-semibold mb-1">
                  体检核验报告
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif-display text-2xl font-medium text-[#faf9f5]">
                    {report.targetModel}
                  </h3>
                  <StatusBadge status={report.level} size="md" />
                </div>
              </div>

              <div className="text-xs text-[#9c9689] font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>耗时 {report.probes.reduce((a, b) => a + b.latencyMs, 0)}ms</span>
              </div>
            </div>

            {/* Split Content: Left Score Ring + Right Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
              {/* Left Column: Score Gauge (4 cols) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-[#23211e] border border-[#2e2b27] text-center space-y-3">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#2e2b27]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={report.overallScore >= 80 ? 'text-[#5db872]' : report.overallScore >= 50 ? 'text-[#e8a55a]' : 'text-[#c64545]'}
                      strokeDasharray={`${report.overallScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-[#faf9f5]">
                      {report.overallScore}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#9c9689]">
                      保真指数
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#faf9f5]">
                    {report.overallScore >= 90 ? '高保真官方真品' : report.overallScore >= 70 ? '协议表现良好' : '疑似降级或掺假'}
                  </div>
                  <p className="text-[11px] text-[#9c9689] mt-1 line-clamp-2 px-2">
                    {report.summary}
                  </p>
                </div>
              </div>

              {/* Right Column: Key Verification Checklist (8 cols) */}
              <div className="md:col-span-8 space-y-2.5">
                {/* 1. Claude Thinking Signature */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-xs">
                  <span className="font-medium text-[#d4cebe]">Anthropic 官方私钥加密签名 (Thinking Signature)</span>
                  {report.signatureResult?.isApplicable ? (
                    report.signatureResult.passed ? (
                      <span className="text-[#5db872] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 100% 官方真品通过
                      </span>
                    ) : (
                      <span className="text-[#c64545] font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 签名缺失 (疑似套壳)
                      </span>
                    )
                  ) : (
                    <span className="text-[#9c9689]">非原生 messages 协议 (标准通过)</span>
                  )}
                </div>

                {/* 2. Reasoning Protocol */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-xs">
                  <span className="font-medium text-[#d4cebe]">原生思维链协议流 (Reasoning Stream Delta)</span>
                  {report.reasoningResult?.hasReasoningStream ? (
                    <span className="text-[#5db872] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 原生思考链通过
                    </span>
                  ) : (
                    <span className="text-[#9c9689]">
                      {report.reasoningResult?.passed ? '标准文本流 (通过)' : '未捕获思维链'}
                    </span>
                  )}
                </div>

                {/* 3. Probes List Items */}
                {report.probes.map((probe, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-xs">
                    <span className="text-[#d4cebe]">{probe.title}</span>
                    {probe.passed ? (
                      <span className="text-[#5db872] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 通过
                      </span>
                    ) : (
                      <span className="text-[#c64545] font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 未通过
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Probes Detailed Log Table */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
            <div className="p-4 border-b border-[#2e2b27] flex items-center justify-between">
              <h4 className="font-serif-display text-base font-medium text-[#faf9f5]">
                探针实测明细与决策证据
              </h4>
              <span className="text-xs text-[#9c9689] font-mono">共执行 {report.probes.length} 项探针</span>
            </div>

            <div className="divide-y divide-[#2e2b27]">
              {report.probes.map((probe, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#23211e]/50 transition">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#9c9689]">#{idx + 1}</span>
                      <span className="text-xs font-medium text-[#faf9f5]">{probe.title}</span>
                      {probe.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#5db872]/10 text-[#5db872] border border-[#5db872]/20">
                          通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#c64545]/10 text-[#c64545] border border-[#c64545]/20">
                          未达标
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9c9689] leading-relaxed">{probe.details}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-[#9c9689] shrink-0">
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
