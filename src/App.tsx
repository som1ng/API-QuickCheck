import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { GlobalConfigBar } from './components/layout/GlobalConfigBar';
import { TabNav } from './components/layout/TabNav';
import { FaqSection } from './components/layout/FaqSection';
import { Footer } from './components/layout/Footer';
import { FidelityTab } from './components/tabs/FidelityTab';
import { BenchmarkTab } from './components/tabs/BenchmarkTab';
import { BatchScannerTab } from './components/tabs/BatchScannerTab';
import { CapabilityTab } from './components/tabs/CapabilityTab';
import { QuickPingTab } from './components/tabs/QuickPingTab';
import { ClientExportTab } from './components/tabs/ClientExportTab';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  return (
    <div className="min-h-screen flex flex-col bg-[#141413] text-[#d4cebe] font-sans selection:bg-[#cc785c]/30 selection:text-[#faf9f5]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
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
            <ErrorBoundary fallbackTitle="API Key 批量检测模块异常">
              <QuickPingTab />
            </ErrorBoundary>
          )}

          {activeTab === 'export' && (
            <ErrorBoundary fallbackTitle="客户端配置导出模块异常">
              <ClientExportTab />
            </ErrorBoundary>
          )}
        </div>

        {/* Common Questions & FAQs */}
        <FaqSection />
      </main>

      {/* Rich Multi-column Footer */}
      <Footer />
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
