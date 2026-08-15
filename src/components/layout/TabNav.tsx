import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, Gauge, Search, Cpu, Zap, Code2 } from 'lucide-react';

interface TabItem {
  id: ActiveTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'fidelity', label: '真伪鉴别', icon: ShieldCheck },
  { id: 'benchmark', label: '性能测速', icon: Gauge },
  { id: 'scanner', label: '批量巡检', icon: Search },
  { id: 'capability', label: '能力矩阵', icon: Cpu },
  { id: 'quickping', label: '极速单测', icon: Zap },
  { id: 'export', label: '客户端配置', icon: Code2 },
];

export const TabNav: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  return (
    <div className="flex items-center justify-start overflow-x-auto pb-1 no-scrollbar">
      <div className="inline-flex p-1.5 rounded-xl bg-[#1b1a18] border border-[#2e2b27] gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
              className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#cc785c] text-[#faf9f5] shadow-sm font-semibold'
                  : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
