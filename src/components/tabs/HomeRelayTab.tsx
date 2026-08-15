import React, { useState } from 'react';
import { GlobalConfigBar } from '../layout/GlobalConfigBar';
import { FidelityTab } from './FidelityTab';
import { BenchmarkTab } from './BenchmarkTab';
import { BatchScannerTab } from './BatchScannerTab';
import { ErrorBoundary } from '../common/ErrorBoundary';

type SubTab = 'fidelity' | 'benchmark' | 'scanner';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'fidelity', label: '真伪鉴别' },
  { id: 'benchmark', label: '性能测速' },
  { id: 'scanner', label: '模型巡检' },
];

export const HomeRelayTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('fidelity');

  return (
    <div className="space-y-8">
      {/* API Configuration */}
      <GlobalConfigBar />

      {/* Sub-navigation: clean underline style */}
      <div className="border-b border-[#2e2b27]">
        <div className="flex items-center gap-6">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                subTab === tab.id
                  ? 'text-[#faf9f5] border-[#cc785c]'
                  : 'text-[#9c9689] border-transparent hover:text-[#d4cebe]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {subTab === 'fidelity' && (
          <ErrorBoundary fallbackTitle="真伪鉴别模块异常">
            <FidelityTab />
          </ErrorBoundary>
        )}
        {subTab === 'benchmark' && (
          <ErrorBoundary fallbackTitle="性能测速模块异常">
            <BenchmarkTab />
          </ErrorBoundary>
        )}
        {subTab === 'scanner' && (
          <ErrorBoundary fallbackTitle="模型巡检模块异常">
            <BatchScannerTab />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};
