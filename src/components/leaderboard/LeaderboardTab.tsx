import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getAaModelsSnapshot,
  getArenaAgentsSnapshot,
  filterAndSortAaModels,
  filterAndSortArenaAgents,
  mapModelToApiId,
  AaSortKey,
  ArenaSortKey,
  SortDirection,
} from '../../engine/leaderboard/leaderboardService';
import { AaModelsTable } from './AaModelsTable';
import { ArenaAgentsTable } from './ArenaAgentsTable';
import {
  Trophy,
  Search,
  X,
  ExternalLink,
  Brain,
  Zap,
  Bot,
  Calendar,
  Sparkles,
  ArrowRight,
  Layers,
  Clock,
  TrendingUp,
  CheckCircle,
  Terminal,
} from 'lucide-react';

function formatContextWindow(ctx: number): string {
  if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(ctx % 1000000 === 0 ? 0 : 1)}M 词元`;
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}k 词元`;
  return `${ctx} 词元`;
}

const CREATOR_FILTER_OPTIONS = [
  { id: 'all', label: '全部厂商' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'xai', label: 'xAI' },
  { id: 'moonshot', label: 'Moonshot (Kimi)' },
  { id: 'alibaba', label: 'Alibaba (Qwen)' },
  { id: 'z.ai', label: 'Z.ai (智谱)' },
  { id: 'meta', label: 'Meta' },
];

