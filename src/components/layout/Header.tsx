import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';

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

  const navItems: { id: ActiveTabId; label: string; active: boolean }[] = [
    { id: 'home', label: '中转站检测', active: isHome },
    { id: 'quickping', label: 'API Key 批量', active: isKeys },
    { id: 'docs', label: '文档', active: isDocs },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d0c]/90 backdrop-blur-md">
      <div className="w-full px-6 h-[52px] flex items-center justify-between relative">
        {/* Left: Brand Logo & Name */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className="flex items-center gap-2.5 group"
          >
            <img
              src="/logo.png"
              alt="API-QuickCheck"
              className="w-6 h-6 rounded object-cover border border-[rgba(255,255,255,0.1)]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[14px] font-medium text-[#ededed] tracking-tight font-sans">
              API-QuickCheck
            </span>
          </button>
        </div>

        {/* Center: Centered Navigation Links */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-7 text-[13px] font-sans">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSwitchTab(item.id)}
              className={`transition-colors py-1 relative ${
                item.active
                  ? 'text-[#ededed] font-semibold'
                  : 'text-[#888888] hover:text-[#ededed]'
              }`}
            >
              {item.label}
              {item.active && (
                <span className="absolute bottom-[-14px] left-0 right-0 h-[2px] bg-[#e8895d] rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Version & GitHub Link */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-[#525252]">v3.2.0</span>
          
          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#ededed] transition font-mono"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
