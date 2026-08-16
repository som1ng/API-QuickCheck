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
    { id: 'quickping', label: 'API Key 批量检测', active: isKeys },
    { id: 'docs', label: '文档', active: isDocs },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#2e2b27] bg-[#141413]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleSwitchTab('home')}
          className="flex items-center gap-2.5 group"
        >
          <img
            src="/logo.png"
            alt="API-QuickCheck"
            className="w-7 h-7 rounded-md object-cover border border-[#2e2b27]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#faf9f5] tracking-tight font-sans">
              API-QuickCheck
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181715] border border-[#2e2b27] text-neutral-400">
              v2.2.0
            </span>
          </div>
        </button>

        {/* Global Navigation */}
        <nav className="flex items-center gap-1 p-0.5 rounded-md bg-[#181715] border border-[#2e2b27]">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSwitchTab(item.id)}
              className={`px-3 py-1 rounded text-xs font-sans font-medium transition ${
                item.active
                  ? 'text-white bg-[#cc785c]'
                  : 'text-neutral-300 hover:text-white hover:bg-[#1f1e1b]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* GitHub */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#2e2b27] bg-[#181715] text-xs font-mono text-[#faf9f5] hover:border-[#cc785c] hover:text-[#cc785c] transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
