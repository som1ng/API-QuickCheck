import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { FaqSection } from './components/layout/FaqSection';
import { Footer } from './components/layout/Footer';
import { HomeRelayTab } from './components/tabs/HomeRelayTab';
import { QuickPingTab } from './components/tabs/QuickPingTab';
import { ClientExportTab } from './components/tabs/ClientExportTab';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const LeaderboardTab = React.lazy(() =>
  import('./components/leaderboard/LeaderboardTab').then((m) => ({ default: m.LeaderboardTab }))
);

const LeaderboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-48 rounded-2xl bg-[#181715] border border-[#2e2b27]" />
    <div className="h-14 rounded-xl bg-[#181715] border border-[#2e2b27]" />
    <div className="h-96 rounded-xl bg-[#181715] border border-[#2e2b27]" />
  </div>
);

const MainContent: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  const isBatchKeys = activeTab === 'quickping';
  const isLeaderboard = activeTab === 'leaderboard';
  const isDocs = activeTab === 'docs' || activeTab === 'export';

  return (
    <div className="min-h-screen flex flex-col bg-[#141413] text-[#d4cebe] font-sans selection:bg-[#cc785c]/20">
      <Header />

      {isDocs ? (
        <main className="flex-1 w-full flex flex-col">
          <ErrorBoundary fallbackTitle="Docs 模块异常">
            <ClientExportTab />
          </ErrorBoundary>
        </main>
      ) : isBatchKeys ? (
        <>
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
            <ErrorBoundary fallbackTitle="API Key 批量检测模块异常">
              <QuickPingTab />
            </ErrorBoundary>

            <div className="mt-28 mb-16">
              <FaqSection />
            </div>
          </main>

          <Footer />
        </>
      ) : isLeaderboard ? (
        <>
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            <ErrorBoundary fallbackTitle="大模型天梯榜模块异常">
              <React.Suspense fallback={<LeaderboardSkeleton />}>
                <LeaderboardTab />
              </React.Suspense>
            </ErrorBoundary>
          </main>

          <Footer />
        </>
      ) : (
        <>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
            <div className="min-h-[520px]">
              <ErrorBoundary fallbackTitle="中转站检测模块异常">
                <HomeRelayTab />
              </ErrorBoundary>
            </div>

            <FaqSection />
          </main>

          <Footer />
        </>
      )}
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
