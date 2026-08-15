import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  summaryNote?: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: '我花钱买的是 GPT/Claude，怎么知道中转站没偷偷换成更便宜的模型？',
    answer: (
      <div className="space-y-2">
        <p>
          看响应里有没有「穿帮」的指纹和协议结构。例如 OpenAI 官方回包只会出现标准的 token 计数字段；如果中转站偷偷把你的请求转给其他开源模型（如 Qwen 或 Llama）再包装成 OpenAI 格式发回来，很多专有元数据和格式特征经常会露出来。
        </p>
        <p>
          API-QuickCheck 内置多维探针：包括 <strong>Anthropic 官方私钥加密签名验真 (Thinking Signature)</strong>、<strong>原生思维链 Delta 提取</strong>、<strong>知识库截止期探针</strong> 与 <strong>空间几何逻辑反作弊</strong>，一旦抓到异常特征，就会自动标记降级并计算保真指数。
        </p>
      </div>
    ),
    summaryNote: '简单说：正版模型会按官方体系回答，冒牌与套壳包装层经常露出对面厂家的痕迹。',
  },
  {
    question: '我得了 75 分，为什么保真指数圆圈还是黄色而不是绿色？',
    answer: (
      <div className="space-y-2">
        <p>
          保真指数评分体系定义如下：
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[#d4cebe]">
          <li><span className="text-[#5db872] font-semibold">80 ~ 100 分（绿色）</span>：高保真官方真品，所有签名与关键探针全部通过；</li>
          <li><span className="text-[#e8a55a] font-semibold">50 ~ 79 分（黄色）</span>：存在可疑项（例如伪造流式思维链、响应延迟异常、缺少官方签名，但模型推理能力接近）；</li>
          <li><span className="text-[#c64545] font-semibold">0 ~ 49 分（红色）</span>：证据确凿的严重降级或冒充（例如用廉价开源模型冒充顶尖旗舰）。</li>
        </ul>
      </div>
    ),
  },
  {
    question: '测完显示「0 个模型可用」，是中转站挂了吗？',
    answer: (
      <div className="space-y-2">
        <p>
          不一定。常见原因有三：
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-[#d4cebe]">
          <li><strong>中转站关闭了公开模型列表</strong>：很多中转站管理员在后台隐藏了 <code className="text-[#cc785c] font-mono">/v1/models</code> 路由。这种情况下，你依然可以在输入框直接手动填写模型名（如 <code className="text-[#faf9f5] font-mono">gpt-4o</code>）直接发起检测；</li>
          <li><strong>API Key 额度用尽或未授权</strong>：Key 本身失效或账户欠费；</li>
          <li><strong>本地网络被中转站防火墙拦截</strong>：由于开发环境 CORS 限制，系统已自动为你启用了透明本地代理进行重试。</li>
        </ol>
      </div>
    ),
  },
  {
    question: '为什么 OpenAI 的检测不像 Claude 那样能「100% 保证真伪」？',
    answer: (
      <div className="space-y-2">
        <p>
          因为 Anthropic 在 Claude 3.7 / 3.5 的 Thinking 输出中，加入了由官方私钥加密签名的 <code className="text-[#cc785c] font-mono">signature</code> 字段，任何第三方套壳或逆向均无法伪造其数学签名；
        </p>
        <p>
          而 OpenAI 等厂商目前尚未提供端到端非对称加密签名，因此对其检测主要通过 <strong>系统指纹 (system_fingerprint)</strong>、<strong>知识库截断期探针</strong>、<strong>高维空间拓扑</strong> 与 <strong>流式 Token 生成延迟特征</strong> 进行多重交叉高置信度鉴别。
        </p>
      </div>
    ),
  },
  {
    question: 'API Key 批量检测时，我的密钥会被你们保存或泄露吗？',
    answer: (
      <div className="space-y-2">
        <p className="text-[#5db872] font-semibold">
          绝不。API-QuickCheck 坚持 100% 纯前端零数据落盘原则。
        </p>
        <p>
          你的所有 API Key 仅保存在你的浏览器内存中，直接与目标端点进行通信，绝不经过、也不保存到任何第三方云端数据库或后端服务器。代码完全开源透明，任何人均可审计源码。
        </p>
      </div>
    ),
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default open first

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-5 pt-6 border-t border-[#2e2b27]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-[#cc785c]" />
          <h3 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
            常见问题 (FAQ)
          </h3>
        </div>
        <span className="text-xs text-[#9c9689] font-mono">
          精选指南 · 权威鉴别解答
        </span>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-3">
        {FAQ_LIST.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#cc785c]/50 bg-[#1b1a18] shadow-md'
                  : 'border-[#2e2b27] bg-[#1b1a18]/70 hover:border-[#2e2b27]/80 hover:bg-[#1b1a18]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-5 text-left transition"
              >
                <span className="text-sm font-semibold text-[#faf9f5] pr-4">
                  {item.question}
                </span>
                <span className="text-[#9c9689] shrink-0">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#cc785c]' : ''
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-[#9c9689] leading-relaxed border-t border-[#2e2b27]/60 space-y-3 animate-in fade-in duration-200">
                  {item.answer}

                  {item.summaryNote && (
                    <div className="mt-3 pt-3 border-t border-[#2e2b27]/40 text-xs text-[#d4cebe] italic">
                      {item.summaryNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
