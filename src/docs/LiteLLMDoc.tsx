import { ChevronRight, Copy, CheckCircle2, Download, Rocket, Info, LayoutTemplate, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { PLATFORMS } from '../config/platforms';

const CATEGORY_ORDER = ['海外巨头', '海外聚合与加速', '国内大厂', '国内新锐'] as const;

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
          掌握从安装到核心配置的全流程，极致优化代理网关的性能与稳定性。
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

        {/* Step 2: 核心配置指南 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
              <LayoutTemplate className="w-3 h-3" />
            </span>
            第二步 — 核心配置指南 (公式与对照表)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            通过指定正确的平台前缀，LiteLLM 可以统一管理跨平台模型调用。是否需要显式附加 <code className="bg-white/10 px-1 rounded">--api_base</code>，请严格以速查表中的标记为准。
          </p>

          <div className="pl-8 space-y-8">
            {/* 模板区块 */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                📐 通用配置公式 (模板)
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

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-blue-400" />
                🗂️ 全平台参数速查表 (23+ 支持)
              </h4>
              <div className="space-y-5">
                {CATEGORY_ORDER.map((category) => {
                  const groupedPlatforms = Object.values(PLATFORMS).filter((platform) => platform.category === category);
                  if (groupedPlatforms.length === 0) return null;

                  return (
                    <section key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">{category}</span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>

                      <div className="space-y-2">
                        {groupedPlatforms.map((platform) => (
                          <div key={platform.id} className="bg-black/30 border border-white/5 rounded-lg p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-bold text-slate-200 text-xs">{platform.name}</div>
                              {platform.litellmConfig.requiresApiBase && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                                  <AlertTriangle className="w-3 h-3" />
                                  需附加 --api_base（{platform.defaultBaseUrl}）
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              变量:
                              <code className="ml-1 text-blue-300 bg-blue-500/10 px-1 rounded">
                                {platform.litellmConfig.envVar}
                              </code>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              前缀:
                              <code className="ml-1 text-emerald-300 bg-emerald-500/10 px-1 rounded">
                                {platform.litellmConfig.prefix}
                              </code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: 实操案例 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">
              <Rocket className="w-3 h-3" />
            </span>
            第三步 — 实操案例 (以 OpenRouter 为例)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            通过具体的案例，快速上手 LiteLLM 的基本运行流程。
          </p>

          <div className="pl-8">
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
  );
}
