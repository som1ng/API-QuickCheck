import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import {
  Terminal,
  BookOpen,
  Code2,
  Laptop,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Globe,
  ShieldAlert,
  Search,
  Hash,
  Sparkles,
  Server,
  Zap,
  Info,
  Workflow,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

// ==========================================
// Types & Interfaces
// ==========================================

export type DocCategoryId =
  | 'quickstart'
  | 'cli_agent'
  | 'desktop_clients'
  | 'enterprise_workflows'
  | 'troubleshooting_specs';

export type DocItemId =
  // 快速开始
  | 'quickstart'
  // CLI & Agent 接入
  | 'opencode'
  | 'claude_code'
  | 'cline'
  | 'cursor'
  | 'aider'
  // 桌面客户端
  | 'cherry_studio'
  | 'chatbox'
  | 'nextchat'
  // 企业级与工作流
  | 'dify'
  | 'fastgpt'
  | 'langchain_llamaindex'
  // 排错与规范
  | 'http_errors'
  | 'api_specs';

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
    id: 'quickstart',
    title: '快速开始',
    badge: 'Guide',
    icon: Sparkles,
    items: [
      { id: 'quickstart', title: '简介与快速上手', badge: '必读' },
    ],
  },
  {
    id: 'cli_agent',
    title: 'CLI & 终端 Agent',
    badge: 'Agent',
    icon: Terminal,
    items: [
      { id: 'opencode', title: 'OpenCode (AI 编码代理)', badge: '推荐' },
      { id: 'claude_code', title: 'Claude Code', badge: '官方 CLI' },
      { id: 'cline', title: 'Cline / Roo Code', badge: 'VS Code' },
      { id: 'cursor', title: 'Cursor', badge: 'AI IDE' },
      { id: 'aider', title: 'Aider', badge: 'Git 配对' },
    ],
  },
  {
    id: 'desktop_clients',
    title: '桌面与 Web 客户端',
    badge: 'Desktop',
    icon: Laptop,
    items: [
      { id: 'cherry_studio', title: 'Cherry Studio', badge: '全功能' },
      { id: 'chatbox', title: 'Chatbox', badge: '开源跨平台' },
      { id: 'nextchat', title: 'NextChat', badge: 'Web/桌面' },
    ],
  },
  {
    id: 'enterprise_workflows',
    title: '企业级与 SDK 接入',
    badge: 'Workflow',
    icon: Workflow,
    items: [
      { id: 'dify', title: 'Dify.ai', badge: '应用平台' },
      { id: 'fastgpt', title: 'FastGPT', badge: '知识库' },
      { id: 'langchain_llamaindex', title: 'LangChain & LlamaIndex', badge: 'SDK/Code' },
    ],
  },
  {
    id: 'troubleshooting_specs',
    title: '排错与协议规范',
    badge: 'Debug',
    icon: ShieldAlert,
    items: [
      { id: 'http_errors', title: '常见 HTTP 报错排查', badge: '401/404/429' },
      { id: 'api_specs', title: 'API 格式标准与路由', badge: '协议规范' },
    ],
  },
];

// ==========================================
// Main Component
// ==========================================

