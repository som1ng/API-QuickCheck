import { BookOpen, ChevronRight, Copy, Info } from 'lucide-react';

export default function DocsView() {
  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 border-r border-white/10 overflow-y-auto bg-transparent pb-10">
        <nav className="p-6 space-y-8">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">入门</h4>
            <ul className="space-y-1">
              <li><a href="#" className="block text-sm text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors bg-white/5 font-medium">快速开始</a></li>
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">核心概念</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">代理网关</h4>
            <ul className="space-y-1">
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">LiteLLM 配置</a></li>
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">模型路由</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent 接入</h4>
            <ul className="space-y-1">
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">Claude Code</a></li>
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">Cursor</a></li>
              <li><a href="#" className="block text-sm text-slate-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors cursor-pointer">OpenClaw</a></li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12">
          
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-slate-400 mb-6">
            <span>首页</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>文档</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-200">快速开始</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Agent 快速接入指南</h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            通过部署 LiteLLM 本地网关，您可以将任何第三方聚合模型（如 DeepSeek、OpenRouter 等）伪装成 Anthropic 的官方服务，从而无缝接入 Claude Code 等强大的本地 Agent 工具，实现零代码修改的跨平台模型调度。
          </p>

          {/* Callouts */}
          <div className="space-y-4 mb-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
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

          {/* Code Blocks */}
          <h2 className="text-xl font-bold text-white mt-10 mb-6">配置代码参考</h2>
          
          <div className="space-y-8">
            {/* Terminal 1 */}
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                终端 1：启动服务端 (LiteLLM 本地网关)
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
                      <span className="text-slate-500"># 1. 注入对应平台的真实 API Key (以 OpenRouter 为例)</span>{'\n'}
                      <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"[填入真实的平台_API_KEY]"</span>{'\n'}
                      {'\n'}
                      <span className="text-slate-500"># 2. 启动代理网关 (格式要求：litellm --model [平台前缀]/[目标模型ID] --drop_params)</span>{'\n'}
                      <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/[填入平台支持的具体模型ID]</span> --drop_params
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Terminal 2 */}
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full inline-block shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                终端 2：启动客户端 (Agent 交互终端)
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
                      <span className="text-slate-500"># 1. 清理 Auth 干扰并设置正确的本地回环地址 (注意必须是 127.0.0.1)</span>{'\n'}
                      <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
                      <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n'}
                      {'\n'}
                      <span className="text-slate-500"># 2. 劫持官方请求至本地 LiteLLM</span>{'\n'}
                      <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
                      <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm-local-proxy"</span>{'\n'}
                      {'\n'}
                      <span className="text-slate-500"># 3. 启动 Agent 应用</span>{'\n'}
                      <span className="text-emerald-400">claude</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            
            {/* Warning */}
            <div className="mt-8 flex items-start bg-red-500/10 border border-red-500/20 rounded-xl p-5 gap-4 shadow-lg relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
              <BookOpen className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200/90 leading-relaxed space-y-2">
                <p className="font-bold text-red-300 text-base mb-3">终端内模型显式重定向 (防 404 必做)</p>
                <p>进入 Agent 交互界面后，<strong className="text-red-400 font-extrabold text-white">绝对不能直接开始对话</strong>（会触发默认模型的 404 错误）。</p>
                <p>必须第一时间执行 Agent 的模型切换命令（例如 Claude Code 中的 <code className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">/model</code>），并在弹出的列表中<strong className="text-white">手动高亮选中</strong>通过 LiteLLM 映射进来的代理模型，回车确认后方可开始对话。</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
