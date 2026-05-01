import React, { useState } from 'react';
import { Info, Check, Copy, AlertTriangle, ExternalLink, BookOpen } from 'lucide-react';

// ── Reusable copy button (self-contained) ────────────────────────────
function GuideCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
      title="一键复制"
    >
      {copied ? (
        <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
      ) : (
        <><Copy className="w-3 h-3" /><span>Copy</span></>
      )}
    </button>
  );
}

// ── Code block wrapper ───────────────────────────────────────────────
function CodeBlock({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <GuideCopyButton text={code} />
      </div>
      <pre className="bg-black/40 border border-white/10 rounded-xl p-5 pr-24 overflow-x-auto custom-scrollbar font-mono text-sm text-gray-300 leading-relaxed shadow-2xl">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────
interface IntegrationGuideProps {
  apiKey: string;
  baseUrl: string;
  platformId: string;
  modelId: string;
}

type TabId = 'claude-code' | 'nextchat' | 'dify' | 'python';

const TABS: { id: TabId; label: string }[] = [
  { id: 'claude-code', label: 'Claude Code (CLI)' },
  { id: 'nextchat', label: 'NextChat' },
  { id: 'dify', label: 'Dify / FastGPT' },
  { id: 'python', label: 'Python / cURL' },
];

// ── Main component ──────────────────────────────────────────────────
export default function IntegrationGuide({ apiKey, baseUrl, platformId, modelId }: IntegrationGuideProps) {
  const [activeTab, setActiveTab] = useState<TabId>('claude-code');
  const [shellType, setShellType] = useState<'bash' | 'ps'>(
    typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Win') !== -1 ? 'ps' : 'bash'
  );

  // Resolve display values
  const displayKey = apiKey || 'sk-your-api-key';
  const displayUrl = baseUrl || 'https://api.openai.com';
  const displayModel = modelId || 'gpt-4o';
  const baseUrlNoTrailingSlash = displayUrl.replace(/\/$/, '');
  // Some apps don't want /v1 suffix
  const baseUrlNoV1 = baseUrlNoTrailingSlash.replace(/\/v1$/, '');

  // LiteLLM env key
  const litellmEnvKey = platformId === 'custom' ? 'OPENAI_API_KEY' : `${platformId.toUpperCase()}_API_KEY`;
  const litellmModel = platformId === 'deepseek'
    ? 'deepseek/deepseek-chat'
    : `openai/${displayModel}`;

  // ── Renderers ─────────────────────────────────────────────────────

  const renderClaudeCode = () => {
    const isNativeAnthropic = platformId === 'anthropic' || platformId === 'claude';

    if (isNativeAnthropic) {
      // Direct Anthropic key → no LiteLLM needed
      const bashCode = `export ANTHROPIC_API_KEY="${displayKey}"\nclaude`;
      const psCode = `$env:ANTHROPIC_API_KEY="${displayKey}"\nclaude`;
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              检测到您使用的是 <strong className="text-emerald-300">Anthropic 原生 Key</strong>，无需额外中转，直接设置环境变量即可启动 Claude Code。
            </p>
          </div>
          <ShellSwitch shell={shellType} onChange={setShellType} />
          <CodeBlock code={shellType === 'bash' ? bashCode : psCode}>
            {shellType === 'bash' ? (
              <>
                <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"{displayKey}"</span>{'\n'}
                <span className="text-emerald-400">claude</span>
              </>
            ) : (
              <>
                <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"{displayKey}"</span>{'\n'}
                <span className="text-emerald-400">claude</span>
              </>
            )}
          </CodeBlock>
        </div>
      );
    }

    // Non-Anthropic → LiteLLM gateway
    const bashCode = `# Step 1: 清理环境 & 反劫持\nunset ANTHROPIC_AUTH_TOKEN\nexport NO_PROXY="127.0.0.1,localhost,0.0.0.0"\n\n# Step 2: 启动 LiteLLM 网关\nexport ${litellmEnvKey}="${displayKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmModel} --drop_params\n\n# Step 3: (新终端) 启动 Claude Code\nexport ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\nexport ANTHROPIC_API_KEY="sk-litellm"\nclaude`;
    const psCode = `# Step 1: 清理环境 & 反劫持\nRemove-Item Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"\n\n# Step 2: 启动 LiteLLM 网关\n$env:${litellmEnvKey}="${displayKey}"\npip install --upgrade "litellm[proxy]"\nlitellm --model ${litellmModel} --drop_params\n\n# Step 3: (新终端) 启动 Claude Code\n$env:ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm"\nclaude`;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/70 leading-relaxed">
            Claude Code 仅支持 Anthropic 协议。当前平台需要通过 <strong className="text-amber-300">LiteLLM 本地网关</strong> 进行协议翻译。
            <code className="ml-1 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">--drop_params</code> 可自动过滤不兼容参数。
          </p>
        </div>
        <ShellSwitch shell={shellType} onChange={setShellType} />
        <CodeBlock code={shellType === 'bash' ? bashCode : psCode}>
          {shellType === 'bash' ? (
            <>
              <span className="text-slate-500"># Step 1: 清理环境 & 反劫持</span>{'\n'}
              <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\n'}
              <span className="text-purple-400">export</span> NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># Step 2: 启动 LiteLLM 网关</span>{'\n'}
              <span className="text-purple-400">export</span> {litellmEnvKey}=<span className="text-amber-300">"{displayKey}"</span>{'\n'}
              <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
              <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmModel}</span> --drop_params{'\n'}
              {'\n'}
              <span className="text-slate-500"># Step 3: (新终端) 启动 Claude Code</span>{'\n'}
              <span className="text-purple-400">export</span> ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
              <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\n'}
              <span className="text-emerald-400">claude</span>
            </>
          ) : (
            <>
              <span className="text-slate-500"># Step 1: 清理环境 & 反劫持</span>{'\n'}
              <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
              <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># Step 2: 启动 LiteLLM 网关</span>{'\n'}
              <span className="text-purple-400">$env:</span>{litellmEnvKey}=<span className="text-amber-300">"{displayKey}"</span>{'\n'}
              <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
              <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmModel}</span> --drop_params{'\n'}
              {'\n'}
              <span className="text-slate-500"># Step 3: (新终端) 启动 Claude Code</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\n'}
              <span className="text-emerald-400">claude</span>
            </>
          )}
        </CodeBlock>
        <div className="flex flex-wrap gap-3">
          <DocLink href="https://docs.litellm.ai/docs/proxy/quick_start" label="LiteLLM Proxy 文档" color="blue" />
          <DocLink href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview" label="Claude Code 官方指南" color="purple" />
        </div>
      </div>
    );
  };

  const renderNextChat = () => {


    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200/70 leading-relaxed space-y-2">
            <p>在 NextChat (ChatGPT-Next-Web) 的 <strong className="text-blue-300">设置 → 自定义接口</strong> 中填入以下配置：</p>
            <ul className="list-disc ml-4 space-y-1 text-blue-200/60">
              <li>接口地址 (API Endpoint)：<code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">{baseUrlNoV1}</code></li>
              <li>API Key：使用您的真实 Key</li>
              <li>自定义模型名：<code className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">{displayModel}</code></li>
            </ul>
            <p className="text-amber-200/60">⚠️ 注意：NextChat 会自动拼接 <code className="bg-white/5 px-1 rounded">/v1</code>，所以 Base URL 请 <strong className="text-amber-300">去掉末尾的 /v1</strong>。</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">或者直接使用 Docker 环境变量启动：</p>
        <CodeBlock code={`docker run -d -p 3000:3000 \\\n  -e OPENAI_API_KEY="${displayKey}" \\\n  -e BASE_URL="${baseUrlNoV1}" \\\n  -e DEFAULT_MODEL="${displayModel}" \\\n  yidadaa/chatgpt-next-web`}>
          <span className="text-purple-400">docker</span> run -d -p 3000:3000 \{'\n'}
          {'  '}-e OPENAI_API_KEY=<span className="text-amber-300">"{displayKey}"</span> \{'\n'}
          {'  '}-e BASE_URL=<span className="text-amber-300">"{baseUrlNoV1}"</span> \{'\n'}
          {'  '}-e DEFAULT_MODEL=<span className="text-emerald-300">"{displayModel}"</span> \{'\n'}
          {'  '}yidadaa/chatgpt-next-web
        </CodeBlock>
      </div>
    );
  };

  const renderDify = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200/70 leading-relaxed space-y-2">
            <p>在 <strong className="text-indigo-300">Dify / FastGPT</strong> 后台的 <strong className="text-indigo-300">模型供应商 → 自定义模型</strong> 中，添加以下配置：</p>
          </div>
        </div>

        {/* Config Table */}
        <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl" />
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest w-36 border-r border-white/5">模型类型</td>
                <td className="py-3.5 px-5 text-white font-semibold">OpenAI-API-compatible</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-r border-white/5">模型名称</td>
                <td className="py-3.5 px-5 text-emerald-400 font-mono text-xs">{displayModel}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-r border-white/5">API Endpoint</td>
                <td className="py-3.5 px-5 text-amber-300 font-mono text-xs">{baseUrlNoTrailingSlash}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-r border-white/5">API Key</td>
                <td className="py-3.5 px-5 text-blue-400 font-mono text-xs">{displayKey.substring(0, 12)}···</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-start bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/60 leading-relaxed">
            Dify 和 FastGPT 都支持 OpenAI 兼容格式。如果连通异常，请确认 Base URL 是否包含 <code className="bg-white/5 px-1 rounded">/v1</code> 后缀（部分平台需要，部分不需要）。
          </p>
        </div>
      </div>
    );
  };

  const renderPython = () => {
    const pythonCode = `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${baseUrlNoTrailingSlash}/v1"
)

response = client.chat.completions.create(
    model="${displayModel}",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=100
)

print(response.choices[0].message.content)`;

    const curlCode = `curl ${baseUrlNoTrailingSlash}/v1/chat/completions \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${displayModel}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'`;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
          Python (openai SDK)
        </p>
        <CodeBlock code={pythonCode}>
          <span className="text-purple-400">from</span> <span className="text-blue-300">openai</span> <span className="text-purple-400">import</span> OpenAI{'\n'}
          {'\n'}
          client = <span className="text-blue-300">OpenAI</span>({'\n'}
          {'    '}api_key=<span className="text-amber-300">"{displayKey}"</span>,{'\n'}
          {'    '}base_url=<span className="text-amber-300">"{baseUrlNoTrailingSlash}/v1"</span>{'\n'}
          ){'\n'}
          {'\n'}
          response = client.chat.completions.<span className="text-blue-300">create</span>({'\n'}
          {'    '}model=<span className="text-emerald-300">"{displayModel}"</span>,{'\n'}
          {'    '}messages=[{'{'}<span className="text-amber-300">"role"</span>: <span className="text-amber-300">"user"</span>, <span className="text-amber-300">"content"</span>: <span className="text-amber-300">"Hello!"</span>{'}'}],{'\n'}
          {'    '}max_tokens=<span className="text-blue-300">100</span>{'\n'}
          ){'\n'}
          {'\n'}
          <span className="text-purple-400">print</span>(response.choices[<span className="text-blue-300">0</span>].message.content)
        </CodeBlock>

        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1 flex items-center gap-2 pt-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
          cURL
        </p>
        <CodeBlock code={curlCode}>
          <span className="text-purple-400">curl</span> {baseUrlNoTrailingSlash}/v1/chat/completions \{'\n'}
          {'  '}-H <span className="text-amber-300">"Authorization: Bearer {displayKey}"</span> \{'\n'}
          {'  '}-H <span className="text-amber-300">"Content-Type: application/json"</span> \{'\n'}
          {'  '}-d <span className="text-amber-300">'{`{`}</span>{'\n'}
          {'    '}<span className="text-blue-400">"model"</span>: <span className="text-emerald-300">"{displayModel}"</span>,{'\n'}
          {'    '}<span className="text-blue-400">"messages"</span>: [{'{'}<span className="text-amber-300">"role"</span>: <span className="text-amber-300">"user"</span>, <span className="text-amber-300">"content"</span>: <span className="text-amber-300">"Hello!"</span>{'}'}],{'\n'}
          {'    '}<span className="text-blue-400">"max_tokens"</span>: <span className="text-blue-300">100</span>{'\n'}
          {'  '}<span className="text-amber-300">{`}`}'</span>
        </CodeBlock>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-200/60 leading-relaxed">
            安装依赖：<code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">pip install openai</code>。所有兼容 OpenAI 格式的平台（DeepSeek、硅基流动、OpenRouter 等）均可使用此代码，只需修改 <code className="text-emerald-300 bg-emerald-500/10 px-1.5 rounded">base_url</code> 即可。
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden hover:border-white/15 transition-all duration-300">
      {/* Header */}
      <div className="p-6 bg-black/20 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-black text-white flex items-center text-lg tracking-tight">
          <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
          一键接入指南
        </h3>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Integration Docs</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/5 bg-black/10 overflow-x-auto custom-scrollbar px-3 pt-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-500 bg-white/5'
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 md:p-8">
        {activeTab === 'claude-code' && renderClaudeCode()}
        {activeTab === 'nextchat' && renderNextChat()}
        {activeTab === 'dify' && renderDify()}
        {activeTab === 'python' && renderPython()}
      </div>
    </div>
  );
}

// ── Utility sub-components ──────────────────────────────────────────

function ShellSwitch({ shell, onChange }: { shell: 'bash' | 'ps'; onChange: (s: 'bash' | 'ps') => void }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('bash')}
        className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${
          shell === 'bash'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'
        }`}
      >
        Bash / Zsh
      </button>
      <button
        onClick={() => onChange('ps')}
        className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${
          shell === 'ps'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'
        }`}
      >
        PowerShell
      </button>
    </div>
  );
}

function DocLink({ href, label, color }: { href: string; label: string; color: 'blue' | 'purple' | 'emerald' }) {
  const colorMap = {
    blue: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
    purple: 'text-purple-400 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
    emerald: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg border transition-all ${colorMap[color]}`}
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}
