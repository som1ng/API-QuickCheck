import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import { Terminal } from 'lucide-react';

export const ClientExportTab: React.FC = () => {
  const { config } = useApp().state;

  const [activeClient, setActiveClient] = useState<
    'claude_code' | 'cline' | 'cursor' | 'cherry' | 'nextchat' | 'dify'
  >('claude_code');

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
  const apiKey = config.apiKey || 'sk-your-api-key-here';
  const model = config.selectedModel || 'gpt-4o';

  const clientConfigs = {
    claude_code: {
      title: 'Claude Code (Anthropic 官方 CLI)',
      description: '将当前中转站密钥与 BaseURL 注入 Claude Code 终端环境变量。',
      code: `# 1. 注入 Anthropic 兼容环境变量 (Linux/macOS)
export ANTHROPIC_BASE_URL="${cleanBaseUrl}"
export ANTHROPIC_API_KEY="${apiKey}"

# Windows PowerShell:
# $env:ANTHROPIC_BASE_URL="${cleanBaseUrl}"
# $env:ANTHROPIC_API_KEY="${apiKey}"

# 2. 启动 Claude Code (指定当前模型)
claude --model ${model}`,
      language: 'bash',
    },
    cline: {
      title: 'Cline / Roo Code (VS Code Agent 插件)',
      description: '在 VS Code 插件设置中选择 OpenAI Compatible 模式填入。',
      code: `{
  "apiProvider": "openai",
  "openAiBaseUrl": "${cleanBaseUrl}",
  "openAiApiKey": "${apiKey}",
  "openAiModelId": "${model}",
  "openAiCustomModelInfo": {
    "maxTokens": 8192,
    "supportsFunctionCalling": true,
    "supportsImages": true
  }
}`,
      language: 'json',
    },
    cursor: {
      title: 'Cursor (AI 代码编辑器)',
      description: '在 Cursor Settings -> Models -> OpenAI API Key 中配置。',
      code: `# 1. 进入 Cursor Settings -> Models
# 2. 开启 "Override OpenAI Base URL"
Base URL: ${cleanBaseUrl}

# 3. 填入 API Key:
API Key : ${apiKey}

# 4. 在 Model List 中添加自定义模型名:
Model   : ${model}`,
      language: 'yaml',
    },
    cherry: {
      title: 'Cherry Studio / Chatbox (桌面客户端)',
      description: '进入 设置 -> 模型服务 -> 添加自定义 OpenAI 兼容服务。',
      code: `提供商类型: OpenAI API 兼容
API 域名  : ${cleanBaseUrl}
API 密钥  : ${apiKey}
默认模型  : ${model}`,
      language: 'yaml',
    },
    nextchat: {
      title: 'NextChat (ChatGPT-Next-Web)',
      description: '在设置 -> 模型服务商中填写。',
      code: `接口地址 (Base URL): ${cleanBaseUrl}
API Key             : ${apiKey}
自定义模型          : ${model}`,
      language: 'yaml',
    },
    dify: {
      title: 'Dify / FastGPT (企业级 Agent 平台)',
      description: '进入 设置 -> 模型供应商 -> OpenAI API-compatible。',
      code: `模型类型: LLM
模型名称: ${model}
API Base: ${cleanBaseUrl}
API Key : ${apiKey}`,
      language: 'yaml',
    },
  };

  const current = clientConfigs[activeClient];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-display text-xl font-medium text-[#faf9f5] tracking-tight">
              客户端与 Agent 配置导出
            </h2>
            <p className="mt-1 text-xs text-[#9c9689]">
              自动根据当前配置的中转站 Base URL、Key 和模型生成各大 Coding Agent 及客户端的最佳连接配置。
            </p>
          </div>
        </div>
      </div>

      {/* Client Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'claude_code', label: 'Claude Code' },
          { id: 'cline', label: 'Cline / Roo Code' },
          { id: 'cursor', label: 'Cursor' },
          { id: 'cherry', label: 'Cherry Studio' },
          { id: 'nextchat', label: 'NextChat' },
          { id: 'dify', label: 'Dify / FastGPT' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveClient(tab.id as any)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              activeClient === tab.id
                ? 'bg-[#cc785c] text-[#faf9f5] font-semibold'
                : 'text-[#9c9689] hover:text-[#faf9f5] hover:bg-[#23211e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Display Card */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md space-y-4">
        <div>
          <h3 className="font-serif-display text-base font-medium text-[#faf9f5]">{current.title}</h3>
          <p className="text-xs text-[#9c9689] mt-0.5">{current.description}</p>
        </div>

        <CodeBlock
          code={current.code}
          language={current.language}
          title={`${activeClient}_config`}
          showLineNumbers
        />
      </div>
    </div>
  );
};
