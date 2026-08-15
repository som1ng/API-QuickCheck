import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { silentFetch } from '../../engine/transport/silentTransport';
import { buildChatCompletionsUrl } from '../../engine/transport/urlNormalizer';
import { parseKeyList, runBatchKeyTestPool } from '../../engine/batchKeys/keyPoolTester';
import { BatchKeySummary } from '../../types/batchKeys';
import { StatusBadge } from '../common/StatusBadge';
import { MetricCard } from '../common/MetricCard';
import { Play, CheckCircle2, XCircle, Copy, Check, Layers, RefreshCw, KeyRound, ChevronDown, Search } from 'lucide-react';

const POPULAR_MODEL_PRESETS = [
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'deepseek-reasoner',
  'deepseek-chat',
  'gpt-4o',
  'o1',
  'gemini-2.5-flash',
];

export const QuickPingTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels } = state;

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Single Ping state
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{
    ok: boolean;
    status: number;
    latencyMs: number;
    responseSnippet: string;
    errorMessage?: string;
    errorCategory?: string;
  } | null>(null);

  // Batch Ping state
  const [batchRawKeys, setBatchRawKeys] = useState<string>('');
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchSummary, setBatchSummary] = useState<BatchKeySummary | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [copiedActive, setCopiedActive] = useState<boolean>(false);

  const handleSinglePing = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先在顶部配置中转站 Base URL 和 API Key');
      return;
    }

    setIsPinging(true);
    setPingResult(null);

    const chatUrl = buildChatCompletionsUrl(config.baseUrl);

    try {
      const res = await silentFetch<any>({
        url: chatUrl,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: config.selectedModel,
          messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
          max_tokens: 30,
        },
        timeoutMs: 6000,
      });

      const snippet = res.data?.choices?.[0]?.message?.content || res.rawText.slice(0, 150);

      setPingResult({
        ok: res.ok,
        status: res.status,
        latencyMs: res.latencyMs,
        responseSnippet: snippet,
        errorMessage: res.errorMessage,
        errorCategory: res.errorCategory,
      });
    } catch (err: unknown) {
      setPingResult({
        ok: false,
        status: 0,
        latencyMs: 0,
        responseSnippet: '',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleStartBatchTest = async () => {
    const keys = parseKeyList(batchRawKeys);
    if (keys.length === 0) {
      alert('请输入至少一个有效的 API Key（每行一个）');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ total: keys.length, completed: 0 });
    setBatchSummary(null);

    try {
      const summary = await runBatchKeyTestPool(
        config.baseUrl,
        keys,
        config.selectedModel,
        5,
        (_item, completed) => {
          setBatchProgress({ total: keys.length, completed });
        }
      );
      setBatchSummary(summary);
    } catch (err: unknown) {
      alert(`批量检测异常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleCopyActiveKeys = async () => {
    if (!batchSummary) return;
    const activeKeys = batchSummary.results
      .filter((r) => r.status === 'active')
      .map((r) => r.key)
      .join('\n');

    try {
      await navigator.clipboard.writeText(activeKeys);
      setCopiedActive(true);
      setTimeout(() => setCopiedActive(false), 2000);
    } catch {
      // ignore
    }
  };

  const filteredRemoteModels = availableModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const avgLatency = batchSummary && batchSummary.results.length > 0
    ? Math.round(batchSummary.results.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / batchSummary.results.length)
    : 0;

  const validityRate = batchSummary && batchSummary.total > 0
    ? Math.round((batchSummary.activeCount / batchSummary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5db872]/15 border border-[#5db872]/30 flex items-center justify-center text-[#5db872]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
                极速单测与多 Key 批量清洗
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
              单 Key 即时排错连通性诊断，或粘贴多行 Key 多线程批量清洗过滤。
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#23211e] p-1 rounded-lg border border-[#2e2b27]">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'single'
                  ? 'bg-[#cc785c] text-[#faf9f5] font-semibold'
                  : 'text-[#9c9689] hover:text-[#faf9f5]'
              }`}
            >
              单 Key 测试
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                mode === 'batch'
                  ? 'bg-[#cc785c] text-[#faf9f5] font-semibold'
                  : 'text-[#9c9689] hover:text-[#faf9f5]'
              }`}
            >
              批量 Key 验货
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection Combobox */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#faf9f5] flex items-center gap-2">
            <Layers className="w-[18px] h-[18px] text-[#cc785c]" />
            <span>测试目标模型</span>
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

      {/* Mode 1: Single Key Ping */}
      {mode === 'single' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="text-sm font-mono text-[#9c9689]">
                端点: <span className="text-[#cc785c] font-semibold">{config.baseUrl}</span> | 目标模型: <span className="text-[#faf9f5] font-semibold">{config.selectedModel}</span>
              </div>

              <button
                onClick={handleSinglePing}
                disabled={isPinging}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-6 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50"
              >
                {isPinging ? (
                  <>
                    <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                    <span>Ping 测试中...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                    <span>发送即时 Ping</span>
                  </>
                )}
              </button>
            </div>

            {/* Ping Result Card */}
            {pingResult && (
              <div className="mt-4 rounded-lg border border-[#2e2b27] bg-[#23211e] p-5 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pingResult.ok ? (
                      <span className="p-2 rounded-lg bg-[#5db872]/10 text-[#5db872] border border-[#5db872]/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="p-2 rounded-lg bg-[#c64545]/10 text-[#c64545] border border-[#c64545]/20">
                        <XCircle className="w-5 h-5" />
                      </span>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-[#faf9f5]">
                        {pingResult.ok ? '连接正常 (HTTP 200 OK)' : `请求未成功 (HTTP ${pingResult.status})`}
                      </h4>
                      <p className="text-xs text-[#9c9689]">
                        耗时: <span className="font-mono text-[#faf9f5]">{pingResult.latencyMs} ms</span>
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={pingResult.ok ? 'available' : (pingResult.errorCategory as any) || 'server_error'} />
                </div>

                {pingResult.errorMessage && (
                  <div className="p-3 rounded-lg bg-[#c64545]/10 border border-[#c64545]/20 text-xs text-[#c64545]">
                    {pingResult.errorMessage}
                  </div>
                )}

                {pingResult.responseSnippet && (
                  <div className="space-y-1">
                    <span className="text-xs text-[#9c9689]">响应摘要 (Response Snippet):</span>
                    <pre className="p-3 rounded-lg bg-[#141413] border border-[#2e2b27] font-mono text-xs text-[#faf9f5] overflow-x-auto whitespace-pre-wrap">
                      {pingResult.responseSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Batch Keys Test */}
      {mode === 'batch' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#faf9f5] mb-2">
                粘贴待清洗的 API Key 列表 (每行一个，自动去重过滤空行)
              </label>
              <textarea
                rows={5}
                value={batchRawKeys}
                onChange={(e) => setBatchRawKeys(e.target.value)}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxx&#10;sk-proj-yyyyyyyyyyyyyyyyyyyy&#10;sk-proj-zzzzzzzzzzzzzzzzzzzz"
                className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] p-3.5 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <span className="text-xs text-[#9c9689] font-mono">
                当前解析到: <span className="text-[#faf9f5] font-semibold">{parseKeyList(batchRawKeys).length}</span> 个候选 Key
              </span>

              <button
                onClick={handleStartBatchTest}
                disabled={isBatchRunning}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-6 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50"
              >
                {isBatchRunning ? (
                  <>
                    <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                    <span>批量并发检验中 ({batchProgress.completed}/{batchProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                    <span>开始批量验货清洗</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Batch Test Summary */}
          {batchSummary && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                  label="有效可用 Key"
                  value={batchSummary.activeCount}
                  unit={`/ ${batchSummary.total}`}
                  status="success"
                  icon={<CheckCircle2 className="w-4 h-4 text-[#5db872]" />}
                />
                <MetricCard
                  label="有效可用率"
                  value={`${validityRate}%`}
                  status={validityRate > 80 ? 'success' : validityRate > 50 ? 'warning' : 'error'}
                  icon={<KeyRound className="w-4 h-4 text-[#cc785c]" />}
                />
                <MetricCard
                  label="平均延迟"
                  value={avgLatency}
                  unit="ms"
                  status="neutral"
                  icon={<RefreshCw className="w-4 h-4 text-[#9c9689]" />}
                />
                <div className="flex items-center justify-center p-4 rounded-xl border border-[#2e2b27] bg-[#1b1a18]">
                  <button
                    onClick={handleCopyActiveKeys}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg bg-[#23211e] hover:bg-[#2b2926] border border-[#2e2b27] text-xs text-[#faf9f5] transition"
                  >
                    {copiedActive ? (
                      <>
                        <Check className="w-5 h-5 text-[#5db872]" />
                        <span className="text-[#5db872] font-semibold">已复制有效 Key!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-[#cc785c]" />
                        <span>一键导出有效 Keys ({batchSummary.activeCount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Batch Keys Table */}
              <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
                <div className="p-4 border-b border-[#2e2b27] flex items-center justify-between">
                  <h3 className="font-serif-display text-lg font-medium text-[#faf9f5]">
                    批量清洗结果详单
                  </h3>
                  <span className="text-xs text-[#9c9689] font-mono">共 {batchSummary.results.length} 条</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#23211e] text-xs text-[#9c9689] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">API Key (令牌)</th>
                        <th className="px-4 py-3">健康状态</th>
                        <th className="px-4 py-3">HTTP 状态</th>
                        <th className="px-4 py-3">延迟</th>
                        <th className="px-4 py-3">诊断信息</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e2b27] font-mono text-xs">
                      {batchSummary.results.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#23211e]/50 transition">
                          <td className="px-4 py-3 text-[#9c9689]">#{idx + 1}</td>
                          <td className="px-4 py-3 text-[#faf9f5] font-semibold">{item.maskedKey}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 text-[#d4cebe]">{item.httpStatus || '-'}</td>
                          <td className="px-4 py-3 text-[#faf9f5]">{item.latencyMs} ms</td>
                          <td className="px-4 py-3 text-[#9c9689] truncate max-w-xs">{item.errorMessage || '正常'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
