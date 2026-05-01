import { ChevronRight, Copy } from 'lucide-react';

export default function LiteLLMDoc() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-400 mb-6">
        <span>首页</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>文档</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-200">LiteLLM 进阶配置</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">LiteLLM 代理进阶配置</h1>
      <p className="text-slate-400 text-base leading-relaxed mb-10">
        掌握高级命令行参数，优化代理性能与调试效率。
      </p>

      <div className="space-y-12">
        {/* Step 1 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">1</span>
            第一步 — 解决跨域问题 (CORS)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            如果你想在浏览器环境（前端代码）中直接调用本地的 LiteLLM，必须开启跨域支持。
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
                    <span className="text-slate-500"># 启动时加上 --cors 参数允许所有跨域请求</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">deepseek/deepseek-chat</span> --cors
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 调试与日志打印
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            遇到各种 400 或 500 报错时，开启 debug 模式可以查看完整的请求和返回体。
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
                    <span className="text-slate-500"># 添加 --detailed_debug 查看请求明细</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/auto</span> --detailed_debug
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
