import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#2e2b27] bg-[#141413] pt-12 pb-8 text-sm text-[#9c9689]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Footer Multi-column Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Mission Statement (5 cols) */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="font-serif-display text-xl font-medium text-[#faf9f5]">
                API-QuickCheck
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#23211e] border border-[#2e2b27] text-[#cc785c] font-mono">
                v2.2.0
              </span>
            </div>

            <p className="text-xs text-[#9c9689] leading-relaxed max-w-sm">
              全能 AI API 中转站真伪鉴别与 Key 批量清洗引擎。支持官方私钥签名验真、思维链 Delta 提取、知识库截止期与流式测速。代码完全开源，API Key 永不落盘。
            </p>

            <div className="flex items-center gap-2 text-xs text-[#5db872] pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>零数据上传 · 密钥安全不离浏览器</span>
            </div>
          </div>

          {/* Column 1: 项目 (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-semibold text-[#faf9f5] tracking-wider">
              项目
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] transition"
                >
                  GitHub 源码
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] transition"
                >
                  开源协议 (MIT)
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] transition"
                >
                  提交 Issue / 需求
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/som1ng/API-QuickCheck"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#faf9f5] transition"
                >
                  贡献指南
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: 工具矩阵 (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-semibold text-[#faf9f5] tracking-wider">
              核心工具
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-[#d4cebe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c]" />
                <span>Claude 官方签名深度验真</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#d4cebe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5db872]" />
                <span>API Key 批量并发清洗验货</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#d4cebe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8a55a]" />
                <span>TTFT 与流式 TPS 性能压测</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#d4cebe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9c9689]" />
                <span>中转站多模型并发批量巡检</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#d4cebe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9c9689]" />
                <span>NextChat / Cline 客户端配置导出</span>
              </li>
            </ul>
          </div>

          {/* Column 3: 资源与安全 (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-semibold text-[#faf9f5] tracking-wider">
              安全与隐私
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-[#d4cebe]">纯前端内存直连</span>
              </li>
              <li>
                <span className="text-[#d4cebe]">无后端数据库落盘</span>
              </li>
              <li>
                <span className="text-[#d4cebe]">支持本地完全离线部署</span>
              </li>
              <li>
                <span className="text-[#d4cebe]">透明开源代码可审计</span>
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
