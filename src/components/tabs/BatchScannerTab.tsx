import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels, runBatchScanPool } from '../../engine/scanner/batchScanner';
import { ModelCheckItem } from '../../types/scanner';
import { StatusBadge } from '../common/StatusBadge';
import { ListFilter, Play, RefreshCw, Search, Loader2 } from 'lucide-react';

export const BatchScannerTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ModelCheckItem>>({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });

  const handleFetchModels = async (): Promise<{ id: string; name: string }[]> => {
    if (!config.baseUrl || !config.apiKey) {
      return [];
    }

    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey, config.platformId);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !models.some((m) => m.id === config.selectedModel)) {
        dispatch({ type: 'SET_SELECTED_MODEL', payload: models[0].id });
      }
      return models;
    } catch (err: unknown) {
      alert(`获取模型列表失败: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING_MODELS', payload: false });
    }
  };

  const handleStartBatchScan = async () => {
    const models = availableModels.length > 0 ? availableModels : await handleFetchModels();

    if (models.length === 0) return;

    setIsScanning(true);
    setScanProgress({ total: models.length, completed: 0 });
    const resultsMap: Record<string, ModelCheckItem> = {};

    try {
      await runBatchScanPool(
        config.baseUrl,
        config.apiKey,
        models,
        5,
        (item, completed) => {
          resultsMap[item.id] = item;
          setScanResults({ ...resultsMap });
          setScanProgress({ total: models.length, completed });
        }
      );
    } catch (err: unknown) {
      alert(`批量巡检异常: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredModels = availableModels.filter((m) => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterProvider === 'all') return true;
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3');
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude');
    if (filterProvider === 'deepseek') return m.id.toLowerCase().includes('deepseek');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5db8a6]/15 border border-[#5db8a6]/30 flex items-center justify-center text-[#5db8a6]">
                <ListFilter className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
                模型清单与并发巡检
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
              自动探测中转站开放的模型总表，5 线程并发探测各模型真实可用性（200 可用 / 401 无效 / 402 欠费 / 429 限流 / 404 空壳）。
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleFetchModels}
              disabled={isLoadingModels || isScanning}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2e2b27] bg-[#23211e] px-4 py-2.5 text-sm font-medium text-[#d4cebe] hover:bg-[#2b2926] hover:text-[#faf9f5] transition"
            >
              <RefreshCw className={`w-[18px] h-[18px] ${isLoadingModels ? 'animate-spin' : ''}`} />
              <span>{availableModels.length > 0 ? `已拉取 (${availableModels.length})` : '拉取清单'}</span>
            </button>

            <button
              onClick={handleStartBatchScan}
              disabled={isScanning || availableModels.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-5 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  <span>巡检中 ({scanProgress.completed}/{scanProgress.total})</span>
                </>
              ) : (
                <>
                  <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                  <span>并发巡检</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress */}
        {isScanning && (
          <div className="mt-5 space-y-2 pt-4 border-t border-[#2e2b27]">
            <div className="flex justify-between text-sm text-[#9c9689]">
              <span>正在批量探测模型连通性...</span>
              <span className="font-mono text-[#faf9f5]">
                {Math.round((scanProgress.completed / (scanProgress.total || 1)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#23211e]">
              <div
                className="h-full bg-[#cc785c] transition-all duration-200 rounded-full"
                style={{ width: `${(scanProgress.completed / (scanProgress.total || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `全部 (${availableModels.length})` },
            { id: 'openai', label: 'OpenAI' },
            { id: 'claude', label: 'Claude' },
            { id: 'deepseek', label: 'DeepSeek' },
            { id: 'google', label: 'Google' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterProvider(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                filterProvider === tab.id
                  ? 'bg-[#cc785c] text-[#faf9f5] font-semibold'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-[#9c9689]" />
          <input
            type="text"
            placeholder="搜索模型 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] pl-9 pr-4 py-2 text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]/40 transition"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#d4cebe]">
            <thead className="border-b border-[#2e2b27] bg-[#23211e] text-[#9c9689] font-mono">
              <tr>
                <th className="p-3 pl-4">序号</th>
                <th className="p-3">模型 ID</th>
                <th className="p-3">可用性状态</th>
                <th className="p-3">HTTP 响应</th>
                <th className="p-3">响应延迟</th>
                <th className="p-3 pr-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2b27] font-mono">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#9c9689]">
                    {availableModels.length === 0
                      ? '暂无模型数据，请点击上方「拉取清单」'
                      : '未匹配到符合搜索条件的模型'}
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, idx) => {
                  const check = scanResults[model.id];
                  return (
                    <tr key={model.id} className="hover:bg-[#23211e]/50 transition">
                      <td className="p-3 pl-4 text-[#9c9689]">#{idx + 1}</td>
                      <td className="p-3 font-medium text-[#faf9f5]">
                        <div className="flex items-center gap-2">
                          <span>{model.id}</span>
                          {config.selectedModel === model.id && (
                            <span className="px-1.5 py-0.2 rounded bg-[#cc785c]/15 text-[#cc785c] text-xs border border-[#cc785c]/30 font-semibold">
                              主测
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {check ? (
                          <StatusBadge status={check.status} />
                        ) : (
                          <span className="text-[#9c9689] text-xs">未测试</span>
                        )}
                      </td>
                      <td className="p-3 text-[#9c9689]">
                        {check?.httpStatus ? (
                          <span className={check.httpStatus === 200 ? 'text-[#5db872] font-semibold' : 'text-[#c64545] font-semibold'}>
                            HTTP {check.httpStatus}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-[#9c9689]">
                        {check?.latencyMs ? `${check.latencyMs} ms` : '-'}
                      </td>
                      <td className="p-3 pr-4">
                        <button
                          onClick={() => dispatch({ type: 'SET_SELECTED_MODEL', payload: model.id })}
                          className="text-xs text-[#cc785c] hover:text-[#d98266] transition underline"
                        >
                          设为主测
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
