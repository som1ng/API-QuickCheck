import { ChevronRight, Info, Copy, CheckCircle2, BookOpen } from 'lucide-react';
import { useState } from 'react';

const CURSOR_GATEWAY_COMMAND = '$env:DEEPSEEK_API_KEY="sk-xxxxxxxxx"\nlitellm --drop_params';

export default function CursorDoc() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 sm:px-12 animate-in fade-in duration-300 pb-20">
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
          通过本地代理，让 Cursor 使用任意第三方 OpenAI 兼容或 LiteLLM 已支持的上游平台。
        </p>

        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg mb-4">
          <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-300 font-bold text-lg mb-1">💡 核心区别：Cursor 自己传模型名</h4>
            <p className="text-blue-400/80 text-sm leading-relaxed">
              Cursor 走 OpenAI 协议，网关只负责接入和参数兜底，真正选择哪个模型由 Cursor 客户端配置决定。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            Cursor 不需要 `--model` 强制劫持。先按速查表注入对应环境变量，再启动一个开放模型选择权的 LiteLLM 网关。
          </p>

          <div className="pl-8 space-y-6">
            <div>
              <h4 className="text-slate-300 font-semibold mb-2">📐 通用配置公式 (模板)</h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 注入你所选平台的环境变量</span>{'\n'}
                    <span className="text-purple-400">$env:</span><span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【对应环境变量】</span>=<span className="text-amber-300">"你的真实密钥"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 启动代理网关</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>

            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-blue-200/80">
                找不到你需要配置的平台？请前往左侧导航栏的 <strong>「LiteLLM 进阶配置」</strong> 模块，查阅我们整理的 23+ 主流大模型平台完整参数速查表。
              </span>
            </div>

            <div>
              <h4 className="text-slate-300 font-semibold mb-2">🎯 实操案例 (以 DeepSeek 官方为例)</h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(CURSOR_GATEWAY_COMMAND, 'step1-cursor')}
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

          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 配置 Cursor 客户端
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            打开 Cursor 设置 → Models，按照以下顺序完成图形化接入。
          </p>
          <div className="pl-8 space-y-3">
            {[
              { text: '关闭默认的所有模型开关，避免误走官方额度。', highlight: '' },
              { text: '在 OpenAI API Key 处填入虚拟密钥：', highlight: 'sk-litellm-local' },
              { text: '展开高级设置，覆盖 OpenAI Base URL 为本地网关地址（必须带 /v1）：', highlight: 'http://127.0.0.1:4000/v1' },
              { text: '在底部 Add Model 中手动添加你要用的「平台前缀/模型名称」并启用。例如：', highlight: 'deepseek/deepseek-chat' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-white/5 border border-white/5 p-4 rounded-lg">
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
