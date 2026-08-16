import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  ShieldAlert,
  Search,
  Hash,
  Sparkles,
  Zap,
  Info,
  Activity,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Gauge
} from 'lucide-react';

// ==========================================
// Types & Interfaces
// ==========================================

export type DocCategoryId =
  | 'overview'
  | 'fidelity_architecture'
  | 'relay_traps'
  | 'benchmarks'
  | 'troubleshooting'
  | 'developer_api';

export type DocItemId =
  // 1. 概览与设计初衷
  | 'about_quickcheck'
  // 2. 验真体系与密码学防伪
  | 'probe_matrix'
  | 'cryptographic_signatures'
  // 3. 中转站黑产与掺水套路
  | 'model_downgrades'
  | 'stream_token_cheating'
  | 'fake_rate_limits'
  // 4. 性能与基准
  | 'ttft_tps_standards'
  // 5. 排错与协议规范
  | 'http_error_codes'
  | 'api_specifications'
  // 6. 开发者与自动化
  | 'cicd_automation';

interface CodeTabItem {
  id: string;
  label: string;
  language: string;
  code: string;
  title?: string;
  description?: string;
}

interface StepGuide {
  stepNumber: number;
  title: string;
  description: string;
  code?: string;
  language?: string;
  tip?: string;
}

interface CalloutItem {
  type: 'tip' | 'warning' | 'info' | 'danger';
  title: string;
  content: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface DocContent {
  id: DocItemId;
  categoryId: DocCategoryId;
  title: string;
  badge: string;
  protocol: string;
  subtitle: string;
  overviewSummary: string;
  keyParams: { label: string; value: string; hint?: string }[];
  codeTabs: CodeTabItem[];
  steps: StepGuide[];
  callouts: CalloutItem[];
  verificationSnippet?: {
    title: string;
    description: string;
    language: string;
    code: string;
  };
  faqs: FaqItem[];
}

interface CategoryGroup {
  id: DocCategoryId;
  title: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    id: DocItemId;
    title: string;
    badge?: string;
    tag?: string;
  }[];
}

