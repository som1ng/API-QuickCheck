import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';

export const Footer: React.FC = () => {
  const { dispatch } = useApp();

  const nav = (tabId: ActiveTabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#2e2b27]/60 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px]">
          {/* Col 1: Product */}
          <div className="space-y-3">
            <p className="text-[11px] font-mono font-medium text-[#9c9689] tracking-widest uppercase">Product</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => nav('home')} className="text-left text-[#d4cebe] hover:text-[#faf9f5] transition-colors">中转站检测</button>
              <button onClick={() => nav('quickping')} className="text-left text-[#d4cebe] hover:text-[#faf9f5] transition-colors">Key 批量检测</button>
              <button onClick={() => nav('docs')} className="text-left text-[#d4cebe] hover:text-[#faf9f5] transition-colors">Docs</button>
            </div>
          </div>

          {/* Col 2: Resources */}
          <div className="space-y-3">
            <p className="text-[11px] font-mono font-medium text-[#9c9689] tracking-widest uppercase">Resources</p>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noreferrer" className="text-[#d4cebe] hover:text-[#faf9f5] transition-colors">GitHub</a>
              <a href="https://github.com/som1ng/API-QuickCheck/issues" target="_blank" rel="noreferrer" className="text-[#d4cebe] hover:text-[#faf9f5] transition-colors">Issues</a>
              <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-[#d4cebe] hover:text-[#faf9f5] transition-colors">MIT License</a>
            </div>
          </div>

          {/* Col 3-4 spacer on desktop, copyright on mobile */}
          <div className="col-span-2 flex items-end">
            <p className="text-xs text-[#9c9689]/60">© 2026 API-QuickCheck · Open Source · MIT</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
