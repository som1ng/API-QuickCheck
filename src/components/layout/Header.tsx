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

  const navItems: { id: ActiveTabId; label: string; active: boolean; badge?: string }[] = [
    { id: 'home', label: '中转站检测', active: isHome },
    { id: 'quickping', label: 'Key 批量检测', active: isKeys, badge: '🔥' },
    { id: 'docs', label: 'Docs', active: isDocs },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#2e2b27]/60 bg-[#141413]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleSwitchTab('home')}
          className="flex items-center gap-2.5 group"
        >
          <img
            src="/logo.png"
            alt=""
            className="w-7 h-7 rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[15px] font-semibold text-[#faf9f5] tracking-tight">
            API-QuickCheck
          </span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSwitchTab(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                item.active
                  ? 'text-[#faf9f5] bg-[#23211e]'
                  : 'text-[#9c9689] hover:text-[#d4cebe]'
              }`}
            >
              {item.label}{item.badge ? ` ${item.badge}` : ''}
            </button>
          ))}
        </nav>

        {/* GitHub */}
        <a
          href="https://github.com/som1ng/API-QuickCheck"
          target="_blank"
          rel="noreferrer"
          className="text-[#9c9689] hover:text-[#faf9f5] transition-colors"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
