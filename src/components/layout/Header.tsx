import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, BookOpen, KeyRound } from 'lucide-react';

export const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  const handleSwitchTab = (tabId: ActiveTabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHomeActive = activeTab === 'home' || activeTab === 'fidelity' || activeTab === 'benchmark' || activeTab === 'scanner';
  const isQuickPingActive = activeTab === 'quickping';
  const isDocsActive = activeTab === 'docs' || activeTab === 'export';

  return (
    <header className="border-b border-[#2e2b27] bg-[#141413]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner with Latest Announcement matching reference */}
      <div className="bg-[#1b1a18] border-b border-[#2e2b27]/60 py-1.5 px-4 text-center text-xs text-[#9c9689]">
        <span>⚡ 现已全面支持 <strong>Claude 3.7 Thinking 私钥加密验真</strong> 与 <strong>xAI (Grok)</strong> 官方多维探活！</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand with Claude Editorial Voice & Repository Logo */}
        <div className="flex items-center gap-3.5 shrink-0">
          <img
            src="/logo.png"
            alt="API-QuickCheck Logo"
            className="w-10 h-10 rounded-xl shadow-md border border-[#2e2b27] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.svg';
            }}
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-xl font-semibold text-[#faf9f5] tracking-tight">
                API-QuickCheck
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#23211e] border border-[#2e2b27] text-[#cc785c]">
                v2.2.0
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Global Navigation Pills (Matching Screenshot) ── */}
        <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1b1a18] border border-[#2e2b27] shadow-inner">
          {/* Tab 1: Home (中转站综合检测) */}
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              isHomeActive
                ? 'bg-[#cc785c] text-[#faf9f5] shadow-md font-bold'
                : 'text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#23211e]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>中转站综合检测</span>
          </button>

          {/* Tab 2: API Key 批量检测 🔥 */}
          <button
            type="button"
            onClick={() => handleSwitchTab('quickping')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              isQuickPingActive
                ? 'bg-[#cc785c] text-[#faf9f5] shadow-md font-bold'
                : 'text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#23211e]'
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#e8a55a]" />
            <span>API Key 批量检测 🔥</span>
          </button>

          {/* Tab 3: 客户端与 Agent 配置 (Docs) */}
          <button
            type="button"
            onClick={() => handleSwitchTab('docs')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              isDocsActive
                ? 'bg-[#cc785c] text-[#faf9f5] shadow-md font-bold'
                : 'text-[#d4cebe] hover:text-[#faf9f5] hover:bg-[#23211e]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>客户端 & Agent 配置 (Docs)</span>
          </button>
        </nav>

        {/* Right Info: Official Status & GitHub Link */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#1b1a18] border border-[#2e2b27] text-xs font-mono text-[#9c9689]">
            <span className="w-2 h-2 rounded-full bg-[#5db872] animate-pulse" />
            <span>全网官方节点正常</span>
          </div>

          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1a18] border border-[#2e2b27] text-xs font-semibold text-[#faf9f5] hover:border-[#cc785c]/60 transition"
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
