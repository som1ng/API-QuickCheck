
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
          LiteLLM 万能中转配置
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          LiteLLM 是一款强大的本地协议转换工具，能将所有主流厂商（如 DeepSeek、OpenRouter）的接口转换为标准的 OpenAI 格式。
          <br />使用时 <strong className="text-emerald-300">务必注意 model 参数的拼写</strong>，通常需要带上服务商前缀。
        </p>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm shadow-inner overflow-x-auto">
          <pre className="text-slate-300">
            <code>
              <span className="text-slate-500"># 安装依赖</span>{'\n'}
              <span className="text-purple-400">pip</span> install <span className="text-amber-300">"litellm[proxy]"</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># 设置对应平台的 API Key</span>{'\n'}
              <span className="text-purple-400">export</span> OPENROUTER_API_KEY=<span className="text-amber-300">"sk-or-v1-..."</span>{'\n'}
              {'\n'}
              <span className="text-slate-500"># 启动 LiteLLM（将 OpenRouter 转换为本地服务，并过滤不兼容参数）</span>{'\n'}
              <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">openrouter/meta-llama/llama-3.1-8b-instruct:free</span> --drop_params
            </code>
          </pre>
        </div>
      </div>

      {/* 模块三：Claude Code 终极接入法 */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all shadow-2xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-6">
          <Code2 className="w-6 h-6 mr-3 text-purple-400" />
          Claude Code 终极接入法
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Claude Code 原生仅支持 Anthropic 接口。启动上述 LiteLLM 网关后，开启一个<strong>新的终端窗口</strong>，执行以下环境变量注入：
        </p>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm shadow-inner overflow-x-auto">
          <pre className="text-slate-300">
            <code>
              <span className="text-slate-500"># Windows PowerShell</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\n'}
              <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\n'}
              <span className="text-emerald-400">claude</span>
            </code>
          </pre>
        </div>
        <div className="mt-6 flex items-start bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 gap-3">
          <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-purple-200/70 leading-relaxed">
            此方案完美解决了非 Anthropic 模型（如 DeepSeek 等）与 Claude Code 之间的协议兼容性问题，是目前社区公认的最优解。
          </p>
        </div>
      </div>
    </div>
  );
}
