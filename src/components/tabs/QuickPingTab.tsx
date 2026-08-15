import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { silentFetch } from '../../engine/transport/silentTransport';
import { buildChatCompletionsUrl } from '../../engine/transport/urlNormalizer';
import { parseKeyList, runBatchKeyTestPool } from '../../engine/batchKeys/keyPoolTester';
import { BatchKeySummary } from '../../types/batchKeys';
import { StatusBadge } from '../common/StatusBadge';
import { MetricCard } from '../common/MetricCard';
import { Play, CheckCircle2, XCircle, Copy, Check, Layers, RefreshCw, KeyRound } from 'lucide-react';

export const QuickPingTab: React.FC = () => {
  const { config } = useApp().state;

  const [mode, setMode] = useState<'single' | 'batch'>('single');

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

                  <StatusBadge status={pingResult.ok ? 'available' : (pingResult.errorCategory as any) || 'invalid'} />
                </div>

                {pingResult.ok ? (
                  <div className="rounded-lg bg-[#141413] border border-[#2e2b27] p-3.5 font-mono text-sm text-[#5db872]">
                    <div className="text-xs text-[#9c9689] mb-1 font-mono">模型返回:</div>
                    "{pingResult.responseSnippet}"
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#c64545]/10 border border-[#c64545]/20 p-3.5 text-sm text-[#faf9f5] space-y-2">
                    <div className="font-semibold text-[#c64545]">错误原因分析:</div>
                    <p className="text-[#faf9f5] leading-relaxed font-mono">
                      {pingResult.errorMessage || '未知网络错误'}
                    </p>
                    <div className="text-xs text-[#9c9689] pt-2 border-t border-[#c64545]/20">
                      • 401: API Key 填写有误或已被吊销；<br />
                      • 402/429: 账户欠费或当前分钟频次超限；<br />
                      • 404: 中转站无此模型映射名。
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Batch Keys Cleaner */}
      {mode === 'batch' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#faf9f5] mb-1.5">
                粘贴待测试的 API Key 列表（每行一个，自动去重）：
              </label>
              <textarea
                rows={5}
                value={batchRawKeys}
                onChange={(e) => setBatchRawKeys(e.target.value)}
                placeholder={`sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx\nsk-proj-yyyyyyyyyyyyyyyyyyyyyyyy`}
                className="w-full rounded-lg border border-[#2e2b27] bg-[#23211e] p-3 font-mono text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-[#9c9689] font-mono">
                已识别有效格式: <span className="text-[#faf9f5] font-semibold">{parseKeyList(batchRawKeys).length}</span> 个
              </div>

              <button
                onClick={handleStartBatchTest}
                disabled={isBatchRunning || parseKeyList(batchRawKeys).length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-5 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50"
              >
                {isBatchRunning ? (
                  <>
                    <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                    <span>检测中 ({batchProgress.completed}/{batchProgress.total})</span>
                  </>
                ) : (
                  <>
                    <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                    <span>开始批量检测</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Batch Metrics Cards */}
          {batchSummary && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                  label="有效 Key (可用)"
                  value={batchSummary.activeCount}
                  unit="个"
                  status="success"
                  icon={<CheckCircle2 className="w-5 h-5 text-[#5db872]" />}
                />
                <MetricCard
                  label="额度不足 / 欠费"
                  value={batchSummary.exhaustedCount}
                  unit="个"
                  status="warning"
                />
                <MetricCard
                  label="无效 / 错误 Key"
                  value={batchSummary.invalidCount}
                  unit="个"
                  status="error"
                />
                <MetricCard
                  label="总检测数"
                  value={batchSummary.total}
                  unit="个"
                  status="neutral"
                  icon={<Layers className="w-5 h-5 text-[#9c9689]" />}
                />
              </div>

              {/* Batch Table */}
              <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
                <div className="p-4 border-b border-[#2e2b27] flex items-center justify-between">
                  <h4 className="font-serif-display text-lg font-medium text-[#faf9f5]">批量验货结果列表</h4>
                  <button
                    onClick={handleCopyActiveKeys}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#5db872]/30 bg-[#5db872]/10 px-4 py-2 text-sm font-medium text-[#5db872] hover:bg-[#5db872]/20 transition"
                  >
                    {copiedActive ? (
                      <>
                        <Check className="w-[18px] h-[18px]" />
                        <span>已复制 {batchSummary.activeCount} 个有效 Key</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-[18px] h-[18px]" />
                        <span>导出有效 Key 列表</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-left text-sm text-[#d4cebe]">
                    <thead className="border-b border-[#2e2b27] bg-[#23211e] text-[#9c9689] font-mono sticky top-0 bg-[#1b1a18]/95 backdrop-blur-md">
                      <tr>
                        <th className="p-3 pl-4">序号</th>
                        <th className="p-3">Key 脱敏识别</th>
                        <th className="p-3">状态</th>
                        <th className="p-3">HTTP 响应</th>
                        <th className="p-3 pr-4">响应延迟</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e2b27] font-mono">
                      {batchSummary.results.map((item) => (
                        <tr key={item.index} className="hover:bg-[#23211e]/50 transition">
                          <td className="p-3 pl-4 text-[#9c9689]">#{item.index}</td>
                          <td className="p-3 font-medium text-[#faf9f5]">{item.maskedKey}</td>
                          <td className="p-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="p-3 text-[#9c9689]">
                            {item.httpStatus ? `HTTP ${item.httpStatus}` : '-'}
                          </td>
                          <td className="p-3 pr-4 text-[#9c9689]">
                            {item.latencyMs ? `${item.latencyMs} ms` : '-'}
                          </td>
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
