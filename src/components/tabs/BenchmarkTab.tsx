import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { runBenchmarkRound, aggregateBenchmarkSummary } from '../../engine/benchmark/speedTester';
import { BenchmarkRoundResult, BenchmarkSummary } from '../../types/benchmark';
import { MetricCard } from '../common/MetricCard';
import { Play, Loader2, Gauge, Activity, Radio, CheckCircle2, XCircle, Terminal, Layers, ChevronDown, Search } from 'lucide-react';

const POPULAR_MODEL_PRESETS = [
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'deepseek-reasoner',
  'deepseek-chat',
  'gpt-4o',
  'o1',
  'gemini-2.5-flash',
];

export const BenchmarkTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels } = state;

  const [roundsCount, setRoundsCount] = useState<number>(3);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [liveText, setLiveText] = useState<string>('');
  const [liveTps, setLiveTps] = useState<number>(0);
  const [liveTtft, setLiveTtft] = useState<number>(0);
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

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

  const filteredRemoteModels = availableModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e8a55a]/15 border border-[#e8a55a]/30 flex items-center justify-center text-[#e8a55a]">
                <Gauge className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
                流式测速与性能基准
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
              高精度实测首字响应延迟 (TTFT)、流式生成吞吐速率 (TPS) 与网络 Chunk 抖动方差，评估中转站上游拥塞与稳定性。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#23211e] px-4 py-2.5 rounded-lg border border-[#2e2b27] text-sm text-[#d4cebe]">
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#c64545] hover:bg-[#a93a3a] px-5 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition"
              >
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span>停止测试 ({currentRound}/{roundsCount})</span>
              </button>
            ) : (
              <button
                onClick={handleStartBenchmark}
                className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-5 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition"
              >
                <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                <span>开始测速</span>
              </button>
            )}
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="pt-4 border-t border-[#2e2b27] relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
              <Layers className="w-[18px] h-[18px] text-[#cc785c]" />
              <span>测速目标模型</span>
            </label>
            {availableModels.length > 0 && (
              <span className="text-xs text-[#5db872] font-mono">
                已探测到 {availableModels.length} 个可用模型
              </span>
            )}
          </div>

          <div className="relative">
            <div className="flex rounded-lg border border-[#2e2b27] bg-[#23211e] focus-within:border-[#cc785c] transition">
              <input
                type="text"
                value={config.selectedModel}
                onChange={(e) => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
                placeholder="例如: gpt-4o / deepseek-chat"
                className="w-full bg-transparent px-4 py-2.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="px-3.5 text-[#9c9689] hover:text-[#faf9f5] transition border-l border-[#2e2b27]"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Dropdown */}
            {showModelDropdown && (
              <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[#2e2b27] bg-[#23211e] p-2.5 shadow-2xl z-50 max-h-80 overflow-y-auto space-y-2">
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
                    常用热门模型
                  </div>
                  {POPULAR_MODEL_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SET_SELECTED_MODEL', payload: m });
                        setShowModelDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#2b2926] text-[#faf9f5] transition font-mono truncate"
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {availableModels.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-[#5db872] px-2.5 py-1.5 border-t border-[#2e2b27] mt-1 pt-2">
                      中转站可用模型 ({availableModels.length})
                    </div>
                    {filteredRemoteModels.slice(0, 40).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'SET_SELECTED_MODEL', payload: m.id });
                          setShowModelDropdown(false);
                        }}
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
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="首字生成延迟 (TTFT)"
          value={isRunning ? liveTtft : (summary?.avgTtftMs || '-')}
          unit="ms"
          status={
            summary && summary.avgTtftMs < 600
              ? 'success'
              : summary && summary.avgTtftMs < 1500
              ? 'warning'
              : summary
              ? 'error'
              : 'neutral'
          }
          icon={<Radio className="w-4 h-4 text-[#9c9689]" />}
        />
        <MetricCard
          label="流式生成速度 (TPS)"
          value={isRunning ? liveTps : (summary?.avgTps || '-')}
          unit="tokens/s"
          status={
            summary && summary.avgTps > 40
              ? 'success'
              : summary && summary.avgTps > 15
              ? 'warning'
              : summary
              ? 'error'
              : 'neutral'
          }
          icon={<Activity className="w-4 h-4 text-[#cc785c]" />}
        />
        <MetricCard
          label="网络 Chunk 抖动"
          value={summary?.avgJitterVariance || '-'}
          unit="ms (方差)"
          status={
            summary && summary.avgJitterVariance < 100
              ? 'success'
              : summary && summary.avgJitterVariance < 300
              ? 'warning'
              : summary
              ? 'error'
              : 'neutral'
          }
          icon={<Gauge className="w-4 h-4 text-[#5db872]" />}
        />
      </div>

      {/* Live Stream Terminal */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#141413] p-5 shadow-inner">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2b27] text-sm text-[#9c9689]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#cc785c]" />
            <span className="font-mono text-[#d4cebe]">实时流式控制台 (Streaming Terminal)</span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#5db872]">
              <span className="h-2 w-2 rounded-full bg-[#5db872] animate-ping" />
              <span>接收 Chunk 中...</span>
            </div>
          )}
        </div>

        <div className="mt-3.5 max-h-56 overflow-y-auto font-mono text-sm leading-relaxed text-[#faf9f5] whitespace-pre-wrap select-text">
          {liveText || (
            <span className="text-[#9c9689]/60 italic">点击“开始测速”按钮启动流式性能探针...</span>
          )}
        </div>
      </div>

      {/* Benchmark Summary Table */}
      {summary && (
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
          <div className="p-4 border-b border-[#2e2b27] flex items-center justify-between">
            <h3 className="font-serif-display text-lg font-medium text-[#faf9f5]">
              多轮测试详单统计
            </h3>
            <span className="text-xs text-[#9c9689] font-mono">
              测试模型: {summary.model}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#23211e] text-xs text-[#9c9689] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">轮次</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">首字延迟 (TTFT)</th>
                  <th className="px-4 py-3">生成速度 (TPS)</th>
                  <th className="px-4 py-3">总耗时</th>
                  <th className="px-4 py-3">生成 Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2b27] font-mono text-xs">
                {summary.rounds.map((round) => (
                  <tr key={round.round} className="hover:bg-[#23211e]/50 transition">
                    <td className="px-4 py-3 font-semibold text-[#faf9f5]">#{round.round}</td>
                    <td className="px-4 py-3">
                      {round.status === 'completed' ? (
                        <span className="text-[#5db872] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 成功
                        </span>
                      ) : (
                        <span className="text-[#c64545] flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> 失败
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#faf9f5]">{round.ttftMs} ms</td>
                    <td className="px-4 py-3 text-[#cc785c] font-semibold">{round.tps} t/s</td>
                    <td className="px-4 py-3 text-[#d4cebe]">{round.totalDurationMs} ms</td>
                    <td className="px-4 py-3 text-[#d4cebe]">{round.outputTokens}</td>
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
