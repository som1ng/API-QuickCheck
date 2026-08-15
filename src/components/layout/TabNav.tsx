import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, KeyRound, Gauge, Search, Code2 } from 'lucide-react';

interface TabItem {
  id: ActiveTabId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'fidelity', label: 'API 掺水验真', badge: '核心', icon: ShieldCheck },
  { id: 'quickping', label: 'API KEY 批量检测', badge: '核心', icon: KeyRound },
  { id: 'benchmark', label: '性能测速', icon: Gauge },
  { id: 'scanner', label: '模型巡检', icon: Search },
  { id: 'export', label: '客户端配置', icon: Code2 },
];

export const TabNav: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  return (
    <div className="w-full flex items-center justify-start overflow-x-auto pb-1 no-scrollbar">
      <div className="inline-flex p-1.5 rounded-xl bg-[#1b1a18] border border-[#2e2b27] gap-2.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-[#cc785c] text-[#faf9f5] shadow-md font-semibold'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isActive
                      ? 'bg-white/20 text-[#faf9f5]'
                      : 'bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