export const ClientExportTab: React.FC = () => {
  const { state } = useApp();
  const { config } = state;

  const [activeItem, setActiveItem] = useState<DocItemId>('quickstart');
  const [activeCodeTab, setActiveCodeTab] = useState<string>('macos_linux');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFullKey, setShowFullKey] = useState<boolean>(false);
  const [globalCopied, setGlobalCopied] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
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

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Dynamic values injected from AppContext
  const cleanBaseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = config.apiKey || 'sk-your-api-key-here';
  const model = config.selectedModel || 'gpt-4o';

  const maskedKey = useMemo(() => {
    if (!config.apiKey) return 'sk-your-api-key-here';
    if (showFullKey) return config.apiKey;
    if (config.apiKey.length <= 10) return 'sk-***';
    return `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}`;
  }, [config.apiKey, showFullKey]);

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
      const yOffset = -90;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Build documentation content map
  const docContents: Record<DocItemId, DocContent> = useMemo(() => {
    return {
      // 1. 快速上手
      quickstart: {
        id: 'quickstart',
        categoryId: 'quickstart',
        title: '简介与快速上手 (Quickstart Guide)',
        badge: '入门指引',
        protocol: 'OpenAI / Anthropic 双协议兼容',
        subtitle: '掌握中转站统一环境变量规范与 API 连接机制，一处配置，全套工具即刻连接。',
        overviewSummary:
          '本平台检测与导出的 Base URL、API Key 与 Model 已全局与下方所有代码及配置模板实时同步。你可以直接复制各环境代码快速注入。',
        keyParams: [
          { label: '统一 Base URL', value: cleanBaseUrl, hint: '末尾请勿带多余斜杠' },
          { label: '当前已配置 Key', value: maskedKey, hint: '用于 Authorization: Bearer 鉴权' },
          { label: '选定默认模型', value: model, hint: '已与当前平台所选模型联动' },
          { label: '鉴权协议模式', value: 'Bearer Token (Header)', hint: '标准 Authorization: Bearer sk-...' },
        ],
        codeTabs: [
          {
            id: 'macos_linux',
            label: 'macOS / Linux (Shell)',
            language: 'bash',
            title: '~/.bashrc or ~/.zshrc',
            code: `# 1. 写入 OpenAI 官方兼容环境变量
export OPENAI_BASE_URL="${cleanBaseUrl}"
export OPENAI_API_KEY="${apiKey}"
export OPENAI_MODEL_NAME="${model}"

# 2. 写入 Anthropic 兼容环境变量 (如使用 Claude 相关工具)
export ANTHROPIC_BASE_URL="${cleanBaseUrl}"
export ANTHROPIC_API_KEY="${apiKey}"

# 3. 立即生效配置
# source ~/.zshrc  # 或 source ~/.bashrc`,
          },
          {
            id: 'windows_pwsh',
            label: 'Windows PowerShell',
            language: 'powershell',
            title: '$PROFILE (PowerShell 环境变量)',
            code: `# 临时注入当前会话:
$env:OPENAI_BASE_URL="${cleanBaseUrl}"
$env:OPENAI_API_KEY="${apiKey}"
$env:ANTHROPIC_BASE_URL="${cleanBaseUrl}"
$env:ANTHROPIC_API_KEY="${apiKey}"

# 永久写入用户环境变量:
[Environment]::SetEnvironmentVariable("OPENAI_BASE_URL", "${cleanBaseUrl}", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "${apiKey}", "User")`,
          },
          {
            id: 'windows_cmd',
            label: 'Windows CMD',
            language: 'batch',
            title: 'Command Prompt (CMD)',
            code: `:: 临时生效
set OPENAI_BASE_URL=${cleanBaseUrl}
set OPENAI_API_KEY=${apiKey}
set ANTHROPIC_BASE_URL=${cleanBaseUrl}
set ANTHROPIC_API_KEY=${apiKey}

:: 永久生效 (setx)
setx OPENAI_BASE_URL "${cleanBaseUrl}"
setx OPENAI_API_KEY "${apiKey}"`,
          },
          {
            id: 'dotenv',
            label: '.env 统一配置文件',
            language: 'ini',
            title: '项目根目录 .env',
            code: `# OpenAI Compatible Standards
OPENAI_BASE_URL=${cleanBaseUrl}
OPENAI_API_KEY=${apiKey}
OPENAI_MODEL=${model}

# Anthropic Compatible Standards
ANTHROPIC_BASE_URL=${cleanBaseUrl}
ANTHROPIC_API_KEY=${apiKey}
ANTHROPIC_MODEL=${model}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '在中转站获取 API Key 并确认 Base URL',
            description:
              '在中转站控制台（如 One API / New API）创建令牌，确保令牌具有所选模型的调用权限，并复制当前中转站根域名与 /v1 路径。',
          },
          {
            stepNumber: 2,
            title: '设置系统或项目环境变量',
            description:
              '选择对应操作系统的环境变量注入方式，将 OPENAI_BASE_URL 与 OPENAI_API_KEY 注入到全局终端或项目根目录 .env 文件中。',
          },
          {
            stepNumber: 3,
            title: '发起快速 cURL 连通性测试',
            description:
              '使用下方提供的单行验证命令测试连接，若能正常收到 JSON 流式或非流式响应，则说明中转站服务与密钥配置正常。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '末尾斜杠 (Trailing Slash) 规范',
            content:
              '大多数现代 SDK（如 official openai-node / python-openai）会自动处理 URL 末尾路径。推荐规范为带 "/v1" 且不含末尾斜杠，如：https://api.openai.com/v1。',
          },
          {
            type: 'warning',
            title: 'Anthropic 与 OpenAI 协议差异',
            content:
              'Anthropic 官方 SDK 默认请求 /v1/messages，若中转站仅支持 OpenAI 格式，需配合转换代理或使用 OpenAI Compatible 客户端模式。',
          },
        ],
        verificationSnippet: {
          title: 'cURL 连通性验证命令 (OpenAI 协议)',
          description: '在终端直接粘贴运行，测试当前 Base URL 与 Key 是否有效：',
          language: 'bash',
          code: `curl -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Say hello from API-QuickCheck!"}],
    "max_tokens": 50
  }'`,
        },
        faqs: [
          {
            question: '为什么在终端设置了 export 后，打开新窗口又失效了？',
            answer:
              '使用 export 仅对当前终端会话生效。若需永久生效，请将 export 语句写入 ~/.zshrc (macOS 默认) 或 ~/.bashrc (Linux 默认) 文件中，并执行 source ~/.zshrc。',
          },
          {
            question: '什么是 OpenAI Compatible (兼容) 接口？',
            answer:
              '指第三方中转站或模型服务商（如 DeepSeek、SiliconFlow、OpenRouter、New API 等）实现了与 OpenAI 官方 /v1/chat/completions 及 /v1/models 完全一致的请求参数与响应格式。',
          },
        ],
      },

      // 2. Claude Code
      claude_code: {
        id: 'claude_code',
        categoryId: 'cli_agent',
        title: 'Claude Code (Anthropic 官方 CLI)',
        badge: 'Anthropic 官方',
        protocol: 'Anthropic Messages 原生协议 (/v1/messages)',
        subtitle:
          'Anthropic 推出的终端 Agent 编程工具，具备深度代码库分析、多文件编辑、命令执行与 Git 工作流能力。',
        overviewSummary:
          'Claude Code 默认通过 ANTHROPIC_BASE_URL 与 ANTHROPIC_API_KEY 环境变量连接后端。请确保中转站提供 Anthropic Messages 原生接口支持。',
        keyParams: [
          { label: 'Anthropic Base URL', value: cleanBaseUrl, hint: '指向中转站 Anthropic 兼容端点' },
          { label: 'Anthropic API Key', value: maskedKey, hint: '中转站生成的 API 令牌' },
          { label: '推荐模型', value: model.includes('claude') ? model : 'claude-3-7-sonnet-20250219', hint: '推荐 Claude 3.7 / 3.5 Sonnet' },
        ],
        codeTabs: [
          {
            id: 'macos_linux',
            label: 'macOS / Linux (Shell)',
            language: 'bash',
            title: 'Terminal 终端命令',
            code: `# 1. 全局安装 Claude Code CLI (需 Node.js 18+)
npm install -g @anthropic-ai/claude-code

# 2. 注入 Anthropic 环境变量
export ANTHROPIC_BASE_URL="${cleanBaseUrl}"
export ANTHROPIC_API_KEY="${apiKey}"

# 3. 启动 Claude Code 并指定模型
claude --model ${model.includes('claude') ? model : 'claude-3-7-sonnet-20250219'}`,
          },
          {
            id: 'windows_pwsh',
            label: 'Windows PowerShell',
            language: 'powershell',
            title: 'PowerShell 终端命令',
            code: `# 1. 注入当前会话环境变量
$env:ANTHROPIC_BASE_URL="${cleanBaseUrl}"
$env:ANTHROPIC_API_KEY="${apiKey}"

# 2. 启动 Claude Code
claude --model ${model.includes('claude') ? model : 'claude-3-7-sonnet-20250219'}`,
          },
          {
            id: 'windows_cmd',
            label: 'Windows CMD',
            language: 'batch',
            title: 'CMD 命令行',
            code: `set ANTHROPIC_BASE_URL=${cleanBaseUrl}
set ANTHROPIC_API_KEY=${apiKey}
claude --model ${model.includes('claude') ? model : 'claude-3-7-sonnet-20250219'}`,
          },
          {
            id: 'claude_json',
            label: '~/.claude.json 配置文件',
            language: 'json',
            title: '~/.claude.json (或 %USERPROFILE%/.claude.json)',
            code: `{
  "primaryApiKey": "${apiKey}",
  "customBaseUrl": "${cleanBaseUrl}",
  "preferredModel": "${model.includes('claude') ? model : 'claude-3-7-sonnet-20250219'}"
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '安装 Node.js 环境与 Claude Code CLI',
            description:
              '确保本地已安装 Node.js 18 及以上版本。在终端执行 `npm install -g @anthropic-ai/claude-code` 进行全局安装。',
          },
          {
            stepNumber: 2,
            title: '配置 ANTHROPIC_BASE_URL 环境变量',
            description:
              '将中转站的 API Base URL 与 Key 分别赋予 ANTHROPIC_BASE_URL 与 ANTHROPIC_API_KEY 环境变量。',
          },
          {
            stepNumber: 3,
            title: '在工程根目录启动 Claude Code',
            description:
              '在你的项目根目录下执行 `claude` 命令，首次启动时将自动识别环境变量并完成初始化验证。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: 'Base URL 路径层级注意',
            content:
              'Anthropic 官方 SDK 在请求时会自动追加 /v1/messages。如果你的中转站 Base URL 填为 https://example.com/v1，最终请求为 https://example.com/v1/messages。若中转站本身根域名即转发，请确认是否需要包含 /v1。',
          },
          {
            type: 'info',
            title: 'Extended Thinking / 思考模式支持',
            content:
              '若使用 Claude 3.7 Sonnet 并希望启用推理思考能力，请确保中转站上游渠道支持 thinking 参数透传，未过滤 reasoning_content 字段。',
          },
        ],
        verificationSnippet: {
          title: 'Anthropic 原生 Messages 接口连通性验证',
          description: '通过原生 cURL 验证中转站是否支持 Anthropic 协议：',
          language: 'bash',
          code: `curl -X POST "${cleanBaseUrl}/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${model.includes('claude') ? model : 'claude-3-7-sonnet-20250219'}",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello Claude!"}]
  }'`,
        },
        faqs: [
          {
            question: 'Claude Code 启动提示 "Authentication failed" 或 401？',
            answer:
              '请检查中转站后台令牌是否有剩余配额，或中转站上游的 Claude 渠道是否开启。同时确认环境变量名称为 ANTHROPIC_API_KEY。',
          },
        ],
      },

      // 3. Cline / Roo Code
      cline: {
        id: 'cline',
        categoryId: 'cli_agent',
        title: 'Cline / Roo Code (VS Code Agent 插件)',
        badge: 'VS Code 必备',
        protocol: 'OpenAI Compatible / Anthropic Native',
        subtitle:
          'VS Code 中最强大的自主编程 Agent 插件，具备命令行执行、代码文件智能编辑、浏览器测试与多步骤任务拆解能力。',
        overviewSummary:
          'Cline / Roo Code 提供了直接的 OpenAI Compatible 自定义配置面板，也可以直接将配置写入 VS Code 的 settings.json。',
        keyParams: [
          { label: 'API Provider', value: 'OpenAI Compatible', hint: '选择兼容模式' },
          { label: 'Base URL', value: cleanBaseUrl, hint: '需包含 /v1 路径' },
          { label: 'API Key', value: maskedKey, hint: '填入中转站令牌' },
          { label: 'Model ID', value: model, hint: '自定义模型名称' },
        ],
        codeTabs: [
          {
            id: 'settings_json',
            label: 'VS Code settings.json (推荐)',
            language: 'json',
            title: '.vscode/settings.json 或 用户 settings.json',
            code: `{
  "cline.apiProvider": "openai",
  "cline.openAiBaseUrl": "${cleanBaseUrl}",
  "cline.openAiApiKey": "${apiKey}",
  "cline.openAiModelId": "${model}",
  "cline.openAiCustomModelInfo": {
    "maxTokens": 8192,
    "contextWindow": 128000,
    "supportsFunctionCalling": true,
    "supportsImages": true
  }
}`,
          },
          {
            id: 'roo_code_json',
            label: 'Roo Code settings.json',
            language: 'json',
            title: 'Roo Code 模式配置',
            code: `{
  "roo-cline.apiProvider": "openai",
  "roo-cline.openAiBaseUrl": "${cleanBaseUrl}",
  "roo-cline.openAiApiKey": "${apiKey}",
  "roo-cline.openAiModelId": "${model}",
  "roo-cline.openAiCustomModelInfo": {
    "maxTokens": 8192,
    "contextWindow": 128000,
    "supportsFunctionCalling": true,
    "supportsImages": true
  }
}`,
          },
          {
            id: 'gui_steps',
            label: 'GUI 图形界面配置参数',
            language: 'yaml',
            title: 'Cline 设置面板各输入框对应值',
            code: `API Provider       : OpenAI Compatible
Base URL           : ${cleanBaseUrl}
API Key            : ${apiKey}
Model ID           : ${model}
Supports Function  : 勾选 (Enabled)
Supports Vision    : 勾选 (Enabled)
Max Output Tokens  : 8192`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '在 VS Code 插件市场安装扩展',
            description: '打开 VS Code 插件商店，搜索 `Cline` 或 `Roo Code` 并点击安装。',
          },
          {
            stepNumber: 2,
            title: '打开 Cline 设置面板配置 Provider',
            description:
              '点击左侧活动栏 Cline 图标，点击顶部齿轮设置，在 `API Provider` 下拉列表选择 `OpenAI Compatible`。',
          },
          {
            stepNumber: 3,
            title: '粘贴 Base URL 与 API Key 并保存',
            description:
              '在 Base URL 填入 `' + cleanBaseUrl + '`，在 API Key 填入当前密钥，Model ID 输入 `' + model + '`，点击保存完成连接。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: 'Custom Model Info 务必配置 Function Calling',
            content:
              'Cline 严重依赖 Tools/Function Calling 机制来读写文件与执行终端命令。请确保中转站上游模型支持 Function Calling，并在 Cline 自定义模型设置中开启支持。',
          },
          {
            type: 'tip',
            title: '上下文窗口设置 (Context Window)',
            content:
              '建议将 contextWindow 设置为 128000 (128K) 或 200000 (200K)，以允许 Cline 在分析整个代码库或大文件时不至于触发上下文溢出。',
          },
        ],
        verificationSnippet: {
          title: 'Cline 连通性测试 (Function Calling 兼容测试)',
          description: '验证中转站是否支持 Cline 所需的 Tools 结构：',
          language: 'bash',
          code: `curl -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "calculate",
        "description": "Calculate math",
        "parameters": {"type": "object", "properties": {"expr": {"type": "string"}}}
      }
    }]
  }'`,
        },
        faqs: [
          {
            question: 'Cline 报错 "Failed to parse model response" 或陷入无限循环？',
            answer:
              '通常是因为中转站上游对 tool_calls 的格式转换存在缺陷（如参数 JSON 未正确转义）。建议切换为 Claude 3.5/3.7 或 GPT-4o 原生中转渠道。',
          },
        ],
      },

      // 4. Cursor
      cursor: {
        id: 'cursor',
        categoryId: 'cli_agent',
        title: 'Cursor (AI 代码编辑器)',
        badge: 'AI IDE 标杆',
        protocol: 'OpenAI Compatible',
        subtitle:
          '基于 VS Code 定制的 AI First 代码编辑器，支持 Composer 多文件生成、Codebase 全库索引与智能补全。',
        overviewSummary:
          'Cursor 内置了 Override OpenAI Base URL 功能，可以通过简单的配置将所有 AI 请求路由至你的中转站。',
        keyParams: [
          { label: 'Override Base URL', value: cleanBaseUrl, hint: '进入 Settings -> Models 填入' },
          { label: 'OpenAI API Key', value: maskedKey, hint: '填入中转站 Key' },
          { label: 'Custom Model', value: model, hint: '在 Model List 中点击 Add Model' },
        ],
        codeTabs: [
          {
            id: 'cursor_gui',
            label: 'Cursor 设置填法指南',
            language: 'yaml',
            title: 'Cursor Settings -> Models 配置项',
            code: `# 1. 打开 Settings (快捷键 Cmd/Ctrl + ,) -> 搜索 "Models"
# 2. 找到 "OpenAI API Key" 输入框:
API Key: ${apiKey}

# 3. 展开并开启 "Override OpenAI Base URL":
Base URL: ${cleanBaseUrl}

# 4. 点击 "Add Model" 添加当前模型名:
Model Name: ${model}

# 5. 建议在 Model List 中只保留中转站支持的模型勾选状态。`,
          },
          {
            id: 'cursor_curl',
            label: '模拟 Cursor 请求',
            language: 'bash',
            title: '测试 Cursor 连通性',
            code: `curl -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "system", "content": "You are Cursor AI assistant."},
      {"role": "user", "content": "Write a quick test function."}
    ],
    "stream": false
  }'`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '进入 Cursor 设置面板',
            description: '打开 Cursor，使用快捷键 `Ctrl + ,` (Windows) 或 `Cmd + ,` (macOS) 打开设置，在左侧选择 `Models`。',
          },
          {
            stepNumber: 2,
            title: '填入 API Key 并开启 Override Base URL',
            description:
              '在 `OpenAI API Key` 处填入你的密钥，点击 `Override OpenAI Base URL` 开关，填入 `' + cleanBaseUrl + '` 并点击 Verify/Save。',
          },
          {
            stepNumber: 3,
            title: '添加自定义模型并禁用多余模型',
            description:
              '在 `Model Names` 列表下方点击 `+ Add Model`，填入 `' + model + '` 并开启开关。将其他未在中转站购买的模型关闭以避免报错。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '关闭未激活模型以防止误调用',
            content:
              'Cursor 默认开启 gpt-4、gpt-3.5-turbo 等模型。若你的中转站未开启这些模型的权限，切换模型时可能会导致报错。请在列表中仅保留中转站支持的模型。',
          },
          {
            type: 'warning',
            title: 'Cursor 的 Codebase 索引流量',
            content:
              'Cursor 对全工程建立索引时会发起大量 embedding 与小型补全请求。请确保中转站令牌设置了充足的额度或不限额度。',
          },
        ],
        faqs: [
          {
            question: 'Cursor 点击 Verify 提示 "Invalid API Key" 或超时？',
            answer:
              '1. 确认 Base URL 后面有 /v1，且末尾无多余斜杠；2. 部分中转站拦截了 Cursor 的请求头或 User-Agent，可尝试在中转站 WAF 中放行或联系中转站管理员。',
          },
        ],
      },

      // 5. OpenCode (AI Coding Agent)
      opencode: {
        id: 'opencode',
        categoryId: 'cli_agent',
        title: 'OpenCode (终端 AI 编码代理)',
        badge: '终端利器',
        protocol: 'OpenAI / Anthropic 双协议与 AI SDK',
        subtitle:
          '开源高性能终端 AI 编程代理，支持全工程感知、多文件编辑、命令执行、白名单过滤及插件生态。',
        overviewSummary:
          'OpenCode (opencode.ai) 支持通过 ~/.config/opencode/opencode.json 或项目根目录 opencode.json 进行全局与局部配置。配置白名单 (whitelist) 即可精确过滤非目标模型。',
        keyParams: [
          { label: '配置文件位置', value: '~/.config/opencode/opencode.json', hint: '全局默认配置文件' },
          { label: '统一 Base URL', value: cleanBaseUrl, hint: '指向中转站端点' },
          { label: 'API Key', value: maskedKey, hint: '中转站 API 令牌' },
          { label: '激活模型', value: model, hint: '白名单中的当前首选模型' },
        ],
        codeTabs: [
          {
            id: 'opencode_json',
            label: 'opencode.json (标准配置)',
            language: 'json',
            title: '~/.config/opencode/opencode.json',
            code: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "options": {
        "baseURL": "${cleanBaseUrl}",
        "apiKey": "${apiKey}"
      },
      "whitelist": [
        "${model}"
      ],
      "models": {
        "${model}": {
          "name": "${model.toUpperCase()}",
          "limit": {
            "context": 1050000,
            "output": 128000
          },
          "options": {
            "store": false
          },
          "variants": {
            "low": {},
            "medium": {},
            "high": {},
            "xhigh": {},
            "max": {}
          }
        }
      }
    }
  },
  "agent": {
    "build": { "options": { "store": false } },
    "plan": { "options": { "store": false } }
  }
}`,
          },
          {
            id: 'install_cli',
            label: 'Terminal 安装命令 (macOS/Linux)',
            language: 'bash',
            title: '终端一键安装脚本',
            code: `# 1. 官方脚本安装
curl -fsSL https://opencode.ai/install | bash

# 2. 或使用 npm / bun / pnpm 全局安装
npm install -g opencode-ai
# bun install -g opencode-ai

# 3. 运行并开启智能体编程
opencode`,
          },
          {
            id: 'windows_install',
            label: 'Windows PowerShell 安装',
            language: 'powershell',
            title: 'Windows PowerShell',
            code: `# 1. 使用 npm 全局安装
npm install -g opencode-ai

# 2. 配置文件路径:
# $env:USERPROFILE\\.config\\opencode\\opencode.json

# 3. 启动 OpenCode
opencode`,
          },
          {
            id: 'isolated_provider',
            label: '自定义 Provider 隔离模式',
            language: 'json',
            title: '完全屏蔽官方默认 Catalog 的配置写法',
            code: `{
  "$schema": "https://opencode.ai/config.json",
  "disabled_providers": ["openai"],
  "provider": {
    "my-relay": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "${cleanBaseUrl}",
        "apiKey": "${apiKey}"
      },
      "models": {
        "${model}": {
          "name": "${model}"
        }
      }
    }
  }
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '安装 OpenCode 命令行客户端',
            description: '通过官方脚本 `curl -fsSL https://opencode.ai/install | bash` 或 `npm install -g opencode-ai` 进行全局安装。',
          },
          {
            stepNumber: 2,
            title: '创建并写入 opencode.json 配置文件',
            description:
              '在 `~/.config/opencode/opencode.json` 中配置 baseURL、apiKey 以及 whitelist 白名单，避免识别多余的未授权模型。',
          },
          {
            stepNumber: 3,
            title: '启动 OpenCode 并验证模型',
            description:
              '在项目终端中输入 `opencode`，使用 `/models` 命令即可查看当前中转站已成功挂载的模型列表。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '为什么需要配置 whitelist 白名单？',
            content:
              'OpenCode 默认会将你填写的 models 与官方 OpenAI Catalog 目录进行合并 (Merge)。配置 whitelist 数组后，未列入白名单的官方内置模型将被自动隐藏。',
          },
          {
            type: 'info',
            title: '常用 TUI 快捷指令',
            content:
              '在 OpenCode 终端中，输入 /models 切换模型，输入 /theme 切换界面主题，按 Ctrl+P 可快速呼出模型切换面板。',
          },
        ],
        faqs: [
          {
            question: '为什么改了配置还是能识别到额外的 OpenAI 模型？',
            answer:
              '因为 OpenCode 默认是增量合并机制。只需在 provider.openai 下添加 "whitelist": ["' + model + '"] 即可彻底过滤掉多余内置模型。',
          },
        ],
      },

      // 6. Aider
      aider: {
        id: 'aider',
        categoryId: 'cli_agent',
        title: 'Aider (终端 Git 配对编程)',
        badge: 'Git 协同',
        protocol: 'OpenAI Compatible (LiteLLM)',
        subtitle:
          '专注于终端与 Git 协同的 AI 配对编程助手，支持自动创建规范 Git Commit、多文件重构及终端指令自主执行。',
        overviewSummary:
          'Aider 基于 LiteLLM 架构，支持通过 OPENAI_API_BASE 与 OPENAI_API_KEY 环境变量接入任意 OpenAI 兼容中转站。',
        keyParams: [
          { label: 'OPENAI_API_BASE', value: cleanBaseUrl, hint: '环境变量 API 地址' },
          { label: 'OPENAI_API_KEY', value: maskedKey, hint: '环境变量 API 密钥' },
          { label: '模型指定参数', value: `--model openai/${model}`, hint: 'LiteLLM 前缀写法' },
        ],
        codeTabs: [
          {
            id: 'macos_linux',
            label: 'macOS / Linux (Shell)',
            language: 'bash',
            title: 'Aider 终端启动脚本',
            code: `# 1. 安装 Aider (推荐使用 pipx 或 pip)
pip install -U aider-chat

# 2. 设置环境变量
export OPENAI_API_BASE="${cleanBaseUrl}"
export OPENAI_API_KEY="${apiKey}"

# 3. 启动 Aider 并指定模型 (注意 openai/ 前缀)
aider --model openai/${model}`,
          },
          {
            id: 'windows_pwsh',
            label: 'Windows PowerShell',
            language: 'powershell',
            title: 'PowerShell 启动脚本',
            code: `# 1. 设置环境变量
$env:OPENAI_API_BASE="${cleanBaseUrl}"
$env:OPENAI_API_KEY="${apiKey}"

# 2. 启动 Aider
aider --model openai/${model}`,
          },
          {
            id: 'aider_conf',
            label: '.aider.conf.yml 配置文件',
            language: 'yaml',
            title: '项目根目录 .aider.conf.yml',
            code: `openai-api-base: ${cleanBaseUrl}
openai-api-key: ${apiKey}
model: openai/${model}
auto-commits: true
show-diffs: true`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '安装 Aider 命令行工具',
            description: '在终端执行 `pip install -U aider-chat` 或 `pipx install aider-chat`。',
          },
          {
            stepNumber: 2,
            title: '配置 API Base 与 API Key 环境变量',
            description:
              '导出 `OPENAI_API_BASE` 与 `OPENAI_API_KEY`，注意 Aider 采用 `OPENAI_API_BASE`（部分工具写作 OPENAI_BASE_URL）。',
          },
          {
            stepNumber: 3,
            title: '指定模型前缀启动并开始结对编程',
            description:
              '执行 `aider --model openai/' + model + '`，Aider 将加载 Git 仓库并进入交互式会话。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: '模型名称加 openai/ 前缀的重要性',
            content:
              'Aider 内部集成 LiteLLM 路由。若不加 openai/ 前缀，直接传 claude-3-5-sonnet 会尝试去连 Anthropic 官方域名。加上 openai/ 前缀可强制通过 OPENAI_API_BASE 走兼容转发。',
          },
        ],
        faqs: [
          {
            question: 'Aider 提示 "Model not found" 或尝试连接 api.openai.com？',
            answer:
              '请确保使用的是 `OPENAI_API_BASE` 变量名，并且启动参数为 `--model openai/你的模型名`。',
          },
        ],
      },

      // 6. Cherry Studio
      cherry_studio: {
        id: 'cherry_studio',
        categoryId: 'desktop_clients',
        title: 'Cherry Studio',
        badge: '全功能推荐',
        protocol: 'OpenAI Compatible',
        subtitle:
          '全能跨平台 AI 桌面客户端，支持多模型并发对比、Agent 智能体助手、本地知识库与画图模型。',
        overviewSummary:
          'Cherry Studio 支持一键拉取中转站模型列表，并提供连通性测速与可视化管理。',
        keyParams: [
          { label: '提供商类型', value: 'OpenAI API 兼容', hint: '添加提供商时选择' },
          { label: 'API 域名', value: cleanBaseUrl, hint: 'Base URL' },
          { label: 'API 密钥', value: maskedKey, hint: '中转站 API Key' },
          { label: '默认模型', value: model, hint: '模型列表中设为默认' },
        ],
        codeTabs: [
          {
            id: 'cherry_params',
            label: 'Cherry Studio 参数填法',
            language: 'yaml',
            title: 'Cherry Studio -> 设置 -> 模型服务 -> 添加提供商',
            code: `提供商名称: 自定义中转站 (API-QuickCheck)
提供商类型: OpenAI API 兼容
API 域名  : ${cleanBaseUrl}
API 密钥  : ${apiKey}

# 完成后点击:
1. 点击 "检查" (验证 API Key 与域名)
2. 点击 "管理" -> "从 API 获取模型列表" 或手动添加模型:
   - 模型 ID: ${model}
   - 模型名称: ${model}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '打开 Cherry Studio 设置面板',
            description: '启动 Cherry Studio，点击左下角设置图标，进入 `模型服务` 选项卡。',
          },
          {
            stepNumber: 2,
            title: '添加 OpenAI 兼容服务商',
            description:
              '点击顶部 `+ 添加`，选择 `OpenAI API 兼容`，填入提供商名称、API 域名 `' + cleanBaseUrl + '` 与 API 密钥。',
          },
          {
            stepNumber: 3,
            title: '同步模型列表并开始聊天',
            description:
              '点击 `管理` 按钮同步模型列表或手动添加 `' + model + '`，在对话界面选择该模型即可畅享丝滑对话。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: '支持自动模型同步',
            content:
              'Cherry Studio 支持调用 /v1/models 接口自动同步中转站开放的所有模型，无需逐个手动输入。',
          },
        ],
        faqs: [
          {
            question: 'Cherry Studio 点击检查提示网络错误？',
            answer:
              '请检查 Base URL 是否正确，若中转站开启了 Cloudflare 人机验证，可能需要在 Cherry Studio 设置中关闭代理或开启直连。',
          },
        ],
      },

      // 7. Chatbox
      chatbox: {
        id: 'chatbox',
        categoryId: 'desktop_clients',
        title: 'Chatbox (开源跨平台 AI 客户端)',
        badge: '开源轻量',
        protocol: 'OpenAI Compatible',
        subtitle:
          '开源跨平台的桌面与移动端 AI 客户端，支持本地数据安全存储、Prompt 预设与文件对话。',
        overviewSummary:
          'Chatbox 界面轻量直观，支持在设置中直接切换自定义 API 域名。',
        keyParams: [
          { label: 'AI 模型提供方', value: 'OpenAI API 兼容', hint: '下拉菜单选择' },
          { label: 'API 域名 (Host)', value: cleanBaseUrl, hint: '包含 /v1' },
          { label: 'API 密钥', value: maskedKey, hint: 'API 令牌' },
          { label: '自定义模型', value: model, hint: '填入模型标识符' },
        ],
        codeTabs: [
          {
            id: 'chatbox_config',
            label: 'Chatbox 设置填法',
            language: 'yaml',
            title: 'Chatbox -> 设置面板',
            code: `AI 模型提供方: OpenAI API 兼容
API 域名 (Host): ${cleanBaseUrl}
API 密钥      : ${apiKey}
模型          : 自定义模型
自定义模型名称: ${model}
温度 (Temperature): 0.7`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '进入 Chatbox 设置',
            description: '打开 Chatbox，点击左下角齿轮进入 `设置`。',
          },
          {
            stepNumber: 2,
            title: '设置模型提供方为 OpenAI 兼容',
            description: '在 `AI 模型提供方` 下拉列表中选择 `OpenAI API 兼容`。',
          },
          {
            stepNumber: 3,
            title: '填写域名与密钥并保存',
            description: '填入 API 域名 `' + cleanBaseUrl + '` 与 API 密钥，在模型名称处输入 `' + model + '` 并点击保存。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: 'Host 格式说明',
            content: 'Chatbox 支持填写完整包含 /v1 的地址。如果中转站返回 404，请确认路径没有重复多拼 /v1。',
          },
        ],
        faqs: [
          {
            question: 'Chatbox 对话响应缓慢？',
            answer: '进入 Chatbox 设置 -> 模型设置 -> 开启“流式传输 (Stream)”，即可实现打字机效果逐字输出。',
          },
        ],
      },

      // 8. NextChat
      nextchat: {
        id: 'nextchat',
        categoryId: 'desktop_clients',
        title: 'NextChat (ChatGPT-Next-Web)',
        badge: 'Web & 桌面',
        protocol: 'OpenAI Compatible',
        subtitle:
          '一键免费部署的私有 ChatGPT / Claude 网页应用与全平台客户端，支持海量 Prompt 面具与防中间人加密。',
        overviewSummary:
          'NextChat 无论是使用自建 Docker 部署还是直接使用桌面客户端，均能通过极简的环境变量或 GUI 面板完成配置。',
        keyParams: [
          { label: '接口地址 (Base URL)', value: cleanBaseUrl, hint: '中转站 API 地址' },
          { label: 'API Key', value: maskedKey, hint: '中转站 API 密钥' },
          { label: '自定义模型', value: model, hint: '添加到模型列表中' },
        ],
        codeTabs: [
          {
            id: 'docker_cmd',
            label: 'Docker 一键部署命令',
            language: 'bash',
            title: '终端 Docker 命令',
            code: `docker run -d -p 3000:3000 \\
  -e BASE_URL="${cleanBaseUrl}" \\
  -e OPENAI_API_KEY="${apiKey}" \\
  -e CUSTOM_MODELS="+${model}" \\
  yidadaa/chatgpt-next-web`,
          },
          {
            id: 'docker_compose',
            label: 'docker-compose.yml',
            language: 'yaml',
            title: 'docker-compose.yml 文件',
            code: `version: '3.9'
services:
  chatgpt-next-web:
    image: yidadaa/chatgpt-next-web
    ports:
      - "3000:3000"
    environment:
      - BASE_URL=${cleanBaseUrl}
      - OPENAI_API_KEY=${apiKey}
      - CUSTOM_MODELS=+${model}
    restart: always`,
          },
          {
            id: 'gui_settings',
            label: '网页端 / 客户端 GUI 填法',
            language: 'yaml',
            title: 'NextChat -> 设置 -> 模型服务商',
            code: `模型服务商       : OpenAI
接口地址 (Base URL): ${cleanBaseUrl}
API Key          : ${apiKey}
自定义模型列表   : +${model}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '打开 NextChat 设置',
            description: '打开 NextChat 网页或客户端，点击左下角齿轮进入 `设置`。',
          },
          {
            stepNumber: 2,
            title: '配置接口地址与 API Key',
            description:
              '展开 `模型服务商`，填入接口地址 `' + cleanBaseUrl + '` 与 API Key。',
          },
          {
            stepNumber: 3,
            title: '在自定义模型中追加当前模型',
            description: '在 `自定义模型` 输入框中填入 `+' + model + '`，在对话界面即可选择使用。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: 'NextChat 模型追加语法',
            content:
              '在 NextChat 中，使用 `+模型名` 表示追加新模型，使用 `-模型名` 表示隐藏系统默认模型。例如：`+gpt-4o,+claude-3-5-sonnet,-gpt-3.5-turbo`。',
          },
        ],
        faqs: [
          {
            question: 'Docker 部署时修改 BASE_URL 为什么没生效？',
            answer:
              '请确保重新拉取并重建容器（docker-compose down && docker-compose up -d）。若在网页端手动填写过设置，网页端 LocalStorage 优先级高于 Docker 环境变量，需在网页端设置中点击“重置”。',
          },
        ],
      },

      // 9. Dify.ai
      dify: {
        id: 'dify',
        categoryId: 'enterprise_workflows',
        title: 'Dify.ai (开源 LLM 应用开发平台)',
        badge: '企业级推荐',
        protocol: 'OpenAI Compatible',
        subtitle:
          '开源的 LLM 应用开发与 Agent 编排平台，涵盖可视化的 Prompt 工程、工作流编排、RAG 向量数据库与知识库管理。',
        overviewSummary:
          'Dify 支持通过 OpenAI-API-compatible 机制接入中转站，为整个工作流与 Agent 应用提供模型算力底座。',
        keyParams: [
          { label: '提供商类型', value: 'OpenAI-API-compatible', hint: '模型供应商列表' },
          { label: '模型类型', value: 'LLM', hint: '可选 LLM / Text Embedding / Rerank' },
          { label: 'API Base', value: cleanBaseUrl, hint: '需带 /v1' },
          { label: 'API Key', value: maskedKey, hint: '中转站密钥' },
        ],
        codeTabs: [
          {
            id: 'dify_gui',
            label: 'Dify 模型供应商配置表单',
            language: 'yaml',
            title: 'Dify 控制台 -> 设置 -> 模型供应商 -> OpenAI-API-compatible',
            code: `模型类型   : LLM
模型名称   : ${model}
API Base   : ${cleanBaseUrl}
API Key    : ${apiKey}
最大 Token : 8192
支持的功能 : 勾选 "Function calling" 与 "Stream"`,
          },
          {
            id: 'dify_embedding',
            label: 'Embedding 向量模型配置',
            language: 'yaml',
            title: '若中转站提供 text-embedding-3-small 等向量模型',
            code: `模型类型   : Text Embedding
模型名称   : text-embedding-3-small
API Base   : ${cleanBaseUrl}
API Key    : ${apiKey}
最大 Token : 8192`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '登录 Dify 管理后台进入模型供应商',
            description: '点击 Dify 右上角头像 -> `设置` -> 左侧导航选择 `模型供应商`。',
          },
          {
            stepNumber: 2,
            title: '添加 OpenAI-API-compatible 供应商',
            description:
              '在供应商列表中找到 `OpenAI-API-compatible`，点击 `添加模型`。',
          },
          {
            stepNumber: 3,
            title: '填入模型参数并保存验证',
            description:
              '模型名称输入 `' + model + '`，API Base 填入 `' + cleanBaseUrl + '`，API Key 填入密钥，点击保存完成连通性校验。',
          },
        ],
        callouts: [
          {
            type: 'warning',
            title: 'API Base 规范',
            content: 'Dify 要求 API Base 必须是以 http:// 或 https:// 开头的完整 URL，且末尾不能有多余的斜杠。',
          },
        ],
        faqs: [
          {
            question: 'Dify 保存时提示 "Connection timed out" 或 404？',
            answer:
              'Dify 后台是以容器内部网络发起请求。若 Dify 部署在国外服务器，中转站被 Cloudflare 拦截可能导致 403；若 Base URL 缺少 /v1 会导致 404。',
          },
        ],
      },

      // 10. FastGPT
      fastgpt: {
        id: 'fastgpt',
        categoryId: 'enterprise_workflows',
        title: 'FastGPT (企业知识库系统)',
        badge: '企业知识库',
        protocol: 'OpenAI Compatible',
        subtitle:
          '基于大语言模型的企业级知识库问答与复杂工作流系统，支持高精度的文档切片、混合检索编排与多模型接入。',
        overviewSummary:
          'FastGPT 依靠 config.json 中的 llmModels 与 vectorModels 数组统一接入中转站。',
        keyParams: [
          { label: 'requestUrl', value: cleanBaseUrl, hint: '配置文件中的请求基地址' },
          { label: 'apiKey', value: maskedKey, hint: '配置文件中的 API 密钥' },
          { label: 'model', value: model, hint: '模型名称标识' },
        ],
        codeTabs: [
          {
            id: 'fastgpt_json',
            label: 'config.json 配置片段',
            language: 'json',
            title: 'FastGPT 项目 config.json -> llmModels',
            code: `{
  "llmModels": [
    {
      "model": "${model}",
      "name": "${model} (中转通道)",
      "maxContext": 128000,
      "maxResponse": 8192,
      "quoteMaxToken": 10000,
      "maxTemperature": 1.2,
      "charsPointsPrice": 0,
      "censor": false,
      "vision": true,
      "datasetProcess": true,
      "usedInClassify": true,
      "usedInExtractFields": true,
      "usedInToolCall": true,
      "toolCall": true,
      "defaultSystemChatPrompt": "",
      "requestUrl": "${cleanBaseUrl}",
      "apiKey": "${apiKey}"
    }
  ]
}`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '打开 FastGPT 的 config.json',
            description: '定位到 FastGPT 部署目录中的 `projects/app/data/config.json` 或 Docker 挂载的配置文件。',
          },
          {
            stepNumber: 2,
            title: '将中转模型配置追加到 llmModels 数组',
            description: '将上述 JSON 片段中的对象复制并粘贴到 `llmModels` 数组中。',
          },
          {
            stepNumber: 3,
            title: '重启 FastGPT 容器使配置生效',
            description: '执行 `docker compose restart fastgpt` 重启服务，进入 FastGPT 知识库或应用中即可选用该模型。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: 'requestUrl 格式规范',
            content: 'FastGPT 的 requestUrl 需完整指向 /v1，例如 ' + cleanBaseUrl + '。',
          },
        ],
        faqs: [
          {
            question: 'FastGPT 工作流中 Tool Call 节点报错？',
            answer: '请确认 config.json 中 `toolCall` 与 `usedInToolCall` 均设置为 true，且中转站上游模型支持 Function Calling。',
          },
        ],
      },

      // 11. LangChain & LlamaIndex
      langchain_llamaindex: {
        id: 'langchain_llamaindex',
        categoryId: 'enterprise_workflows',
        title: 'LangChain & LlamaIndex (Python/TS SDK)',
        badge: '开发者代码接入',
        protocol: 'Python & TypeScript SDK',
        subtitle:
          '主流 AI 开发框架与官方 SDK 接入标准代码，轻松集成到自主 Agent、RAG 向量检索管道与自动化微服务。',
        overviewSummary:
          '无论使用 Python 还是 Node.js/TypeScript，只需在初始化客户端或 LLM 对象时指定 base_url 与 api_key 即可无缝切换中转站。',
        keyParams: [
          { label: 'base_url', value: cleanBaseUrl, hint: 'SDK 初始化参数' },
          { label: 'api_key', value: maskedKey, hint: 'SDK 鉴权密钥' },
          { label: 'model', value: model, hint: '模型参数' },
        ],
        codeTabs: [
          {
            id: 'python_langchain',
            label: 'Python (LangChain)',
            language: 'python',
            title: 'langchain_openai.py',
            code: `from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# 1. 实例化 ChatOpenAI，注入中转站 Base URL 与 Key
llm = ChatOpenAI(
    base_url="${cleanBaseUrl}",
    api_key="${apiKey}",
    model="${model}",
    temperature=0.7,
    streaming=True
)

# 2. 发起对话调用
response = llm.invoke([HumanMessage(content="Hello! Please introduce yourself.")])
print(response.content)`,
          },
          {
            id: 'python_openai',
            label: 'Python (OpenAI 官方 SDK)',
            language: 'python',
            title: 'openai_demo.py',
            code: `from openai import OpenAI

# 1. 初始化 OpenAI Client
client = OpenAI(
    base_url="${cleanBaseUrl}",
    api_key="${apiKey}"
)

# 2. 流式对话调用 (Streaming)
stream = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Write a python quicksort function"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`,
          },
          {
            id: 'python_llamaindex',
            label: 'Python (LlamaIndex)',
            language: 'python',
            title: 'llama_index_demo.py',
            code: `from llama_index.llms.openai import OpenAI
from llama_index.core.llms import ChatMessage

# 1. 实例化 LlamaIndex OpenAI LLM
llm = OpenAI(
    api_base="${cleanBaseUrl}",
    api_key="${apiKey}",
    model="${model}"
)

# 2. 发起对话
messages = [ChatMessage(role="user", content="Hello LlamaIndex!")]
response = llm.chat(messages)
print(response.message.content)`,
          },
          {
            id: 'ts_openai',
            label: 'TypeScript (OpenAI SDK)',
            language: 'typescript',
            title: 'client.ts',
            code: `import OpenAI from 'openai';

// 1. 初始化 OpenAI Client
const openai = new OpenAI({
  baseURL: '${cleanBaseUrl}',
  apiKey: '${apiKey}',
});

async function main() {
  // 2. 发起流式请求
  const stream = await openai.chat.completions.create({
    model: '${model}',
    messages: [{ role: 'user', content: 'Say hello in TypeScript!' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main().catch(console.error);`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '安装对应语言环境的依赖包',
            description:
              'Python 执行 `pip install openai langchain-openai llama-index`；TypeScript 执行 `npm i openai @langchain/openai`。',
          },
          {
            stepNumber: 2,
            title: '在代码中显式传入 baseURL 与 apiKey',
            description:
              '在构造客户端实例时，将 baseURL 设置为 `' + cleanBaseUrl + '`，将 apiKey 设置为当前密钥。',
          },
          {
            stepNumber: 3,
            title: '运行代码并验证响应与流式输出',
            description: '执行脚本，确认终端能够正常输出模型生成的内容。',
          },
        ],
        callouts: [
          {
            type: 'tip',
            title: 'Python OpenAI 环境变量自动读取',
            content:
              '若已设置环境变量 OPENAI_BASE_URL 与 OPENAI_API_KEY，在 Python 中直接使用 `client = OpenAI()` 即可自动读取，无需显式传参。',
          },
        ],
        faqs: [
          {
            question: 'OpenAI Python SDK 报错 "APIConnectionError"？',
            answer:
              '检查 base_url 是否包含了 /v1。新版 openai-python (v1.0+) 要求 base_url 需为 "https://your-domain.com/v1"，若缺失 /v1 会导致请求直接发往根路径。',
          },
        ],
      },

      // 12. HTTP Errors 排查
      http_errors: {
        id: 'http_errors',
        categoryId: 'troubleshooting_specs',
        title: '常见中转站 HTTP 报错排查 (401/404/429/500/502)',
        badge: '排错指南',
        protocol: 'HTTP Status Codes',
        subtitle:
          '全方位解析中转站及上游渠道最常见的 HTTP 状态码成因、日志特征与秒级修复方案。',
        overviewSummary:
          '在中转站调用中，HTTP 错误通常源于四个层面：鉴权认证 (401/403)、路由与模型名称 (404)、速率配额 (429) 以及上游网络或服务器异常 (500/502/504)。',
        keyParams: [
          { label: '401 Unauthorized', value: '密钥无效 / 过期 / 额度耗尽', hint: '检查 Key 状态' },
          { label: '404 Not Found', value: 'Base URL 缺少 /v1 或模型名错误', hint: '检查路径与模型' },
          { label: '429 Rate Limit', value: '触发中转站或官方 RPM/TPM 限流', hint: '降低并发或升级' },
          { label: '500 / 502 / 504', value: '中转站上游渠道故障 / 超时 / 熔断', hint: '切换通道或重试' },
        ],
        codeTabs: [
          {
            id: 'diag_curl',
            label: '全流程诊断 cURL (带详细 Header)',
            language: 'bash',
            title: '诊断网络与响应头 (-i 参数打印 Header)',
            code: `curl -i -X POST "${cleanBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "ping"}],
    "max_tokens": 10
  }'`,
          },
          {
            id: 'models_curl',
            label: '测试 /v1/models 接口',
            language: 'bash',
            title: '检查当前 Key 是否有权读取模型列表',
            code: `curl -i -X GET "${cleanBaseUrl}/models" \\
  -H "Authorization: Bearer ${apiKey}"`,
          },
        ],
        steps: [
          {
            stepNumber: 1,
            title: '定位具体的 HTTP 响应状态码与错误 Body',
            description:
              '通过终端 cURL -i 命令或抓包工具，查看返回的 HTTP Code 与 JSON 中的 `error.message`。',
          },
          {
            stepNumber: 2,
            title: '对照下方状态码矩阵进行针对性修复',
            description:
              '若是 401，检查令牌与额度；若是 404，检查 URL 与模型名称；若是 502，联系中转站或切换模型。',
          },
          {
            stepNumber: 3,
            title: '使用本站首页“中转站检测”进行诊断',
            description:
              '切换到“中转站检测”页面，系统将自动对响应速度、流式传输、真实性与可用性进行测试。',
          },
        ],
        callouts: [
          {
            type: 'danger',
            title: '401 Unauthorized 排查清单',
            content:
              '1. 检查 Key 是否复制完整（有无前后多余空格）；2. 登录中转站后台检查该令牌是否已过期或额度用尽；3. 检查中转站是否限制了 IP 白名单。',
          },
          {
            type: 'warning',
            title: '404 Not Found 排查清单',
            content:
              '1. 检查 Base URL 是否漏写 /v1（例如 https://api.xxx.com 写成了 https://api.xxx.com 无 /v1）；2. 检查模型名称是否拼写错误（如 gpt-4o 误写成 gpt4o）；3. 检查中转站渠道是否未开启当前请求的端点。',
          },
          {
            type: 'info',
            title: '502 Bad Gateway / 504 Gateway Timeout',
            content:
              '说明中转站服务本身正常，但中转站去请求 OpenAI/Anthropic 官方上游时网络中断或超时。通常只需等待几秒重试，或在中转站切换其他备用渠道。',
          },
        ],
        faqs: [
          {
            question: '中转站返回 HTML 页面（如 Cloudflare 502 / 521）？',
            answer:
              '说明请求被 Cloudflare 拦截，可能是中转站源站服务器宕机，或者中转站开启了高防人机验证。建议联系中转站站长处理。',
          },
        ],
      },

      // 13. API Specs 规范
      api_specs: {
        id: 'api_specs',
        categoryId: 'troubleshooting_specs',
        title: 'API 格式标准与路由规范',
        badge: '协议规范',
        protocol: 'RFC & API Spec',
        subtitle:
          '深入解析 OpenAI 与 Anthropic 两大主流协议规范差异、Header 鉴权要求与 SSE 流式传输关键点。',
        overviewSummary:
          '统一掌握 API 标准规范，能够帮助你在对接不同客户端与编写自定义网关中间件时游刃有余。',
        keyParams: [
          { label: 'OpenAI 对话路由', value: '/v1/chat/completions', hint: '标准 Chat 端点' },
          { label: 'Anthropic 对话路由', value: '/v1/messages', hint: 'Anthropic Messages 端点' },
          { label: '模型列表路由', value: '/v1/models', hint: '获取可用模型' },
          { label: '流式 Content-Type', value: 'text/event-stream', hint: 'SSE 传输规范' },
        ],
        codeTabs: [
          {
            id: 'spec_compare',
            label: 'OpenAI vs Anthropic 协议对比',
            language: 'json',
            title: '请求 Payload 结构对比',
            code: `// 1. OpenAI Compatible 格式 (POST /v1/chat/completions)
{
  "model": "${model}",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "stream": true
}

// 2. Anthropic Messages 格式 (POST /v1/messages)
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 1024,
  "system": "You are a helpful assistant.",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}`,
          },
          {
            id: 'sse_spec',
            label: 'SSE 流式传输响应头规范',
            language: 'yaml',
            title: '中转站反代 Nginx 推荐配置',
            code: `# Nginx 反向代理关键配置 (防止流式输出被缓冲卡顿)
location / {
    proxy_pass http://upstream_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # 禁用代理缓冲，实现真正打字机逐字推流
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
            title: '核对客户端与中转站所使用的协议类型',
            description:
              '确认客户端需要的是 OpenAI Compatible 还是 Anthropic Messages 协议，选择正确的 Base URL 格式。',
          },
          {
            stepNumber: 2,
            title: '规范 HTTP Headers 头部',
            description:
              'OpenAI 格式使用 `Authorization: Bearer <key>`，Anthropic 格式使用 `x-api-key: <key>` 与 `anthropic-version: 2023-06-01`。',
          },
          {
            stepNumber: 3,
            title: '确保流式传输 (SSE) 缓冲已关闭',
            description:
              '若自建反代或中转服务器，确保已配置 `proxy_buffering off`，避免客户端出现响应延迟卡顿现象。',
          },
        ],
        callouts: [
          {
            type: 'info',
            title: 'Base URL 斜杠容错原则',
            content:
              '优秀的 API 网关应同时支持结尾带 / 与不带 / 的请求，并自动规范化路径。但在配置客户端时，保持结尾不带斜杠（如 https://api.openai.com/v1）兼容性最佳。',
          },
        ],
        faqs: [
          {
            question: '为什么流式传输时文字会一瞬间出来一整段，而不是一个个字出来？',
            answer:
              '这是典型的前端反向代理（如 Nginx、Cloudflare 等）开启了响应缓冲 (Buffer)。在 Nginx 配置中添加 `proxy_buffering off;` 即可解决。',
          },
        ],
      },
    };
  }, [cleanBaseUrl, apiKey, model, maskedKey]);

  // Current doc item content
  const currentDoc = docContents[activeItem] || docContents.quickstart;

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
    <div className="space-y-6">
      {/* Top Banner Card - OpenCode Docs Style */}
      <div className="relative overflow-hidden rounded-2xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-xl smooth-card">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-[#cc785c]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#cc785c]/40 bg-[#cc785c]/15 text-[#cc785c] shadow-inner">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif-display text-2xl md:text-3xl font-bold tracking-tight text-[#faf9f5]">
                  客户端与 Agent 接入文档
                </h2>
                <span className="rounded-full border border-[#cc785c]/40 bg-[#cc785c]/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#cc785c] tracking-wide">
                  OpenCode Style AI Docs
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-300">
                自动注入当前 Base URL、API Key 与 Model，为各大开发工具、Agent 及桌面端生成开箱即用的配置与命令。
              </p>
            </div>
          </div>

          {/* Quick Info & Copy All Config */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[#2e2b27] bg-[#141413] px-3 py-1.5 text-xs text-neutral-300 shadow-inner">
              <Globe className="h-3.5 w-3.5 text-[#cc785c]" />
              <span className="font-mono text-[#faf9f5] truncate max-w-[200px]" title={cleanBaseUrl}>
                {cleanBaseUrl}
              </span>
            </div>
            <button
              onClick={handleCopyGlobalConfig}
              className="flex items-center gap-1.5 rounded-lg border border-[#cc785c]/50 bg-[#cc785c]/20 px-3.5 py-1.5 text-xs font-semibold text-[#faf9f5] transition hover:bg-[#cc785c] hover:text-white smooth-btn shadow-sm"
            >
              {globalCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#6ee7b7]" />
                  <span className="text-[#6ee7b7]">已复制配置 JSON</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>导出全局配置 JSON</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Documentation 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================== */}
        {/* Left Column: Sidebar Navigation (3 cols)   */}
        {/* ========================================== */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-20">
          {/* Search Box with Ctrl+K shortcut badge */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文档、工具、客户端..."
              className="w-full rounded-xl border border-[#2e2b27] bg-[#1b1a18] py-2 pl-9 pr-16 text-xs text-[#faf9f5] placeholder-neutral-400 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c] transition smooth-input font-medium"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white px-1"
                >
                  ✕
                </button>
              ) : (
                <span className="text-[10px] font-mono text-neutral-400 bg-[#23211e] px-1.5 py-0.5 rounded border border-[#2e2b27] select-none">
                  Ctrl K
                </span>
              )}
            </div>
          </div>

          {/* Category Tree Navigation with Collapse/Expand */}
          <nav className="space-y-3 rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-3 shadow-md max-h-[75vh] overflow-y-auto smooth-card">
            {filteredCategories.map((group) => {
              const IconComp = group.icon;
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 hover:text-white rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className="h-3.5 w-3.5 text-[#cc785c]" />
                      <span>{group.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.badge && (
                        <span className="text-[10px] text-neutral-400 bg-[#23211e] px-1.5 py-0.2 rounded border border-[#2e2b27]">
                          {group.badge}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Category Item List */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1 animate-in fade-in duration-150">
                      {group.items.map((item) => {
                        const isActive = activeItem === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateToDoc(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left smooth-btn ${
                              isActive
                                ? 'bg-[#cc785c]/20 text-[#faf9f5] font-semibold border-l-2 border-[#cc785c] shadow-sm'
                                : 'text-neutral-300 hover:text-white hover:bg-[#23211e] font-medium'
                            }`}
                          >
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wide ${
                                  isActive
                                    ? 'bg-[#cc785c] text-white shadow-sm'
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

            {filteredCategories.length === 0 && (
              <div className="p-4 text-center text-xs text-neutral-400">
                未找到匹配的文档主题
              </div>
            )}
          </nav>

          {/* Quick Context Card */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#141413] p-3.5 space-y-2 text-xs smooth-card">
            <div className="flex items-center justify-between text-neutral-400 font-semibold tracking-wide">
              <span className="font-mono uppercase text-[10px]">Active Model</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
            </div>
            <div className="font-mono text-[#faf9f5] font-semibold truncate select-all" title={model}>
              {model}
            </div>
            <div className="text-[11px] text-neutral-300 font-normal">
              配置已实时贯通至下方所有代码片段。
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* Center Column: Rich Documentation Content */}
        {/* ========================================== */}
        <main className="lg:col-span-6 xl:col-span-7 space-y-8 min-w-0">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="hover:text-white cursor-pointer font-medium" onClick={() => navigateToDoc('quickstart')}>
              文档与接入 (Docs)
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#2e2b27]" />
            <span className="text-neutral-300 font-medium">{currentCategoryGroup.title}</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#2e2b27]" />
            <span className="text-[#cc785c] font-semibold">{currentDoc.title.split(' ')[0]}</span>
          </div>

          {/* Page Header */}
          <div className="space-y-3 pb-6 border-b border-[#2e2b27]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#cc785c]/40 bg-[#cc785c]/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#cc785c] tracking-wide">
                {currentDoc.badge}
              </span>
              <span className="rounded-md border border-[#2e2b27] bg-[#23211e] px-2.5 py-0.5 text-xs font-mono text-neutral-300 font-medium">
                {currentDoc.protocol}
              </span>
            </div>

            <h1 className="font-serif-display text-2xl md:text-3xl font-bold text-[#faf9f5] tracking-tight">
              {currentDoc.title}
            </h1>

            <p className="text-sm text-neutral-300 leading-relaxed font-normal">
              {currentDoc.subtitle}
            </p>
          </div>

          {/* Section 1: Overview & Parameters */}
          <section id="overview" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                <Layers className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-semibold text-[#faf9f5]">1. 连接参数总览 (Parameters Overview)</h2>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {currentDoc.overviewSummary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentDoc.keyParams.map((param, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-3.5 space-y-1.5 hover:border-[#cc785c]/40 transition smooth-card"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                    <span>{param.label}</span>
                    {param.hint && (
                      <span className="text-[10px] text-neutral-400 font-normal">{param.hint}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-xs font-semibold text-[#faf9f5] truncate select-all tracking-wide"
                      title={param.value}
                    >
                      {param.value}
                    </span>
                    {param.label.includes('Key') && (
                      <button
                        onClick={() => setShowFullKey(!showFullKey)}
                        className="text-neutral-400 hover:text-[#faf9f5] transition p-1 smooth-btn"
                        title={showFullKey ? '隐藏密钥' : '显示完整密钥'}
                      >
                        {showFullKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Code Snippets with Multi-Platform Switcher */}
          <section id="quick-config" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <Code2 className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base font-semibold text-[#faf9f5]">2. 快速配置与代码注入 (Code & Config)</h2>
              </div>
            </div>

            {/* Platform / Language Tabs */}
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

            {/* Code Block Container */}
            <div className="space-y-2">
              <CodeBlock
                code={currentSelectedTab.code}
                language={currentSelectedTab.language}
                title={currentSelectedTab.title || `${activeItem}_${currentSelectedTab.id}`}
                showLineNumbers
              />
              <div className="flex items-center justify-between text-[11px] text-neutral-300 px-1 font-medium">
                <span>💡 提示：该配置已自动填入当前活跃的中转 Base URL 与 API Key。</span>
                <span className="font-mono text-neutral-400">{currentSelectedTab.language}</span>
              </div>
            </div>
          </section>

          {/* Section 3: Step-by-Step Guide */}
          <section id="step-by-step" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-semibold text-[#faf9f5]">3. 分步操作指南 (Step-by-Step Walkthrough)</h2>
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
                <h2 className="text-base font-semibold text-[#faf9f5]">4. 关键注意事项与避坑 (Tips & Warnings)</h2>
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

          {/* Section 5: Verification Command */}
          {currentDoc.verificationSnippet && (
            <section id="verification" className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base font-semibold text-[#faf9f5]">5. 连通性快速验证 (Quick Verification)</h2>
              </div>

              <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-3 smooth-card">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-[#faf9f5]">
                    {currentDoc.verificationSnippet.title}
                  </h3>
                  <p className="text-xs text-neutral-300">
                    {currentDoc.verificationSnippet.description}
                  </p>
                </div>

                <CodeBlock
                  code={currentDoc.verificationSnippet.code}
                  language={currentDoc.verificationSnippet.language}
                  title="verification_curl"
                />
              </div>
            </section>
          )}

          {/* Section 6: FAQ & Troubleshooting */}
          {currentDoc.faqs.length > 0 && (
            <section id="faq" className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c]">
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-base font-semibold text-[#faf9f5]">6. 常见问题排查 (FAQ)</h2>
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

          {/* Bottom Article Navigation Cards (OpenCode Docs Previous & Next) */}
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
        </main>

        {/* ========================================== */}
        {/* Right Column: TOC "本页内容" (2-3 cols)     */}
        {/* ========================================== */}
        <aside className="hidden xl:block xl:col-span-2 space-y-4 sticky top-20">
          <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-4 space-y-3 shadow-md smooth-card">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-semibold text-[#faf9f5] pb-2 border-b border-[#2e2b27]">
              <Hash className="h-3.5 w-3.5 text-[#cc785c]" />
              <span>本页内容</span>
            </div>

            <nav className="space-y-1 text-xs">
              <button
                onClick={() => scrollToSection('overview')}
                className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
              >
                1. 连接参数总览
              </button>
              <button
                onClick={() => scrollToSection('quick-config')}
                className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
              >
                2. 快速配置代码
              </button>
              <button
                onClick={() => scrollToSection('step-by-step')}
                className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
              >
                3. 分步操作指南
              </button>
              {currentDoc.callouts.length > 0 && (
                <button
                  onClick={() => scrollToSection('tips-warnings')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  4. 注意事项与避坑
                </button>
              )}
              {currentDoc.verificationSnippet && (
                <button
                  onClick={() => scrollToSection('verification')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  5. 连通性快速验证
                </button>
              )}
              {currentDoc.faqs.length > 0 && (
                <button
                  onClick={() => scrollToSection('faq')}
                  className="w-full text-left py-1 text-neutral-400 hover:text-white transition block truncate font-medium"
                >
                  6. 常见问题排查
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
                <span>复制完整配置</span>
              </button>
            </div>
          </div>

          {/* Live Config Summary Widget */}
          <div className="rounded-xl border border-[#2e2b27] bg-[#141413] p-3 space-y-2 text-[11px] smooth-card">
            <div className="font-semibold text-[#faf9f5] flex items-center gap-1">
              <Server className="h-3 w-3 text-[#cc785c]" />
              <span>当前连接端点</span>
            </div>
            <div className="text-neutral-300 font-mono truncate" title={cleanBaseUrl}>
              {cleanBaseUrl}
            </div>
            <div className="text-[10px] text-[#6ee7b7] flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
              <span>配置参数自动同步已就绪</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};
