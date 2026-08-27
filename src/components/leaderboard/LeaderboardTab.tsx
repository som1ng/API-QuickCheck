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
        tone: 'text-amber-400',
        title: '智力最强',
        model: intelligence?.name ?? '--',
        detail: intelligence?.intelligenceIndex != null ? `智力指数 ${intelligence.intelligenceIndex}` : '--',
      },
      {
        icon: Zap,
        tone: 'text-amber-400',
        title: '生成最快',
        model: speed?.name ?? '--',
        detail: speed?.medianTokensPerSec != null ? `${speed.medianTokensPerSec.toLocaleString()} tokens/s` : '--',
      },
      {
        icon: Clock,
        tone: 'text-cyan-400',
        title: '首字最快',
        model: latency?.name ?? '--',
        detail: latency?.latencyFirstChunkSec != null ? `TTFT ${latency.latencyFirstChunkSec.toFixed(2)}s` : '--',
      },
      {
        icon: Layers,
        tone: 'text-purple-400',
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
        tone: 'text-emerald-400',
        title: '净提升最高',
        model: net?.name ?? '--',
        detail: net?.netImprovementPct != null ? `+${net.netImprovementPct.toFixed(2)}% 净提升` : '--',
      },
      {
        icon: CheckCircle,
        tone: 'text-cyan-400',
        title: '完工确认最多',
        model: confirmed?.name ?? '--',
        detail: confirmed?.confirmedSuccessPct != null ? `${confirmed.confirmedSuccessPct.toFixed(2)}% 确认完工` : '--',
      },
      {
        icon: Bot,
        tone: 'text-amber-400',
        title: '好评最多',
        model: praise?.name ?? '--',
        detail: praise?.praiseVsComplaintPct != null ? `${praise.praiseVsComplaintPct.toFixed(2)}% 好评比` : '--',
      },
      {
        icon: Terminal,
        tone: 'text-emerald-400',
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
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-[#2e2b27] bg-[#181715] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#cc785c]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#cc785c]/20 border border-[#cc785c]/40 flex items-center justify-center text-[#cc785c] shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-sans">
                全球大模型天梯排行榜
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-[#252320] border border-[#36332e] text-xs font-mono text-[#cc785c] font-bold">
                权威双榜快照
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
              两份榜单，两种视角：<strong className="text-slate-100 font-semibold">Artificial Analysis</strong> 用标准化基准测试给模型打分（智力、速度、成本）；{' '}
              <strong className="text-slate-100 font-semibold">Arena (LMArena)</strong> 汇总真实用户的盲测会话，统计 Agent 实际干活时的完工率、纠错与工具使用表现。数据为定期快照，指标含义见各列标题。
            </p>
          </div>

          {/* Source Links */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <a
              href="https://artificialanalysis.ai/leaderboards/models"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#201f1c] hover:bg-[#282723] text-slate-200 hover:text-slate-100 border border-[#2e2b27] text-xs sm:text-sm font-mono font-bold transition cursor-pointer shadow-sm"
            >
              <span>Artificial Analysis</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://arena.ai/leaderboard/agent"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#201f1c] hover:bg-[#282723] text-slate-200 hover:text-slate-100 border border-[#2e2b27] text-xs sm:text-sm font-mono font-bold transition cursor-pointer shadow-sm"
            >
              <span>Arena Agent</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* 2. Highlights: derived from snapshot data, no hardcoded numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-6 pt-6 border-t border-[#272522]">
          {highlightCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="p-4 rounded-xl bg-[#1d1c1a] border border-[#2e2b27] hover:border-[#36332e] transition shadow-sm">
                <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold tracking-normal ${card.tone}`}>
                  <Icon className={`w-4 h-4 ${card.tone}`} />
                  <span>{card.title}</span>
                </div>
                <div className="mt-1.5 text-base sm:text-lg font-black text-slate-100 font-sans tracking-tight">
                  {card.model}
                </div>
                <div className={`text-xs sm:text-sm font-mono font-bold mt-1 ${card.tone}`}>
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
          <div className="relative inline-flex p-1.5 rounded-2xl bg-[#181715] border border-[#2e2b27] shadow-inner select-none">
            {/* Smooth Sliding Pill */}
            <span
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-[#252320] border border-[#36332e] shadow-[0_2px_12px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300 ease-out"
              style={{
                transform: `translateX(${boardPill.left}px)`,
                width: `${boardPill.width}px`,
                opacity: boardPill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Accent Underglow */}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#cc785c] rounded-full shadow-[0_0_10px_#cc785c]" />
            </span>

            <button
              ref={(el) => { boardRefs.current['aa'] = el; }}
              type="button"
              onClick={(e) => handleBoardClick('aa', e.currentTarget)}
              className={`relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-colors duration-200 cursor-pointer ${
                activeBoard === 'aa' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Brain className={`w-4 h-4 transition-colors ${activeBoard === 'aa' ? 'text-[#cc785c]' : 'text-slate-500'}`} />
              <span>全球模型综合性能榜</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-[#181715] border border-[#36332e] text-amber-400">
                {aaSnapshot.rowCount}
              </span>
            </button>

            <button
              ref={(el) => { boardRefs.current['arena'] = el; }}
              type="button"
              onClick={(e) => handleBoardClick('arena', e.currentTarget)}
              className={`relative z-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-colors duration-200 cursor-pointer ${
                activeBoard === 'arena' ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Bot className={`w-4 h-4 transition-colors ${activeBoard === 'arena' ? 'text-[#cc785c]' : 'text-slate-500'}`} />
              <span>Agent 智能体实战榜</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-[#181715] border border-[#36332e] text-amber-400">
                {arenaSnapshot.rowCount}
              </span>
            </button>
          </div>

          {/* Quick Stats / Info */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-[#cc785c]" />
            <span>基准: {activeBoard === 'aa' ? aaSnapshot.asOf : arenaSnapshot.asOf}</span>
            <span>·</span>
            <span>
              已筛选 <strong className="text-slate-100 font-extrabold">{activeBoard === 'aa' ? filteredAaModels.length : filteredArenaAgents.length}</strong> 款
            </span>
          </div>
        </div>

        {/* Search & Vendor Filter Pills */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#2e2b27] bg-[#181715] space-y-3.5 shadow-md">
          {/* Top Search Line */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模型名称、厂商、版本（如 claude-opus, gpt-5, kimi, deepseek, 1M 等）..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#201f1c] border border-[#2e2b27] focus:border-[#cc785c] text-slate-100 placeholder-[#7a776e] text-sm sm:text-base font-sans focus:outline-none transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Vendor Chips with Dynamic Sliding Capsule */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
            <span className="text-xs sm:text-sm font-bold text-slate-300 shrink-0 font-mono">厂商筛选:</span>

            <div className="relative inline-flex items-center p-1 rounded-xl bg-[#201f1c] border border-[#2e2b27] shadow-inner">
              {/* Dynamic Sliding Capsule Indicator */}
              <span
                className="absolute top-1 bottom-1 rounded-lg bg-[#36332e] border border-[#4a463f] shadow-sm pointer-events-none transition-all duration-300 ease-out"
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
                    className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer shrink-0 font-sans ${
                      isSelected ? 'text-slate-100' : 'text-slate-400 hover:text-slate-100'
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
      <div className="rounded-2xl border border-[#2e2b27] bg-[#181715]/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc785c]" />
            <span>怀疑中转站偷换模型？</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            点任意行的「一键测真」，模型名会自动填入检测模块，随后执行签名校验、推理深度与性能全套审计，判断上游是不是真货。
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: 'home' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-4.5 py-2.5 rounded-xl bg-[#252320] hover:bg-[#36332e] text-slate-100 border border-[#36332e] hover:border-[#cc785c]/50 text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition cursor-pointer shadow-sm"
        >
          <span>前往中转站检测</span>
          <ArrowRight className="w-4 h-4 text-[#cc785c]" />
        </button>
      </div>
    </div>
  );
};


