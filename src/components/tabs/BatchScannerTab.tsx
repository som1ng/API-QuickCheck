import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchRemoteModels, runBatchScanPool } from '../../engine/scanner/batchScanner';
import { ModelCheckItem } from '../../types/scanner';
import { StatusBadge } from '../common/StatusBadge';
import { ProviderIcon } from '../common/ProviderLogos';
import { ListFilter, Play, RefreshCw, Search, Loader2, Layers } from 'lucide-react';

export const BatchScannerTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { config, availableModels, isLoadingModels } = state;

  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scanResults, setScanResults] = useState<Record<string, ModelCheckItem>>(() => {
    try {
      const saved = localStorage.getItem('apiqc_last_scan_results');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(scanResults).length > 0) {
      try {
        localStorage.setItem('apiqc_last_scan_results', JSON.stringify(scanResults));
      } catch (e) {
        console.warn('Failed to persist scanResults to localStorage', e);
      }
    }
  }, [scanResults]);

  useEffect(() => {
    if (isScanning && tableRef.current) {
      const timer = setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleFetchModels = async (): Promise<{ id: string; name: string }[]> => {
    if (!config.baseUrl || !config.apiKey) {
      return [];
    }

    dispatch({ type: 'SET_LOADING_MODELS', payload: true });
    try {
      const models = await fetchRemoteModels(config.baseUrl, config.apiKey, config.platformId);
      dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
      if (models.length > 0 && !config.selectedModel) {
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
    if (filterProvider === 'openai') return m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('sol') || m.id.toLowerCase().includes('terra') || m.id.toLowerCase().includes('luna') || m.id.toLowerCase().includes('openai') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('codex');
    if (filterProvider === 'claude') return m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('fable') || m.id.toLowerCase().includes('opus') || m.id.toLowerCase().includes('sonnet') || m.id.toLowerCase().includes('anthropic');
    if (filterProvider === 'google') return m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma') || m.id.toLowerCase().includes('google');
    if (filterProvider === 'xai') return m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai') || m.id.toLowerCase().includes('x-ai');
    return true;
  });

  const getProviderModelCount = (providerId: string) => {
    if (providerId === 'all') return availableModels.length;
    if (providerId === 'openai') return availableModels.filter((m) => m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('sol') || m.id.toLowerCase().includes('terra') || m.id.toLowerCase().includes('luna') || m.id.toLowerCase().includes('openai') || m.id.toLowerCase().includes('o1') || m.id.toLowerCase().includes('o3') || m.id.toLowerCase().includes('codex')).length;
    if (providerId === 'claude') return availableModels.filter((m) => m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('fable') || m.id.toLowerCase().includes('opus') || m.id.toLowerCase().includes('sonnet') || m.id.toLowerCase().includes('anthropic')).length;
    if (providerId === 'google') return availableModels.filter((m) => m.id.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('gemma') || m.id.toLowerCase().includes('google')).length;
    if (providerId === 'xai') return availableModels.filter((m) => m.id.toLowerCase().includes('grok') || m.id.toLowerCase().includes('xai') || m.id.toLowerCase().includes('x-ai')).length;
    return 0;
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {(() => {
          const tabs = [
            { id: 'all', label: '全部', icon: <Layers className="w-4 h-4" /> },
            { id: 'openai', label: 'OpenAI', icon: <ProviderIcon providerId="openai" size={16} className="w-4 h-4 shrink-0" /> },
            { id: 'claude', label: 'Claude', icon: <ProviderIcon providerId="claude" size={16} className="w-4 h-4 shrink-0" /> },
            { id: 'google', label: 'Gemini', icon: <ProviderIcon providerId="google" size={16} className="w-4 h-4 shrink-0" /> },
            { id: 'xai', label: 'Grok', icon: <ProviderIcon providerId="xai" size={16} className="w-4 h-4 shrink-0" /> },
          ];
          const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === filterProvider));
          return (
            <div className="relative grid grid-cols-5 p-1.5 rounded-2xl bg-[#141413] border border-[#2e2b27] select-none shadow-inner w-full sm:w-[620px] overflow-hidden">
              {/* Dynamic sliding highlight indicator pill */}
              <div
                className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-transform z-0"
                style={{
                  width: `calc((100% - 12px) / ${tabs.length})`,
                  transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
                }}
              >
                <div className="w-full h-full rounded-xl bg-[#cc785c] shadow-lg shadow-[#cc785c]/25 border border-[#cc785c]" />
              </div>

              {tabs.map((tab) => {
                const count = getProviderModelCount(tab.id);
                const isSelected = filterProvider === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterProvider(tab.id)}
                    className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl cursor-pointer select-none transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#d5d1c8] hover:text-white transition-colors'}>
                      {tab.icon}
                    </span>
                    <span className={`text-sm tracking-normal transition-colors duration-300 ${isSelected ? 'text-white font-bold' : 'text-[#faf9f5] font-bold'}`}>
                      {tab.label}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md transition-all duration-300 ${
                        isSelected
                          ? 'bg-black/35 border border-white/20 text-white shadow-sm'
                          : 'bg-[#22201d] border border-[#3e3b35] text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder="搜索模型 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#2e2b27] bg-[#141413] pl-10 pr-4 py-2.5 text-sm font-mono text-[#faf9f5] placeholder-[#8e8b82] focus:border-[#cc785c] focus:outline-none smooth-input tracking-wide"
          />
        </div>
      </div>

      {/* Results Table */}
      <div ref={tableRef} className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] overflow-hidden shadow-md scroll-mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="border-b border-[#2e2b27] bg-[#181715] text-slate-100 uppercase font-mono font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-xs sm:text-sm">序号</th>
                <th className="px-6 py-4 text-xs sm:text-sm">模型 ID</th>
                <th className="px-6 py-4 text-xs sm:text-sm">可用性状态</th>
                <th className="px-6 py-4 text-xs sm:text-sm">HTTP 响应</th>
                <th className="px-6 py-4 text-xs sm:text-sm">响应延迟</th>
                <th className="px-6 py-4 text-xs sm:text-sm">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2b27] font-mono">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-300 font-semibold text-base font-sans">
                    {availableModels.length === 0
                      ? '暂无模型数据，请点击上方「拉取清单」'
                      : '未匹配到符合搜索条件的模型'}
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, idx) => {
                  const check = scanResults[model.id];
                  return (
                    <tr key={model.id} className="hover:bg-[#23211e]/60 transition">
                      <td className="px-6 py-4 text-slate-200 font-mono font-bold">#{idx + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-[#faf9f5] text-sm">
                        <div className="flex items-center gap-2">
                          <span>{model.id}</span>
                          {config.selectedModel === model.id && (
                            <span className="px-2 py-0.5 rounded bg-[#cc785c]/20 text-[#e8a55a] text-xs border border-[#cc785c]/40 font-bold">
                              主测
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {check ? (
                          <StatusBadge status={check.status} />
                        ) : (
                          <span className="text-slate-300 text-xs sm:text-sm font-mono font-semibold">未测试</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-100">
                        {check?.httpStatus ? (
                          <span className={`px-3 py-1 rounded-md font-mono font-bold tracking-wide text-xs sm:text-sm shadow-sm ${
                            check.httpStatus === 200
                              ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                              : 'bg-[#4c0519] text-[#fda4af] border border-[#e11d48]'
                          }`}>
                            HTTP {check.httpStatus}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-100 font-mono font-bold text-sm">
                        {check?.latencyMs ? `${check.latencyMs} ms` : '--'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'SET_SELECTED_MODEL', payload: model.id })}
                          className="px-4 py-2 rounded-xl bg-[#22201d] hover:bg-[#cc785c] hover:text-white text-[#faf9f5] transition font-sans text-xs sm:text-sm font-bold tracking-wide border border-[#3e3b35] cursor-pointer shadow-sm active:scale-95"
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
