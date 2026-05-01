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
      <div className="flex items-center text-sm text-slate-400 mb-6">
        <span>首页</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>Agent 接入</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-200">Claude Code</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Claude Code 接入指南</h1>
      
      <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-lg mb-10">
        <BookOpen className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-red-300 font-bold mb-1">强制要求：双终端隔离</h4>
          <p className="text-red-200/80 text-sm leading-relaxed">
            必须使用两个完全独立的终端窗口。<strong>严禁</strong>在同一个终端内混用环境变量。
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            步骤 1：启动服务端 (LiteLLM 网关)
          </p>
          <div className="relative group">
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
              <pre className="text-slate-300">
                <code>
                  <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"sk-or-v1-你的真实密钥"</span>{'\n'}
                  <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/tencent/hy3-preview:free</span> --drop_params
                </code>
              </pre>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full inline-block shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            步骤 2：启动客户端 (Agent 终端)
          </p>
          <div className="mb-3 text-sm text-slate-400">强调：必须打开<strong>全新终端</strong>。</div>
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

        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            步骤 3：终端内模型显式重定向
          </p>
          <div className="flex items-start bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 gap-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <BookOpen className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90 leading-relaxed space-y-2">
              <p className="font-bold text-amber-300 text-base mb-3">进入 Claude Code 后，切勿直接对话！</p>
              <p>必须立刻输入 <code className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">/model</code> <strong>手动选中代理模型</strong>，否则将触发 404 错误。</p>
            </div>
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
