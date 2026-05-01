
import { ExternalLink, Terminal, Code2, BookOpen } from 'lucide-react';

const CONSOLES = [
  { name: 'OpenRouter', url: 'https://openrouter.ai/keys' },
  { name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
  { name: '硅基流动 (SiliconFlow)', url: 'https://cloud.siliconflow.cn/account/ak' },
  { name: 'NVIDIA NIM', url: 'https://build.nvidia.com/explore/discover' },
  { name: 'Groq', url: 'https://console.groq.com/keys' },
];

export default function DocsView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 模块一：官方控制台直达 */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all shadow-2xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-6">
          <ExternalLink className="w-6 h-6 mr-3 text-blue-400" />
          官方控制台直达
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          没有可用 API Key？请前往以下官方平台注册并获取免费额度：
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CONSOLES.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
            >
              <span className="font-bold text-slate-300 group-hover:text-blue-300">{c.name}</span>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      </div>

      {/* 模块二：LiteLLM 万能中转配置 */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all shadow-2xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-6">
          <Terminal className="w-6 h-6 mr-3 text-emerald-400" />
          终端 1：启动服务端 (LiteLLM 本地网关)
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          LiteLLM 是一款强大的本地协议转换工具。必须使用对应平台原生的前缀（如 <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">openrouter/</code>），以确保正确寻找环境变量，<strong className="text-emerald-400">严禁添加 --api_base 参数</strong>。
        </p>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm shadow-inner overflow-x-auto">
          <pre className="text-slate-300">
            <code>
              <span className="text-slate-500"># 1. 注入对应平台的真实 API Key (以 OpenRouter 为例)</span>{'\n'}
              <span className="text-purple-400">$env:</span>OPENROUTER_API_KEY=<span className="text-amber-300">"[填入真实的平台_API_KEY]"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># 2. 启动代理网关 (格式要求：litellm --model [平台前缀]/[目标模型ID] --drop_params)</span>{'\n'}
              <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/[填入平台支持的具体模型ID]</span> --drop_params
            </code>
          </pre>
        </div>
      </div>

      {/* 模块三：Claude Code 终极接入法 */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all shadow-2xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-6">
          <Code2 className="w-6 h-6 mr-3 text-purple-400" />
          终端 2：启动客户端 (Agent 交互终端)
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          必须在<strong>全新的终端窗口</strong>执行。目标是清理网络干扰，并将流量完全劫持到本地 <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">127.0.0.1:4000</code>。
        </p>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm shadow-inner overflow-x-auto">
          <pre className="text-slate-300">
            <code>
              <span className="text-slate-500"># 1. 清理 Auth 干扰并设置正确的本地回环地址 (注意必须是 127.0.0.1)</span>{'\n'}
              <span className="text-emerald-400">Remove-Item</span> Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\n'}
              <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># 2. 劫持官方请求至本地 LiteLLM (以 Claude Code 为例)</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm-local-proxy"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># 3. 启动 Agent 应用</span>{'\n'}
              <span className="text-emerald-400">claude</span>
            </code>
          </pre>
        </div>
        
        <div className="mt-8 flex items-start bg-red-500/10 border border-red-500/20 rounded-xl p-5 gap-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <BookOpen className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200/90 leading-relaxed space-y-2">
            <p className="font-bold text-red-300 text-base mb-3">终端内模型显式重定向 (防 404 必做)</p>
            <p>进入 Agent 交互界面后，<strong className="text-red-400 font-extrabold text-white">绝对不能直接开始对话</strong>（会触发默认模型的 404 错误）。</p>
            <p>必须第一时间执行 Agent 的模型切换命令（例如 Claude Code 中的 <code className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">/model</code>），并在弹出的列表中<strong className="text-white">手动高亮选中</strong>通过 LiteLLM 映射进来的代理模型，回车确认后方可开始对话。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
