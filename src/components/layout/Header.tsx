import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#2e2b27] bg-[#141413]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Claude Editorial Voice & Repository Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="API-QuickCheck Logo"
            className="w-9 h-9 rounded-xl shadow-md border border-[#2e2b27] hover:scale-105 transition-transform object-cover"
            onError={(e) => {
              // fallback to svg if needed
              (e.target as HTMLImageElement).src = '/logo.svg';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-xl font-medium text-[#faf9f5] tracking-tight">
                API-QuickCheck
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#23211e] border border-[#2e2b27] text-[#cc785c]">
                v2.2.0
              </span>
            </div>
            <p className="text-[11px] text-[#9c9689] hidden sm:block">
              全能 AI 中转站真伪鉴别与性能检测引擎
            </p>
          </div>
        </div>

        {/* Right Info & Links */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-[#1b1a18] border border-[#2e2b27] text-xs text-[#9c9689]">
            <span className="w-2 h-2 rounded-full bg-[#5db872]" />
            <span>Anthropic 官方私钥验签已就绪</span>
          </div>

          <a
            href="https://github.com/som1ng/API-QuickCheck"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b1a18] border border-[#2e2b27] text-xs text-[#d4cebe] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-medium">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
