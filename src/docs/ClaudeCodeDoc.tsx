import { ChevronRight, BookOpen, Copy, Database, Info } from 'lucide-react';

export default function ClaudeCodeDoc() {
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
          < BookOpen className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
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
            <div className="relative group mb-6">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 注入真实平台的 API Key (注意变量名因平台而异)</span>{'\n'}
                    <span className="text-purple-400">$env:</span>【平台对应的环境变量】=<span className="text-amber-300">"你的真实密钥"</span>{'\n'}
                    {'\n'}
                    <span className="text-slate-500"># 2. 启动代理 (使用对应原生前缀，严禁添加 --api_base)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">【平台前缀】/【具体模型ID】</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>

            {/* 平台对照表 */}
            <h4 className="text-sm font-bold text-slate-300 mt-6 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              🗂️ 主流平台配置速查表
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {[
                {
                  name: 'OpenRouter',
                  env: 'OPENROUTER_API_KEY',
                  prefix: 'openrouter/',
                  example: 'openrouter/deepseek/deepseek-chat'
                },
                {
                  name: 'DeepSeek (官方)',
                  env: 'DEEPSEEK_API_KEY',
                  prefix: 'deepseek/',
                  example: 'deepseek/deepseek-chat'
                },
                {
                  name: 'SiliconFlow (硅基流动)',
                  env: 'SILICONFLOW_API_KEY',
                  prefix: 'siliconflow/',
                  example: 'siliconflow/deepseek-ai/DeepSeek-V3'
                },
                {
                  name: 'OpenAI (官方)',
                  env: 'OPENAI_API_KEY',
                  prefix: 'openai/',
                  example: 'openai/gpt-4o'
                }
              ].map((platform) => (
                <div key={platform.name} className="bg-black/30 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
                  <div className="text-xs font-bold text-white mb-2 pb-2 border-b border-white/5">{platform.name}</div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">环境变量</span>
                      <code className="bg-white/5 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px] w-fit leading-none">{platform.env}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">模型前缀</span>
                      <code className="bg-white/5 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[10px] w-fit leading-none">{platform.prefix}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">示例</span>
                      <code className="text-slate-400 font-mono text-[10px] break-all">{platform.example}</code>
                    </div>
                  </div>
                </div>
              ))}
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
