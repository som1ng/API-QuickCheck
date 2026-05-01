import { useState } from 'react';
import { BookOpen, ChevronRight, Copy, Info, Construction } from 'lucide-react';

export default function DocsView() {
  const [activeDoc, setActiveDoc] = useState('quick-start');

  const renderContent = () => {
    switch (activeDoc) {
      case 'quick-start':
        return <QuickStartDoc />;
      case 'claude-code':
        return <ClaudeCodeDoc />;
      default:
        return <EmptyStateDoc />;
    }
  };

  const navItems = [
    {
      category: '入门',
      items: [
        { id: 'quick-start', label: '快速开始' },
        { id: 'core-concepts', label: '核心概念' },
      ],
    },
    {
      category: '代理网关',
      items: [
        { id: 'lite-llm', label: 'LiteLLM 配置' },
        { id: 'model-routing', label: '模型路由' },
      ],
    },
    {
      category: 'Agent 接入',
      items: [
        { id: 'claude-code', label: 'Claude Code' },
        { id: 'cursor', label: 'Cursor' },
        { id: 'openclaw', label: 'OpenClaw' },
      ],
    },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 border-r border-white/10 overflow-y-auto bg-transparent pb-10">
        <nav className="p-6 space-y-8">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{group.category}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveDoc(item.id)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                        activeDoc === item.id
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </div>
    </div>
  );
}

function QuickStartDoc() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-400 mb-6">
        <span>首页</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>入门</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-200">快速开始</span>
      </div>

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Agent 快速接入指南</h1>
      <p className="text-slate-400 text-base leading-relaxed mb-8">
        通过部署 LiteLLM 本地网关，您可以将任何第三方聚合模型（如 DeepSeek、OpenRouter 等）伪装成 Anthropic 的官方服务，从而无缝接入 Claude Code 等强大的本地 Agent 工具，实现零代码修改的跨平台模型调度。
      </p>

      {/* Callouts */}
      <div className="space-y-4 mb-12">
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3 shadow-lg">
          <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-emerald-300 font-bold mb-1">核心原则：双终端物理隔离</h4>
            <p className="text-emerald-200/80 text-sm leading-relaxed">
              本方案强制要求开启<strong>两个完全独立</strong>的终端窗口。一个作为服务端（LiteLLM 网关）持续运行，另一个作为客户端（Agent）进行交互。绝对不要在同一个终端内混用环境变量。
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-start gap-3 shadow-lg">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-300 font-bold mb-1">注意：前缀路由自动解析</h4>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              在使用聚合平台时，必须使用 LiteLLM 原生支持的服务商前缀（如 <code className="bg-blue-500/20 px-1 rounded">openrouter/</code>），让其自动处理 Base URL 和鉴权，<strong className="text-blue-300">严禁画蛇添足添加 --api_base 参数</strong>。
            </p>
          </div>
        </div>
      </div>

      {/* Step Cards Grid */}
      <h2 className="text-xl font-bold text-white mt-10 mb-6">3 分钟接入步骤</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4 border border-blue-500/30">1</div>
          <h3 className="text-white font-bold mb-2">获取 API Key</h3>
          <p className="text-slate-400 text-sm leading-relaxed">前往 OpenRouter、DeepSeek 等第三方平台的 Dashboard 获取你的专属 API Key。</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4 border border-purple-500/30">2</div>
          <h3 className="text-white font-bold mb-2">启动 LiteLLM 网关</h3>
          <p className="text-slate-400 text-sm leading-relaxed">在终端 1 中配置对应 Key 并启动本地网关，注意映射正确的模型前缀。</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/30">3</div>
          <h3 className="text-white font-bold mb-2">启动 Agent</h3>
          <p className="text-slate-400 text-sm leading-relaxed">在终端 2 中劫持官方环境变量指向 127.0.0.1，并显式选中代理模型进行对话。</p>
        </div>
      </div>
    </div>
  );
}

