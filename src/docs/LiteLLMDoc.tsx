import { ChevronRight, Copy, CheckCircle2, Download, Rocket } from 'lucide-react';
import { useState } from 'react';

export default function LiteLLMDoc() {
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
          <span className="text-slate-200">LiteLLM 进阶配置</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">LiteLLM 代理进阶配置</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-10">
          掌握从安装到高级调试的全流程，极致优化代理网关的性能与稳定性。
        </p>
      </div>

      <div className="space-y-16">
        {/* Step 1: 安装 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">
              <Download className="w-3 h-3" />
            </span>
            第一步 — 安装 LiteLLM
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            LiteLLM 是一个基于 Python 的工具，推荐在全局环境或虚拟环境中使用 <code className="bg-white/10 px-1 rounded">pip</code> 进行安装。
          </p>
          <div className="pl-8">
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy("pip install 'litellm[proxy]'", 'install')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                >
                  {copiedId === 'install' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-slate-300">
                <code>
                  <span className="text-slate-500"># 使用 pip 安装支持代理模式的完整包</span>{'\n'}
                  <span className="text-purple-400">pip</span> install 'litellm[proxy]'
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 2: 实操案例 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
              <Rocket className="w-3 h-3" />
            </span>
            第二步 — 核心用法与实操案例
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            通过指定正确的平台前缀，LiteLLM 会自动处理所有底层的 Base URL 和鉴权握手。
          </p>

          <div className="pl-8 space-y-6">
            <div>
              <h4 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
                <span>🎯 实操案例 (以 OpenRouter + 腾讯混元为例)</span>
              </h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy('$env:OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxx"\nlitellm --model openrouter/tencent/hy3-preview:free --drop_params', 'example')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                  >
                    {copiedId === 'example' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 设置 OpenRouter 的专属环境变量</span>{'\n'}
                    <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"sk-or-v1-xxxxxxxxx"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 使用 openrouter/ 前缀启动代理 (劫持模式)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model openrouter/tencent/hy3-preview:free --drop_params
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}