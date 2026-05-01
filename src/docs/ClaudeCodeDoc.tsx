import { ChevronRight, BookOpen, Copy, Info, CheckCircle2, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function ClaudeCodeDoc() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300 pb-20">
      {/* 顶部导引 */}
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

        {/* 核心原则警告框 */}
        <div className="bg-orange-500/10 border-l-4 border-orange-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg mb-4">
          <BookOpen className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-orange-300 font-bold text-lg mb-1">⚠️ 核心原则：双终端物理隔离</h4>
            <p className="text-orange-400/80 text-sm leading-relaxed">
              本方案强制要求开启<strong>两个完全独立</strong>的终端窗口！一个作为服务端运行 LiteLLM 网关，另一个作为客户端运行 Agent。绝对不要在同一个终端内混用环境变量！
            </p>
          </div>
        </div>
      </div>

      {/* 核心步骤区块 */}
      <div className="space-y-12">

        {/* Step 1: 启动服务端 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            通过指定正确的平台前缀，LiteLLM 会自动处理所有底层的 Base URL 和鉴权握手，切勿画蛇添足手动添加 <code className="bg-white/10 px-1 rounded">--api_base</code> 参数。
          </p>

          <div className="pl-8 space-y-6">
            {/* 模板区块 */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                <span>📐 通用配置公式 (模板)</span>
              </h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 注入你所选平台的 API Key (注意环境变量名需与平台匹配)</span>{'\n'}
                    <span className="text-purple-400">$env:</span><span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【平台对应环境变量】</span>=<span className="text-amber-300">"你的真实密钥"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 启动代理 (使用平台专属前缀，开启参数过滤)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【平台前缀】</span>/<span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【具体模型ID】</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>

            {/* 实操案例区块 */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                <span>🎯 实操案例 (以 OpenRouter + 腾讯混元为例)</span>
              </h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy('$env:OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxx"\nlitellm --model openrouter/tencent/hy3-preview:free --drop_params', 'step1')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                  >
                    {copiedId === 'step1' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 设置 OpenRouter 的专属环境变量</span>{'\n'}
                    <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"sk-or-v1-xxxxxxxxx"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 使用 openrouter/ 前缀启动代理</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model openrouter/tencent/hy3-preview:free --drop_params
                  </code>
                </pre>
              </div>
            </div>

            {/* 平台对照表 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mt-4">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                🗂️ 常见平台参数速查表
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">OpenRouter</div>
                  <div className="text-xs text-slate-400 mb-1">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">OPENROUTER_API_KEY</code></div>
                  <div className="text-xs text-slate-400">前缀: <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">openrouter/</code></div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">DeepSeek (官方)</div>
                  <div className="text-xs text-slate-400 mb-1">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">DEEPSEEK_API_KEY</code></div>
                  <div className="text-xs text-slate-400">前缀: <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">deepseek/</code></div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">硅基流动 (SiliconFlow)</div>
                  <div className="text-xs text-slate-400 mb-1">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">SILICONFLOW_API_KEY</code></div>
                  <div className="text-xs text-slate-400">前缀: <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">siliconflow/</code></div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">OpenAI (官方)</div>
                  <div className="text-xs text-slate-400 mb-1">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">OPENAI_API_KEY</code></div>
                  <div className="text-xs text-slate-400">前缀: <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">openai/</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: 启动客户端 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 启动客户端 (配置 Agent)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            在<strong>全新的终端 2</strong> 中执行。清理掉可能干扰的鉴权 Token，将所有请求劫持到本地的 4000 端口，并随便塞一个假的 Key 糊弄 Claude Code 的本地检查。
          </p>
          <div className="pl-8">
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy('Remove-Item Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"\n$env:ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm-local"\nclaude', 'step2')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                >
                  {copiedId === 'step2' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-slate-300">
                <code>
                  <span className="text-slate-500"># 1. 清理环境 & 反劫持</span>{'\n'}
                  <span className="text-purple-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
                  <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n\n'}
                  <span className="text-slate-500"># 2. 劫持官方请求至本地</span>{'\n'}
                  <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
                  <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm-local"</span>{'\n\n'}
                  <span className="text-slate-500"># 3. 启动应用</span>{'\n'}
                  <span className="text-emerald-400">claude</span>
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 3: 直接对话 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">3</span>
            第三步 — 验证与直接对话
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            进入 Claude Code 后，<strong>无需使用 <code className="bg-white/10 px-1 rounded">/model</code> 切换模型</strong>，直接开始对话即可！
          </p>

          <div className="pl-8">
            <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg">
              <Terminal className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-emerald-300 font-bold text-lg mb-1">💡 偷梁换柱的网关魔法</h4>
                <p className="text-emerald-400/80 text-sm leading-relaxed">
                  因为我们在第一步强行指定了 <code className="bg-black/30 px-1 rounded">--model</code> 参数，LiteLLM 已开启<strong>单模型劫持模式</strong>。此时无论 Claude Code 界面显示默认使用的是 Haiku 还是 Sonnet，底层都已经被替换为了你指定的第三方大模型。您的 Agent 毫无察觉，但却拥有了全新的大脑！
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FAQ 区域 */}
      <div className="mt-20 border-t border-white/10 pt-10">
        <h3 className="text-2xl font-bold text-white mb-8">🛠️ 常见问题排查</h3>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 启动 LiteLLM 报错 401 Unauthorized
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 通常是因为环境变量前缀和模型前缀不匹配（例如使用了 <code className="bg-white/10 px-1 rounded">openai/</code> 前缀但只配置了 <code className="bg-white/10 px-1 rounded">OPENROUTER_API_KEY</code>）。请参照上方速查表，确保严格对应。
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 报错 Cannot connect to host api.openai.com:443
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 路由劫持失败，请求错误地发往了 OpenAI 官方。请检查启动 LiteLLM 时是否遗漏了平台前缀。
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 终端一直提示 Lollygagging... 或报错 404 Not Found
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 代理链路已通，但上游的特定模型可能下线或繁忙（常见于免费探针模型）。请在第一步更换一个稳定可用的模型名称。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}