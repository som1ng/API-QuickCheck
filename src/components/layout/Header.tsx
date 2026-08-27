import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, KeyRound, Trophy, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  const handleSwitchTab = (tabId: ActiveTabId, targetEl?: HTMLElement | null) => {
    if (targetEl) {
      setPillStyle({
        left: targetEl.offsetLeft,
        width: targetEl.offsetWidth,
        opacity: 1,
      });
    }
    React.startTransition(() => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHome = activeTab === 'home' || activeTab === 'fidelity' || activeTab === 'benchmark' || activeTab === 'scanner';
  const isKeys = activeTab === 'quickping';
  const isLeaderboard = activeTab === 'leaderboard';
  const isDocs = activeTab === 'docs' || activeTab === 'export';

  const currentActiveGroupId: ActiveTabId = isHome
    ? 'home'
    : isKeys
    ? 'quickping'
    : isLeaderboard
    ? 'leaderboard'
    : 'docs';

  const navItems: { id: ActiveTabId; label: string; active: boolean; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: '中转站检测', active: isHome, icon: ShieldCheck },
    { id: 'quickping', label: 'API Key 批量', active: isKeys, icon: KeyRound },
    { id: 'leaderboard', label: '大模型天梯榜', active: isLeaderboard, icon: Trophy },
    { id: 'docs', label: '文档', active: isDocs, icon: BookOpen },
  ];

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updatePillPosition = useCallback(() => {
    const activeEl = tabRefs.current[currentActiveGroupId];
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [currentActiveGroupId]);

  useEffect(() => {
    // Immediate and next frame update to ensure dimensions are rendered
    updatePillPosition();
    const raf = requestAnimationFrame(updatePillPosition);
    window.addEventListener('resize', updatePillPosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePillPosition);
    };
  }, [updatePillPosition]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2e2b27] bg-[#141413]/95 backdrop-blur-xl select-none">
      <div className="w-full px-6 h-[52px] flex items-center justify-between relative">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className="flex items-center gap-2.5 group transition cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="API-QuickCheck"
              className="w-6 h-6 rounded-md object-cover border border-[#2e2b27] group-hover:border-[#cc785c]/60 transition duration-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[14px] font-semibold text-[#faf9f5] tracking-tight font-sans group-hover:text-[#cc785c] transition">
              API-QuickCheck
            </span>
          </button>
        </div>

        {/* Center: Absolute 100% Mathematically Centered Floating Navigation */}
        <nav
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center p-1 rounded-xl bg-[#181715] border border-[#2e2b27] shadow-inner"
        >
          {/* Silky Sliding Active Pill Indicator */}
          <span
            className="absolute top-1 bottom-1 rounded-lg bg-[#252320] border border-[#36332e] shadow-[0_2px_12px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${pillStyle.left}px)`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Coral bottom accent line */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#cc785c] rounded-full shadow-[0_0_8px_#cc785c]" />
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <button
                key={item.id}
                ref={(el) => { tabRefs.current[item.id] = el; }}
                type="button"
                onClick={(e) => handleSwitchTab(item.id, e.currentTarget)}
                className={`relative z-10 px-4 py-1.5 rounded-lg text-[13px] font-sans transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'text-[#faf9f5] font-semibold'
                    : 'text-[#a09d96] hover:text-[#faf9f5]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    isActive ? 'text-[#cc785c]' : 'text-[#6c6a64]'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Version & GitHub Link */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#a09d96] bg-[#181715] px-2 py-0.5 rounded border border-[#2e2b27]">
            v3.2.0
          </span>

          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181715] hover:bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] border border-[#2e2b27] hover:border-[#cc785c]/40 transition-all text-xs font-sans"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-medium tracking-tight">GitHub</span>
          </a>
        </div>

      </div>
    </header>
  );
};
