import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AaModelRow } from '../../types/leaderboard';
import { AaSortKey, SortDirection } from '../../engine/leaderboard/leaderboardService';
import { ProviderIcon } from '../common/ProviderLogos';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AaModelsTableProps {
  rows: AaModelRow[];
  sortKey: AaSortKey;
  sortDir: SortDirection;
  onSort: (key: AaSortKey) => void;
  onTestModel: (modelName: string) => void;
}

export const AaModelsTable: React.FC<AaModelsTableProps> = ({
  rows,
  sortKey,
  sortDir,
  onSort,
  onTestModel,
}) => {
  const [pageSize, setPageSize] = useState<number>(35);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Dynamic Sliding Indicator: Pagination Page Size
  const sizeRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [sizePill, setSizePill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateSizePill = useCallback(() => {
    const el = sizeRefs.current[pageSize];
    if (el) {
      setSizePill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, [pageSize]);

  useEffect(() => {
    updateSizePill();
    const raf = requestAnimationFrame(updateSizePill);
    window.addEventListener('resize', updateSizePill);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateSizePill);
    };
  }, [updateSizePill]);

  const handlePageSizeClick = (sz: number, el: HTMLButtonElement) => {
    setSizePill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    setPageSize(sz);
  };

  // Reset page to 1 when rows or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, sortKey, sortDir]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(rows.length / pageSize);

  const displayedRows = useMemo(() => {
    if (pageSize === 0) return rows;
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  const renderSortIcon = (key: AaSortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#cc785c]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#cc785c]" />
    );
  };

  const getProviderIconKey = (creator: string): string => {
    const c = creator.toLowerCase();
    if (c.includes('anthropic')) return 'claude';
    if (c.includes('openai')) return 'openai';
    if (c.includes('google')) return 'google';
    if (c.includes('deepseek')) return 'deepseek';
    if (c.includes('spacexai') || c.includes('xai') || c.includes('x.ai')) return 'xai';
    if (c.includes('kimi') || c.includes('moonshot')) return 'moonshot';
    if (c.includes('alibaba') || c.includes('qwen')) return 'qwen';
    if (c.includes('z ai') || c.includes('z.ai') || c.includes('glm')) return 'zhipu';
    if (c.includes('meta')) return 'meta';
    return 'openai';
  };

  const formatContext = (ctx: number | null): string => {
    if (!ctx) return '--';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(ctx % 1000000 === 0 ? 0 : 2)}M`;
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}k`;
    return `${ctx}`;
  };

  return (
    <div className="space-y-3.5">
      <div className="w-full overflow-x-auto rounded-2xl border border-[#2e2b27] bg-[#181715] shadow-2xl">
        <table className="w-full text-left text-sm border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[#2e2b27] bg-[#1d1c1a]/95 text-slate-200 text-xs sm:text-sm tracking-normal font-bold font-mono select-none">
              <th
                onClick={() => onSort('rank')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group w-20 min-w-[75px] text-center whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>排名</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              <th className="py-4 px-4 min-w-[240px] whitespace-nowrap">
                <span>模型与开发厂商</span>
              </th>

              <th
                onClick={() => onSort('intelligence')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[150px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>综合智力指数</span>
                  {renderSortIcon('intelligence')}
                </div>
              </th>

              <th
                onClick={() => onSort('speed')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>输出速度 (t/s)</span>
                  {renderSortIcon('speed')}
                </div>
              </th>

              <th
                onClick={() => onSort('latency')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>首字延迟 (TTFT)</span>
                  {renderSortIcon('latency')}
                </div>
              </th>

              <th
                onClick={() => onSort('totalResponse')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>总响应耗时</span>
                  {renderSortIcon('totalResponse')}
                </div>
              </th>

              <th
                onClick={() => onSort('cost')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>单任务成本</span>
                  {renderSortIcon('cost')}
                </div>
              </th>

              <th
                onClick={() => onSort('context')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[120px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>上下文窗口</span>
                  {renderSortIcon('context')}
                </div>
              </th>

              <th className="py-4 px-4 text-center min-w-[160px] whitespace-nowrap">
                <span>操作</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#272522]">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-300 text-sm font-medium">
                  未找到匹配的模型，请尝试调整筛选条件或搜索关键词
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
                const isTop1 = row.rank === 1;
                const isTop2 = row.rank === 2;
                const isTop3 = row.rank === 3;

                return (
                  <tr
                    key={`${row.rank}-${row.name}`}
                    className="hover:bg-[#201f1c] transition duration-150 group"
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-center font-mono font-black whitespace-nowrap">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#cc785c]/25 text-[#cc785c] border border-[#cc785c]/50 text-xs sm:text-sm font-black shadow-sm">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-400/25 text-neutral-100 border border-neutral-400/50 text-xs sm:text-sm font-black shadow-sm">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/25 text-amber-400 border border-amber-700/50 text-xs sm:text-sm font-black shadow-sm">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs sm:text-sm font-bold">{row.rank}</span>
                      )}
                    </td>

                    {/* Model & Creator */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {row.creatorLogo ? (
                          <img
                            src={row.creatorLogo}
                            alt={row.creator}
                            className="w-6 h-6 rounded-md object-contain shrink-0 bg-[#252320] p-0.5 border border-[#36332e]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-[#252320] flex items-center justify-center shrink-0 border border-[#36332e]">
                            <ProviderIcon providerId={getProviderIconKey(row.creator)} size={16} />
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="text-slate-100 font-bold text-sm sm:text-base tracking-tight group-hover:text-[#cc785c] transition-colors">
                            {row.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-medium mt-0.5">
                            {row.creator}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Intelligence Index */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {row.intelligenceIndex !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-14 bg-[#252320] rounded-full h-2.5 overflow-hidden border border-[#36332e]">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-[#cc785c] h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${Math.min(100, Math.max(10, ((row.intelligenceIndex - 20) / 45) * 100))}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono font-black text-slate-100 text-sm sm:text-base">
                            {row.intelligenceIndex}
                            {row.estimated && (
                              <span className="text-[#cc785c] ml-0.5 font-bold" title="官方预估基准分值">
                                *
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">--</span>
                      )}
                    </td>

                    {/* Speed Tokens/s */}
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      {row.medianTokensPerSec !== null ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                            row.medianTokensPerSec >= 100
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : row.medianTokensPerSec >= 60
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-[#252320] text-slate-100 border border-[#36332e]'
                          }`}
                        >
                          {row.medianTokensPerSec} t/s
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Latency First Chunk */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.latencyFirstChunkSec !== null ? (
                        <span className="text-slate-100 font-bold">
                          {row.latencyFirstChunkSec.toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Total Response Time */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.totalResponseSec !== null ? (
                        <span className="text-amber-400 font-bold">
                          {row.totalResponseSec.toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Cost per Task USD */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.costPerTaskUsd !== null ? (
                        <span className="text-emerald-400 font-bold">
                          ${row.costPerTaskUsd.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Context Window */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#252320] text-purple-300 border border-[#36332e] font-bold">
                        {formatContext(row.contextWindow)}
                      </span>
                    </td>

                    {/* Actions & Links */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onTestModel(row.name)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#252320] hover:bg-[#cc785c] text-slate-100 hover:text-white border border-[#36332e] hover:border-[#cc785c] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
                          title="将此模型带入中转站真实性审计"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#cc785c] group-hover:text-white" />
                          <span>一键测真</span>
                        </button>

                        {row.modelUrl && (
                          <a
                            href={row.modelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#252320] hover:bg-[#36332e] text-slate-300 hover:text-slate-100 border border-[#36332e] transition cursor-pointer"
                            title="查看官方模型主页"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Page Size with Dynamic Sliding Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-xs sm:text-sm font-bold text-slate-300 font-mono">每页展示:</span>

          <div className="relative inline-flex items-center p-1 rounded-xl bg-[#201f1c] border border-[#2e2b27] shadow-inner">
            {/* Smooth Dynamic Sliding Indicator */}
            <span
              className="absolute top-1 bottom-1 rounded-lg bg-[#36332e] border border-[#4a463f] shadow-sm pointer-events-none transition-all duration-300 ease-out"
              style={{
                transform: `translateX(${sizePill.left}px)`,
                width: `${sizePill.width}px`,
                opacity: sizePill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {[35, 70, 150, 0].map((sz) => {
              const label = sz === 0 ? '全部' : `${sz}条`;
              const isSelected = pageSize === sz;

              return (
                <button
                  key={sz}
                  ref={(el) => { sizeRefs.current[sz] = el; }}
                  type="button"
                  onClick={(e) => handlePageSizeClick(sz, e.currentTarget)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold font-mono transition-colors duration-200 cursor-pointer ${
                    isSelected ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl bg-[#201f1c] hover:bg-[#282723] disabled:opacity-30 disabled:hover:bg-[#201f1c] text-slate-200 border border-[#2e2b27] transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-bold text-slate-200 px-2.5">
              {currentPage} / {totalPages} 页
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl bg-[#201f1c] hover:bg-[#282723] disabled:opacity-30 disabled:hover:bg-[#201f1c] text-slate-200 border border-[#2e2b27] transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


