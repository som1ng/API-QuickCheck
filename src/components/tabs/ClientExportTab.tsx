import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Search,
  Sparkles,
  Activity,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Gauge,
  Sliders
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
  // 1. 概览
  | 'about_quickcheck'
  // 2. 验真体系
  | 'probe_matrix'
  | 'cryptographic_signatures'
  // 3. 常见降级手法
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
// Category Definitions (OpenCode Minimal Layout)
// ==========================================

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'overview',
    title: '概览与设计体系',
    badge: 'Guide',
    icon: Sparkles,
    items: [
      { id: 'about_quickcheck', title: 'API-QuickCheck 验真体系', badge: 'Core' },
    ],
  },
  {
    id: 'fidelity_architecture',
    title: '验真体系与密码学',
    badge: 'Fidelity',
    icon: ShieldCheck,
    items: [
      { id: 'probe_matrix', title: '8 维反作弊探针矩阵', badge: 'Matrix' },
      { id: 'cryptographic_signatures', title: 'Anthropic 官方私钥验签机制', badge: 'Crypto' },
    ],
  },
  {
    id: 'relay_traps',
    title: '中转降级手法剖析',
    badge: 'Security',
    icon: Sliders,
    items: [
      { id: 'model_downgrades', title: '开源模型偷换套壳', badge: 'Downgrade' },
      { id: 'stream_token_cheating', title: '流式延迟与 Token 截断', badge: 'Streaming' },
      { id: 'fake_rate_limits', title: '伪造 429 限流报错', badge: 'RateLimit' },
    ],
  },
  {
    id: 'benchmarks',
    title: '性能与基准测速',
    badge: 'Metrics',
    icon: Gauge,
    items: [
      { id: 'ttft_tps_standards', title: 'TTFT 与 TPS 评级标准', badge: 'Standard' },
    ],
  },
  {
    id: 'troubleshooting',
    title: '排错与协议规范',
    badge: 'Debug',
    icon: Activity,
    items: [
      { id: 'http_error_codes', title: 'HTTP 状态码自愈字典', badge: 'HTTP' },
      { id: 'api_specifications', title: '网关与反代配置规范', badge: 'RFC' },
    ],
  },
  {
    id: 'developer_api',
    title: '开发者与自动化',
    badge: 'DevOps',
    icon: FileCode2,
    items: [
      { id: 'cicd_automation', title: 'CI/CD 自动化流水线集成', badge: 'CLI' },
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
      // 1. 概览
      about_quickcheck: {
        id: 'about_quickcheck',
        categoryId: 'overview',
        title: 'API-QuickCheck 验真体系',
        badge: 'Architecture',
        protocol: 'Zero-Storage / Memory Only',
        subtitle:
          '基于密码学数字签名校验与 8 维对抗式逻辑探针的大模型 API 质量检测与防篡改验证系统。',
        overviewSummary:
          '针对第三方大模型中转站常见的开源模型套壳、数据流篡改以及降速节流现象，API-QuickCheck 依托底层通信协议特征与数学签名，提供不依赖主观文本判断的客观保真度评估。',
        keyParams: [
          { label: '检测逻辑', value: '密码学签名 + 逻辑反作弊', hint: '权重综合判定' },
          { label: '数据存储', value: '100% 内存直连 / 无落盘', hint: '请求完毕即刻销毁' },
          { label: '支持协议', value: 'OpenAI / Anthropic / Google / xAI', hint: '官方标准格式' },
          { label: '输出产物', value: 'Veridrop 格式验真证书', hint: '含遥测数据与证据链' },
        ],
        codeTabs: [
          {
            id: 'architecture_diagram',
            label: '探测流程与架构',
            language: 'yaml',
            title: 'Pipeline Architecture',
            code: `Pipeline:
  1. Handshake:
     - 测量首字时间 (TTFT) 与网络握手
     - 捕获响应 Headers 与 Server 特征
  2. Cryptographic Proof:
     - 提取 Anthropic Official Thinking Signature
     - 验证 RSA/ECC 非对称数字签名合法性
  3. Stream Reasoning Delta:
     - 解析原生流式思维链 chunk
     - 检查是否存在伪造 <thinking> 纯文本
  4. Logic Probes:
     - 空间几何拓扑 (Spatial Topology) 逻辑
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
            title: '配置中转站 Base URL 与 API Key',
            description: '填入目标站点的 API 端点地址与调用密钥，系统自动嗅探可用模型列表。',
          },
          {
            stepNumber: 2,
            title: '选定目标模型与探测项',
            description: '选择 Anthropic Claude、OpenAI、xAI Grok 或 Google Gemini 进行定制化扫描。',
          },
          {
            stepNumber: 3,
            title: '执行检测并生成证据链',
            description: '系统在 5~15 秒内完成并发探测并颁发不可篡改的验真报告。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '零存储安全机制',
            content:
              'API-QuickCheck 不设后端数据库，所有网络通信均由浏览器本地直接发起或经由无状态中间件透明转发。',
          },
        ],
        faqs: [
          {
            question: '为什么需要多维探针？',
            answer:
              '简单的身份问答可被中转站通过修改 System Prompt 轻易伪造。只有基于底层数学签名与高阶推理能力的探针才能有效穿透套壳。',
          },
        ],
      },

      // 2. 8 维探针矩阵
      probe_matrix: {
        id: 'probe_matrix',
        categoryId: 'fidelity_architecture',
        title: '8 维反作弊探针矩阵',
        badge: 'Probe Matrix',
        protocol: 'Adversarial Probe Matrix v2.5',
        subtitle:
          '通过底层通信结构、边界约束测试与多维逻辑分析构建的综合质检矩阵。',
        overviewSummary:
          '探针矩阵从密码学有效性、流式结构、排他性逻辑依从以及空间建模能力等 8 个维度交叉验证模型真伪。',
        keyParams: [
          { label: '官方数字签名', value: 'Anthropic 官方私钥验签', hint: '权重: 30%' },
          { label: '流式思维链', value: '原生 Thinking Delta 提取', hint: '权重: 20%' },
          { label: '排他性约束', value: 'OpenAI 多重负向条件依从', hint: '权重: 15%' },
          { label: '空间几何拓扑', value: '多维空间旋转逻辑', hint: '权重: 10%' },
        ],
        codeTabs: [
          {
            id: 'probe_details',
            label: '探针定义清单',
            language: 'json',
            title: 'Probe Specifications',
            code: `{
  "probes": [
    {
      "id": "anthropic_signature",
      "name": "Anthropic 官方私钥签名验真",
      "mechanism": "验证 thinking 块中 signature 字段是否符合官方非对称加密格式"
    },
    {
      "id": "thinking_delta",
      "name": "原生流式思维链 Delta 提取",
      "mechanism": "检查 SSE 流是否使用原生 thinking_delta 事件"
    },
    {
      "id": "openai_constraint",
      "name": "OpenAI 严格负向约束依从",
      "mechanism": "测试复杂多重否定与排他性逻辑执行精度"
    },
    {
      "id": "knowledge_horizon",
      "name": "知识库截止期断代",
      "mechanism": "探测模型对特定时间节点后事件的真实记忆边界"
    },
    {
      "id": "spatial_topology",
      "name": "空间拓扑三维旋转",
      "mechanism": "测试高阶模型具备的三维空间建模与推断能力"
    },
    {
      "id": "semantic_nuance",
      "name": "跨语言双关语与语境理解",
      "mechanism": "测试多语言语境下的细微修辞与隐喻推断"
    },
    {
      "id": "prompt_injection_immunity",
      "name": "系统提示词抗注入与对齐防御",
      "mechanism": "测试模型官方安全对齐强度与中转包装穿透性"
    },
    {
      "id": "token_consumption_audit",
      "name": "Token 消耗与报文完整性审计",
      "mechanism": "核对 usage 字段中 completion_tokens 真实性"
    }
  ]
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '并发下发非线性探针报文',
            description: '向目标端点并发分发不同逻辑维度的对抗性 Payload。',
          },
          {
            stepNumber: 2,
            title: '实时解析 SSE 事件帧',
            description: '提取底层 Server-Sent Events 事件类型、时间间隔与元数据。',
          },
          {
            stepNumber: 3,
            title: '交叉比对官方基准指纹',
            description: '将回包数据与官方真机基准库进行指纹比对与打分。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '空间几何拓扑判定原理',
            content:
              '空间几何探针需要参数量庞大的高阶模型进行多维空间推算，小参数开源模型在此类推断中必然出现逻辑矛盾。',
          },
        ],
        faqs: [
          {
            question: '探针能否被 Prompt 伪装欺骗？',
            answer:
              '不能。探针检验的是底层推理能力与通信数据结构，Prompt 无法凭空生成不存在的逻辑推理能力与数字签名。',
          },
        ],
      },

      // 3. Anthropic 官方私钥验签
      cryptographic_signatures: {
        id: 'cryptographic_signatures',
        categoryId: 'fidelity_architecture',
        title: 'Anthropic 官方私钥验签机制',
        badge: 'Cryptography',
        protocol: 'Anthropic Signature Verification',
        subtitle:
          '基于非对称加密数字签名的官方思维链防伪校验机制。',
        overviewSummary:
          'Anthropic 官方在 Claude 3.7 模型中引入了 Thinking Signature 机制：推理集群在生成思维链时，通过官方私钥生成不可伪造的数字签名。',
        keyParams: [
          { label: '加密体系', value: 'Anthropic Official RSA/ECC', hint: '官方私钥签发' },
          { label: '载体字段', value: 'content_block.signature', hint: '原生协议字段' },
          { label: '伪造难度', value: '数学不可行 (Cryptographically Impossible)', hint: '无私钥不可伪造' },
        ],
        codeTabs: [
          {
            id: 'signature_structure',
            label: '官方回包结构',
            language: 'json',
            title: 'Official Thinking Stream Signature',
            code: `// 官方标准回包 (Anthropic Messages API)
{
  "type": "content_block_start",
  "content_block": {
    "type": "thinking",
    "thinking": "Analysis in progress...",
    "signature": "EqkBCgIYAhIQV1X7x8k2N4m9Z8P...[Anthropic Private Key Signed Hash]..."
  }
}

// 伪造套壳回包 (开源模型包装)
{
  "choices": [{
    "delta": {
      "content": "<thinking>思考中...</thinking>回答内容..."
    }
  }]
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '下发 thinking 参数',
            description: '请求携带 thinking: { type: "enabled", budget_tokens: 1024 } 配置。',
          },
          {
            stepNumber: 2,
            title: '提取 signature 密文字段',
            description: '从数据流中解析 content_block.signature 字段。',
          },
          {
            stepNumber: 3,
            title: '校验签名格式与有效性',
            description: '缺少 signature 字段或仅返回纯文本 <thinking> 标签判定为未通过。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: '格式转换注意',
            content:
              '若中转站仅开放 /v1/chat/completions 并将 Claude 转换为 OpenAI 格式，通常会丢失官方签名信息。',
          },
        ],
        faqs: [
          {
            question: '第三方中转能否伪造 signature？',
            answer:
              '不能。数字签名依赖 Anthropic 官方集群持有的非对称私钥，第三方无法伪造合法有效签名。',
          },
        ],
      },

      // 4. 开源模型偷换套壳
      model_downgrades: {
        id: 'model_downgrades',
        categoryId: 'relay_traps',
        title: '开源模型偷换套壳',
        badge: 'Downgrade Analysis',
        protocol: 'Routing Manipulation',
        subtitle:
          '中转服务商将旗舰模型请求转发至廉价开源模型的降级行为分析。',
        overviewSummary:
          '部分中转服务对外标称 Claude 3.7 或 GPT-5，但在网关路由层将请求重定向至低成本开源模型（如 Qwen 或 DeepSeek），通过篡改 System Prompt 伪造模型身份。',
        keyParams: [
          { label: '常见手段', value: '网关路由重定向 + Prompt 身份伪造', hint: '后台动态转发' },
          { label: '成本差异', value: '10 ~ 50 倍成本差价', hint: '暴利驱动' },
          { label: '表现特征', value: '代码重构易错、长上下文丢失、逻辑断层', hint: '能力下降明显' },
        ],
        codeTabs: [
          {
            id: 'downgrade_routes',
            label: '网关重定向示意',
            language: 'javascript',
            title: 'Gateway Redirection Mock',
            code: `// 中转网关动态转发伪代码
app.post('/v1/chat/completions', async (req, res) => {
  const requestedModel = req.body.model;
  
  if (requestedModel.includes('claude-3-7-sonnet') || requestedModel.includes('gpt-5')) {
    // 重定向至低成本开源通道
    req.body.model = 'qwen-2.5-72b-instruct';
    // 注入伪造的系统提示词
    req.body.messages.unshift({
      role: 'system',
      content: 'You are Claude 3.7 Sonnet made by Anthropic.'
    });
  }
  
  return forwardToUpstream(req, res);
});`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '执行时间地平线探针',
            description: '测试模型对特定时间节点后事件的记忆边界。',
          },
          {
            stepNumber: 2,
            title: '执行语言学特征探针',
            description: '探测特定厂商模型固有的标点、句式与 Markdown 输出偏好。',
          },
          {
            stepNumber: 3,
            title: '计算综合降级概率',
            description: '特征命中开源基准库即标记降级风险并在报告中列出证据。',
          },
        ],
        callouts: [
          {
            type: 'danger',
            title: '辨别原则',
            content: '避免询问模型身份，通过底层数学推导与严格约束验证模型实际推理能力。',
          },
        ],
        faqs: [
          {
            question: '开源模型与旗舰模型的主要差距在哪里？',
            answer:
              '在复杂多步骤推理、严格排他性指令依从以及深层代码重构等极限场景下差异明显。',
          },
        ],
      },

      // 5. 流式延迟与 Token 截断
      stream_token_cheating: {
        id: 'stream_token_cheating',
        categoryId: 'relay_traps',
        title: '流式延迟与 Token 截断',
        badge: 'Streaming Analysis',
        protocol: 'SSE Cheating & Truncation',
        subtitle:
          '中转网关进行整段缓冲、伪造流式速率及强制限制输出长度的行为分析。',
        overviewSummary:
          '中转站为掩盖上游并发瓶颈或减少 Token 消耗，可能采用流式代理整段缓冲后再行吐字，或强制设定较低的 max_tokens 导致生成截断。',
        keyParams: [
          { label: '整段缓冲', value: '全量生成后伪造逐字流式', hint: '假流式传输' },
          { label: '输出截断', value: '强制截断超长回答', hint: '节省成本' },
          { label: '计费虚标', value: '虚标 usage 统计数量', hint: '超额扣费' },
        ],
        codeTabs: [
          {
            id: 'stream_timing_analysis',
            label: '流式时间序列特征',
            language: 'yaml',
            title: 'SSE Timing Metrics',
            code: `Normal Stream:
  - TTFT: 450ms (稳定迅速)
  - Inter-Token Latency: 15ms ~ 25ms (平滑均匀)
  - TPS: 55 tokens/s

Buffered Fake Stream:
  - TTFT: 3800ms (源站等待全量生成)
  - Inter-Token Latency: 0.5ms (瞬间吐出整段)
  - Result: Fake SSE Stream Detected`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '记录 SSE Chunk 时间序列',
            description: '毫秒级记录从发送请求到每个数据块到达的时间戳。',
          },
          {
            stepNumber: 2,
            title: '计算字间延迟方差',
            description: '分析流式离散度，识别全量缓冲转发。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: '假流式对开发工具的影响',
            content: '整段缓冲会导致 Coding Agent（如 Cursor / Cline）长时间挂起且无法提前中断。',
          },
        ],
        faqs: [
          {
            question: '如何排查流式缓冲问题？',
            answer: '检查中转网关 Nginx 是否配置了 proxy_buffering off;。',
          },
        ],
      },

      // 6. 伪造 429 限流报错
      fake_rate_limits: {
        id: 'fake_rate_limits',
        categoryId: 'relay_traps',
        title: '伪造 429 限流报错',
        badge: 'Error Analysis',
        protocol: 'Rate Limiting Diagnostic',
        subtitle:
          '中转网关并发资源枯竭或账号异常时伪造 429 报错的行为分析。',
        overviewSummary:
          '当服务商上游账号池欠费、被封禁或并发耗尽时，网关往往直接向客户端返回 429 Too Many Requests，误导用户为自身调用频次过高。',
        keyParams: [
          { label: '成因', value: '中转站上游并发池击穿或欠费', hint: '非客户端原因' },
          { label: '判定条件', value: '单并发极低频调用依然触发 429', hint: '上游资源故障' },
        ],
        codeTabs: [
          {
            id: 'rate_limit_diag',
            label: '单并发探测命令',
            language: 'bash',
            title: 'Low Frequency Probe',
            code: `# 1 QPS 单并发低频探测
curl -i -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${model}", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 5}'

# 若低频依然返回 429，说明为中转站上游资源枯竭`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '发起 1 QPS 单线程探测',
            description: '验证在排除自身并发干扰后的端点可用性。',
          },
        ],
        callouts: [
          {
            type: 'danger',
            title: '处置建议',
            content: '若单并发下持续返回 429，应及时联系服务商扩容渠道或切换备用线路。',
          },
        ],
        faqs: [
          {
            question: '429 与 402 的差异？',
            answer: '429 为调用频率超限，402 为账户余额耗尽。',
          },
        ],
      },

      // 7. TTFT 与 TPS 评级标准
      ttft_tps_standards: {
        id: 'ttft_tps_standards',
        categoryId: 'benchmarks',
        title: 'TTFT 与 TPS 评级标准',
        badge: 'Benchmarks',
        protocol: 'Latency & Throughput Standard',
        subtitle:
          '主流旗舰模型首字延迟与生成速率官方基准参考。',
        overviewSummary:
          '首字延迟 (TTFT) 与生成速率 (TPS) 是评估 API 服务质量的核心物理指标。',
        keyParams: [
          { label: 'TTFT 优良区间', value: '< 600 ms', hint: '极速响应' },
          { label: 'TTFT 正常区间', value: '600 ~ 1500 ms', hint: '主流水准' },
          { label: 'TTFT 拥塞区间', value: '> 2000 ms', hint: '网关排队' },
        ],
        codeTabs: [
          {
            id: 'benchmark_table',
            label: '官方基准速率参考表',
            language: 'markdown',
            title: 'Official Telemetry Standard',
            code: `| 模型名称 | 典型 TTFT | 标准 TPS | 评级阈值 |
| :--- | :--- | :--- | :--- |
| Claude 3.7 Sonnet | 500 ~ 900 ms | 45 ~ 75 tokens/s | >50 tps |
| Claude 3.5 Sonnet | 450 ~ 800 ms | 55 ~ 85 tokens/s | >60 tps |
| GPT-4o | 350 ~ 650 ms | 70 ~ 110 tokens/s | >80 tps |
| OpenAI o3-mini | 800 ~ 1800 ms (含推理) | 50 ~ 90 tokens/s | 推理耗时正常 |
| Grok 3 | 400 ~ 750 ms | 60 ~ 95 tokens/s | >60 tps |
| Gemini 2.5 Flash | 200 ~ 450 ms | 120 ~ 250 tokens/s | 极速型 |`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '在控制台发起测速',
            description: '点击检测，系统自动多轮采样并计算 TTFT 与 TPS 中位数。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '推理模型的 TTFT 说明',
            content: '推理模型（如 o1、o3-mini 或开启 Thinking 的模型）包含隐式推断时间，TTFT 相对较长属于正常现象。',
          },
        ],
        faqs: [
          {
            question: 'TPS 波动原因有哪些？',
            answer: '受上游负载、网络抖动及输出内容复杂度共同影响。',
          },
        ],
      },

      // 8. HTTP 状态码自愈字典
      http_error_codes: {
        id: 'http_error_codes',
        categoryId: 'troubleshooting',
        title: 'HTTP 状态码自愈字典',
        badge: 'HTTP Codes',
        protocol: 'HTTP Diagnostics',
        subtitle:
          '大模型接口常见 HTTP 错误状态码定位与自愈指南。',
        overviewSummary:
          '大模型接口错误主要覆盖鉴权、路由、配额与网络四个方面。',
        keyParams: [
          { label: '401 Unauthorized', value: '密钥失效 / 余额耗尽', hint: '排查 API Key' },
          { label: '404 Not Found', value: 'Base URL 缺 /v1 或模型名错误', hint: '排查路由配置' },
          { label: '429 Rate Limit', value: '并发超限或上游受限', hint: '降低并发' },
          { label: '502 Bad Gateway', value: '上游网关连接超时', hint: '重试或切换渠道' },
        ],
        codeTabs: [
          {
            id: 'curl_diag_command',
            label: '诊断 cURL 脚本',
            language: 'bash',
            title: 'HTTP Diagnostic cURL',
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
            title: '查看 HTTP 状态码与 error 结构体',
            description: '解析返回体中的 error.message 与 error.code 字段。',
          },
          {
            stepNumber: 2,
            title: '执行对应排查措施',
            description: '核实 /v1 路径及密钥前后是否存在不可见空格。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '404 常见根因',
            content: 'OpenAI 协议要求 Base URL 必须以 /v1 结尾（如 https://api.example.com/v1）。',
          },
        ],
        faqs: [
          {
            question: 'Cloudflare 521 状态码代表什么？',
            answer: '代表中转站源站服务器宕机或无法连接。',
          },
        ],
      },

      // 9. 网关与反代配置规范
      api_specifications: {
        id: 'api_specifications',
        categoryId: 'troubleshooting',
        title: '网关与反代配置规范',
        badge: 'RFC Spec',
        protocol: 'RFC & SSE Specifications',
        subtitle:
          'OpenAI 与 Anthropic 协议规范差异及 Nginx 反向代理配置标准。',
        overviewSummary:
          '自建中转网关时，必须正确配置反向代理的缓冲策略以保障流式通信。',
        keyParams: [
          { label: 'OpenAI 端点', value: '/v1/chat/completions', hint: 'Authorization: Bearer' },
          { label: 'Anthropic 端点', value: '/v1/messages', hint: 'x-api-key' },
          { label: 'Nginx 关键参数', value: 'proxy_buffering off;', hint: '禁用响应缓冲' },
        ],
        codeTabs: [
          {
            id: 'nginx_conf',
            label: 'Nginx 配置示例',
            language: 'nginx',
            title: 'nginx.conf',
            code: `location /v1/ {
    proxy_pass https://api.openai.com/v1/;
    proxy_ssl_server_name on;
    proxy_set_header Host api.openai.com;
    
    # 禁用缓冲以保证流式传输
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
            title: '确认协议标准',
            description: '区分客户端调用采用 OpenAI 还是 Anthropic 协议。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: 'CORS 跨域配置',
            content: '前端直连 API 时，响应头中须包含 Access-Control-Allow-Origin: *。',
          },
        ],
        faqs: [
          {
            question: '流式输出卡顿的原因？',
            answer: '通常由反向代理开启了 proxy_buffering 响应缓冲导致。',
          },
        ],
      },

      // 10. CI/CD 自动化流水线集成
      cicd_automation: {
        id: 'cicd_automation',
        categoryId: 'developer_api',
        title: 'CI/CD 自动化流水线集成',
        badge: 'DevOps',
        protocol: 'Automation Workflow',
        subtitle:
          '在自动化脚本与 CI/CD 流水线中集成 API-QuickCheck 质量检测。',
        overviewSummary:
          '在持续集成流水线中自动执行 API 质量与真伪检测，实现上游渠道质量监控。',
        keyParams: [
          { label: '支持环境', value: 'Node.js / Python / cURL / GitHub Actions', hint: '全平台' },
          { label: '告警机制', value: '保真分 < 80 触发异常告警', hint: '自动化质检' },
        ],
        codeTabs: [
          {
            id: 'nodejs_script',
            label: 'Node.js 自动化脚本',
            language: 'typescript',
            title: 'ci-fidelity-check.ts',
            code: `async function checkRelayHealth() {
  const baseUrl = process.env.RELAY_BASE_URL || '${cleanBaseUrl}';
  const apiKey = process.env.RELAY_API_KEY || '${apiKey}';
  const model = '${model}';

  const start = Date.now();
  const res = await fetch(\`\${baseUrl}/chat/completions\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    }),
  });

  const latency = Date.now() - start;
  if (!res.ok) {
    throw new Error(\`Relay error: HTTP \${res.status}\`);
  }

  console.log(\`Relay operational. Latency: \${latency}ms\`);
}

checkRelayHealth().catch(console.error);`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '配置 CI 环境变量',
            description: '在流水线中注入 RELAY_BASE_URL 与 RELAY_API_KEY。',
          },
          {
            stepNumber: 2,
            title: '配置定时调度任务',
            description: '定期执行自动化探测并在异常时触发 Webhook 告警。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '容灾建议',
            content: '配置至少 2 个备用上游并在 CI 中轮询测真，保障核心链路可用性。',
          },
        ],
        faqs: [
          {
            question: '单次体检的 Token 消耗？',
            answer: '探针均经过精简压缩，单次检测通常不超过 200 Tokens。',
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
          <div className="p-3 border-b border-[#2e2b27] bg-[#181715]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="w-full rounded-md border border-[#2e2b27] bg-[#1f1e1b] py-1.5 pl-8 pr-14 text-xs text-[#faf9f5] placeholder-neutral-400 focus:border-[#cc785c] focus:outline-none transition font-sans"
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
                  <span className="text-[10px] font-mono text-neutral-400 bg-[#252320] px-1.5 py-0.5 rounded border border-[#2e2b27]">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Category Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredCategories.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 hover:text-[#faf9f5] rounded transition"
                  >
                    <span className="truncate">{group.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {group.badge && (
                        <span className="text-[9px] text-neutral-400 bg-[#1f1e1b] px-1.5 py-0.2 rounded border border-[#2e2b27]">
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
                    <div className="space-y-0.5 pl-1">
                      {group.items.map((item) => {
                        const isActive = activeItem === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateToDoc(item.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left ${
                              isActive
                                ? 'bg-[#252320] text-[#faf9f5] font-semibold border-l-2 border-[#cc785c]'
                                : 'text-neutral-300 hover:text-[#faf9f5] hover:bg-[#181715]'
                            }`}
                          >
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                                  isActive
                                    ? 'bg-[#cc785c] text-white'
                                    : 'bg-[#1f1e1b] text-neutral-400 border border-[#2e2b27]'
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

          {/* Sidebar Bottom Status */}
          <div className="p-3 border-t border-[#2e2b27] bg-[#181715] space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400 font-medium">
              <span className="font-mono uppercase text-[10px]">Endpoint</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />
            </div>
            <div className="font-mono text-neutral-300 text-xs truncate select-all" title={cleanBaseUrl}>
              {cleanBaseUrl}
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* Resizable Divider Handle (Drag to Resize)  */}
        {/* ========================================== */}
        <div
          onMouseDown={startResizing}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-[#cc785c] transition-all cursor-col-resize z-30 shrink-0 select-none relative group -ml-0.5"
          title="拖拽调整侧边栏宽度"
        >
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-8 -ml-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div className="w-0.5 h-4 bg-[#faf9f5] rounded-full" />
          </div>
        </div>

        {/* ========================================== */}
        {/* Center & Right: Main Article Reading Area  */}
        {/* ========================================== */}
        <div className="flex-1 min-w-0 flex justify-center py-8 px-6 lg:px-12 xl:px-16 overflow-y-auto">
          
          <div className="w-full max-w-4xl space-y-10 min-w-0">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-sans">
              <span
                className="hover:text-white cursor-pointer"
                onClick={() => navigateToDoc('about_quickcheck')}
              >
                文档
              </span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-neutral-300">{currentCategoryGroup.title}</span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-[#faf9f5] font-semibold">{currentDoc.title}</span>
            </div>

            {/* Document Header */}
            <div className="space-y-3 pb-6 border-b border-[#2e2b27]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-[#cc785c]/40 bg-[#cc785c]/10 px-2 py-0.5 text-xs font-mono font-medium text-[#cc785c]">
                  {currentDoc.badge}
                </span>
                <span className="rounded border border-[#2e2b27] bg-[#181715] px-2 py-0.5 text-xs font-mono text-neutral-300">
                  {currentDoc.protocol}
                </span>
              </div>

              <h1 className="font-serif-display text-3xl md:text-4xl font-normal text-[#faf9f5] tracking-tight">
                {currentDoc.title}
              </h1>

              <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                {currentDoc.subtitle}
              </p>
            </div>

            {/* Section 1: Overview & Parameters */}
            <section id="overview" className="space-y-4">
              <h2 className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">
                1. 机制解析与核心指标
              </h2>

              <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                {currentDoc.overviewSummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentDoc.keyParams.map((param, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>{param.label}</span>
                      {param.hint && (
                        <span className="text-[10px] text-neutral-400">{param.hint}</span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#faf9f5] truncate select-all">
                      {param.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Code Snippets & Spec */}
            <section id="quick-config" className="space-y-4">
              <h2 className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">
                2. 报文格式与数据结构
              </h2>

              {/* Multi-Tab Selector */}
              {currentCodeTabs.length > 1 && (
                <div className="flex items-center gap-1 border-b border-[#2e2b27]">
                  {currentCodeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCodeTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-mono transition border-b-2 ${
                        currentSelectedTab.id === tab.id
                          ? 'border-[#cc785c] text-[#faf9f5] bg-[#181715]'
                          : 'border-transparent text-neutral-400 hover:text-white'
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
              <h2 className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">
                3. 执行步骤与检验逻辑
              </h2>

              <div className="space-y-2.5">
                {currentDoc.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#cc785c] text-xs font-mono font-bold text-white">
                        {step.stepNumber}
                      </span>
                      <h3 className="text-xs font-semibold text-[#faf9f5]">{step.title}</h3>
                    </div>
                    <p className="text-xs text-neutral-300 pl-7 leading-relaxed font-sans">
                      {step.description}
                    </p>
                    {step.code && (
                      <div className="pl-7 pt-1">
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
                <h2 className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">
                  4. 注意事项
                </h2>

                <div className="space-y-2.5">
                  {currentDoc.callouts.map((callout, idx) => {
                    const isWarning = callout.type === 'warning';
                    const isDanger = callout.type === 'danger';
                    const isTip = callout.type === 'tip';

                    const borderClass = isDanger
                      ? 'border-[#c64545]/40 bg-[#1f1616] text-[#faf9f5]'
                      : isWarning
                      ? 'border-[#d4a017]/40 bg-[#1f1d16] text-[#faf9f5]'
                      : isTip
                      ? 'border-[#5db872]/40 bg-[#161f18] text-[#faf9f5]'
                      : 'border-[#cc785c]/40 bg-[#1f1a17] text-[#faf9f5]';

                    return (
                      <div
                        key={idx}
                        className={`rounded-md border p-3.5 space-y-1 ${borderClass}`}
                      >
                        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">{callout.title}</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
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
                <h2 className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">
                  5. 常见问题
                </h2>

                <div className="space-y-2.5">
                  {currentDoc.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-1"
                    >
                      <div className="text-xs font-semibold text-[#faf9f5] font-sans">
                        {faq.question}
                      </div>
                      <div className="text-xs text-neutral-300 leading-relaxed font-sans">
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bottom Article Navigation */}
            <div className="pt-8 border-t border-[#2e2b27] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prevDocItem ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(prevDocItem.id)}
                    className="flex flex-col items-start p-3.5 rounded-md border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c] transition text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>上一篇</span>
                    </div>
                    <div className="mt-1 font-semibold text-xs text-[#faf9f5] truncate w-full">
                      {prevDocItem.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextDocItem ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(nextDocItem.id)}
                    className="flex flex-col items-end p-3.5 rounded-md border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c] transition text-right"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <span>下一篇</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-1 font-semibold text-xs text-[#faf9f5] truncate w-full">
                      {nextDocItem.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Back to Top */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 font-mono">
                <div>
                  当前: <span className="text-[#faf9f5]">{currentDoc.title}</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-[#cc785c] hover:underline"
                >
                  回到顶部 ↑
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: TOC "本页内容" (Desktop Sticky) */}
          <div className="hidden xl:block w-52 ml-8 sticky top-6 h-fit space-y-3">
            <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-2.5">
              <div className="text-xs font-mono uppercase font-semibold text-[#faf9f5] pb-2 border-b border-[#2e2b27]">
                本页内容
              </div>

              <nav className="space-y-1 text-xs font-sans">
                <button
                  onClick={() => scrollToSection('overview')}
                  className="w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate"
                >
                  1. 机制解析与核心指标
                </button>
                <button
                  onClick={() => scrollToSection('quick-config')}
                  className="w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate"
                >
                  2. 报文格式与数据结构
                </button>
                <button
                  onClick={() => scrollToSection('step-by-step')}
                  className="w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate"
                >
                  3. 执行步骤与检验逻辑
                </button>
                {currentDoc.callouts.length > 0 && (
                  <button
                    onClick={() => scrollToSection('tips-warnings')}
                    className="w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate"
                  >
                    4. 注意事项
                  </button>
                )}
                {currentDoc.faqs.length > 0 && (
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate"
                  >
                    5. 常见问题
                  </button>
                )}
              </nav>

              <div className="pt-2 border-t border-[#2e2b27]">
                <button
                  onClick={handleCopyGlobalConfig}
                  className="w-full flex items-center justify-center gap-1.5 rounded border border-[#2e2b27] bg-[#1f1e1b] py-1 text-xs text-neutral-300 hover:text-white hover:border-[#cc785c] transition font-mono"
                >
                  <Copy className="h-3 w-3" />
                  <span>{globalCopied ? '已复制' : '复制配置 JSON'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
