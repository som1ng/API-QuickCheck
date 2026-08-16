import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, KeyRound, BookOpen } from 'lucide-react';

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
    { id: 'quickping', label: 'API Key 批量', active: isKeys, icon: KeyRound },
    { id: 'docs', label: '文档', active: isDocs, icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0d0c]/90 backdrop-blur-xl select-none">
      <div className="w-full px-6 h-[52px] flex items-center justify-between relative">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className="flex items-center gap-2.5 group transition"
          >
            <img
              src="/logo.png"
              alt="API-QuickCheck"
              className="w-6 h-6 rounded-md object-cover border border-white/10 group-hover:border-[#e8895d]/60 transition duration-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[14px] font-semibold text-white tracking-tight font-sans group-hover:text-[#e8895d] transition">
              API-QuickCheck
            </span>
          </button>
        </div>

        {/* Center: Razor-Sharp Minimalist Segmented Navigation */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-[#141413] border border-white/[0.08] shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchTab(item.id)}
                className={`relative px-4 py-1.5 rounded-lg text-[13px] font-sans transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  item.active
                    ? 'bg-[#262422] text-white font-semibold shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    item.active ? 'text-[#e8895d]' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Version & GitHub Link */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
            v3.2.0
          </span>

          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141413] hover:bg-[#1f1e1c] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all text-xs font-sans"
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
