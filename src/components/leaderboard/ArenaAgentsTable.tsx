import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArenaAgentRow } from '../../types/leaderboard';
import { ArenaSortKey, SortDirection, resolveProviderLogoKey } from '../../engine/leaderboard/leaderboardService';
import { ProviderIcon } from '../common/ProviderLogos';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
  CircleDollarSign,
  SlidersHorizontal,
} from 'lucide-react';

export type ArenaMetricViewMode = 'core' | 'reliability' | 'cost' | 'all';

interface ArenaAgentsTableProps {
  rows: ArenaAgentRow[];
  sortKey: ArenaSortKey;
  sortDir: SortDirection;
  onSort: (key: ArenaSortKey) => void;
  onTestModel: (modelName: string) => void;
}

const VIEW_MODE_OPTIONS: { id: ArenaMetricViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'core', label: '核心胜率', icon: Sparkles },
  { id: 'reliability', label: '纠错与工具', icon: Wrench },
  { id: 'cost', label: '成本与定价', icon: CircleDollarSign },
  { id: 'all', label: '全量看板 (12项)', icon: SlidersHorizontal },
];

export const ArenaAgentsTable: React.FC<ArenaAgentsTableProps> = ({
  rows,
  sortKey,
  sortDir,
  onSort,
  onTestModel,
}) => {
  const [pageSize, setPageSize] = useState<number>(35);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ArenaMetricViewMode>('core');

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Sliding Indicator: View Mode
  const modeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [modePill, setModePill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateModePill = useCallback(() => {
    const el = modeRefs.current[viewMode];
    if (el) {
      setModePill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, [viewMode]);

  useEffect(() => {
    updateModePill();
    const raf = requestAnimationFrame(updateModePill);
    window.addEventListener('resize', updateModePill);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateModePill);
    };
  }, [updateModePill]);

  const handleModeClick = (mode: ArenaMetricViewMode, el: HTMLButtonElement) => {
    setModePill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    setViewMode(mode);
  };

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

  const showCore = viewMode === 'core' || viewMode === 'all';
  const showReliability = viewMode === 'reliability' || viewMode === 'all';
  const showCost = viewMode === 'cost' || viewMode === 'all';

  return (
    <div className="space-y-3.5">
      {/* Top Toolbar: View Mode Switcher + Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1b1a18] p-2.5 sm:p-3 rounded-xl border border-[#2e2b27] select-none">
        {/* Metric Dimension Switcher with Sliding Capsule */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span className="text-xs font-medium text-[#9c9689] shrink-0 pl-1">数据视角:</span>
          <div className="relative inline-flex items-center p-1 rounded-lg bg-[#23211e] border border-[#2e2b27] shrink-0">
            {/* Dynamic Sliding Capsule Indicator */}
            <span
              className="absolute top-1 bottom-1 rounded-md bg-[#cc785c]/15 border border-[#cc785c]/30 pointer-events-none transition-all duration-300"
              style={{
                transform: `translateX(${modePill.left}px)`,
                width: `${modePill.width}px`,
                opacity: modePill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {VIEW_MODE_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = viewMode === opt.id;

              return (
                <button
                  key={opt.id}
                  ref={(el) => { modeRefs.current[opt.id] = el; }}
                  type="button"
                  onClick={(e) => handleModeClick(opt.id, e.currentTarget)}
                  className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                    isSelected ? 'text-[#cc785c]' : 'text-[#9c9689] hover:text-[#faf9f5]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Info Note */}
        <div className="text-xs text-[#9c9689] font-mono flex items-center gap-2 pr-1">
          <span>共 {rows.length} 款模型</span>
          {viewMode === 'all' && (
            <span className="hidden lg:inline text-xs text-[#9c9689]/70 bg-[#23211e] px-2 py-0.5 rounded border border-[#2e2b27]">
              Shift+滚轮可横向滚屏 · 左侧模型已冻结锁定
            </span>
          )}
        </div>
      </div>

      {/* Main Table Container: Viewport-Bounded with Sticky Header and Sticky Left Columns */}
      <div
        ref={tableContainerRef}
        className="w-full overflow-auto max-h-[calc(100vh-280px)] min-h-[440px] rounded-xl border border-[#2e2b27] bg-[#1b1a18] relative shadow-inner"
      >
        <table className="w-full text-left text-sm border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-[#23211e] shadow-sm">
            <tr className="border-b border-[#2e2b27] text-xs text-[#9c9689] uppercase tracking-wider select-none">
              {/* Sticky Rank */}
              <th
                onClick={() => onSort('rank')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group w-18 min-w-[70px] text-center whitespace-nowrap font-medium sticky left-0 z-30 bg-[#23211e]"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>排名</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              {/* Sticky Model Name & Lab */}
              <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap font-medium sticky left-[70px] z-30 bg-[#23211e] border-r border-[#2e2b27] shadow-[4px_0_12px_rgba(0,0,0,0.4)]">
                <span>智能体模型与所属机构</span>
              </th>

              {/* Core Combat Metrics */}
              {showCore && (
                <>
                  <th
                    onClick={() => onSort('netImprovement')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[130px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>净提升胜率</span>
                      {renderSortIcon('netImprovement')}
                    </div>
                  </th>

                  <th
                    onClick={() => onSort('confirmedSuccess')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[125px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>确认成功率</span>
                      {renderSortIcon('confirmedSuccess')}
                    </div>
                  </th>

                  <th
                    onClick={() => onSort('praiseVsComplaint')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[125px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>好评/差评比</span>
                      {renderSortIcon('praiseVsComplaint')}
                    </div>
                  </th>
                </>
              )}

              {/* Reliability & Tooling Metrics */}
              {showReliability && (
                <>
                  <th
                    onClick={() => onSort('steerability')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[115px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>引导纠错率</span>
                      {renderSortIcon('steerability')}
                    </div>
                  </th>

                  <th
                    onClick={() => onSort('bashRecovery')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[115px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>终端报错自愈</span>
                      {renderSortIcon('bashRecovery')}
                    </div>
                  </th>

                  <th
                    onClick={() => onSort('toolHallucination')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[115px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>工具幻觉率</span>
                      {renderSortIcon('toolHallucination')}
                    </div>
                  </th>

                  <th
                    onClick={() => onSort('sessions')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[105px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>评测样本数</span>
                      {renderSortIcon('sessions')}
                    </div>
                  </th>
                </>
              )}

              {/* Cost & Efficiency Metrics */}
              {showCost && (
                <>
                  <th
                    onClick={() => onSort('cost')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[#faf9f5] transition group min-w-[125px] whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>P50 开销/词元</span>
                      {renderSortIcon('cost')}
                    </div>
                  </th>

                  <th className="py-3.5 px-4 min-w-[115px] whitespace-nowrap font-medium">
                    <span>官方定价 ($/M)</span>
                  </th>
                </>
              )}

              {/* Action Column */}
              <th className="py-3.5 px-4 text-center min-w-[150px] whitespace-nowrap font-medium sticky right-0 z-20 bg-[#23211e]">
                <span>操作</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#2e2b27] font-mono text-xs">
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    2 + (showCore ? 3 : 0) + (showReliability ? 4 : 0) + (showCost ? 2 : 0) + 1
                  }
                  className="py-12 text-center text-[#9c9689] text-sm font-sans"
                >
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
                    className="hover:bg-[#23211e]/60 transition duration-150 group"
                  >
                    {/* Sticky Rank */}
                    <td className="py-3.5 px-4 text-center font-mono whitespace-nowrap sticky left-0 z-10 bg-[#1b1a18] group-hover:bg-[#23211e] transition-colors">
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

                    {/* Sticky Model & Lab */}
                    <td className="py-3.5 px-4 whitespace-nowrap sticky left-[70px] z-10 bg-[#1b1a18] group-hover:bg-[#23211e] border-r border-[#2e2b27] shadow-[4px_0_12px_rgba(0,0,0,0.4)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-[#23211e] flex items-center justify-center shrink-0 border border-[#2e2b27] overflow-hidden">
                          <ProviderIcon providerId={resolveProviderLogoKey(row.lab)} size={16} />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[#faf9f5] font-medium text-sm font-sans tracking-tight group-hover:text-[#cc785c] transition-colors">
                            {row.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-[#9c9689] font-mono mt-0.5">
                            <span>{row.lab}</span>
                            {row.license && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[130px]">{row.license}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Core Combat Metrics */}
                    {showCore && (
                      <>
                        {/* Net Improvement */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          {row.netImprovementPct !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={`font-medium text-xs sm:text-sm ${
                                  row.netImprovementPct > 0
                                    ? 'text-[#5db872]'
                                    : row.netImprovementPct < 0
                                    ? 'text-[#c64545]'
                                    : 'text-[#d4cebe]'
                                }`}
                              >
                                {row.netImprovementPct > 0
                                  ? `+${row.netImprovementPct.toFixed(2)}%`
                                  : `${row.netImprovementPct.toFixed(2)}%`}
                              </span>
                              {row.netImprovementCi != null && (
                                <span className="text-xs text-[#9c9689]">
                                  ±{row.netImprovementCi.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>

                        {/* Confirmed Success */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          {row.confirmedSuccessPct !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[#5db8a6] text-xs sm:text-sm">
                                {row.confirmedSuccessPct.toFixed(2)}%
                              </span>
                              {row.confirmedSuccessCi != null && (
                                <span className="text-xs text-[#9c9689]">
                                  ±{row.confirmedSuccessCi.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>

                        {/* Praise vs Complaint */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          {row.praiseVsComplaintPct !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[#e8a55a] text-xs sm:text-sm">
                                {row.praiseVsComplaintPct.toFixed(2)}%
                              </span>
                              {row.praiseVsComplaintCi != null && (
                                <span className="text-xs text-[#9c9689]">
                                  ±{row.praiseVsComplaintCi.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Reliability & Tooling Metrics */}
                    {showReliability && (
                      <>
                        {/* Steerability */}
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {row.steerabilityPct !== null ? (
                            <span className="text-[#d4cebe]">
                              {row.steerabilityPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>

                        {/* Bash Recovery */}
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {row.bashRecoveryPct !== null ? (
                            <span className="text-[#d4cebe]">
                              {row.bashRecoveryPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>

                        {/* Tool Hallucination (Lower is better) */}
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          {row.toolHallucinationPct !== null ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md border ${
                                row.toolHallucinationPct <= 0.5
                                  ? 'bg-[#5db872]/10 text-[#5db872] border-[#5db872]/30'
                                  : row.toolHallucinationPct <= 1.2
                                  ? 'bg-[#5db8a6]/10 text-[#5db8a6] border-[#5db8a6]/30'
                                  : 'bg-[#e8a55a]/10 text-[#e8a55a] border-[#e8a55a]/30'
                              }`}
                              title="工具幻觉率（越低越安全）"
                            >
                              {row.toolHallucinationPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-[#9c9689]">--</span>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="py-3.5 px-4 font-mono text-xs text-[#d4cebe] whitespace-nowrap">
                          {row.sessions !== null ? row.sessions.toLocaleString() : '--'}
                        </td>
                      </>
                    )}

                    {/* Cost & Efficiency Metrics */}
                    {showCost && (
                      <>
                        {/* Cost/Task (P50) & Output Tokens */}
                        <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[#5db872]">
                              {row.costPerTaskP50Usd !== null ? `$${row.costPerTaskP50Usd.toFixed(2)}` : '--'}
                            </span>
                            <span className="text-xs text-[#9c9689]">
                              {row.outputTokensP50Raw || (row.outputTokensP50 ? `${(row.outputTokensP50 / 1000).toFixed(1)}k` : '--')}
                            </span>
                          </div>
                        </td>

                        {/* Price $/M */}
                        <td className="py-3.5 px-4 font-mono text-xs text-[#9c9689] whitespace-nowrap">
                          {row.pricePerM || '--'}
                        </td>
                      </>
                    )}

                    {/* Actions & Links */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
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

            {[35, 0].map((sz) => {
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
