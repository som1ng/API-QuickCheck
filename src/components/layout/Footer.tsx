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
    <footer className="border-t border-[#2e2b27]/80 mt-16 bg-[#141413]/60">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px]">
          {/* Col 1: Product */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-semibold text-neutral-400 tracking-wider uppercase">产品功能</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => nav('home')} className="text-left text-neutral-300 hover:text-white font-medium transition-colors">中转站检测</button>
              <button onClick={() => nav('quickping')} className="text-left text-neutral-300 hover:text-white font-medium transition-colors">API Key 批量检测</button>
              <button onClick={() => nav('docs')} className="text-left text-neutral-300 hover:text-white font-medium transition-colors">文档与接入指南</button>
            </div>
          </div>

          {/* Col 2: Resources */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-semibold text-neutral-400 tracking-wider uppercase">开源社区</p>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-white font-medium transition-colors">GitHub 仓库</a>
              <a href="https://github.com/som1ng/API-QuickCheck/issues" target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-white font-medium transition-colors">反馈与 Issue</a>
              <a href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-white font-medium transition-colors">MIT 开源协议</a>
            </div>
          </div>

          {/* Col 3-4 spacer on desktop, copyright on mobile */}
          <div className="col-span-2 flex items-end">
            <p className="text-xs text-neutral-400 font-mono">© 2026 API-QuickCheck · Open Source · MIT License</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