export const LeaderboardTab: React.FC = () => {
  const { dispatch } = useApp();

  const [activeBoard, setActiveBoard] = useState<'aa' | 'arena'>('aa');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCreator, setSelectedCreator] = useState<string>('all');

  // AA Table Sorting
  const [aaSortKey, setAaSortKey] = useState<AaSortKey>('intelligence');
  const [aaSortDir, setAaSortDir] = useState<SortDirection>('desc');

  // Arena Table Sorting
  const [arenaSortKey, setArenaSortKey] = useState<ArenaSortKey>('netImprovement');
  const [arenaSortDir, setArenaSortDir] = useState<SortDirection>('desc');

  // Dynamic Sliding Indicator: Dual Board Switcher
  const boardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [boardPill, setBoardPill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateBoardPill = useCallback(() => {
    const el = boardRefs.current[activeBoard];
    if (el) {
      setBoardPill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, [activeBoard]);

  useEffect(() => {
    updateBoardPill();
    const raf = requestAnimationFrame(updateBoardPill);
    window.addEventListener('resize', updateBoardPill);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateBoardPill);
    };
  }, [updateBoardPill]);

  const handleBoardClick = (board: 'aa' | 'arena', el: HTMLButtonElement) => {
    setBoardPill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    setActiveBoard(board);
  };

  // Dynamic Sliding Indicator: Vendor Filter Chips
  const vendorRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [vendorPill, setVendorPill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateVendorPill = useCallback(() => {
    const el = vendorRefs.current[selectedCreator];
    if (el) {
      setVendorPill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  }, [selectedCreator]);

  useEffect(() => {
    updateVendorPill();
    const raf = requestAnimationFrame(updateVendorPill);
    window.addEventListener('resize', updateVendorPill);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateVendorPill);
    };
  }, [updateVendorPill]);

  const handleVendorClick = (creator: string, el: HTMLButtonElement) => {
    setVendorPill({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    setSelectedCreator(creator);
  };

  // Snapshot Data
  const aaSnapshot = useMemo(() => getAaModelsSnapshot(), []);
  const arenaSnapshot = useMemo(() => getArenaAgentsSnapshot(), []);

  // 亮点卡：直接从快照数据计算榜首，避免硬编码数字与表格脱节
  function topBy<T>(rows: T[], get: (r: T) => number | null | undefined, dir: 'max' | 'min'): T | null {
    let best: T | null = null;
    let bestVal: number | null = null;
    for (const r of rows) {
      const v = get(r);
      if (v === null || v === undefined) continue;
      if (bestVal === null || (dir === 'max' ? v > bestVal : v < bestVal)) {
        bestVal = v;
        best = r;
      }
    }
    return best;
  }

  const aaHighlightCards = useMemo(() => {
    const intelligence = topBy(aaSnapshot.rows, (r) => r.intelligenceIndex, 'max');
    const speed = topBy(aaSnapshot.rows, (r) => r.medianTokensPerSec, 'max');
    const latency = topBy(aaSnapshot.rows, (r) => r.latencyFirstChunkSec, 'min');
    const context = topBy(aaSnapshot.rows, (r) => r.contextWindow, 'max');
    return [
      {
        icon: Brain,
        tone: 'text-[#cc785c]',
        title: '智力最强',
        model: intelligence?.name ?? '--',
        detail: intelligence?.intelligenceIndex != null ? `智力指数 ${intelligence.intelligenceIndex}` : '--',
      },
      {
        icon: Zap,
        tone: 'text-[#5db872]',
        title: '生成最快',
        model: speed?.name ?? '--',
        detail: speed?.medianTokensPerSec != null ? `${speed.medianTokensPerSec.toLocaleString()} tokens/s` : '--',
      },
      {
        icon: Clock,
        tone: 'text-[#5db8a6]',
        title: '首字最快',
        model: latency?.name ?? '--',
        detail: latency?.latencyFirstChunkSec != null ? `TTFT ${latency.latencyFirstChunkSec.toFixed(2)}s` : '--',
      },
      {
        icon: Layers,
        tone: 'text-[#e8a55a]',
        title: '上下文最长',
        model: context?.name ?? '--',
        detail: context?.contextWindow != null ? formatContextWindow(context.contextWindow) : '--',
      },
    ];
  }, [aaSnapshot]);

  const arenaHighlightCards = useMemo(() => {
    const net = topBy(arenaSnapshot.rows, (r) => r.netImprovementPct, 'max');
    const confirmed = topBy(arenaSnapshot.rows, (r) => r.confirmedSuccessPct, 'max');
    const praise = topBy(arenaSnapshot.rows, (r) => r.praiseVsComplaintPct, 'max');
    const recovery = topBy(arenaSnapshot.rows, (r) => r.bashRecoveryPct, 'max');
    return [
      {
        icon: TrendingUp,
        tone: 'text-[#5db872]',
        title: '净提升最高',
        model: net?.name ?? '--',
        detail: net?.netImprovementPct != null ? `+${net.netImprovementPct.toFixed(2)}% 净提升` : '--',
      },
      {
        icon: CheckCircle,
        tone: 'text-[#5db8a6]',
        title: '完工确认最多',
        model: confirmed?.name ?? '--',
        detail: confirmed?.confirmedSuccessPct != null ? `${confirmed.confirmedSuccessPct.toFixed(2)}% 确认完工` : '--',
      },
      {
        icon: Bot,
        tone: 'text-[#e8a55a]',
        title: '好评最多',
        model: praise?.name ?? '--',
        detail: praise?.praiseVsComplaintPct != null ? `${praise.praiseVsComplaintPct.toFixed(2)}% 好评比` : '--',
      },
      {
        icon: Terminal,
        tone: 'text-[#cc785c]',
        title: '报错恢复最快',
        model: recovery?.name ?? '--',
        detail: recovery?.bashRecoveryPct != null ? `${recovery.bashRecoveryPct.toFixed(2)}% 恢复率` : '--',
      },
    ];
  }, [arenaSnapshot]);

  const highlightCards = activeBoard === 'aa' ? aaHighlightCards : arenaHighlightCards;

  // Filtered & Sorted Lists
  const filteredAaModels = useMemo(() => {
    return filterAndSortAaModels(
      aaSnapshot.rows,
      searchQuery,
      selectedCreator,
      aaSortKey,
      aaSortDir
    );
  }, [aaSnapshot.rows, searchQuery, selectedCreator, aaSortKey, aaSortDir]);

  const filteredArenaAgents = useMemo(() => {
    return filterAndSortArenaAgents(
      arenaSnapshot.rows,
      searchQuery,
      selectedCreator,
      arenaSortKey,
      arenaSortDir
    );
  }, [arenaSnapshot.rows, searchQuery, selectedCreator, arenaSortKey, arenaSortDir]);

  const handleAaSort = (key: AaSortKey) => {
    if (aaSortKey === key) {
      setAaSortDir(aaSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setAaSortKey(key);
      setAaSortDir(key === 'cost' || key === 'latency' || key === 'totalResponse' || key === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleArenaSort = (key: ArenaSortKey) => {
    if (arenaSortKey === key) {
      setArenaSortDir(arenaSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setArenaSortKey(key);
      setArenaSortDir(key === 'cost' || key === 'toolHallucination' || key === 'rank' ? 'asc' : 'desc');
    }
  };

  const handleTestModel = (rawModelName: string) => {
    const apiId = mapModelToApiId(rawModelName);
    dispatch({ type: 'SET_SELECTED_MODEL', payload: apiId });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'home' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#faf9f5] tracking-tight">
                AI 编程 / Agent 天梯榜
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 text-xs font-mono text-[#cc785c]">
                双榜快照
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#9c9689] max-w-3xl leading-relaxed">
              两份榜单，两种视角：<strong className="text-[#d4cebe] font-medium">Artificial Analysis</strong> 用标准化基准测试给模型打分（智力、速度、成本）；{' '}
              <strong className="text-[#d4cebe] font-medium">Arena (LMArena)</strong> 汇总真实用户的盲测会话，统计 Agent 实际干活时的完工率、纠错与工具使用表现。数据为定期快照，指标含义见各列标题。
            </p>
          </div>

          {/* Source Links */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <a
              href="https://artificialanalysis.ai/leaderboards/models"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2b27] bg-[#23211e] hover:border-[#cc785c]/40 px-3.5 py-2 text-xs font-mono text-[#d4cebe] hover:text-[#faf9f5] transition"
            >
              <span>Artificial Analysis</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9c9689]" />
            </a>

            <a
              href="https://arena.ai/leaderboard/agent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2b27] bg-[#23211e] hover:border-[#cc785c]/40 px-3.5 py-2 text-xs font-mono text-[#d4cebe] hover:text-[#faf9f5] transition"
            >
              <span>Arena Agent</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9c9689]" />
            </a>
          </div>
        </div>

        {/* 2. Highlights: derived from snapshot data, no hardcoded numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-6 pt-6 border-t border-[#2e2b27]">
          {highlightCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="p-4 rounded-xl border border-[#2e2b27] bg-[#23211e] hover:border-[#cc785c]/30 transition">
                <div className="flex items-center gap-2 text-xs text-[#9c9689]">
                  <Icon className={`w-4 h-4 ${card.tone}`} />
                  <span>{card.title}</span>
                </div>
                <div className="mt-1.5 text-sm sm:text-base font-medium text-[#faf9f5] tracking-tight truncate" title={card.model}>
                  {card.model}
                </div>
                <div className={`mt-1 text-xs sm:text-sm font-mono ${card.tone}`}>
                  {card.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="space-y-4">
        {/* Dual Tab Switcher with Dynamic Sliding Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative inline-flex p-1.5 rounded-xl bg-[#1b1a18] border border-[#2e2b27] select-none">
            {/* Smooth Sliding Pill */}
            <span
              className="absolute top-1.5 bottom-1.5 rounded-lg bg-[#cc785c] shadow-sm pointer-events-none transition-all duration-300"
              style={{
                transform: `translateX(${boardPill.left}px)`,
                width: `${boardPill.width}px`,
                opacity: boardPill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            <button
              ref={(el) => { boardRefs.current['aa'] = el; }}
              type="button"
              onClick={(e) => handleBoardClick('aa', e.currentTarget)}
              className={`relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeBoard === 'aa' ? 'text-[#faf9f5]' : 'text-[#9c9689] hover:text-[#faf9f5]'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>全球模型综合性能榜</span>
              <span
                className={`px-2 py-0.5 text-xs font-mono rounded-md border transition-colors ${
                  activeBoard === 'aa'
                    ? 'bg-white/15 border-white/20 text-[#faf9f5]'
                    : 'bg-[#cc785c]/15 border-[#cc785c]/30 text-[#cc785c]'
                }`}
              >
                {aaSnapshot.rowCount}
              </span>
            </button>

            <button
              ref={(el) => { boardRefs.current['arena'] = el; }}
              type="button"
              onClick={(e) => handleBoardClick('arena', e.currentTarget)}
              className={`relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeBoard === 'arena' ? 'text-[#faf9f5]' : 'text-[#9c9689] hover:text-[#faf9f5]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Agent 智能体实战榜</span>
              <span
                className={`px-2 py-0.5 text-xs font-mono rounded-md border transition-colors ${
                  activeBoard === 'arena'
                    ? 'bg-white/15 border-white/20 text-[#faf9f5]'
                    : 'bg-[#cc785c]/15 border-[#cc785c]/30 text-[#cc785c]'
                }`}
              >
                {arenaSnapshot.rowCount}
              </span>
            </button>
          </div>

          {/* Quick Stats / Info */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#9c9689]">
            <Calendar className="w-4 h-4 text-[#cc785c]" />
            <span>基准: {activeBoard === 'aa' ? aaSnapshot.asOf : arenaSnapshot.asOf}</span>
            <span>·</span>
            <span>
              已筛选 <span className="text-[#faf9f5]">{activeBoard === 'aa' ? filteredAaModels.length : filteredArenaAgents.length}</span> 款
            </span>
          </div>
        </div>

        {/* Search & Vendor Filter Pills */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#2e2b27] bg-[#1b1a18] space-y-3.5">
          {/* Top Search Line */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9c9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模型名称、厂商、版本（如 claude-opus, gpt-5, kimi, deepseek, 1M 等）..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#23211e] border border-[#2e2b27] focus:border-[#cc785c] text-sm text-[#faf9f5] placeholder-[#9c9689]/60 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9c9689] hover:text-[#faf9f5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Vendor Chips with Dynamic Sliding Capsule */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
            <span className="text-xs font-medium text-[#9c9689] shrink-0">厂商筛选:</span>

            <div className="relative inline-flex items-center p-1 rounded-lg bg-[#23211e] border border-[#2e2b27]">
              {/* Dynamic Sliding Capsule Indicator */}
              <span
                className="absolute top-1 bottom-1 rounded-md bg-[#cc785c]/15 border border-[#cc785c]/30 pointer-events-none transition-all duration-300"
                style={{
                  transform: `translateX(${vendorPill.left}px)`,
                  width: `${vendorPill.width}px`,
                  opacity: vendorPill.opacity,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {CREATOR_FILTER_OPTIONS.map((opt) => {
                const isSelected = selectedCreator === opt.id;
                return (
                  <button
                    key={opt.id}
                    ref={(el) => { vendorRefs.current[opt.id] = el; }}
                    type="button"
                    onClick={(e) => handleVendorClick(opt.id, e.currentTarget)}
                    className={`relative z-10 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 cursor-pointer shrink-0 ${
                      isSelected ? 'text-[#cc785c]' : 'text-[#9c9689] hover:text-[#faf9f5]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table View */}
      {activeBoard === 'aa' ? (
        <AaModelsTable
          rows={filteredAaModels}
          sortKey={aaSortKey}
          sortDir={aaSortDir}
          onSort={handleAaSort}
          onTestModel={handleTestModel}
        />
      ) : (
        <ArenaAgentsTable
          rows={filteredArenaAgents}
          sortKey={arenaSortKey}
          sortDir={arenaSortDir}
          onSort={handleArenaSort}
          onTestModel={handleTestModel}
        />
      )}

      {/* 5. Bottom Guide */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm sm:text-base font-medium text-[#faf9f5] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc785c]" />
            <span>怀疑中转站偷换模型？</span>
          </div>
          <p className="text-xs sm:text-sm text-[#9c9689] leading-relaxed">
            点任意行的「一键测真」，模型名会自动填入检测模块，随后执行签名校验、推理深度与性能全套审计，判断上游是不是真货。
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: 'home' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-5 py-2.5 rounded-lg bg-[#23211e] hover:bg-[#2e2b27] text-[#d4cebe] hover:text-[#faf9f5] border border-[#2e2b27] hover:border-[#cc785c]/50 text-xs sm:text-sm font-medium flex items-center gap-2 shrink-0 transition cursor-pointer"
        >
          <span>前往中转站检测</span>
          <ArrowRight className="w-4 h-4 text-[#cc785c]" />
        </button>
      </div>
    </div>
  );
};
