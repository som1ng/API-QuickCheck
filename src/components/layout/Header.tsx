import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, Layers, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  const handleSwitchTab = (tabId: ActiveTabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHome = activeTab === 'home' || activeTab === 'fidelity' || activeTab === 'benchmark' || activeTab === 'scanner';
  const isKeys = activeTab === 'quickping';
  const isDocs = activeTab === 'docs' || activeTab === 'export';

  const navItems: { id: ActiveTabId; label: string; active: boolean; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: '中转站检测', active: isHome, icon: ShieldCheck },
    { id: 'quickping', label: 'API Key 批量', active: isKeys, icon: Layers },
    { id: 'docs', label: '文档', active: isDocs, icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0d0d0c]/90 backdrop-blur-xl transition-all select-none">
      <div className="w-full px-6 h-[54px] flex items-center justify-between relative">
        
        {/* =================================================== */}
        {/* Left: Brand Logo & Title with Coral Hover Glow      */}
        {/* =================================================== */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className="flex items-center gap-2.5 group transition-all"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="API-QuickCheck"
                className="w-6 h-6 rounded-md object-cover border border-white/10 group-hover:border-[#e8895d]/60 group-hover:shadow-[0_0_12px_rgba(232,137,93,0.35)] transition-all duration-300 transform group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#5db872] ring-2 ring-[#0d0d0c]" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-semibold text-[#faf9f5] tracking-tight font-sans group-hover:text-white transition-colors">
                API-QuickCheck
              </span>
              <span className="text-[10px] font-mono text-[#e8895d] bg-[#e8895d]/10 px-1.5 py-0.2 rounded border border-[#e8895d]/20 font-medium">
                Audit
              </span>
            </div>
          </button>
        </div>

        {/* =================================================== */}
        {/* Center: Sleek Interactive Floating Capsule Navbar   */}
        {/* =================================================== */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 rounded-full bg-[#161514]/90 border border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchTab(item.id)}
                className={`relative px-4 py-1.5 rounded-full text-[13.5px] font-sans font-medium transition-all duration-200 flex items-center gap-2 group cursor-pointer ${
                  item.active
                    ? 'bg-[#252320] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                    : 'text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/[0.06] hover:border-white/[0.06] border border-transparent'
                }`}
              >
                {/* Active Warm Coral Glow Indicator */}
                {item.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8895d] shadow-[0_0_8px_#e8895d] animate-pulse" />
                )}

                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                    item.active ? 'text-[#e8895d]' : 'text-[#8e8b82] group-hover:text-[#faf9f5]'
                  }`}
                />

                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* =================================================== */}
        {/* Right: Version Capsule & GitHub Button              */}
        {/* =================================================== */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex text-[11px] font-mono text-[#8e8b82] bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.06]">
            v3.2.0
          </span>

          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181715] hover:bg-[#252320] text-[#a09d96] hover:text-[#faf9f5] border border-white/[0.08] hover:border-white/[0.16] hover:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-200 text-xs font-sans group"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#8e8b82] group-hover:text-white transition-colors" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-medium tracking-tight">GitHub</span>
          </a>
        </div>

      </div>
    </header>
  );
};
