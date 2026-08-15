import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { FaqSection } from './components/layout/FaqSection';
import { Footer } from './components/layout/Footer';
import { HomeRelayTab } from './components/tabs/HomeRelayTab';
import { QuickPingTab } from './components/tabs/QuickPingTab';
import { ClientExportTab } from './components/tabs/ClientExportTab';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  const isHome = activeTab === 'home' || activeTab === 'fidelity' || activeTab === 'benchmark' || activeTab === 'scanner';
  const isBatchKeys = activeTab === 'quickping';
  const isDocs = activeTab === 'docs' || activeTab === 'export';

  return (
    <div className="min-h-screen flex flex-col bg-[#141413] text-[#d4cebe] font-sans selection:bg-[#cc785c]/30 selection:text-[#faf9f5]">
      {/* ── 1. Global Navigation Header ── */}
      <Header />

      {/* ── 2. Primary Workbench Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Main Workspaces according to Global Header Nav */}
        <div className="min-h-[640px]">
          {isHome && (
            <ErrorBoundary fallbackTitle="中转站综合检测模块异常">
              <HomeRelayTab />
            </ErrorBoundary>
          )}

          {isBatchKeys && (
            <ErrorBoundary fallbackTitle="API Key 批量检测模块异常">
              <QuickPingTab />
            </ErrorBoundary>
          )}

          {isDocs && (
            <ErrorBoundary fallbackTitle="客户端与 Agent 配置模块异常">
              <ClientExportTab />
            </ErrorBoundary>
          )}
        </div>

        {/* Common Questions & FAQs (Positioned comfortably below main workspace) */}
        <div className="pt-16 mt-16 border-t border-[#2e2b27]/80">
          <FaqSection />
        </div>
      </main>

      {/* ── 3. Footer ── */}
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
