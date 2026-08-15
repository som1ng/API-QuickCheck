import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTabId } from '../../types/config';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { dispatch } = useApp();

  const handleNavigateTab = (tabId: ActiveTabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#2e2b27] bg-[#141413] pt-12 pb-8 text-sm text-[#9c9689]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Footer 3-Column Spread Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand & Mission Statement (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-serif-display text-2xl font-medium text-[#faf9f5]">
                API-QuickCheck
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#23211e] border border-[#2e2b27] text-[#cc785c] font-mono">
                v2.2.0
              </span>
            </div>

            <p className="text-sm text-[#9c9689] leading-relaxed max-w-md">
              全能 AI API 中转站真伪鉴别与 Key 批量清洗引擎。聚合官方私钥签名验真、思维链 Delta 提取、知识库截止期与流式测速。代码完全开源，API Key 永不落盘。
            </p>

            <div className="flex items-center gap-2.5 text-xs text-[#5db872] pt-1 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>零数据上传 · 密钥安全不离浏览器 · 内存直连</span>
            </div>
          </div>

          {/* Column 2: 功能直达 (4 cols) */}
          <div className="md:col-span-4 space-y-3.5">
            <h4 className="text-xs uppercase font-semibold text-[#faf9f5] tracking-wider">
              核心功能导航
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigateTab('home')}
                  className="flex items-center gap-2 text-[#d4cebe] hover:text-[#cc785c] transition text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#cc785c]" />
                  <span>中转站综合检测 (掺水验真 / 测速 / 巡检)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigateTab('quickping')}
                  className="flex items-center gap-2 text-[#d4cebe] hover:text-[#5db872] transition text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#5db872]" />
                  <span>API Key 批量检测与清洗 🔥 (核心)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigateTab('docs')}
                  className="flex items-center gap-2 text-[#d4cebe] hover:text-[#faf9f5] transition text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#9c9689]" />
                  <span>客户端与 Agent 接入配置 (Docs)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: 开源生态 (3 cols) */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-xs uppercase font-semibold text-[#faf9f5] tracking-wider">
              开源生态
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] text-[#d4cebe] transition flex items-center gap-2"
                >
                  <span>GitHub 源码仓库</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] text-[#d4cebe] transition"
                >
                  开源许可协议 (MIT)
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] text-[#d4cebe] transition"
                >
                  提交 Issue / 漏洞反馈
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & GitHub Star Bar */}
        <div className="pt-8 border-t border-[#2e2b27] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9c9689]">
          <div className="flex items-center gap-2">
            <span>© 2026 API-QuickCheck · 独立测评 · 字段级穿透 · MIT 开源 · 代码可逐行审计</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Anthropic Claude Editorial Design</span>
            </div>

            <a
              href="https://github.com/som1ng/API-QuickCheck"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[#d4cebe] hover:text-[#faf9f5] transition underline font-medium"
            >
              <span>GitHub 加星支持 ⭐</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
