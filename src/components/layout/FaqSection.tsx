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
      question: '如何排查中转站是否存在偷换开源模型行为？',
      answer: (
        <div className="space-y-2">
          <p>
            通过对比模型底层响应指纹与通信协议结构。官方接口返回标准计数与特定元数据，若中转站将请求转发至开源模型再行封装，其专有特征与边界能力往往存在偏差。
          </p>
          <p>
            系统通过 <strong>Anthropic 官方私钥加密签名验真 (Thinking Signature)</strong>、<strong>原生思维链 Delta 提取</strong>、<strong>知识库截止期探针</strong> 与 <strong>空间几何逻辑反作弊</strong> 进行多维交叉验证。
          </p>
        </div>
      ),
      summaryNote: '正版官方模型遵循官方规范与推理体系，套壳模型在多维极限测试下会暴露能力断层。',
    },
    {
      question: '保真指数评分区间是如何划分的？',
      answer: (
        <div className="space-y-2">
          <p>保真指数评分体系定义如下：</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-300">
            <li><span className="text-[#5db872] font-mono">85 ~ 100 分</span>：高保真官方正品，签名与关键探针全部通过；</li>
            <li><span className="text-[#e8a55a] font-mono">50 ~ 84 分</span>：存在可疑项（如缺少签名、思维链异常或延迟偏高）；</li>
            <li><span className="text-[#c64545] font-mono">0 ~ 49 分</span>：存在严重降级或冒充风险。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '提示无法获取模型列表的原因？',
      answer: (
        <div className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 pl-1 text-neutral-300">
            <li><strong>服务商未开放公开列表</strong>：部分中转站关闭了 <code className="text-[#cc785c] font-mono">/v1/models</code> 路由，可直接手动输入模型名进行测试；</li>
            <li><strong>密钥无效或余额耗尽</strong>：API Key 权限异常或账户欠费；</li>
            <li><strong>网络连接限制</strong>：跨域或反向代理网关拦截。</li>
          </ol>
        </div>
      ),
    },
    {
      question: 'TTFT 与 TPS 指标的参考标准？',
      answer: (
        <div className="space-y-2">
          <p>
            <strong>TTFT (Time To First Token)</strong> 为首字响应延迟。TTFT &lt; 600ms 为优秀，600~1500ms 为正常区间，&gt; 2000ms 说明网关存在排队或上游拥塞。
          </p>
          <p>
            <strong>TPS (Tokens Per Second)</strong> 代表流式输出速率。主流旗舰大模型通常在 40~90 tokens/s 区间，轻量型模型可达 100~300+ tokens/s。
          </p>
        </div>
      ),
    },
  ],

  // 2. API KEY 批量检测
  quickping: [
    {
      question: 'API Key 批量检测支持哪些输入格式与厂商？',
      answer: (
        <div className="space-y-2">
          <p>
            支持多行文本直接粘贴，系统自动识别换行、逗号或分号分隔，并过滤多余空格、注释与重复项。
          </p>
          <p>
            预置支持 OpenAI、Anthropic (Claude)、DeepSeek、xAI (Grok)、Google Gemini、Cerebras、SiliconFlow、OpenRouter 及自定义 Base URL。
          </p>
        </div>
      ),
    },
    {
      question: '各状态类型的含义？',
      answer: (
        <div className="space-y-2">
          <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-300">
            <li><strong>有效 (HTTP 200)</strong>：Key 正常且推理成功；</li>
            <li><strong>无额 (HTTP 402/429 Quota)</strong>：账户余额耗尽或欠费；</li>
            <li><strong>限流 (HTTP 429)</strong>：触发频率限制；</li>
            <li><strong>无效 (HTTP 401/403)</strong>：Key 错误、已过期或未授权；</li>
            <li><strong>重复 (Duplicate)</strong>：已自动隔离重复输入。</li>
          </ul>
        </div>
      ),
    },
    {
      question: 'API Key 是否存在存储或泄露风险？',
      answer: (
        <p className="text-[#5db872] font-medium">
          API-QuickCheck 遵循纯前端内存直连原则，无数据库存储，页面刷新或关闭后内存数据立即销毁。
        </p>
      ),
    },
  ],

  // 3. 文档
  docs: [
    {
      question: '支持哪些主流 AI 客户端与 Agent 的配置导出？',
      answer: (
        <p>
          支持适配 OpenCode、Claude Code CLI、Cline、Cursor、Aider、Cherry Studio、Chatbox、NextChat、Dify 及环境变量模板。
        </p>
      ),
    },
    {
      question: '为什么部分客户端 Base URL 需带 /v1？',
      answer: (
        <p>
          不同工具客户端规范不同。例如 OpenAI SDK / Claude Code / LiteLLM 需要以 <code className="text-[#cc785c] font-mono">/v1</code> 结尾，系统已自动按规范适配。
        </p>
      ),
    },
  ],
};

export const FaqSection: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  let currentKey = 'home';
  if (activeTab === 'quickping') currentKey = 'quickping';
  else if (activeTab === 'docs' || activeTab === 'export') currentKey = 'docs';

  const currentFaqList = FAQ_BY_TAB[currentKey] || FAQ_BY_TAB.home;

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 pt-6 border-t border-[#2e2b27]">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#cc785c]" />
        <h3 className="font-serif-display text-xl font-normal text-[#faf9f5] tracking-tight">
          常见问题
        </h3>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-2">
        {currentFaqList.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-md border transition-all overflow-hidden ${
                isOpen
                  ? 'border-[#cc785c]/40 bg-[#181715]'
                  : 'border-[#2e2b27] bg-[#181715]/60 hover:border-[#2e2b27] hover:bg-[#181715]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-4 text-left transition"
              >
                <span className="text-xs font-semibold text-[#faf9f5] pr-4 font-sans">
                  {item.question}
                </span>
                <span className="text-neutral-400 shrink-0">
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#cc785c]' : ''
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-neutral-300 leading-relaxed border-t border-[#2e2b27]/60 space-y-2 font-sans">
                  {item.answer}

                  {item.summaryNote && (
                    <div className="mt-2 pt-2 border-t border-[#2e2b27]/40 text-xs text-neutral-300 bg-[#1f1e1b] border border-[#2e2b27] p-2.5 rounded">
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
