import { ChevronRight, Info, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function CursorDoc() {
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
          <span className="text-slate-200">Cursor</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Cursor 接入教程</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          通过本地代理，让 Cursor 使用任意第三方的 OpenAI 兼容接口（如 DeepSeek、硅基流动）。
        </p>

        {/* 核心区别提示框 */}
        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg mb-4">
          <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-300 font-bold text-lg mb-1">💡 核心区别：OpenAI 兼容协议</h4>
            <p className="text-blue-400/80 text-sm leading-relaxed">
              与 Claude Code 走 Anthropic 协议不同，Cursor 走的是标准的 OpenAI 协议。因此我们在覆盖 Base URL 时，不需要做复杂的模型底层劫持，只需让 Cursor 自己传递模型名称即可。
            </p>
          </div>
        </div>
      </div>

      {/* 核心步骤区块 */}
      <div className="space-y-12">

        {/* Step 1: 启动服务端 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            这里不需要 <code className="bg-white/10 px-1 rounded">--model</code> 强行劫持，直接使用 <code className="bg-white/10 px-1 rounded">--drop_params</code> 启动，让 Cursor 在客户端自由决定使用哪个模型。
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
                    <span className="text-slate-500"># 1. 注入你所选平台的 API Key</span>{'\n'}
                    <span className="text-purple-400">$env:</span><span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【平台对应环境变量】</span>=<span className="text-amber-300">"你的真实密钥"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 启动代理 (放开模型限制，仅丢弃不支持的参数)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>

            {/* 实操案例区块 */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                <span>🎯 实操案例 (以 DeepSeek 官方为例)</span>
              </h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy('$env:DEEPSEEK_API_KEY="sk-xxxxxxxxx"\nlitellm --drop_params', 'step1-cursor')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 transition-colors focus:outline-none"
                  >
                    {copiedId === 'step1-cursor' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 设置官方环境变量</span>{'\n'}
                    <span className="text-purple-400">$env:</span>DEEPSEEK_API_KEY=<span className="text-amber-300">"sk-xxxxxxxxx"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 启动代理网关</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --drop_params
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
                  <div className="font-bold text-slate-200 mb-1">DeepSeek (官方)</div>
                  <div className="text-xs text-slate-400">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">DEEPSEEK_API_KEY</code></div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">硅基流动 (SiliconFlow)</div>
                  <div className="text-xs text-slate-400">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">SILICONFLOW_API_KEY</code></div>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="font-bold text-slate-200 mb-1">OpenRouter</div>
                  <div className="text-xs text-slate-400">变量: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">OPENROUTER_API_KEY</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: 客户端配置 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 配置 Cursor 客户端
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            打开 Cursor 设置 (Settings) → Models，按照以下步骤进行图形化配置：
          </p>
          <div className="pl-8 space-y-3">
            {[
              { text: "关闭默认的所有模型开关（避免消耗官方额度）。", highlight: "" },
              { text: "在 OpenAI API Key 处填入虚拟密钥：", highlight: "sk-litellm-local" },
              { text: "展开高级设置，点击 Override OpenAI Base URL，填入本地网关地址（必须带 /v1）：", highlight: "http://127.0.0.1:4000/v1" },
              { text: "在底部的 Add Model 中，手动添加你要用的「平台前缀/模型名称」，并将其点亮。例如：", highlight: "deepseek/deepseek-coder" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-lg">
                <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-purple-400" /></div>
                <div className="text-slate-300 text-sm leading-relaxed">
                  {item.text}
                  {item.highlight && (
                    <span className="block mt-2">
                      <code className="bg-black/50 text-emerald-300 px-2 py-1 rounded border border-white/10 font-mono">
                        {item.highlight}
                      </code>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}