function ClaudeCodeDoc() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300">
      {/* 顶部导引与核心原则 */}
      <div className="mb-10">
        <div className="flex items-center text-sm text-slate-400 mb-6">
          <span>首页</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>文档</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Agent 接入</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-200">Claude Code</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Claude Code 接入教程</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          通过 LiteLLM 本地网关，三步实现跨平台大模型（如混元、DeepSeek）零代码修改无缝接入。
        </p>
        
        <div className="bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-xl flex items-start gap-3 shadow-lg">
          <BookOpen className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-300 font-bold mb-2 text-lg">⚠️ 先记住一个核心原则：双终端物理隔离</h4>
            <p className="text-red-200/90 text-sm leading-relaxed">
              必须开启两个<strong>完全独立</strong>的终端窗口。一个作为服务端跑 LiteLLM，一个作为客户端跑 Claude Code。绝对不要在同一个终端内混用环境变量！
            </p>
          </div>
        </div>
      </div>

      {/* 核心步骤区块 */}
      <div className="space-y-12">
        {/* 第一步 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            在终端 1 中注入对应平台的真实 API Key，并指定你想代理的具体模型。LiteLLM 会自动处理 Base URL 和底层路由。
          </p>
          <div className="pl-8">
            <div className="relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 注入真实的 API Key (以 OpenRouter 为例)</span>{'\n'}
                    <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"sk-or-v1-你的真实密钥"</span>{'\n'}
                    {'\n'}
                    <span className="text-slate-500"># 2. 启动代理 (使用原生前缀，严禁添加 --api_base)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/tencent/hy3-preview:free</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 第二步 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 启动客户端 (配置环境变量)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            在全新的终端 2 中执行。清理掉可能干扰的鉴权 Token，将所有请求劫持到本地的 4000 端口，并随便塞一个假的 Key 糊弄 Claude Code 的本地检查。
          </p>
          <div className="pl-8">
            <div className="relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
                    <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n'}
                    <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
                    <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm-local"</span>{'\n'}
                    <span className="text-emerald-400">claude</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 第三步 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">3</span>
            第三步 — 验证与直接对话
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            进入 Claude Code 后，无需使用 <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">/model</code> 切换模型。
          </p>
          <div className="pl-8">
            <div className="flex items-start bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 gap-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200/90 leading-relaxed space-y-2">
                <p className="font-bold text-blue-300 text-base mb-2">💡 偷梁换柱的网关魔法</p>
                <p>因为我们在第一步强行指定了 <code className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">--model</code> 参数，LiteLLM 已开启单模型劫持。此时无论 Claude Code 界面显示默认使用的是 <code className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">Haiku</code> 还是 <code className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">Sonnet</code>，底层都已经被替换为了你指定的第三方大模型。直接输入文本开始对话即可！</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 常见问题排查 (FAQ 区块) */}
      <div className="mt-16 border-t border-white/5 pt-10">
        <h2 className="text-lg font-bold text-white mb-6">常见问题排查</h2>
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 启动 LiteLLM 报错 401 Unauthorized
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 通常是因为环境变量前缀和模型前缀不匹配（例如使用了 <code className="bg-white/10 px-1 rounded">openai/</code> 前缀但只配置了 <code className="bg-white/10 px-1 rounded">OPENROUTER_API_KEY</code>）。请确保严格使用 <code className="bg-white/10 px-1 rounded">openrouter/</code> 前缀。
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 报错 Cannot connect to host api.openai.com:443
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 路由劫持失败，请求错误地发往了 OpenAI 官方。请检查启动 LiteLLM 时是否遗漏了平台前缀，或者环境变量拼写错误。
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 终端一直提示 Lollygagging... 或报错 404 Not Found
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 代理链路已通，但上游的特定模型可能下线或繁忙（常见于免费探针模型）。请在第一步更换一个稳定可用的模型名称（如 <code className="bg-white/10 px-1 rounded">Gemini Flash</code> 或 <code className="bg-white/10 px-1 rounded">Llama 3</code>）。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyStateDoc() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-300 pt-32">
      <Construction className="w-20 h-20 text-slate-700 mb-6 opacity-50" />
      <h2 className="text-xl font-bold text-slate-300 mb-2">文档构建中</h2>
      <p className="text-slate-500 max-w-md">该模块文档正在疯狂施工中，敬请期待...</p>
    </div>
  );
}