// ==========================================
// Category Definitions (OpenCode Starlight Layout)
// ==========================================

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'overview',
    title: '平台理念与导读',
    badge: 'Guide',
    icon: Sparkles,
    items: [
      { id: 'about_quickcheck', title: 'API-QuickCheck 验真体系导读', badge: '必读' },
    ],
  },
  {
    id: 'fidelity_architecture',
    title: '验真体系与数学防伪',
    badge: 'Core',
    icon: ShieldCheck,
    items: [
      { id: 'probe_matrix', title: '8 维反作弊探针矩阵深度解构', badge: '核心机制' },
      { id: 'cryptographic_signatures', title: 'Anthropic 官方私钥签名验真原理', badge: '密码学' },
    ],
  },
  {
    id: 'relay_traps',
    title: '中转站「掺水降级」套路揭秘',
    badge: 'Expose',
    icon: ShieldAlert,
    items: [
      { id: 'model_downgrades', title: '套壳替罪羊：开源模型冒充旗舰', badge: '降级套路' },
      { id: 'stream_token_cheating', title: '流式欺骗与 Token 偷工减料', badge: '流式作弊' },
      { id: 'fake_rate_limits', title: '假冒 429 限流与熔断套路', badge: '故障伪造' },
    ],
  },
  {
    id: 'benchmarks',
    title: '真实性能与基准测速',
    badge: 'Speed',
    icon: Gauge,
    items: [
      { id: 'ttft_tps_standards', title: 'TTFT 首字延迟与 TPS 黄金基准表', badge: '评级标准' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'HTTP 排错与协议规范',
    badge: 'Debug',
    icon: Activity,
    items: [
      { id: 'http_error_codes', title: '401/404/429/502 秒级自愈字典', badge: '排错手册' },
      { id: 'api_specifications', title: 'OpenAI/Anthropic 协议与反代规范', badge: 'RFC 协议' },
    ],
  },
  {
    id: 'developer_api',
    title: '开发者与 CI/CD 自动化',
    badge: 'Dev',
    icon: FileCode2,
    items: [
      { id: 'cicd_automation', title: '自动化验真脚本与 CI/CD 流水线', badge: 'SDK/CLI' },
    ],
  },
];

// ==========================================
// Main Component
// ==========================================

export const ClientExportTab: React.FC = () => {
  const { state } = useApp();
  const { config } = state;

  const [activeItem, setActiveItem] = useState<DocItemId>('about_quickcheck');
  const [activeCodeTab, setActiveCodeTab] = useState<string>('architecture_diagram');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalCopied, setGlobalCopied] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Resizable sidebar state (220px ~ 480px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('api_quickcheck_docs_sidebar_width');
    return saved ? Math.max(220, Math.min(480, parseInt(saved, 10))) : 280;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resizable sidebar mouse event handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(220, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem('api_quickcheck_docs_sidebar_width', newWidth.toString());
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Dynamic values injected from AppContext
  const cleanBaseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = config.apiKey || 'sk-your-api-key-here';
  const model = config.selectedModel || 'claude-3-7-sonnet-20250219';

  // Global Config Copy
  const handleCopyGlobalConfig = async () => {
    const jsonConfig = JSON.stringify(
      {
        baseUrl: cleanBaseUrl,
        apiKey: config.apiKey || 'sk-your-api-key-here',
        selectedModel: model,
        platformId: config.platformId,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(jsonConfig);
      setGlobalCopied(true);
      setTimeout(() => setGlobalCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      const yOffset = -80;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Build documentation content map
  const docContents: Record<DocItemId, DocContent> = useMemo(() => {
    return {
      // 1. 平台理念与快速上手
      about_quickcheck: {
        id: 'about_quickcheck',
        categoryId: 'overview',
        title: 'API-QuickCheck 验真体系导读',
        badge: '核心架构',
        protocol: 'Zero-Storage / 纯前端内存直连',
        subtitle:
          '专为大模型 API 中转站打造的开源质量体检与防掺水验真系统，立足于密码学签名校验与 8 维对抗式逻辑探针。',
        overviewSummary:
          '随着大模型 API 市场激增，大量第三方中转站采用开源小模型套壳冒充旗舰大模型、篡改流式数据或降速节流。API-QuickCheck 通过多维探针穿透套壳包装，给用户呈现真实保真指数与详细证据链。',
        keyParams: [
          { label: '核心验真原则', value: '密码学签名 + 逻辑反作弊', hint: '拒绝单纯依靠回答内容判断' },
          { label: '隐私保障级别', value: '100% 内存直连 / 无服务器存储', hint: '所有 Key 刷新后即刻销毁' },
          { label: '支持检测协议', value: 'OpenAI / Anthropic / Google / xAI', hint: '全大厂原生协议支持' },
          { label: '检测输出物', value: 'Veridrop 格式验真证书 + 证据链', hint: '带防伪编号与完整遥测' },
        ],
        codeTabs: [
          {
            id: 'architecture_diagram',
            label: '系统架构与探针工作流',
            language: 'yaml',
            title: 'API-QuickCheck 探测流水线',
            code: `Pipeline:
  1. Handshake:
     - 测量首字时间 (TTFT) & 握手延迟
     - 捕获响应 Headers 与 Server 指纹
  2. Cryptographic Proof:
     - 提取 Anthropic Official Thinking Signature
     - 验证 RSA/ECC 非对称数字签名合法性
  3. Stream Reasoning Delta:
     - 解析原生流式思维链 chunk
     - 检查是否存在伪造 <thinking> 字符串
  4. Logic & Adversarial Probes:
     - 空间几何拓扑 (Spatial Topology) 旋转逻辑
     - 知识地平线 (Knowledge Horizon) 断代校验
     - 负向约束与系统提示词抗注入审计
  5. Certificate Issuance:
     - 计算综合保真指数 (0 ~ 100)
     - 颁发 Veridrop 验真证书与原始证据`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '输入中转站 Base URL 与 API Key',
            description:
              '在首页填入目标中转站的 API 地址与密钥，系统将自动嗅探并列出该站点开放的所有可用模型。',
          },
          {
            stepNumber: 2,
            title: '选择测试模型与检测深度',
            description:
              '支持针对 Anthropic Claude、OpenAI o1/o3/GPT-4o、xAI Grok 及 Google Gemini 进行定制化探针测试。',
          },
          {
            stepNumber: 3,
            title: '开始检测并获取验真证书',
            description:
              '点击开始检测，系统将在 5~15 秒内完成全流程探针并发扫描，自动颁发带有防伪编号的验真证书与原始报文证据。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '100% 纯前端隐私承诺',
            content:
              'API-QuickCheck 绝不在后端记录、落盘或收集任何用户的 API Key。所有请求直接由浏览器通过本地代理发送至目标中转站。',
          },
        ],
        faqs: [
          {
            question: '为什么市面上的中转站需要验真？',
            answer:
              '部分不良中转站为了赚取差价，会用便宜的开源模型（如 Qwen 72B / DeepSeek）冒充昂贵的 Claude 3.7 或 GPT-5，或者通过剥离思维链、降低并发限制等手段损害用户利益。',
          },
        ],
      },

      // 2. 8 维反作弊探针矩阵
      probe_matrix: {
        id: 'probe_matrix',
        categoryId: 'fidelity_architecture',
        title: '8 维反作弊探针矩阵深度解构',
        badge: '核心技术',
        protocol: 'Adversarial Probe Matrix v2.5',
        subtitle:
          '通过结构化特征、对抗性边界测试与逻辑死角探测，彻底穿透任何伪装与套壳包装。',
        overviewSummary:
          '单凭简单的“你是谁”无法辨别模型真伪，因为中转站可以轻松在 System Prompt 中注入虚假身份。API-QuickCheck 的 8 维探针基于底层架构特征与极端逻辑测试，无法通过简单的 Prompt 欺骗。',
        keyParams: [
          { label: '探针 1', value: 'Anthropic 官方私钥签名验真', hint: '权重: 30%' },
          { label: '探针 2', value: '原生思维链 Delta 提取', hint: '权重: 20%' },
          { label: '探针 3', value: 'OpenAI 负向约束依从测试', hint: '权重: 15%' },
          { label: '探针 4', value: '空间几何拓扑三维旋转', hint: '权重: 10%' },
        ],
        codeTabs: [
          {
            id: 'probe_details',
            label: '8 维探针详解清单',
            language: 'json',
            title: '探针规范定义',
            code: `{
  "probes": [
    {
      "id": "anthropic_signature",
      "name": "Anthropic 官方私钥签名验真",
      "mechanism": "检查 thinking block 中的 signature 字段是否符合官方非对称加密格式"
    },
    {
      "id": "thinking_delta",
      "name": "原生流式思维链结构化 Delta 提取",
      "mechanism": "检查 SSE 流中是否使用原生 thinking_delta 事件，而非伪造的 <thinking> 文本"
    },
    {
      "id": "openai_constraint",
      "name": "OpenAI 严格负向约束与依从性",
      "mechanism": "测试模型在复杂多重否定与排他性条件下的逻辑执行能力"
    },
    {
      "id": "knowledge_horizon",
      "name": "知识库截止期与历史事件断代",
      "mechanism": "探测模型对特定时间节点后事件的真实记忆边界"
    },
    {
      "id": "spatial_topology",
      "name": "空间拓扑三维旋转与反作弊",
      "mechanism": "非纯文本语言理解，测试顶尖模型才具备的空间几何推断能力"
    },
    {
      "id": "semantic_nuance",
      "name": "跨语言双关语与古文辨析",
      "mechanism": "测试多语言语境下的细微修辞与隐喻理解深度"
    },
    {
      "id": "prompt_injection_immunity",
      "name": "系统提示词抗注入与越狱防御",
      "mechanism": "测试官方模型的安全对齐强度与中转站额外包装层的穿透性"
    },
    {
      "id": "token_consumption_audit",
      "name": "非流式完整性与 Token 消耗审计",
      "mechanism": "核对 usage 字段中的 completion_tokens 与 prompt_tokens 真实性"
    }
  ]
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '并行分发对抗性 Payload',
            description: '系统并发向目标中转站发送精心构造的非线性和强约束探针报文。',
          },
          {
            stepNumber: 2,
            title: '深度解析流式报文结构',
            description: '实时监听 Server-Sent Events (SSE) 流，提取底层事件类型与元数据。',
          },
          {
            stepNumber: 3,
            title: '比对官方真机指纹数据库',
            description: '将探针返回的思维模式、签名格式与延迟特征与官方基准库进行交叉校验。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '为什么套壳模型在空间几何探针上必露马脚？',
            content:
              '空间几何拓扑探针要求模型在多维空间中进行三维旋转运算，小模型（如 7B/14B/32B）缺乏足够参数量进行高阶空间建模，必然产生逻辑矛盾。',
          },
        ],
        faqs: [
          {
            question: '中转站能否通过修改 System Prompt 绕过探针？',
            answer:
              '不能。探针测试的是底层推理能力与协议数据结构，而非模型“自称”的身份。Prompt 无法伪造不存在的推理能力与官方数字签名。',
          },
        ],
      },

      // 3. Anthropic 官方私钥签名验真原理
      cryptographic_signatures: {
        id: 'cryptographic_signatures',
        categoryId: 'fidelity_architecture',
        title: 'Anthropic 官方私钥签名验真原理',
        badge: '密码学防伪',
        protocol: 'Anthropic Signature Verification',
        subtitle:
          'Anthropic 官方对 Claude 3.7 的思维链引入了非对称加密签名，彻底封死了套壳模型的造假可能。',
        overviewSummary:
          '在 Claude 3.7 Sonnet 中，Anthropic 引入了 Thinking Signature 机制：官方推理集群会使用 Anthropic 官方私钥为每一次生成的思维链生成不可伪造的数字签名。',
        keyParams: [
          { label: '加密体系', value: 'Anthropic Official RSA/ECC', hint: '官方私钥签发' },
          { label: '签名载体', value: 'thinking 块内部 signature 字段', hint: '官方原生协议结构' },
          { label: '伪造难度', value: '数学不可行 (Cryptographically Impossible)', hint: '无私钥无法伪造' },
        ],
        codeTabs: [
          {
            id: 'signature_structure',
            label: '官方签名与假套壳对比',
            language: 'json',
            title: '真实官方回包 vs 假中转站套壳',
            code: `// ✅ 官方真品回包结构 (Anthropic Messages API)
{
  "type": "content_block_start",
  "content_block": {
    "type": "thinking",
    "thinking": "Let me analyze...",
    "signature": "EqkBCgIYAhIQV1X7x8k2N4m9Z8P...[官方私钥加密签名]..."
  }
}

// ❌ 假中转站套壳回包 (用开源模型伪造)
{
  "choices": [{
    "delta": {
      "content": "<thinking>我正在思考...</thinking>答案是..."
    }
  }]
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '请求携带 thinking 参数',
            description: '发送包含 `thinking: { type: "enabled", budget_tokens: 1024 }` 的原生请求。',
          },
          {
            stepNumber: 2,
            title: '提取 signature 密文字段',
            description: '从中转站返回的数据流中提取 content_block.signature 字段。',
          },
          {
            stepNumber: 3,
            title: '校验签名格式与有效性',
            description: '若缺少 signature 字段或仅返回纯文本 <thinking> 标签，直接判定为假冒中转。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: '警惕仅支持 OpenAI 格式的 Claude 接口',
            content:
              '部分中转站只提供 /v1/chat/completions 格式并声称是 Claude 3.7，此时往往是通过中间层剥离了签名甚至是拿其他模型套壳转接的。',
          },
        ],
        faqs: [
          {
            question: '如果中转站返回了 signature，就能 100% 确定是真品吗？',
            answer:
              '是的。因为数字签名必须由 Anthropic 内部持有的私钥计算生成，任何第三方中转站均不可能独立伪造合法签名。',
          },
        ],
      },

      // 4. 套壳替罪羊：开源模型冒充旗舰
      model_downgrades: {
        id: 'model_downgrades',
        categoryId: 'relay_traps',
        title: '套壳替罪羊：开源模型冒充旗舰',
        badge: '行业揭秘',
        protocol: 'Black Market Trap #1',
        subtitle:
          '揭秘不法中转站如何使用单价极低的开源模型偷换 Claude 3.7、o3-mini 与 GPT-5。',
        overviewSummary:
          '在 API 中转行业，暴利的核心在于“偷梁换柱”：中转站对外标注为 GPT-5 或 Claude 3.7（收取高额倍率），在后台路由中却将流量分发给极低成本的开源模型（如 Qwen 2.5 72B、DeepSeek V3 等）。',
        keyParams: [
          { label: '常见冒充手段', value: '修改路由表 + Prompt 伪装身份', hint: '后台动态转发' },
          { label: '典型利润差', value: '高达 10 ~ 50 倍成本差价', hint: '暴利驱动造假' },
          { label: '受害者体验', value: '代码容易报错、逻辑脆弱、丢上下文', hint: '能力断崖式下跌' },
        ],
        codeTabs: [
          {
            id: 'downgrade_routes',
            label: '中转站后台偷换路由示意',
            language: 'javascript',
            title: '假中转网关逻辑',
            code: `// 假中转站网关的典型造假代码示例:
app.post('/v1/chat/completions', async (req, res) => {
  const userModel = req.body.model;
  
  if (userModel.includes('claude-3-7-sonnet') || userModel.includes('gpt-5')) {
    // 🚨 偷换为极低成本的开源模型通道
    req.body.model = 'qwen-2.5-72b-instruct';
    // 注入伪造的系统提示词
    req.body.messages.unshift({
      role: 'system',
      content: 'You are Claude 3.7 Sonnet made by Anthropic.'
    });
  }
  
  return forwardToCheapUpstream(req, res);
});`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '执行时间地平线探针',
            description: '询问特定时间节点之后的专有事件，检验模型训练截止期的硬性边界。',
          },
          {
            stepNumber: 2,
            title: '执行语言学癖好探针',
            description: '探测不同厂商模型在标点符号、中文连接词与特定 Markdown 格式上的固有习惯。',
          },
          {
            stepNumber: 3,
            title: '综合判定降级概率',
            description: '一旦特征命中开源模型基准，系统立即打上降级标签并在证书中展示证据。',
          },
        ],
        callouts: [
          {
            type: 'danger',
            title: '如何识破身份伪装？',
            content:
              '永远不要问“你是谁”，直接测试模型的底层数学、编程边界与多维约束，套壳模型的硬实力差距一眼可见。',
          },
        ],
        faqs: [
          {
            question: '为什么有的套壳模型看起来很聪明？',
            answer:
              '现代开源大模型在日常问答上表现不错，但一遇到复杂的长上下文依赖、深层代码重构或严密数学证明时就会迅速崩溃。',
          },
        ],
      },

      // 5. 流式欺骗与 Token 偷工减料
      stream_token_cheating: {
        id: 'stream_token_cheating',
        categoryId: 'relay_traps',
        title: '流式欺骗与 Token 偷工减料',
        badge: '作弊剖析',
        protocol: 'Black Market Trap #2',
        subtitle:
          '解析中转站如何通过流式延迟缓冲、伪造 TPS 以及强制截断输出降低运营成本。',
        overviewSummary:
          '部分中转站为了掩盖上游并发不足或降低 Token 消耗，会使用流式代理进行字节截留、人为注入延时或者强制设定较低的 max_tokens，造成客户端生成不完整。',
        keyParams: [
          { label: '流式欺骗', value: '整段缓冲后假装逐字吐出', hint: '制造假 TPS' },
          { label: 'Token 截断', value: '强制截断超长回答', hint: '省输出 Token 费用' },
          { label: '计费篡改', value: '虚标 usage 计费数量', hint: '多扣用户额度' },
        ],
        codeTabs: [
          {
            id: 'stream_timing_analysis',
            label: '流式时间线异常分析',
            language: 'yaml',
            title: '流式探测特征',
            code: `Normal Stream:
  - TTFT: 450ms (均匀且迅速)
  - Inter-Token Latency: 15ms ~ 25ms (平滑稳定)
  - TPS: 55 tokens/s

Cheating Stream (假流式/缓冲代理):
  - TTFT: 3800ms (长时间无响应，源站等待全量生成)
  - Inter-Token Latency: 0.5ms (瞬间吐出整段)
  - Verdict: 伪造流式传输 (Fake SSE Stream)`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '逐帧记录 SSE Event Chunk 时间戳',
            description: '以毫秒级精度记录从请求发出到每个数据块到达的完整时间序列。',
          },
          {
            stepNumber: 2,
            title: '计算字间延迟方差 (Jitter)',
            description: '分析流式输出的离散度，识别人工节流与全量缓冲转发。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: '出现整段爆出文字是为什么？',
            content:
              '如果等待了几秒钟后文字瞬间全部弹出来，说明中转站开启了反向代理缓冲，严重影响 Coding Agent 的交互体验。',
          },
        ],
        faqs: [
          {
            question: '流式作弊对写代码有什么危害？',
            answer:
              '导致 IDE 插件（如 Cursor / Cline）长时间等待无法提前中断，且容易造成超时中断报错。',
          },
        ],
      },

      // 6. 假冒 429 限流与熔断套路
      fake_rate_limits: {
        id: 'fake_rate_limits',
        categoryId: 'relay_traps',
        title: '假冒 429 限流与熔断套路',
        badge: '套路拆解',
        protocol: 'Black Market Trap #3',
        subtitle:
          '中转站自身并发不足或欠费时，故意向用户抛出假的 429 报错骗取信任。',
        overviewSummary:
          '很多用户在遇到 429 Too Many Requests 时，以为是自己调用太频繁或官方限流。实则是中转站管理员为了省钱没有配置足够的上游账号，导致集群熔断并假冒官方报错。',
        keyParams: [
          { label: '真相', value: '中转站自身并发池被击穿', hint: '非用户原因' },
          { label: '识别依据', value: '单并发下依然频繁触发 429', hint: '中转站欠费/超载' },
        ],
        codeTabs: [
          {
            id: 'rate_limit_diag',
            label: '429 真实性诊断逻辑',
            language: 'bash',
            title: '单并发低频测试',
            code: `# 以 1 QPS 低频发送测试请求:
curl -i -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${model}", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}'

# 若低频依然返回 429:
# 结论: 中转站上游已严重欠费或被封号，非用户并发问题！`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '发起单线程探测',
            description: '排查是否在 1 QPS 极低并发下依然触发 429。',
          },
        ],
        callouts: [
          {
            type: 'danger',
            title: '遇到假 429 怎么办？',
            content: '立即停止向该中转站充值，并在工单中要求站长增加渠道并发配额。',
          },
        ],
        faqs: [
          {
            question: '429 和 402 的区别是什么？',
            answer: '429 代表频率超限，402 代表账户额度耗尽。',
          },
        ],
      },

      // 7. TTFT 与 TPS 黄金基准表
      ttft_tps_standards: {
        id: 'ttft_tps_standards',
        categoryId: 'benchmarks',
        title: 'TTFT 首字延迟与 TPS 黄金基准表',
        badge: '行业基准',
        protocol: 'Latency & Throughput Standard',
        subtitle:
          '各大官方模型与顶级中转站的首字响应时间与输出速率权威评级参考。',
        overviewSummary:
          'TTFT 决定了问答的“灵敏度”，TPS 决定了代码生成的“吞吐速度”。API-QuickCheck 依据业界权威数据制定了清晰的评级区间。',
        keyParams: [
          { label: 'TTFT 极速优秀', value: '< 600 ms', hint: '丝滑秒回' },
          { label: 'TTFT 正常可用', value: '600 ~ 1500 ms', hint: '主流正常水平' },
          { label: 'TTFT 严重卡顿', value: '> 2000 ms', hint: '网关排队或拥塞' },
        ],
        codeTabs: [
          {
            id: 'benchmark_table',
            label: '主流旗舰模型官方真实速率表',
            language: 'markdown',
            title: '官方标准吞吐参考',
            code: `| 模型名称 | 官方典型 TTFT | 官方标准 TPS | 评级阈值 |
| :--- | :--- | :--- | :--- |
| **Claude 3.7 Sonnet** | 500 ~ 900 ms | 45 ~ 75 tokens/s | 优秀: >50 tps |
| **Claude 3.5 Sonnet** | 450 ~ 800 ms | 55 ~ 85 tokens/s | 优秀: >60 tps |
| **GPT-4o** | 350 ~ 650 ms | 70 ~ 110 tokens/s | 优秀: >80 tps |
| **OpenAI o3-mini** | 800 ~ 1800 ms (含思考) | 50 ~ 90 tokens/s | 思考耗时正常 |
| **Grok 3** | 400 ~ 750 ms | 60 ~ 95 tokens/s | 优秀: >60 tps |
| **Gemini 2.5 Flash** | 200 ~ 450 ms | 120 ~ 250 tokens/s | 极速型模型 |`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '在首页发起测速',
            description: '点击中转站检测，系统将自动记录多次采样的 TTFT 与 TPS 并计算中位数。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '思考模型 (Reasoning Model) 的 TTFT 说明',
            content:
              '像 o1、o3-mini 或开启了 Thinking 的 Claude 3.7，TTFT 包含了模型内部隐式推理时间，因此 TTFT 在 1~3 秒内均属正常现象。',
          },
        ],
        faqs: [
          {
            question: 'TPS 为什么会忽高忽低？',
            answer: '受中转站上游集群负载、当前网络抖动以及输出文本复杂度影响。',
          },
        ],
      },

      // 8. 401/404/429/502 秒级自愈字典
      http_error_codes: {
        id: 'http_error_codes',
        categoryId: 'troubleshooting',
        title: '401/404/429/502 秒级自愈字典',
        badge: '排错手册',
        protocol: 'HTTP Diagnostics',
        subtitle:
          '全方位解析中转站调用过程中最常见的错误代码根因与秒级修复方案。',
        overviewSummary:
          '大模型接口报错绝大部分源于以下四个维度：鉴权、路由、配额与网络。对照下表可快速定位故障点。',
        keyParams: [
          { label: '401 Unauthorized', value: '密钥错误 / 过期 / 额度耗尽', hint: '排查 API Key' },
          { label: '404 Not Found', value: 'Base URL 缺 /v1 或模型名拼错', hint: '排查路由与模型名' },
          { label: '429 Rate Limit', value: '并发超限或中转站上游被限', hint: '降低并发或联系站长' },
          { label: '502 Bad Gateway', value: '中转站去连官方网络中断', hint: '等待重试或换渠道' },
        ],
        codeTabs: [
          {
            id: 'curl_diag_command',
            label: '一键诊断 cURL 脚本',
            language: 'bash',
            title: '带详细 Headers 响应的诊断命令',
            code: `curl -i -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 10
  }'`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '查看 HTTP 状态码与 error.message',
            description: '查看返回的 JSON 结构体中 error 对象包含的详细说明。',
          },
          {
            stepNumber: 2,
            title: '对照字典采取修复动作',
            description: '检查是否漏写 /v1，或 Key 前后是否包含多余空格。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '404 最常见原因：Base URL 漏写 /v1',
            content:
              'OpenAI SDK 规范要求 Base URL 必须以 /v1 结尾（如 https://api.example.com/v1），若写成 https://api.example.com 会直接返回 404。',
          },
        ],
        faqs: [
          {
            question: '返回 Cloudflare 521 / 502 网页说明什么？',
            answer: '说明中转站源站服务器宕机或开启了高防验证拦截。',
          },
        ],
      },

      // 9. API 规范与反代配置
      api_specifications: {
        id: 'api_specifications',
        categoryId: 'troubleshooting',
        title: 'OpenAI/Anthropic 协议与反代规范',
        badge: '协议规范',
        protocol: 'RFC & SSE Specifications',
        subtitle:
          '深入解析 OpenAI 与 Anthropic 两大主流协议规范差异、Header 鉴权要求与 SSE 流式传输关键点。',
        overviewSummary:
          '自建或配置中转网关时，必须正确配置 Nginx 的 proxy_buffering 设置，否则会导致严重的流式卡顿。',
        keyParams: [
          { label: 'OpenAI 协议端点', value: '/v1/chat/completions', hint: 'Authorization: Bearer' },
          { label: 'Anthropic 端点', value: '/v1/messages', hint: 'x-api-key 鉴权' },
          { label: 'Nginx 关键配置', value: 'proxy_buffering off;', hint: '必须关闭流式缓冲' },
        ],
        codeTabs: [
          {
            id: 'nginx_conf',
            label: 'Nginx 正确反代配置模板',
            language: 'nginx',
            title: 'Nginx 反代配置',
            code: `location /v1/ {
    proxy_pass https://api.openai.com/v1/;
    proxy_ssl_server_name on;
    proxy_set_header Host api.openai.com;
    
    # 🚨 关键：必须关闭缓冲以支持丝滑 SSE 流式
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
    proxy_read_timeout 600s;
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '确认客户端协议类型',
            description: '区分客户端是采用 OpenAI Compatible 还是 Anthropic Messages。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '跨域 CORS 规范',
            content: '前端网页直连 API 时，中转站需在响应头中包含 Access-Control-Allow-Origin: *。',
          },
        ],
        faqs: [
          {
            question: '为什么流式传输时卡顿很久才一下出来？',
            answer: '因为 Nginx 或网关开启了 proxy_buffering 响应缓冲，关闭即可恢复逐字流式。',
          },
        ],
      },

      // 10. 自动化验真脚本与 CI/CD 流水线
      cicd_automation: {
        id: 'cicd_automation',
        categoryId: 'developer_api',
        title: '自动化验真脚本与 CI/CD 流水线',
        badge: 'DevOps',
        protocol: 'API-QuickCheck CLI & Automation',
        subtitle:
          '如何在生产环境、自动化测试脚本与 CI/CD 流水线中集成 API-QuickCheck 批量质量检测。',
        overviewSummary:
          '企业可在采购或切换中转渠道时，将 API-QuickCheck 探针集成到自动化脚本中，实现上游渠道质量的持续监控与自动熔断报警。',
        keyParams: [
          { label: '集成方式', value: 'Node.js / Python / cURL / GitHub Actions', hint: '全流程支持' },
          { label: '报警机制', value: '保真分 < 80 自动告警熔断', hint: '保障生产稳定性' },
        ],
        codeTabs: [
          {
            id: 'nodejs_script',
            label: 'Node.js 自动化检测脚本',
            language: 'typescript',
            title: 'ci-fidelity-check.ts',
            code: `import { silentFetch } from './src/engine/transport/silentTransport';

async function checkRelayHealth() {
  const baseUrl = process.env.RELAY_BASE_URL || '${cleanBaseUrl}';
  const apiKey = process.env.RELAY_API_KEY || '${apiKey}';
  const model = '${model}';

  console.log('🚀 开始对中转站进行自动化质检...');
  const start = Date.now();

  const res = await fetch(\`\${baseUrl}/chat/completions\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5,
    }),
  });

  const latency = Date.now() - start;
  if (!res.ok) {
    throw new Error(\`🚨 中转站异常: HTTP \${res.status}\`);
  }

  console.log(\`✅ 中转站健康正常! 延迟: \${latency}ms\`);
}

checkRelayHealth().catch(console.error);`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '配置 CI 环境变量',
            description: '在 GitHub Actions 或服务器中注入 RELAY_BASE_URL 与 RELAY_API_KEY。',
          },
          {
            stepNumber: 2,
            title: '加入定时 Cron 或部署流水线',
            description: '每小时或每次部署前自动运行体检脚本，异常时自动发送邮件或 Webhook 告警。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '生产环境防踩坑建议',
            content: '配置至少 2 个备用中转站渠道，并在 CI 流水线中定期轮询测真，确保核心业务高可用。',
          },
        ],
        faqs: [
          {
            question: '自动化脚本会消耗很多 Token 吗？',
            answer: '极少。API-QuickCheck 探针均经过极限压缩，单次体检消耗通常不超过 200 Tokens。',
          },
        ],
      },
    };
  }, [cleanBaseUrl, apiKey, model]);

  // Current doc item content
  const currentDoc = docContents[activeItem] || docContents.about_quickcheck;

  // Active code tab fallback
  const currentCodeTabs = currentDoc.codeTabs;
  const currentSelectedTab = currentCodeTabs.find((t) => t.id === activeCodeTab) || currentCodeTabs[0];

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return CATEGORIES.map((cat) => {
      const matchedItems = cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q)) ||
          cat.title.toLowerCase().includes(q)
      );
      return {
        ...cat,
        items: matchedItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  // Category find helper
  const currentCategoryGroup = CATEGORIES.find((c) => c.id === currentDoc.categoryId) || CATEGORIES[0];

  // Flat items for prev/next pagination
  const allDocItems = useMemo(() => CATEGORIES.flatMap((c) => c.items), []);
  const currentDocIndex = allDocItems.findIndex((item) => item.id === activeItem);
  const prevDocItem = currentDocIndex > 0 ? allDocItems[currentDocIndex - 1] : null;
  const nextDocItem =
    currentDocIndex >= 0 && currentDocIndex < allDocItems.length - 1
      ? allDocItems[currentDocIndex + 1]
      : null;

  const navigateToDoc = (docId: DocItemId) => {
    setActiveItem(docId);
    const doc = docContents[docId];
    if (doc && doc.codeTabs.length > 0) {
      setActiveCodeTab(doc.codeTabs[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#141413]">
      
      {/* Full-width docs layout matching OpenCode */}
      <div className="flex-1 flex w-full relative">
        
        {/* ========================================== */}
        {/* Left Column: Flush-Left Resizable Sidebar  */}
        {/* ========================================== */}
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className="shrink-0 sticky top-0 h-[calc(100vh-65px)] border-r border-[#2e2b27] bg-[#141413] flex flex-col z-20 select-none"
        >
          {/* Top Search & Filter Bar */}
          <div className="p-3.5 border-b border-[#2e2b27]/80 bg-[#171615]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档与技术规范..."
                className="w-full rounded-lg border border-[#2e2b27] bg-[#1b1a18] py-1.5 pl-8 pr-14 text-xs text-[#faf9f5] placeholder-neutral-400 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c] transition font-medium"
              />
              <div className="absolute right-2 top-1.5 flex items-center">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-neutral-400 hover:text-white px-1"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-400 bg-[#23211e] px-1.5 py-0.5 rounded border border-[#2e2b27]">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Category Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredCategories.map((group) => {
              const IconComp = group.icon;
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 hover:text-white rounded-md transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <IconComp className="h-3.5 w-3.5 text-[#cc785c] shrink-0" />
                      <span className="truncate">{group.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {group.badge && (
                        <span className="text-[9px] text-neutral-400 bg-[#23211e] px-1.5 py-0.2 rounded border border-[#2e2b27]">
                          {group.badge}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Items in Category */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-2">
                      {group.items.map((item) => {
                        const isActive = activeItem === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateToDoc(item.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                              isActive
                                ? 'bg-[#cc785c]/20 text-[#faf9f5] font-semibold border-l-2 border-[#cc785c] shadow-sm'
                                : 'text-neutral-300 hover:text-white hover:bg-[#1f1e1c] font-medium'
                            }`}
                          >
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 font-semibold ${
                                  isActive
                                    ? 'bg-[#cc785c] text-white'
                                    : 'bg-[#23211e] text-neutral-400 border border-[#2e2b27]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Bottom Quick Live Context */}
          <div className="p-3 border-t border-[#2e2b27]/80 bg-[#171615] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400 font-medium">
              <span className="font-mono uppercase text-[10px]">Active Relay</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
            </div>
            <div className="font-mono text-neutral-200 text-xs truncate select-all" title={cleanBaseUrl}>
              {cleanBaseUrl}
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* Resizable Divider Handle (Drag to Resize)  */}
        {/* ========================================== */}
        <div
          onMouseDown={startResizing}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-[#cc785c]/80 transition-all cursor-col-resize z-30 shrink-0 select-none relative group -ml-0.5"
          title="拖拽调节侧边栏宽度"
        >
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-8 -ml-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div className="w-0.5 h-4 bg-[#faf9f5] rounded-full shadow-md" />
          </div>
        </div>

        {/* ========================================== */}
        {/* Center & Right: Main Article Reading Area  */}
        {/* ========================================== */}
        <div className="flex-1 min-w-0 flex justify-center py-8 px-6 lg:px-12 xl:px-16 overflow-y-auto">
          
          <div className="w-full max-w-4xl space-y-10 min-w-0">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span
                className="hover:text-white cursor-pointer font-medium"
                onClick={() => navigateToDoc('about_quickcheck')}
              >
                文档中心 (Docs)
              </span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-neutral-300 font-medium">{currentCategoryGroup.title}</span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-[#cc785c] font-semibold">{currentDoc.title}</span>
            </div>

            {/* Document Header */}
            <div className="space-y-4 pb-6 border-b border-[#2e2b27]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#cc785c]/40 bg-[#cc785c]/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#cc785c] tracking-wide">
                  {currentDoc.badge}
                </span>
                <span className="rounded-md border border-[#2e2b27] bg-[#23211e] px-2.5 py-0.5 text-xs font-mono text-neutral-300 font-medium">
                  {currentDoc.protocol}
                </span>
              </div>

              <h1 className="font-serif-display text-3xl md:text-4xl font-bold text-[#faf9f5] tracking-tight">
                {currentDoc.title}
              </h1>

              <p className="text-base text-neutral-300 leading-relaxed font-normal">
                {currentDoc.subtitle}
              </p>
            </div>

            {/* Section 1: Overview & Parameters */}
            <section id="overview" className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <Layers className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-lg font-semibold text-[#faf9f5]">1. 机制解析与核心指标 (Mechanism & Metrics)</h2>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">
                {currentDoc.overviewSummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {currentDoc.keyParams.map((param, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-1.5 hover:border-[#cc785c]/40 transition smooth-card"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                      <span>{param.label}</span>
                      {param.hint && (
                        <span className="text-[10px] text-neutral-400 font-normal">{param.hint}</span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#faf9f5] truncate select-all tracking-wide">
                      {param.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Code Snippets & Spec */}
            <section id="quick-config" className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-lg font-semibold text-[#faf9f5]">2. 技术报文与数据结构 (Payload & Protocol)</h2>
              </div>

              {/* Multi-Tab Selector */}
              {currentCodeTabs.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#2e2b27]">
                  {currentCodeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCodeTab(tab.id)}
                      className={`rounded-t-lg px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap border-b-2 smooth-btn ${
                        currentSelectedTab.id === tab.id
                          ? 'border-[#cc785c] text-[#faf9f5] bg-[#23211e]'
                          : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#1b1a18]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Code Block Container */}
              <div className="space-y-2">
                <CodeBlock
                  code={currentSelectedTab.code}
                  language={currentSelectedTab.language}
                  title={currentSelectedTab.title || currentDoc.id}
                  showLineNumbers
                />
              </div>
            </section>

            {/* Section 3: Step-by-Step Guide */}
            <section id="step-by-step" className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-lg font-semibold text-[#faf9f5]">3. 检验步骤与执行逻辑 (Action Guide)</h2>
              </div>

              <div className="space-y-3">
                {currentDoc.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-2 transition hover:border-[#cc785c]/40 smooth-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#cc785c] text-xs font-bold text-[#faf9f5] shadow-sm">
                        {step.stepNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-[#faf9f5]">{step.title}</h3>
                    </div>
                    <p className="text-xs text-neutral-300 pl-9 leading-relaxed font-normal">
                      {step.description}
                    </p>
                    {step.code && (
                      <div className="pl-9 pt-2">
                        <CodeBlock code={step.code} language={step.language || 'bash'} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Tips & Warnings Callouts */}
            {currentDoc.callouts.length > 0 && (
              <section id="tips-warnings" className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold text-[#faf9f5]">4. 关键注意事项与避坑 (Key Insights)</h2>
                </div>

                <div className="space-y-3">
                  {currentDoc.callouts.map((callout, idx) => {
                    const isWarning = callout.type === 'warning';
                    const isDanger = callout.type === 'danger';
                    const isTip = callout.type === 'tip';

                    const borderClass = isDanger
                      ? 'border-[#e11d48]/40 bg-[#4c0519]/20 text-[#faf9f5]'
                      : isWarning
                      ? 'border-[#d97706]/40 bg-[#451a03]/20 text-[#faf9f5]'
                      : isTip
                      ? 'border-[#059669]/40 bg-[#064e3b]/20 text-[#faf9f5]'
                      : 'border-[#cc785c]/40 bg-[#cc785c]/10 text-[#faf9f5]';

                    const iconColor = isDanger
                      ? 'text-[#fda4af]'
                      : isWarning
                      ? 'text-[#fcd34d]'
                      : isTip
                      ? 'text-[#6ee7b7]'
                      : 'text-[#cc785c]';

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-4 space-y-1.5 shadow-sm smooth-card ${borderClass}`}
                      >
                        <div className="flex items-center gap-2">
                          {isDanger || isWarning ? (
                            <AlertTriangle className={`h-4 w-4 ${iconColor}`} />
                          ) : isTip ? (
                            <CheckCircle2 className={`h-4 w-4 ${iconColor}`} />
                          ) : (
                            <Info className={`h-4 w-4 ${iconColor}`} />
                          )}
                          <h4 className="text-xs font-bold tracking-wide uppercase">{callout.title}</h4>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed pl-6 font-normal">
                          {callout.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 5: FAQ */}
            {currentDoc.faqs.length > 0 && (
              <section id="faq" className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold text-[#faf9f5]">5. 常见问题 (FAQ)</h2>
                </div>

                <div className="space-y-3">
                  {currentDoc.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-1.5 smooth-card"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono font-bold text-[#cc785c] mt-0.5">Q:</span>
                        <h4 className="text-xs font-semibold text-[#faf9f5]">{faq.question}</h4>
                      </div>
                      <div className="flex items-start gap-2 pl-4 text-xs text-neutral-300 leading-relaxed">
                        <span className="font-mono font-bold text-[#6ee7b7] mt-0.5">A:</span>
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bottom Article Navigation (OpenCode Previous & Next Cards) */}
            <div className="pt-8 border-t border-[#2e2b27] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Previous Article */}
                {prevDocItem ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(prevDocItem.id)}
                    className="flex flex-col items-start p-4 rounded-xl border border-[#2e2b27] bg-[#1b1a18] hover:border-[#cc785c]/60 hover:bg-[#23211e] transition text-left smooth-card smooth-btn group"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-[#cc785c] transition font-medium">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>上一篇</span>
                    </div>
                    <div className="mt-1 font-semibold text-sm text-[#faf9f5] group-hover:text-white truncate w-full">
                      {prevDocItem.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {/* Next Article */}
                {nextDocItem ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(nextDocItem.id)}
                    className="flex flex-col items-end p-4 rounded-xl border border-[#2e2b27] bg-[#1b1a18] hover:border-[#cc785c]/60 hover:bg-[#23211e] transition text-right smooth-card smooth-btn group"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-[#cc785c] transition font-medium">
                      <span>下一篇</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-1 font-semibold text-sm text-[#faf9f5] group-hover:text-white truncate w-full">
                      {nextDocItem.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Back to Top */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
                <div>
                  当前正在浏览: <span className="text-[#faf9f5] font-semibold">{currentDoc.title}</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-[#cc785c] hover:underline flex items-center gap-1 font-semibold smooth-btn"
                >
                  <span>回到顶部 ↑</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: TOC "本页内容" (Desktop Sticky) */}
          <div className="hidden xl:block w-56 ml-10 sticky top-8 h-fit space-y-4">
            <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-3 shadow-md smooth-card">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-semibold text-[#faf9f5] pb-2 border-b border-[#2e2b27]">
                <Hash className="h-3.5 w-3.5 text-[#cc785c]" />
                <span>本页内容</span>
              </div>

              <nav className="space-y-1.5 text-xs">
                <button
                  onClick={() => scrollToSection('overview')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  1. 机制解析与核心指标
                </button>
                <button
                  onClick={() => scrollToSection('quick-config')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  2. 技术报文与数据结构
                </button>
                <button
                  onClick={() => scrollToSection('step-by-step')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  3. 检验步骤与执行逻辑
                </button>
                {currentDoc.callouts.length > 0 && (
                  <button
                    onClick={() => scrollToSection('tips-warnings')}
                    className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                  >
                    4. 关键注意事项与避坑
                  </button>
                )}
                {currentDoc.faqs.length > 0 && (
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                  >
                    5. 常见问题 (FAQ)
                  </button>
                )}
              </nav>

              {/* Quick Actions in TOC Card */}
              <div className="pt-3 border-t border-[#2e2b27] space-y-2">
                <button
                  onClick={handleCopyGlobalConfig}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#2e2b27] bg-[#23211e] py-1.5 text-xs text-neutral-300 hover:text-white hover:border-[#cc785c]/60 transition smooth-btn shadow-sm font-semibold tracking-wide"
                >
                  <Copy className="h-3 w-3" />
                  <span>{globalCopied ? '已复制' : '复制全局配置 JSON'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
