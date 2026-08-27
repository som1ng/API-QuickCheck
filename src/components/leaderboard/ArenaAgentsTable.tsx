import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArenaAgentRow } from '../../types/leaderboard';
import { ArenaSortKey, SortDirection } from '../../engine/leaderboard/leaderboardService';
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

interface ArenaAgentsTableProps {
  rows: ArenaAgentRow[];
  sortKey: ArenaSortKey;
  sortDir: SortDirection;
  onSort: (key: ArenaSortKey) => void;
  onTestModel: (modelName: string) => void;
}

export const ArenaAgentsTable: React.FC<ArenaAgentsTableProps> = ({
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

  const renderSortIcon = (key: ArenaSortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#cc785c]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#cc785c]" />
    );
  };

  const getProviderIconKey = (lab: string): string => {
    const l = lab.toLowerCase();
    if (l.includes('anthropic')) return 'claude';
    if (l.includes('openai')) return 'openai';
    if (l.includes('google')) return 'google';
    if (l.includes('deepseek')) return 'deepseek';
    if (l.includes('spacexai') || l.includes('xai') || l.includes('x.ai')) return 'xai';
    if (l.includes('moonshot') || l.includes('kimi')) return 'moonshot';
    if (l.includes('alibaba') || l.includes('qwen')) return 'qwen';
    if (l.includes('z.ai') || l.includes('zai') || l.includes('glm')) return 'zhipu';
    if (l.includes('meta')) return 'meta';
    return 'openai';
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
                <span>智能体模型与所属机构</span>
              </th>

              <th
                onClick={() => onSort('netImprovement')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[140px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>净提升胜率</span>
                  {renderSortIcon('netImprovement')}
                </div>
              </th>

              <th
                onClick={() => onSort('confirmedSuccess')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>确认成功率</span>
                  {renderSortIcon('confirmedSuccess')}
                </div>
              </th>

              <th
                onClick={() => onSort('praiseVsComplaint')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>好评/差评比</span>
                  {renderSortIcon('praiseVsComplaint')}
                </div>
              </th>

              <th
                onClick={() => onSort('steerability')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[120px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>引导纠错率</span>
                  {renderSortIcon('steerability')}
                </div>
              </th>

              <th
                onClick={() => onSort('bashRecovery')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[120px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>终端报错自愈</span>
                  {renderSortIcon('bashRecovery')}
                </div>
              </th>

              <th
                onClick={() => onSort('toolHallucination')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[120px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>工具幻觉率</span>
                  {renderSortIcon('toolHallucination')}
                </div>
              </th>

              <th
                onClick={() => onSort('sessions')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[110px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>评测样本数</span>
                  {renderSortIcon('sessions')}
                </div>
              </th>

              <th
                onClick={() => onSort('cost')}
                className="py-4 px-4 cursor-pointer hover:text-slate-100 transition group min-w-[130px] whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>P50 开销/词元</span>
                  {renderSortIcon('cost')}
                </div>
              </th>

              <th className="py-4 px-4 min-w-[120px] whitespace-nowrap">
                <span>官方定价 ($/M)</span>
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
                <td colSpan={12} className="py-12 text-center text-slate-300 text-sm font-medium">
                  未找到匹配的 Agent 模型，请尝试调整筛选条件或搜索关键词
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

                    {/* Model & Lab */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-[#252320] flex items-center justify-center shrink-0 border border-[#36332e]">
                          <ProviderIcon providerId={getProviderIconKey(row.lab)} size={16} />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-slate-100 font-bold text-sm sm:text-base tracking-tight group-hover:text-[#cc785c] transition-colors">
                            {row.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-medium mt-0.5">
                            <span>{row.lab}</span>
                            {row.license && (
                              <>
                                <span>·</span>
                                <span className="text-slate-400 truncate max-w-[130px] font-bold">{row.license}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Net Improvement */}
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      {row.netImprovementPct !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`font-black text-xs sm:text-sm ${
                              row.netImprovementPct > 0
                                ? 'text-emerald-400'
                                : row.netImprovementPct < 0
                                ? 'text-rose-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {row.netImprovementPct > 0
                              ? `+${row.netImprovementPct.toFixed(2)}%`
                              : `${row.netImprovementPct.toFixed(2)}%`}
                          </span>
                          {row.netImprovementCi != null && (
                            <span className="text-xs text-slate-400 font-semibold">
                              ±{row.netImprovementCi.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Confirmed Success */}
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      {row.confirmedSuccessPct !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-cyan-400 font-black text-xs sm:text-sm">
                            {row.confirmedSuccessPct.toFixed(2)}%
                          </span>
                          {row.confirmedSuccessCi != null && (
                            <span className="text-xs text-slate-400 font-semibold">
                              ±{row.confirmedSuccessCi.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Praise vs Complaint */}
                    <td className="py-4 px-4 font-mono whitespace-nowrap">
                      {row.praiseVsComplaintPct !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-amber-400 font-black text-xs sm:text-sm">
                            {row.praiseVsComplaintPct.toFixed(2)}%
                          </span>
                          {row.praiseVsComplaintCi != null && (
                            <span className="text-xs text-slate-400 font-semibold">
                              ±{row.praiseVsComplaintCi.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Steerability */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.steerabilityPct !== null ? (
                        <span className="text-purple-300 font-bold">
                          {row.steerabilityPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Bash Recovery */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.bashRecoveryPct !== null ? (
                        <span className="text-slate-100 font-bold">
                          {row.bashRecoveryPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Tool Hallucination (Lower is better) */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {row.toolHallucinationPct !== null ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md font-bold ${
                            row.toolHallucinationPct <= 0.5
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : row.toolHallucinationPct <= 1.2
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                          title="工具幻觉率（越低越安全）"
                        >
                          {row.toolHallucinationPct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Sessions */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm text-slate-100 font-bold whitespace-nowrap">
                      {row.sessions !== null ? row.sessions.toLocaleString() : '--'}
                    </td>

                    {/* Cost/Task (P50) & Output Tokens */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-bold">
                          {row.costPerTaskP50Usd !== null ? `$${row.costPerTaskP50Usd.toFixed(2)}` : '--'}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          {row.outputTokensP50Raw || (row.outputTokensP50 ? `${(row.outputTokensP50 / 1000).toFixed(1)}k` : '--')}
                        </span>
                      </div>
                    </td>

                    {/* Price $/M */}
                    <td className="py-4 px-4 font-mono text-xs sm:text-sm text-slate-300 font-bold whitespace-nowrap">
                      {row.pricePerM || '--'}
                    </td>

                    {/* Actions & Links */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
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
            {/* Dynamic Sliding Capsule Indicator */}
            <span
              className="absolute top-1 bottom-1 rounded-lg bg-[#36332e] border border-[#4a463f] shadow-sm pointer-events-none transition-all duration-300 ease-out"
              style={{
                transform: `translateX(${sizePill.left}px)`,
                width: `${sizePill.width}px`,
                opacity: sizePill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {[35, 0].map((sz) => {
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

