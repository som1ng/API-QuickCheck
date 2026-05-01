import { ChevronRight, Info, Copy, CheckCircle2 } from 'lucide-react';

export default function CursorDoc() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-400 mb-6">
        <span>首页</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>文档</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span>Agent 接入</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-200">Cursor</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Cursor 接入教程</h1>
      <p className="text-slate-400 text-base leading-relaxed mb-8">
        通过本地代理，让 Cursor 使用任意第三方的 OpenAI 兼容接口（如 DeepSeek、硅基流动）。
      </p>

      {/* Callout - Info */}
      <div className="bg-blue-500/10 border-l-4 border-blue-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg mb-12">
        <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-blue-300 font-bold mb-2 text-lg">💡 核心区别：OpenAI 兼容协议</h4>
          <p className="text-blue-200/90 text-sm leading-relaxed">
            与 Claude Code 走 Anthropic 协议不同，Cursor 走的是标准的 OpenAI 协议。因此我们在覆盖 Base URL 时，不需要做复杂的模型劫持，只需正确重定向接口即可。
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Step 1 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            直接使用对应平台的 API Key 启动代理即可。这里不需要 <code className="bg-white/10 px-1 rounded">--model</code> 强行劫持，让 Cursor 自己传模型名。
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
                    <span className="text-purple-400">$env:</span>DEEPSEEK_API_KEY=<span className="text-amber-300">"sk-你的真实密钥"</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 配置 Cursor 客户端
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            打开 Cursor 设置 (Settings) {"->"} Models，进行以下操作：
          </p>
          <div className="pl-8 space-y-4">
            {[
              "关闭默认的所有模型开关。",
              "在 OpenAI API Key 处填入：sk-litellm-local。",
              "展开高级设置，点击 Override OpenAI Base URL，填入：http://127.0.0.1:4000/v1。",
              "在底部的 Add Model 中，手动添加你要用的模型前缀与名称（例如 deepseek/deepseek-coder），并将其点亮。"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 bg-white/5 border border-white/5 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
