import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  summaryNote?: string;
}

const FAQ_BY_TAB: Record<string, FaqItem[]> = {
  // 1. Home: 中转站综合检测
  home: [
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
          <p>保真指数评分体系定义如下：</p>
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
          <p>常见原因分析：</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[#d4cebe]">
            <li><strong>中转站关闭了公开模型列表</strong>：很多中转站管理员在后台隐藏了 <code className="text-[#cc785c] font-mono">/v1/models</code> 路由。这种情况下，你依然可以在输入框直接手动填写模型名发起测试；</li>
            <li><strong>API Key 额度用尽或未授权</strong>：Key 本身失效或账户欠费；</li>
            <li><strong>本地网络与 CORS</strong>：系统已内置透明代理与 SNI 握手兜底重试。</li>
          </ol>
        </div>
      ),
    },
    {
      question: 'TTFT 和 TPS 究竟代表什么？多少算优秀？',
      answer: (
        <div className="space-y-2">
          <p>
            <strong>TTFT (Time To First Token)</strong> 是从发送请求到接收到模型吐出第一个字的时间。TTFT &lt; 600ms 为优秀，600~1500ms 为正常，&gt; 2000ms 说明中转站网关排队或上游拥塞。
          </p>
          <p>
            <strong>TPS (Tokens Per Second)</strong> 代表流式输出的吞吐速率。旗舰大模型（如 Claude 3.7 / GPT-4o）通常在 40~80 tokens/s；轻量模型（如 Groq / Gemini Flash）可达 100~300+ tokens/s。
          </p>
        </div>
      ),
    },
  ],

  // 2. API KEY 批量检测
  quickping: [
    {
      question: 'API Key 批量检测支持哪些格式？支持哪些厂商？',
      answer: (
        <div className="space-y-2">
          <p>
            支持任意多行文本直接粘贴，系统会自动识别<strong>换行、逗号、分号</strong>等分隔符，并自动去除空格、注释行以及过滤重复 Key。
          </p>
          <p>
            原生预置支持 OpenAI、Anthropic (Claude)、DeepSeek、xAI (Grok)、Google Gemini、Cerebras、硅基流动、OpenRouter 以及任何自定义中转站 Base URL。
          </p>
        </div>
      ),
    },
    {
      question: '「有效、无额、限流、无效、重复」各代表什么状态？',
      answer: (
        <div className="space-y-2">
          <ul className="list-disc list-inside space-y-1.5 pl-1 text-[#d4cebe]">
            <li><strong>有效 (Active / HTTP 200)</strong>：Key 正常可用且能成功发起推理；</li>
            <li><strong>无额 (Quota Exhausted / HTTP 402/429 Quota)</strong>：Key 存在但账户余额为 0 或已欠费；</li>
            <li><strong>限流 (Rate Limited / HTTP 429)</strong>：触发了官方或中转站的 RPM/TPM 频率限制；</li>
            <li><strong>无效 (Invalid / HTTP 401/403)</strong>：Key 错误、已过期、被封号或未授权；</li>
            <li><strong>重复 (Duplicate)</strong>：粘贴的文本中包含多条相同 Key，系统已自动隔离。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '批量检测时，我的 API Key 会被你们服务器保存或记录吗？',
      answer: (
        <p className="text-[#5db872] font-semibold">
          绝不。API-QuickCheck 坚持 100% 纯前端内存直连原则，所有请求由你的浏览器直接或通过本地代理转发，无任何数据库落盘，断网或刷新页面后内存立即销毁。
        </p>
      ),
    },
  ],

  // 3. 客户端与 Agent 配置 (Docs)
  docs: [
    {
      question: '导出的配置支持哪些主流 AI 客户端与 Agent？',
      answer: (
        <p>
          支持一键导出适配 <strong>Claude Code CLI</strong>、<strong>Cline (VSCode 插件)</strong>、<strong>Cursor</strong>、<strong>Cherry Studio</strong>、<strong>NextChat (ChatGPT-Next-Web)</strong>、<strong>Dify</strong>、<strong>Chatbox</strong>、<strong>LiteLLM</strong>、<strong>cURL</strong> 以及各类 Agent 环境变量。
        </p>
      ),
    },
    {
      question: '为什么导出的地址有的是 /v1 有的没有？',
      answer: (
        <p>
          不同客户端的规范不同。例如 NextChat 默认要求传入基础域名，而 LiteLLM / OpenAI SDK / Claude Code 需要标准的 <code className="text-[#cc785c] font-mono">/v1</code> 结尾。导出模块已自动根据目标软件的标准进行了自适应格式化。
        </p>
      ),
    },
  ],
};

export const FaqSection: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default open first

  let currentKey = 'home';
  if (activeTab === 'quickping') currentKey = 'quickping';
  else if (activeTab === 'docs' || activeTab === 'export') currentKey = 'docs';

  const currentFaqList = FAQ_BY_TAB[currentKey] || FAQ_BY_TAB.home;

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-5 pt-6 border-t border-[#2e2b27]">
      <div className="flex items-center gap-2.5">
        <HelpCircle className="w-5 h-5 text-[#cc785c]" />
        <h3 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
          常见问题 (FAQ)
        </h3>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-3">
        {currentFaqList.map((item, idx) => {
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
                <div className="px-5 pb-5 pt-3 text-sm text-neutral-300 leading-relaxed border-t border-[#2e2b27]/60 space-y-3 animate-in fade-in duration-200">
                  {item.answer}

                  {item.summaryNote && (
                    <div className="mt-3 pt-3 border-t border-[#2e2b27]/40 text-xs text-neutral-200 font-medium bg-white/5 border border-white/10 p-3 rounded-lg tracking-wide">
                      💡 {item.summaryNote}
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
