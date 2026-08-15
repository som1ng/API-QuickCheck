import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { runBenchmarkRound, aggregateBenchmarkSummary } from '../../engine/benchmark/speedTester';
import { BenchmarkRoundResult, BenchmarkSummary } from '../../types/benchmark';
import { MetricCard } from '../common/MetricCard';
import { Play, Loader2, Gauge, Activity, Radio, CheckCircle2, XCircle, Terminal } from 'lucide-react';

export const BenchmarkTab: React.FC = () => {
  const { config } = useApp().state;

  const [roundsCount, setRoundsCount] = useState<number>(3);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [liveText, setLiveText] = useState<string>('');
  const [liveTps, setLiveTps] = useState<number>(0);
  const [liveTtft, setLiveTtft] = useState<number>(0);
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStartBenchmark = async () => {
    if (!config.apiKey || !config.baseUrl) {
      alert('请先在顶部配置中转站 Base URL 和 API Key');
      return;
    }

    setIsRunning(true);
    setLiveText('');
    setLiveTps(0);
    setLiveTtft(0);
    setSummary(null);

    abortControllerRef.current = new AbortController();
    const roundResults: BenchmarkRoundResult[] = [];

    try {
      for (let r = 1; r <= roundsCount; r++) {
        setCurrentRound(r);
        setLiveText(`[ 测试轮次 ${r}/${roundsCount} 开始... ]\n`);

        const roundRes = await runBenchmarkRound(
          config.baseUrl,
          config.apiKey,
          config.selectedModel,
          r,
          (text, tps, ttft) => {
            setLiveText(text);
            setLiveTps(tps);
            setLiveTtft(ttft);
          },
          abortControllerRef.current?.signal
        );

        roundResults.push(roundRes);

        if (r < roundsCount) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }

      const finalSummary = aggregateBenchmarkSummary(config.selectedModel, roundResults);
      setSummary(finalSummary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`测速过程异常: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e8a55a]/15 border border-[#e8a55a]/30 flex items-center justify-center text-[#e8a55a]">
                <Gauge className="w-4 h-4" />
              </div>
              <h2 className="font-serif-display text-xl font-medium text-[#faf9f5] tracking-tight">
                流式测速与性能基准
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-[#9c9689] max-w-2xl leading-relaxed">
              高精度实测首字响应延迟 (TTFT)、流式生成吞吐速率 (TPS) 与网络 Chunk 抖动方差，评估中转站上游拥塞与稳定性。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#23211e] px-3.5 py-2 rounded-lg border border-[#2e2b27] text-xs text-[#d4cebe]">
              <span>轮数:</span>
              <select
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                disabled={isRunning}
                className="bg-transparent text-[#faf9f5] font-medium focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-[#1b1a18]">1 轮单测</option>
                <option value={3} className="bg-[#1b1a18]">3 轮均值</option>
                <option value={5} className="bg-[#1b1a18]">5 轮压力测试</option>
              </select>
            </div>

            {isRunning ? (
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 rounded-lg bg-[#c64545] hover:bg-[#a93a3a] px-4 py-2 text-xs font-medium text-[#faf9f5] shadow-sm transition"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>停止测试 ({currentRound}/{roundsCount})</span>
              </button>
            ) : (
              <button
                onClick={handleStartBenchmark}
                className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-4 py-2 text-xs font-medium text-[#faf9f5] shadow-sm transition"
              >
                <Play className="w-3.5 h-3.5 fill-[#faf9f5]" />
                <span>开始测速</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="TTFT (首字响应延迟)"
          value={isRunning ? liveTtft || '-' : summary ? summary.avgTtftMs : '-'}
          unit="ms"
          subValue={summary ? `最优: ${summary.minTtftMs}ms | 最慢: ${summary.maxTtftMs}ms` : '首个数据块到达耗时'}
          icon={<Gauge className="w-4 h-4 text-[#e8a55a]" />}
          status={
            summary
              ? summary.avgTtftMs < 600
                ? 'success'
                : summary.avgTtftMs < 1500
                ? 'warning'
                : 'error'
              : 'neutral'
          }
          highlight={isRunning}
        />

        <MetricCard
          label="TPS (生成速率)"
          value={isRunning ? liveTps || '-' : summary ? summary.avgTps : '-'}
          unit="tokens/s"
          subValue={summary ? `峰值: ${summary.maxTps} tokens/s (估算值)` : '实时流式词元吞吐'}
          icon={<Activity className="w-4 h-4 text-[#5db872]" />}
          status={
            summary
              ? summary.avgTps > 50
                ? 'success'
                : summary.avgTps > 20
                ? 'warning'
                : 'error'
              : 'neutral'
          }
          highlight={isRunning}
        />

        <MetricCard
          label="流式稳定性 (Jitter)"
          value={
            summary
              ? summary.stabilityScore === 'excellent'
                ? '极稳 (平滑)'
                : summary.stabilityScore === 'good'
                ? '良好'
                : '波动较大'
              : isRunning
              ? '测算中...'
              : '-'
          }
          subValue={summary ? `Chunk 到达方差: ${summary.avgJitterVariance}` : '数据块到达平稳度'}
          icon={<Radio className="w-4 h-4 text-[#cc785c]" />}
          status={
            summary
              ? summary.stabilityScore === 'excellent' || summary.stabilityScore === 'good'
                ? 'success'
                : 'warning'
              : 'neutral'
          }
        />
      </div>

      {/* Live Typewriter Output */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#141413] p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#2e2b27] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#9c9689]" />
            <span className="text-xs font-mono text-[#d4cebe] font-medium">
              流式打字机监视器 (Streaming Terminal)
            </span>
          </div>
          {isRunning && (
            <span className="text-xs font-mono text-[#e8a55a]">
              第 {currentRound}/{roundsCount} 轮输出中...
            </span>
          )}
        </div>

        <div className="min-h-[120px] max-h-[220px] overflow-y-auto font-mono text-xs text-[#faf9f5] leading-relaxed whitespace-pre-wrap">
          {liveText || (
            <span className="text-[#9c9689]/60 italic">
              点击上方「开始测速」后，此处将实时展示逐字生成的文本流与打字机效果...
            </span>
          )}
        </div>
      </div>

      {/* Multi-round Table */}
      {summary && summary.rounds.length > 0 && (
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
          <div className="p-4 border-b border-[#2e2b27] flex items-center justify-between">
            <h4 className="font-serif-display text-base font-medium text-[#faf9f5]">多轮测速历史明细</h4>
            <span className="text-xs text-[#9c9689] font-mono">模型: {summary.model}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d4cebe]">
              <thead className="border-b border-[#2e2b27] bg-[#23211e] text-[#9c9689] font-mono">
                <tr>
                  <th className="p-3 pl-4">轮次</th>
                  <th className="p-3">状态</th>
                  <th className="p-3">TTFT (首字)</th>
                  <th className="p-3">TPS (吞吐)</th>
                  <th className="p-3">总耗时</th>
                  <th className="p-3">生成 Token</th>
                  <th className="p-3 pr-4">稳定性方差</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2b27] font-mono">
                {summary.rounds.map((round) => (
                  <tr key={round.round} className="hover:bg-[#23211e]/50 transition">
                    <td className="p-3 pl-4 text-[#faf9f5] font-medium">第 {round.round} 轮</td>
                    <td className="p-3">
                      {round.status === 'completed' ? (
                        <span className="text-[#5db872] inline-flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 成功
                        </span>
                      ) : (
                        <span className="text-[#c64545] inline-flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> 失败
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-[#e8a55a]">{round.ttftMs} ms</td>
                    <td className="p-3 font-semibold text-[#5db872]">{round.tps} t/s</td>
                    <td className="p-3 text-[#9c9689]">{round.totalDurationMs} ms</td>
                    <td className="p-3 text-[#9c9689]">{round.outputTokens}</td>
                    <td className="p-3 pr-4 text-[#9c9689]">{round.jitterVariance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
