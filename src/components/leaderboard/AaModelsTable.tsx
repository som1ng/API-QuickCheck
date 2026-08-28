import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AaModelRow } from '../../types/leaderboard';
import { AaSortKey, SortDirection, resolveProviderLogoKey } from '../../engine/leaderboard/leaderboardService';
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

  const formatContext = (ctx: number | null): string => {
    if (!ctx) return '--';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(ctx % 1000000 === 0 ? 0 : 2)}M`;
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}k`;
    return `${ctx}`;
  };

  return (
    <div className="space-y-3.5">
      <div className="w-full overflow-x-auto rounded-xl border border-[#2e2b27] bg-[#1b1a18]">
        <table className="w-full text-left text-sm border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[#2e2b27] bg-[#23211e] text-xs text-[#9c9689] uppercase tracking-wider select-none">
              <th
                onClick={() => onSort('rank')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group w-20 min-w-[75px] text-center whitespace-nowrap font-medium"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>排名</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              <th className="py-3.5 px-4 min-w-[240px] whitespace-nowrap font-medium">
                <span>模型与开发厂商</span>
              </th>

              <th
                onClick={() => onSort('intelligence')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[150px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>综合智力指数</span>
                  {renderSortIcon('intelligence')}
                </div>
              </th>

              <th
                onClick={() => onSort('speed')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[130px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>输出速度 (t/s)</span>
                  {renderSortIcon('speed')}
                </div>
              </th>

              <th
                onClick={() => onSort('latency')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[130px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>首字延迟 (TTFT)</span>
                  {renderSortIcon('latency')}
                </div>
              </th>

              <th
                onClick={() => onSort('totalResponse')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[130px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>总响应耗时</span>
                  {renderSortIcon('totalResponse')}
                </div>
              </th>

              <th
                onClick={() => onSort('cost')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[130px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>单任务成本</span>
                  {renderSortIcon('cost')}
                </div>
              </th>

              <th
                onClick={() => onSort('context')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[120px] whitespace-nowrap font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span>上下文窗口</span>
                  {renderSortIcon('context')}
                </div>
              </th>

              <th className="py-3.5 px-4 text-center min-w-[160px] whitespace-nowrap font-medium">
                <span>操作</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#2e2b27] font-mono text-xs">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#9c9689] text-sm">
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
                    className="hover:bg-[#23211e]/50 transition duration-150 group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-mono whitespace-nowrap">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/40 text-sm font-semibold">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#d4cebe]/10 text-[#d4cebe] border border-[#d4cebe]/25 text-sm font-semibold">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#e8a55a]/10 text-[#e8a55a] border border-[#e8a55a]/30 text-sm font-semibold">
                          3
                        </span>
                      ) : (
                        <span className="text-[#9c9689]">{row.rank}</span>
                      )}
                    </td>

                    {/* Model & Creator */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const logoKey = resolveProviderLogoKey(row.creator);
                          if (logoKey !== 'custom') {
                            return (
                              <div className="w-6 h-6 rounded-md bg-[#23211e] flex items-center justify-center shrink-0 border border-[#2e2b27] overflow-hidden">
                                <ProviderIcon providerId={logoKey} size={16} />
                              </div>
                            );
                          }
                          if (row.creatorLogo) {
                            return (
                              <img
                                src={row.creatorLogo}
                                alt={row.creator}
                                className="w-6 h-6 rounded-md object-contain shrink-0 bg-[#23211e] p-0.5 border border-[#2e2b27]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            );
                          }
                          return (
                            <div className="w-6 h-6 rounded-md bg-[#23211e] flex items-center justify-center shrink-0 border border-[#2e2b27]">
                              <ProviderIcon providerId="custom" size={16} />
                            </div>
                          );
                        })()}

                        <div className="flex flex-col">
                          <span className="text-[#faf9f5] font-medium text-sm font-sans tracking-tight group-hover:text-[#cc785c] transition-colors">
                            {row.name}
                          </span>
                          <span className="text-xs text-[#9c9689] font-mono mt-0.5">
                            {row.creator}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Intelligence Index: score above, 0-100 scale bar below */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.intelligenceIndex !== null ? (
                        <div className="flex flex-col gap-1.5 min-w-[110px]">
                          <span className="font-mono font-medium text-[#faf9f5] text-sm leading-none">
                            {row.intelligenceIndex}
                            {row.estimated && (
                              <span className="text-[#cc785c] ml-0.5" title="官方预估基准分值">
                                *
                              </span>
                            )}
                            <span className="text-[#9c9689] text-xs font-normal ml-1">/ 100</span>
                          </span>
                          <div
                            className="w-full bg-[#141413] rounded-full h-1.5 overflow-hidden"
                            title="Artificial Analysis Intelligence Index（0-100，越高越强）"
                          >
                            <div
                              className="bg-[#cc785c] h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(100, Math.max(2, row.intelligenceIndex))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9c9689]">--</span>
                      )}
                    </td>

                    {/* Speed Tokens/s */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {row.medianTokensPerSec !== null ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${
                            row.medianTokensPerSec >= 100
                              ? 'bg-[#5db872]/10 text-[#5db872] border-[#5db872]/30'
                              : row.medianTokensPerSec >= 60
                              ? 'bg-[#5db8a6]/10 text-[#5db8a6] border-[#5db8a6]/30'
                              : 'bg-[#23211e] text-[#d4cebe] border-[#2e2b27]'
                          }`}
                        >
                          {row.medianTokensPerSec} t/s
                        </span>
                      ) : (
                        <span className="text-[#9c9689]">--</span>
                      )}
                    </td>

                    {/* Latency First Chunk */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {row.latencyFirstChunkSec !== null ? (
                        <span className="text-[#d4cebe]">
                          {row.latencyFirstChunkSec.toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-[#9c9689]">--</span>
                      )}
                    </td>

                    {/* Total Response Time */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {row.totalResponseSec !== null ? (
                        <span className="text-[#e8a55a]">
                          {row.totalResponseSec.toFixed(2)}s
                        </span>
                      ) : (
                        <span className="text-[#9c9689]">--</span>
                      )}
                    </td>

                    {/* Cost per Task USD */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {row.costPerTaskUsd !== null ? (
                        <span className="text-[#5db872]">
                          ${row.costPerTaskUsd.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#9c9689]">--</span>
                      )}
                    </td>

                    {/* Context Window */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#23211e] text-[#d4cebe] border border-[#2e2b27]">
                        {formatContext(row.contextWindow)}
                      </span>
                    </td>

                    {/* Actions & Links */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onTestModel(row.name)}
                          className="px-3 py-1.5 rounded-lg bg-[#23211e] hover:bg-[#2e2b27] text-[#d4cebe] hover:text-[#faf9f5] border border-[#2e2b27] hover:border-[#cc785c]/50 text-xs font-medium font-sans flex items-center gap-1.5 transition duration-150 cursor-pointer"
                          title="将此模型带入中转站真实性审计"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#cc785c]" />
                          <span>一键测真</span>
                        </button>

                        {row.modelUrl && (
                          <a
                            href={row.modelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#23211e] hover:bg-[#2e2b27] text-[#9c9689] hover:text-[#faf9f5] border border-[#2e2b27] transition cursor-pointer"
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
          <span className="text-xs font-medium text-[#9c9689]">每页展示:</span>

          <div className="relative inline-flex items-center p-1 rounded-lg bg-[#23211e] border border-[#2e2b27]">
            {/* Dynamic Sliding Capsule Indicator */}
            <span
              className="absolute top-1 bottom-1 rounded-md bg-[#cc785c]/15 border border-[#cc785c]/30 pointer-events-none transition-all duration-300"
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
                  className={`relative z-10 px-3.5 py-1.5 rounded-md text-xs font-mono transition-colors duration-200 cursor-pointer ${
                    isSelected ? 'text-[#cc785c]' : 'text-[#9c9689] hover:text-[#faf9f5]'
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
              className="p-2 rounded-lg bg-[#23211e] hover:bg-[#2e2b27] disabled:opacity-30 disabled:hover:bg-[#23211e] text-[#d4cebe] border border-[#2e2b27] transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs text-[#9c9689] px-2.5">
              <span className="text-[#faf9f5]">{currentPage}</span> / {totalPages} 页
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-[#23211e] hover:bg-[#2e2b27] disabled:opacity-30 disabled:hover:bg-[#23211e] text-[#d4cebe] border border-[#2e2b27] transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
