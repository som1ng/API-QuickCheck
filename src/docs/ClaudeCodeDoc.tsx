import { ChevronRight, BookOpen, Copy, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';
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
            在<strong>独立的终端窗口</strong>中启动 LiteLLM。你需要根据你选择的供应商配置 API Key 并指定模型 ID。
          </p>

          <div className="pl-8">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-4 shadow-lg">
              <ExternalLink className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-bold mb-2">详细配置请参考 LiteLLM 进阶指南</h4>
                <p className="text-blue-200/80 text-sm leading-relaxed mb-4">
                  关于如何针对 OpenRouter、DeepSeek 或硅基流动等不同平台进行配置，请点击左侧边栏的 <strong>“LiteLLM 配置”</strong> 查看通用公式与参数对照表。
                </p>
                <div className="bg-black/30 border border-white/10 rounded-lg p-4 font-mono text-xs text-slate-300 italic">
                  # 启动示例 (劫持模式)<br/>
                  litellm --model [平台前缀]/[模型ID] --drop_params
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
            在<strong>另一个全新的终端</strong>中执行。清理掉可能干扰的鉴权 Token，将所有请求劫持到本地的 4000 端口，并随便塞一个假的 Key 糊弄 Claude Code 的本地检查。
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
              <span className="font-semibold text-slate-300">A:</span> 通常是因为环境变量前缀和模型前缀不匹配。请参照 <strong>LiteLLM 配置</strong> 中的速查表，确保严格对应。
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
        </div>
      </div>
    </div>
  );
}