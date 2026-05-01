import { ChevronRight, Copy, CheckCircle2, Server, Settings } from 'lucide-react';
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
          掌握高级命令行参数与配置文件，极致优化代理网关的性能与调试效率。
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1: CORS */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
              <Server className="w-3 h-3" />
            </span>
            第一步 — 解决跨域问题 (CORS)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            如果你打算在纯前端应用（如浏览器中的 React/Vue 页面）中直接调用本地跑在 4000 端口的 LiteLLM，你必须显式开启跨域支持，否则浏览器会拦截请求。
          </p>
          <div className="pl-8">
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy('litellm --model deepseek/deepseek-chat --cors', 'cors')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                >
                  {copiedId === 'cors' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-slate-300">
                <code>
                  <span className="text-slate-500"># 启动时加上 --cors 参数允许所有跨域请求</span>{'\n'}
                  <span className="text-purple-400">litellm</span> --model deepseek/deepseek-chat <span className="text-emerald-400 font-bold">--cors</span>
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 2: Debugging */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">
              <Settings className="w-3 h-3" />
            </span>
            第二步 — 调试与日志打印
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            在对接新的 Agent 或平台时，经常会遇到 400 (Bad Request) 或 500 等错误。开启深度调试模式，可以让你在终端清晰地看到请求发往了哪个 URL、带了什么 Header，以及完整返回体。
          </p>
          <div className="pl-8">
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy('litellm --model openrouter/auto --detailed_debug', 'debug')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                >
                  {copiedId === 'debug' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="text-slate-300">
                <code>
                  <span className="text-slate-500"># 添加 --detailed_debug 查看着色打印的请求明细</span>{'\n'}
                  <span className="text-purple-400">litellm</span> --model openrouter/auto <span className="text-amber-400 font-bold">--detailed_debug</span>
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 3: Config.yaml tip */}
        <div>
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl shadow-lg mt-8">
            <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              💡 高级进阶：使用 config.yaml
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              当你的环境变量和参数变得极其复杂时（比如配置负载均衡、回退机制Fallback），建议放弃纯命令行启动，改用配置文件。
            </p>
            <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-mono text-xs text-slate-300">
              $ litellm --config config.yaml
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}