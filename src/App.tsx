import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { GlobalConfigBar } from './components/layout/GlobalConfigBar';
import { TabNav } from './components/layout/TabNav';
import { FidelityTab } from './components/tabs/FidelityTab';
import { BenchmarkTab } from './components/tabs/BenchmarkTab';
import { BatchScannerTab } from './components/tabs/BatchScannerTab';
import { CapabilityTab } from './components/tabs/CapabilityTab';
import { QuickPingTab } from './components/tabs/QuickPingTab';
import { ClientExportTab } from './components/tabs/ClientExportTab';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sparkles, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  return (
    <div className="min-h-screen flex flex-col bg-[#141413] text-[#d4cebe] font-sans selection:bg-[#cc785c]/30 selection:text-[#faf9f5]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Global Configuration Card */}
        <GlobalConfigBar />

        {/* Navigation Tabs */}
        <TabNav />

        {/* Tab Content with Error Boundary */}
        <div className="pt-1">
          {activeTab === 'fidelity' && (
            <ErrorBoundary fallbackTitle="真伪鉴别模块异常">
              <FidelityTab />
            </ErrorBoundary>
          )}

          {activeTab === 'benchmark' && (
            <ErrorBoundary fallbackTitle="性能测速模块异常">
              <BenchmarkTab />
            </ErrorBoundary>
          )}

          {activeTab === 'scanner' && (
            <ErrorBoundary fallbackTitle="模型批量巡检模块异常">
              <BatchScannerTab />
            </ErrorBoundary>
          )}

          {activeTab === 'capability' && (
            <ErrorBoundary fallbackTitle="高级能力探针模块异常">
              <CapabilityTab />
            </ErrorBoundary>
          )}

          {activeTab === 'quickping' && (
            <ErrorBoundary fallbackTitle="极速单测模块异常">
              <QuickPingTab />
            </ErrorBoundary>
          )}

          {activeTab === 'export' && (
            <ErrorBoundary fallbackTitle="客户端配置导出模块异常">
              <ClientExportTab />
            </ErrorBoundary>
          )}
        </div>
      </main>

      {/* Footer in Claude Editorial Warm Tone */}
      <footer className="border-t border-[#2e2b27] bg-[#141413] py-7 text-sm text-[#9c9689]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[#d4cebe]">
            <ShieldCheck className="w-5 h-5 text-[#5db872]" />
            <span>API-QuickCheck 2.0 · 零数据落盘 · 密钥安全不离浏览器</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-[18px] h-[18px] text-[#cc785c]" />
            <span>Anthropic Claude Editorial Design System</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
