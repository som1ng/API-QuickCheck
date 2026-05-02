import { ChevronRight, BookOpen, Copy, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import PlatformQuickReference from './PlatformQuickReference';

const CLIENT_BOOTSTRAP = 'Remove-Item Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"\n$env:ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\n$env:ANTHROPIC_API_KEY="sk-litellm-local"\nclaude';

export default function ClaudeCodeDoc() {
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
          <span className="text-slate-200">Claude Code</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Claude Code 接入教程</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          通过 LiteLLM 本地网关，三步实现跨平台大模型零代码修改接入，并按平台能力决定是否附加 `API_BASE`。
        </p>

        <div className="bg-orange-500/10 border-l-4 border-orange-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg mb-4">
          <BookOpen className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-orange-300 font-bold text-lg mb-1">⚠️ 核心原则：双终端物理隔离</h4>
            <p className="text-orange-400/80 text-sm leading-relaxed">
              一个终端专门运行 LiteLLM 网关，另一个终端只运行 Claude Code。不要在同一个终端里混用环境变量。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">1</span>
            第一步 — 启动服务端 (LiteLLM 网关)
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            在独立终端中先注入供应商环境变量，再根据平台是否需要兼容协议 URL 决定启动命令。
          </p>

          <div className="pl-8 space-y-6">
            <div>
              <h4 className="text-slate-300 font-semibold mb-2">📐 通用配置公式 (模板)</h4>
              <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-slate-500"># 1. 注入你所选平台的环境变量 (详见下方速查表)</span>{'\n'}
                    <span className="text-purple-400">$env:</span><span className="text-yellow-200 bg-yellow-500/20 px-1 rounded">【速查表中的环境变量名】</span>=<span className="text-amber-300">"你的真实密钥"</span>{'\n\n'}
                    <span className="text-slate-500"># 2. 启动代理</span>{'\n'}
                    <span className="text-slate-500"># 情况 A：对于原生支持的平台 (requiresApiBase 为 false，如 openrouter, deepseek)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">【速查表前缀】/【具体模型ID】</span> --drop_params{'\n\n'}
                    <span className="text-slate-500"># 情况 B：对于兼容协议平台 (requiresApiBase 为 true，如 siliconflow, aliyun)</span>{'\n'}
                    <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">【速查表前缀】/【具体模型ID】</span> --api_base <span className="text-blue-300">【平台的默认 Base URL】</span> --drop_params
                  </code>
                </pre>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                全平台参数速查表
              </h4>
              <PlatformQuickReference />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-4 shadow-lg">
              <ExternalLink className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-bold mb-2">读取规则只认速查表</h4>
                <p className="text-blue-200/80 text-sm leading-relaxed">
                  环境变量名、模型前缀，以及是否必须附加 `--api_base`，都以速查表为准。橙色标记的平台请把鼠标悬停在徽章上查看默认 Base URL。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">2</span>
            第二步 — 启动客户端 (配置 Agent)
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed pl-8">
            在另一个全新的终端中执行。清理掉可能干扰的鉴权 Token，再把 Anthropic 请求劫持到本地 4000 端口。
          </p>
          <div className="pl-8">
            <div className="bg-black/50 border border-white/10 rounded-lg p-5 font-mono text-sm overflow-x-auto shadow-inner relative group">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(CLIENT_BOOTSTRAP, 'step2')}
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

        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">3</span>
            第三步 — 验证与直接对话
          </h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-8">
            进入 Claude Code 后无需再执行 `/model`，直接对话即可。LiteLLM 会按你在服务端启动时指定的模型接管请求。
          </p>

          <div className="pl-8">
            <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-5 rounded-r-xl flex items-start gap-4 shadow-lg">
              <Terminal className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-emerald-300 font-bold text-lg mb-1">单模型接管模式</h4>
                <p className="text-emerald-400/80 text-sm leading-relaxed">
                  `litellm --model ... --drop_params` 会固定转发到你指定的目标模型，Claude Code 表面上仍认为自己在调用 Anthropic，但底层已经被本地网关接管。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 border-t border-white/10 pt-10">
        <h3 className="text-2xl font-bold text-white mb-8">🛠️ 常见问题排查</h3>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 启动 LiteLLM 报错 401 Unauthorized
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 先核对速查表里的环境变量和模型前缀，再确认是否遗漏了需要的 `--api_base`。
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">Q:</span> 报错 Cannot connect to host api.openai.com:443
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed pl-6 border-l-2 border-slate-700 ml-1.5">
              <span className="font-semibold text-slate-300">A:</span> 这是请求落回官方默认地址。检查模型前缀是否正确，以及兼容协议平台是否显式补上了 `--api_base`。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
